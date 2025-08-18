import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../lib/api'
import { websocket, StoredToken } from '../lib/websocket'

const BOARD_SIZE = 10

export default function Game() {
  const { id } = useParams<{ id: string }>()
  const [gameState, setGameState] = useState<any>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchGame() {
      try {
        const { data } = await api.get(`/game/${id}`)
        setGameState(data)
      } catch (err: any) {
        const msg = err?.response?.data?.message || 'Ошибка загрузки игры'
        setError(Array.isArray(msg) ? msg.join(' ') : String(msg))
      }
    }

    fetchGame()

    const ws = websocket.connect(StoredToken.get() || '')

    ws.on('connect', () => {
      ws.emit('joinGame', id)
    })

    ws.on('gameStateUpdate', (newGameState) => {
      setGameState(newGameState)
    })

    ws.on('shotResult', ({ x, y, hit, sunk }) => {
      // Update the board with the shot result
      // This is a simplified update. A more robust implementation would be needed.
      const newBoard = [...(gameState.board || [])]
      newBoard[y][x] = hit ? 'hit' : 'miss'
      setGameState({ ...gameState, board: newBoard })
    })

    ws.on('gameOver', (winnerId) => {
      setGameState({ ...gameState, status: 'finished', winnerId })
    })

    ws.on('error', (errorMessage) => {
      setError(errorMessage)
    })

    return () => {
      ws.emit('leaveGame', id)
      ws.disconnect()
    }
  }, [id, gameState])

  async function makeShot(x: number, y: number) {
    try {
      await api.post('/game/make-shot', { gameId: id, x, y })
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Ошибка выстрела'
      setError(Array.isArray(msg) ? msg.join(' ') : String(msg))
    }
  }

  if (error) return <p style={{ color: 'crimson' }}>{error}</p>
  if (!gameState) return <p>Загрузка...</p>

  const isMyTurn = gameState.currentPlayerId === StoredToken.getUserId()

  return (
    <div>
      <h2>Игра: {gameState.id}</h2>
      <p>Статус: {gameState.status}</p>
      {gameState.status === 'finished' && <p>Победитель: {gameState.winnerId}</p>}
      {isMyTurn && <p>Ваш ход</p>}
      <div style={{ display: 'flex', gap: 48 }}>
        <div>
          <h3>Ваша доска</h3>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${BOARD_SIZE}, 30px)` }}>
            {Array.from({ length: BOARD_SIZE * BOARD_SIZE }).map((_, i) => {
              const x = i % BOARD_SIZE
              const y = Math.floor(i / BOARD_SIZE)
              const cell = gameState.playerBoard[y][x]
              let backgroundColor = '#fff'
              if (cell === 'ship') backgroundColor = '#666'
              if (cell === 'hit') backgroundColor = 'red'
              if (cell === 'miss') backgroundColor = '#ccc'

              return (
                <div
                  key={i}
                  style={{
                    width: 30,
                    height: 30,
                    border: '1px solid #ccc',
                    backgroundColor,
                  }}
                />
              )
            })}
          </div>
        </div>
        <div>
          <h3>Доска противника</h3>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${BOARD_SIZE}, 30px)` }}>
            {Array.from({ length: BOARD_SIZE * BOARD_SIZE }).map((_, i) => {
              const x = i % BOARD_SIZE
              const y = Math.floor(i / BOARD_SIZE)
              const cell = gameState.opponentBoard[y][x]
              let backgroundColor = '#fff'
              if (cell === 'hit') backgroundColor = 'red'
              if (cell === 'miss') backgroundColor = '#ccc'

              return (
                <div
                  key={i}
                  onClick={() => isMyTurn && makeShot(x, y)}
                  style={{
                    width: 30,
                    height: 30,
                    border: '1px solid #ccc',
                    backgroundColor,
                    cursor: isMyTurn ? 'pointer' : 'default',
                  }}
                />
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
