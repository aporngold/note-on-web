import { io, Socket } from 'socket.io-client';
import { getResolvedWsUrl } from './api';

let socketInstance: Socket | null = null;

export function getSharedSocket(): Socket {
  if (!socketInstance) {
    const wsUrl = getResolvedWsUrl();
    socketInstance = io(wsUrl, {
      transports: ['polling', 'websocket'],
      withCredentials: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketInstance.on('connect', () => {
      console.log('⚡ [Socket] Connected to real-time server with id:', socketInstance?.id);
    });

    socketInstance.on('connect_error', (err) => {
      console.warn('⚠️ [Socket] Connection error:', err.message);
    });
  }
  return socketInstance;
}
