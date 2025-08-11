import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, setAuthToken } from '../lib/api'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post('/auth/login', { email, password })
      setAuthToken(data.access_token)
      navigate('/profile')
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Ошибка входа'
      setError(Array.isArray(msg) ? msg.join(' ') : String(msg))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 380 }}>
      <h2>Вход</h2>
      <form onSubmit={onSubmit}>
        <div style={{ display: 'grid', gap: 8 }}>
          <label>
            Email
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          </label>
          <label>
            Пароль
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
          </label>
          <button disabled={loading} type="submit">{loading ? 'Вход...' : 'Войти'}</button>
        </div>
        {error && <p style={{ color: 'crimson' }}>{error}</p>}
      </form>
      <p>Нет аккаунта? <Link to="/register">Регистрация</Link></p>
    </div>
  )
}
