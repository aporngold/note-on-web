import { io, Socket } from 'socket.io-client';

let socketInstance: Socket | null = null;

export function getSharedSocket(): Socket {
  if (!socketInstance) {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5000';
    socketInstance = io(wsUrl, {
      transports: ['websocket', 'polling'],
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
