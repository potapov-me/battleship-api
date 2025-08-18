import { io, Socket } from 'socket.io-client'
import { getStoredToken, getUserId } from './api'

const WS_BASE = import.meta.env.VITE_WS_BASE || 'http://localhost:7001'

class WebSocketService {
  private socket: Socket | null = null

  connect(token: string): Socket {
    if (this.socket) {
      return this.socket
    }

    this.socket = io(WS_BASE, {
      auth: {
        token,
      },
    })

    return this.socket
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }
}

export const websocket = new WebSocketService()

export const StoredToken = {
  get: getStoredToken,
  getUserId: getUserId,
}