import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useNavigate } from 'react-router-dom'

interface Room {
  id: string
  name: string
  players: any[]
}

export default function Lobby() {
  const navigate = useNavigate()
  const [rooms, setRooms] = useState<Room[]>([])
  const [roomName, setRoomName] = useState('')
  const [error, setError] = useState('')

  async function fetchRooms() {
    try {
      const { data } = await api.get('/rooms')
      setRooms(data)
    } catch (err: any) {      const msg = err?.response?.data?.message || 'Ошибка загрузки комнат'
      setError(Array.isArray(msg) ? msg.join(' ') : String(msg))
    }
  }

  useEffect(() => {
    fetchRooms()
  }, [])

  async function createRoom(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    if (!roomName.trim()) {
      setError('Название комнаты не может быть пустым')
      return
    }
    try {
      const { data } = await api.post('/rooms', { name: roomName })
      navigate(`/room/${data.id}`)
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Ошибка создания комнаты'
      setError(Array.isArray(msg) ? msg.join(' ') : String(msg))
    }
  }

  return (
    <div>
      <h2>Лобби</h2>
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
      <form onSubmit={createRoom} style={{ marginBottom: 24 }}>
        <input
          type="text"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          placeholder="Название комнаты"
          style={{ marginRight: 12 }}
        />
        <button type="submit">Создать комнату</button>
      </form>
      <h3>Доступные комнаты:</h3>
      <div style={{ display: 'grid', gap: 12 }}>
        {rooms.length === 0 && <p>Нет доступных комнат.</p>}
        {rooms.map((room) => (
          <div key={room.id} style={{ padding: 12, border: '1px solid #ccc', borderRadius: 8 }}>
            <h4>{room.name}</h4>
            <p>Игроки: {room.players.length}/2</p>
            <button onClick={() => navigate(`/room/${room.id}`)}>Присоединиться</button>
          </div>
        ))}
      </div>
    </div>
  )
}
