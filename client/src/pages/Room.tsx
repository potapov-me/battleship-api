import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { websocket, StoredToken } from '../lib/websocket'

interface Room {
  id: string
  name: string
  players: { id: string; username: string }[]
  status: 'waiting' | 'full' | 'playing'
}

export default function Room() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [room, setRoom] = useState<Room | null>(null)
  const [error, setError] = useState('')

  async function fetchRoom() {
    try {
      const { data } = await api.get(`/rooms/${id}`)
      setRoom(data)
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Ошибка загрузки комнаты'
      setError(Array.isArray(msg) ? msg.join(' ') : String(msg))
    }
  }

  useEffect(() => {
    fetchRoom()

    const ws = websocket.connect(StoredToken.get() || '')

    ws.on('connect', () => {
      ws.emit('joinRoom', id)
    })

    ws.on('roomUpdate', (updatedRoom) => {
      setRoom(updatedRoom)
    })

    ws.on('gameStart', (gameId) => {
      navigate(`/game/${gameId}`)
    })

    ws.on('error', (errorMessage) => {
      setError(errorMessage)
    })

    return () => {
      ws.emit('leaveRoom', id)
      ws.disconnect()
    }
  }, [id, navigate])

  async function joinRoom() {
    try {
      await api.post(`/rooms/${id}/join`)
      fetchRoom() // Refresh room data
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Не удалось присоединиться к комнате'
      setError(Array.isArray(msg) ? msg.join(' ') : String(msg))
    }
  }

  if (error) return <p style={{ color: 'crimson' }}>{error}</p>
  if (!room) return <p>Загрузка...</p>

  const canJoin = room.players.length < 2 && room.status === 'waiting'

  return (
    <div>
      <h2>Комната: {room.name}</h2>
      <p>Статус: {room.status}</p>
      <h3>Игроки:</h3>
      <ul>
        {room.players.map((player) => (
          <li key={player.id}>{player.username}</li>
        ))}
      </ul>
      {canJoin && <button onClick={joinRoom}>Присоединиться</button>}
    </div>
  )
}
