import axios from 'axios'
import { jwtDecode } from 'jwt-decode'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:7001'

export const api = axios.create({
  baseURL: API_BASE,
})

export function setAuthToken(token?: string) {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    localStorage.setItem('token', token)
  } else {
    delete api.defaults.headers.common['Authorization']
    localStorage.removeItem('token')
  }
}

export function getStoredToken(): string | null {
  return localStorage.getItem('token')
}

export function getUserId(): string | null {
  const token = getStoredToken()
  if (!token) return null
  try {
    const decoded: { sub: string } = jwtDecode(token)
    return decoded.sub
  } catch (error) {
    console.error('Failed to decode token', error)
    return null
  }
}
