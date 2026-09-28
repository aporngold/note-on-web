import { Server as SocketIOServer } from 'socket.io';

let ioInstance: SocketIOServer | null = null;

export function setSocketIO(io: SocketIOServer) {
  ioInstance = io;
}

export function getSocketIO(): SocketIOServer | null {
  return ioInstance;
}

/**
 * Emit an event to all connected sessions/devices of a specific user
 */
export function emitToUser(userId: string, event: string, data: any) {
  if (ioInstance && userId) {
    ioInstance.to(`user:${userId}`).emit(event, data);
  }
}

/**
 * Emit an event to a specific board room
 */
export function emitToBoard(boardId: string, event: string, data: any) {
  if (ioInstance && boardId) {
    ioInstance.to(`board:${boardId}`).emit(event, data);
  }
}
