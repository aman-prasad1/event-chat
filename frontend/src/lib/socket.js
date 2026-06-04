import { io } from 'socket.io-client';

// Derive socket URL from the API base URL (strip /api/v1 suffix)
const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_BACKEND_URL?.replace(/\/api\/v\d+$/, '') ||
  'http://localhost:8000';

export const socket = io(SOCKET_URL, {
  withCredentials: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});