import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useNoteStore } from '@/store/noteStore';
import { getSharedSocket } from '@/utils/socketClient';

/**
 * Global Real-time Synchronization Hook for Notes across all devices (Desktop <-> Mobile)
 * Listens to WebSocket events emitted by backend when notes are created, updated, or deleted
 */
export function useRealtimeNotes() {
  const { user } = useAuthStore();
  const {
    setRemoteNoteCreated,
    setRemoteNoteUpdated,
    setRemoteNoteDeleted,
    setRemoteNoteRestored,
    setRemoteNoteMoved,
    setRemoteBoardCountUpdated,
    setRemoteTrashEmptied,
  } = useNoteStore();

  useEffect(() => {
    if (!user?.id) return;

    const socket = getSharedSocket();

    // Join user's personal private room to receive real-time sync across devices
    if (socket.connected) {
      socket.emit('join-user', user.id);
    } else {
      socket.once('connect', () => {
        socket.emit('join-user', user.id);
      });
    }

    const handleNoteCreated = (newNote: any) => {
      console.log('⚡ [Realtime] Remote note created:', newNote?.id);
      setRemoteNoteCreated(newNote);
    };

    const handleNoteUpdated = (updatedNote: any) => {
      console.log('⚡ [Realtime] Remote note updated:', updatedNote?.id);
      setRemoteNoteUpdated(updatedNote);
    };

    const handleNoteDeleted = (data: any) => {
      console.log('⚡ [Realtime] Remote note deleted:', data?.id);
      setRemoteNoteDeleted(data);
    };

    const handleNoteRestored = (restoredNote: any) => {
      console.log('⚡ [Realtime] Remote note restored:', restoredNote?.id);
      setRemoteNoteRestored(restoredNote);
    };

    const handleNoteMoved = (data: { noteId: string; posX: number; posY: number }) => {
      if (data?.noteId && typeof data.posX === 'number' && typeof data.posY === 'number') {
        setRemoteNoteMoved(data.noteId, data.posX, data.posY);
      }
    };

    const handleBoardCountUpdated = (data: { boardId: string; delta: number }) => {
      if (data?.boardId && typeof data.delta === 'number') {
        setRemoteBoardCountUpdated(data);
      }
    };

    const handleTrashEmptied = () => {
      console.log('⚡ [Realtime] Remote trash emptied');
      setRemoteTrashEmptied();
    };

    socket.on('note:created', handleNoteCreated);
    socket.on('note:updated', handleNoteUpdated);
    socket.on('note:deleted', handleNoteDeleted);
    socket.on('note:restored', handleNoteRestored);
    socket.on('board-note-moved', handleNoteMoved);
    socket.on('board:note-count-updated', handleBoardCountUpdated);
    socket.on('notes:trash-emptied', handleTrashEmptied);

    return () => {
      socket.off('note:created', handleNoteCreated);
      socket.off('note:updated', handleNoteUpdated);
      socket.off('note:deleted', handleNoteDeleted);
      socket.off('note:restored', handleNoteRestored);
      socket.off('board-note-moved', handleNoteMoved);
      socket.off('board:note-count-updated', handleBoardCountUpdated);
      socket.off('notes:trash-emptied', handleTrashEmptied);
    };
  }, [
    user?.id,
    setRemoteNoteCreated,
    setRemoteNoteUpdated,
    setRemoteNoteDeleted,
    setRemoteNoteRestored,
    setRemoteNoteMoved,
    setRemoteBoardCountUpdated,
    setRemoteTrashEmptied,
  ]);
}
