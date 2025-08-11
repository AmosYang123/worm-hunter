'use client'

import { useEffect, useRef, useState } from 'react'

interface Position {
  x: number
  y: number
}

interface GameState {
  snake: Position[]
  food: Position
  dx: number
  dy: number
  score: number
  gameRunning: boolean
  gameSpeed: number
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gameState, setGameState] = useState<GameState>({
    snake: [{ x: 10, y: 10 }],
    food: { x: 15, y: 15 },
    dx: 0,
    dy: 0,
    score: 0,
    gameRunning: false,
    gameSpeed: 150 // Faster initial speed (was 200)
  })
  const [showGameOver, setShowGameOver] = useState(false)
  const lastTimeRef = useRef(0)
  const animationIdRef = useRef<number>()

  const gridSize = 20
  const tileCount = 20

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!gameState.gameRunning) return

      switch (e.key) {
        case 'ArrowUp':
          if (gameState.dy !== 1) {
            setGameState(prev => ({ ...prev, dx: 0, dy: -1 }))
          }
          break
        case 'ArrowDown':
          if (gameState.dy !== -1) {
            setGameState(prev => ({ ...prev, dx: 0, dy: 1 }))
          }
          break
        case 'ArrowLeft':
          if (gameState.dx !== 1) {
            setGameState(prev => ({ ...prev, dx: -1, dy: 0 }))
          }
          break
        case 'ArrowRight':
          if (gameState.dx !== -1) {
            setGameState(prev => ({ ...prev, dx: 1, dy: 0 }))
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [gameState.gameRunning, gameState.dx, gameState.dy])

  const generateFood = (snake: Position[]): Position => {
    let newFood: Position
    do {
      newFood = {
        x: Math.floor(Math.random() * tileCount),
        y: Math.floor(Math.random() * tileCount)
      }
    } while (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y))
    return newFood
  }

  const checkCollision = (head: Position, snake: Position[]): boolean => {
    // Wall collision
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
      return true
    }

    // Self collision
    for (let i = 1; i < snake.length; i++) {
      if (head.x === snake[i].x && head.y === snake[i].y) {
        return true
      }
    }

    return false
  }

  const gameLoop = (currentTime: number) => {
    if (!gameState.gameRunning) return

    const deltaTime = currentTime - lastTimeRef.current

    if (deltaTime >= gameState.gameSpeed) {
      setGameState(prev => {
        if (prev.dx === 0 && prev.dy === 0) return prev

        const head = { x: prev.snake[0].x + prev.dx, y: prev.snake[0].y + prev.dy }
        const newSnake = [head, ...prev.snake]

        // Check if food is eaten
        if (head.x === prev.food.x && head.y === prev.food.y) {
          const newFood = generateFood(newSnake)
          const newScore = prev.score + 10
          const newGameSpeed = Math.max(80, prev.gameSpeed - 2) // Faster speed increase (was -1, min was 120)

          return {
            ...prev,
            snake: newSnake,
            food: newFood,
            score: newScore,
            gameSpeed: newGameSpeed
          }
        } else {
          newSnake.pop()
        }

        // Check collision
        if (checkCollision(head, newSnake)) {
          setShowGameOver(true)
          return { ...prev, gameRunning: false }
        }

        return { ...prev, snake: newSnake }
      })

      lastTimeRef.current = currentTime
    }

    animationIdRef.current = requestAnimationFrame(gameLoop)
  }

  useEffect(() => {
    if (gameState.gameRunning) {
      lastTimeRef.current = performance.now()
      animationIdRef.current = requestAnimationFrame(gameLoop)
    } else {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
    }

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
    }
  }, [gameState.gameRunning, gameState.gameSpeed])

  useEffect(() => {
    draw()
  }, [gameState.snake, gameState.food])

  const draw = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas with gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
    gradient.addColorStop(0, '#000')
    gradient.addColorStop(1, '#1a1a1a')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw grid lines (subtle)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'
    ctx.lineWidth = 1
    for (let i = 0; i <= tileCount; i++) {
      ctx.beginPath()
      ctx.moveTo(i * gridSize, 0)
      ctx.lineTo(i * gridSize, canvas.height)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(0, i * gridSize)
      ctx.lineTo(canvas.width, i * gridSize)
      ctx.stroke()
    }

    // Draw snake
    gameState.snake.forEach((segment, index) => {
      const x = segment.x * gridSize
      const y = segment.y * gridSize
      const size = gridSize - 2

      if (index === 0) {
        drawSnakeHead(ctx, x, y, size)
      } else {
        drawSnakeBody(ctx, x, y, size)
      }
    })

    // Draw food
    drawFood(ctx)
  }

  const drawSnakeHead = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
    // Glow effect
    ctx.shadowColor = '#4CAF50'
    ctx.shadowBlur = 10

    // Head gradient
    const headGradient = ctx.createRadialGradient(
      x + size / 2, y + size / 2, 0,
      x + size / 2, y + size / 2, size / 2
    )
    headGradient.addColorStop(0, '#6BCF7F')
    headGradient.addColorStop(1, '#4CAF50')

    ctx.fillStyle = headGradient
    ctx.fillRect(x, y, size, size)

    // Eyes
    ctx.shadowBlur = 0
    ctx.fillStyle = '#000'
    ctx.fillRect(x + 4, y + 4, 3, 3)
    ctx.fillRect(x + size - 7, y + 4, 3, 3)

    ctx.shadowBlur = 0
  }

  const drawSnakeBody = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
    // Body gradient
    const bodyGradient = ctx.createLinearGradient(x, y, x + size, y + size)
    bodyGradient.addColorStop(0, '#4CAF50')
    bodyGradient.addColorStop(1, '#45a049')

    ctx.fillStyle = bodyGradient
    ctx.fillRect(x, y, size, size)

    // Subtle pattern
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.fillRect(x + 2, y + 2, size - 4, size - 4)
  }

  const drawFood = (ctx: CanvasRenderingContext2D) => {
    const x = gameState.food.x * gridSize
    const y = gameState.food.y * gridSize
    const size = gridSize - 2

    // Pulsing effect
    const pulse = Math.sin(Date.now() * 0.01) * 0.2 + 0.8
    const pulseSize = size * pulse
    const offset = (size - pulseSize) / 2

    // Glow effect
    ctx.shadowColor = '#FFD700'
    ctx.shadowBlur = 15

    // Food gradient
    const foodGradient = ctx.createRadialGradient(
      x + size / 2, y + size / 2, 0,
      x + size / 2, y + size / 2, size / 2
    )
    foodGradient.addColorStop(0, '#FFD700')
    foodGradient.addColorStop(1, '#FFA500')

    ctx.fillStyle = foodGradient
    ctx.fillRect(x + offset, y + offset, pulseSize, pulseSize)

    ctx.shadowBlur = 0
  }

  const startGame = () => {
    setGameState(prev => ({ ...prev, gameRunning: true }))
  }

  const restartGame = () => {
    setGameState({
      snake: [{ x: 10, y: 10 }],
      food: { x: 15, y: 15 },
      dx: 0,
      dy: 0,
      score: 0,
      gameRunning: false,
      gameSpeed: 150 // Faster initial speed for restart too
    })
    setShowGameOver(false)
  }

  const playAgain = () => {
    restartGame()
    startGame()
  }

  return (
    <div className="game-container">
      <h1>🐍 NEON SNAKE 🐍</h1>
      <div className="subtitle">Arcade Classic</div>
      <div className="score">Score: {gameState.score}</div>
      <canvas
        ref={canvasRef}
        id="gameCanvas"
        width={400}
        height={400}
      />
      <div className="controls">
        <p>Use arrow keys to move</p>
        <button onClick={startGame} disabled={gameState.gameRunning}>
          Start Game
        </button>
        <button onClick={restartGame}>Restart</button>
      </div>

      {/* Game Over Overlay */}
      {showGameOver && (
        <div className="overlay" style={{ display: 'flex' }}>
          <div className="overlay-content">
            <h2>Game Over!</h2>
            <p>Your score: {gameState.score}</p>
            <button id="playAgainBtn" onClick={playAgain}>
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
