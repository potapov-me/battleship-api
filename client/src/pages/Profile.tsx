import { useEffect, useState } from 'react'
import { api, getStoredToken, setAuthToken } from '../lib/api'
import { useNavigate } from 'react-router-dom'

export default function Profile() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<{ username: string; email: string; roles: string[] } | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = getStoredToken()
    if (!token) {
      navigate('/login')
      return
    }
    setAuthToken(token)
    ;(async () => {
      try {
        const { data } = await api.get('/auth/profile')
        setProfile(data)
      } catch (err: any) {
        const msg = err?.response?.data?.message || 'Ошибка загрузки профиля'
        setError(Array.isArray(msg) ? msg.join(' ') : String(msg))
      }
    })()
  }, [navigate])

  function logout() {
    setAuthToken(undefined)
    navigate('/login')
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <h2>Профиль</h2>
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
      {!profile ? (
        <p>Загрузка...</p>
      ) : (
        <div style={{ display: 'grid', gap: 6 }}>
          <div><b>Username:</b> {profile.username}</div>
          <div><b>Email:</b> {profile.email}</div>
          <div><b>Роли:</b> {profile.roles?.join(', ')}</div>
          <button onClick={logout}>Выйти</button>
        </div>
      )}
    </div>
  )
}
