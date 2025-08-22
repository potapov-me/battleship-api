import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './pages/App'
import { getStoredToken, setAuthToken } from './lib/api'

const token = getStoredToken()
if (token) {
  setAuthToken(token)
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
