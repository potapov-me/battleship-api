import axios from 'axios'

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
