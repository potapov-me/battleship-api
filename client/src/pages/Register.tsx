import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, setAuthToken } from '../lib/api'

export default function Register() {
  const [username, setUsername] = useState('')
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
      const { data } = await api.post('/auth/register', { username, email, password })
      setAuthToken(data.access_token)
      alert('Подтвердите email по ссылке в письме, затем войдите')
      navigate('/profile')
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Ошибка регистрации'
      setError(Array.isArray(msg) ? msg.join(' ') : String(msg))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 380 }}>
      <h2>Регистрация</h2>
      <form onSubmit={onSubmit}>
        <div style={{ display: 'grid', gap: 8 }}>
          <label>
            Username
            <input value={username} onChange={(e) => setUsername(e.target.value)} required />
          </label>
          <label>
            Email
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          </label>
          <label>
            Пароль
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
          </label>
          <button disabled={loading} type="submit">{loading ? 'Регистрация...' : 'Зарегистрироваться'}</button>
        </div>
        {error && <p style={{ color: 'crimson' }}>{error}</p>}
      </form>
      <p>Уже есть аккаунт? <Link to="/login">Войти</Link></p>
    </div>
  )
}
