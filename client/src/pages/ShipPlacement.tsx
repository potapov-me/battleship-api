import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'

const shipTypes = [
  { name: 'carrier', size: 5 },
  { name: 'battleship', size: 4 },
  { name: 'cruiser', size: 3 },
  { name: 'submarine', size: 3 },
  { name: 'destroyer', size: 2 },
]

const BOARD_SIZE = 10

export default function ShipPlacement() {
  const navigate = useNavigate()
  const location = useLocation()
  const gameId = location.state?.gameId

  const [ships, setShips] = useState<any[]>([])
  const [selectedShip, setSelectedShip] = useState(shipTypes[0])
  const [direction, setDirection] = useState('horizontal')
  const [error, setError] = useState('')

  function handleCellClick(x: number, y: number) {
    setError('')
    const newShip = {
      x,
      y,
      type: selectedShip.name,
      direction,
    }

    if (isPlacementValid(newShip)) {
      setShips([...ships, newShip])
      const nextShipIndex = shipTypes.findIndex((ship) => ship.name === selectedShip.name) + 1
      if (nextShipIndex < shipTypes.length) {
        setSelectedShip(shipTypes[nextShipIndex])
      } else {
        setSelectedShip(null as any)
      }
    } else {
      setError('Неверное размещение корабля')
    }
  }

  function isPlacementValid(newShip: any) {
    // Basic boundary check
    if (newShip.direction === 'horizontal') {
      if (newShip.x + selectedShip.size > BOARD_SIZE) return false
    } else {
      if (newShip.y + selectedShip.size > BOARD_SIZE) return false
    }

    // Check for collisions with other ships
    for (const ship of ships) {
      // This is a simplified collision check. A proper implementation would be more robust.
      if (
        (newShip.x < ship.x + ship.size &&
          newShip.x + selectedShip.size > ship.x &&
          newShip.y < ship.y + 1 &&
          newShip.y + 1 > ship.y) ||
        (newShip.y < ship.y + ship.size &&
          newShip.y + selectedShip.size > ship.y &&
          newShip.x < ship.x + 1 &&
          newShip.x + 1 > ship.x)
      ) {
        return false
      }
    }

    return true
  }

  async function submitPlacement() {
    if (ships.length !== shipTypes.length) {
      setError('Не все корабли размещены')
      return
    }

    try {
      await api.post('/game/place-ships', { gameId, ships })
      navigate(`/game/${gameId}`)
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Ошибка размещения кораблей'
      setError(Array.isArray(msg) ? msg.join(' ') : String(msg))
    }
  }

  return (
    <div>
      <h2>Расстановка кораблей</h2>
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
      <div style={{ display: 'flex', gap: 24 }}>
        <div>
          <h4>Выберите корабль:</h4>
          {shipTypes.map((ship) => (
            <div
              key={ship.name}
              onClick={() => setSelectedShip(ship)}
              style={{
                padding: 8,
                border: selectedShip?.name === ship.name ? '2px solid blue' : '1px solid #ccc',
                marginBottom: 8,
                cursor: 'pointer',
              }}
            >
              {ship.name} ({ship.size})
            </div>
          ))}
          <button onClick={() => setDirection(direction === 'horizontal' ? 'vertical' : 'horizontal')}>
            Повернуть ({direction})
          </button>
        </div>
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${BOARD_SIZE}, 30px)` }}>
            {Array.from({ length: BOARD_SIZE * BOARD_SIZE }).map((_, i) => {
              const x = i % BOARD_SIZE
              const y = Math.floor(i / BOARD_SIZE)
              return (
                <div
                  key={i}
                  onClick={() => handleCellClick(x, y)}
                  style={{
                    width: 30,
                    height: 30,
                    border: '1px solid #ccc',
                    backgroundColor: ships.some(
                      (ship) =>
                        (ship.direction === 'horizontal' &&
                          y === ship.y &&
                          x >= ship.x &&
                          x < ship.x + shipTypes.find((s) => s.name === ship.type)!.size) ||
                        (ship.direction === 'vertical' &&
                          x === ship.x &&
                          y >= ship.y &&
                          y < ship.y + shipTypes.find((s) => s.name === ship.type)!.size)
                    )
                      ? '#666'
                      : '#fff',
                  }}
                />
              )
            })}
          </div>
        </div>
      </div>
      <button onClick={submitPlacement} style={{ marginTop: 24 }} disabled={ships.length !== shipTypes.length}>
        Готово
      </button>
    </div>
  )
}
