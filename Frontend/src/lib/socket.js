import { io } from 'socket.io-client'
import { getToken } from './api'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL

export function connectSocket() {
  // auth is read on every (re)connect, so a fresh token is picked up automatically.
  return io(SOCKET_URL, { autoConnect: false, auth: (send) => send({ token: getToken() }) })
}
