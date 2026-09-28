"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setSocketIO = setSocketIO;
exports.getSocketIO = getSocketIO;
exports.emitToUser = emitToUser;
exports.emitToBoard = emitToBoard;
let ioInstance = null;
function setSocketIO(io) {
    ioInstance = io;
}
function getSocketIO() {
    return ioInstance;
}
/**
 * Emit an event to all connected sessions/devices of a specific user
 */
function emitToUser(userId, event, data) {
    if (ioInstance && userId) {
        ioInstance.to(`user:${userId}`).emit(event, data);
    }
}
/**
 * Emit an event to a specific board room
 */
function emitToBoard(boardId, event, data) {
    if (ioInstance && boardId) {
        ioInstance.to(`board:${boardId}`).emit(event, data);
    }
}
