import { useMemo } from 'react'
import { Routes, Route, Link, Navigate } from 'react-router-dom'
import Login from './Login'
import Register from './Register'
import Profile from './Profile'
import Lobby from './Lobby'
import Game from './Game'
import ShipPlacement from './ShipPlacement'
import Room from './Room'

function useAuthToken() {
  const token = useMemo(() => localStorage.getItem('token') || '', [])
  return token
}

export default function App() {
  const token = useAuthToken()
  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', padding: 24 }}>
      <header style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <Link to="/">Главная</Link>
        {!token && <Link to="/login">Вход</Link>}
        {!token && <Link to="/register">Регистрация</Link>}
        {token && <Link to="/profile">Профиль</Link>}
        {token && <Link to="/lobby">Лобби</Link>}
      </header>
      <Routes>
        <Route index element={<Navigate to={token ? '/profile' : '/login'} replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/lobby" element={<Lobby />} />
        <Route path="/room/:id" element={<Room />} />
        <Route path="/game/:id" element={<Game />} />
        <Route path="/ship-placement" element={<ShipPlacement />} />
      </Routes>
    </div>
  )
}
