import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useNoteStore } from '@/store/noteStore';
import { useReminderStore } from '@/store/reminderStore';
import { useNotificationStore } from '@/store/notificationStore';
import { getSharedSocket } from '@/utils/socketClient';

/**
 * Global Real-time Synchronization Hook for Notes, Reminders, and Notifications across all devices (Desktop <-> Mobile)
 * Listens to WebSocket events emitted by backend when notes, boards, connections, reminders, or notifications change.
 * Handles automatic silent re-sync upon reconnection or device wake-up (screen unlock).
 */
export function useRealtimeNotes() {
  const { user } = useAuthStore();
  const { fetchReminders } = useReminderStore();
  const {
    setRemoteNotificationUpdated,
    setRemoteNotificationAllRead,
    setRemoteNotificationDeleted,
    setRemoteNotificationCleared,
  } = useNotificationStore();
  const {
    activeBoardId,
    setRemoteNoteCreated,
    setRemoteNoteUpdated,
    setRemoteNoteDeleted,
    setRemoteNoteRestored,
    setRemoteNoteMoved,
    setRemoteBoardCountUpdated,
    setRemoteTrashEmptied,
    fetchNotes,
    fetchBoards,
    fetchNotebooks,
    fetchLabels,
    fetchConnections,
  } = useNoteStore();

  useEffect(() => {
    if (!user?.id) return;

    const socket = getSharedSocket();

    const joinUserRoom = () => {
      if (user?.id) {
        socket.emit('join-user', user.id);
      }
    };

    // Join room immediately if already connected
    if (socket.connected) {
      joinUserRoom();
    }

    // On connect or reconnect (e.g. mobile wakes up from sleep or network recovers)
    const handleConnect = () => {
      joinUserRoom();
      // Silently re-sync in background to ensure zero missed updates
      fetchNotes({ isArchived: false }).catch(() => {});
      fetchBoards().catch(() => {});
      fetchNotebooks().catch(() => {});
      fetchLabels().catch(() => {});
      fetchReminders().catch(() => {});
      if (activeBoardId) {
        fetchConnections(activeBoardId).catch(() => {});
      }
    };

    const handleNoteCreated = (newNote: any) => {
      console.log('⚡ [Realtime] Remote note created:', newNote?.id);
      setRemoteNoteCreated(newNote);
      fetchNotebooks().catch(() => {});
      fetchLabels().catch(() => {});
      fetchBoards().catch(() => {});
    };

    const handleNoteUpdated = (updatedNote: any) => {
      console.log('⚡ [Realtime] Remote note updated:', updatedNote?.id);
      setRemoteNoteUpdated(updatedNote);
      fetchNotebooks().catch(() => {});
      fetchLabels().catch(() => {});
    };

    const handleNoteDeleted = (data: any) => {
      console.log('⚡ [Realtime] Remote note deleted:', data?.id);
      setRemoteNoteDeleted(data);
      fetchNotebooks().catch(() => {});
      fetchLabels().catch(() => {});
      fetchBoards().catch(() => {});
    };

    const handleNoteRestored = (restoredNote: any) => {
      console.log('⚡ [Realtime] Remote note restored:', restoredNote?.id);
      setRemoteNoteRestored(restoredNote);
      fetchNotebooks().catch(() => {});
      fetchLabels().catch(() => {});
      fetchBoards().catch(() => {});
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
      fetchBoards().catch(() => {});
    };

    const handleBoardChanged = (data: { action: string; boardId?: string }) => {
      console.log('⚡ [Realtime] Remote board changed:', data);
      fetchBoards().catch(() => {});
      if (data.action === 'deleted' || data.action === 'cleared') {
        fetchNotes({ isArchived: false }).catch(() => {});
      }
    };

    const handleConnectionChanged = () => {
      console.log('⚡ [Realtime] Remote connection changed');
      if (activeBoardId) {
        fetchConnections(activeBoardId).catch(() => {});
      }
    };

    const handleReminderChanged = (data: any) => {
      console.log('⚡ [Realtime] Remote reminder changed:', data);
      fetchReminders().catch(() => {});
    };

    // Mobile visibility / wake-up listener
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (!socket.connected) {
          socket.connect();
        } else {
          joinUserRoom();
          fetchNotes({ isArchived: false }).catch(() => {});
          fetchBoards().catch(() => {});
          fetchReminders().catch(() => {});
        }
      }
    };

    socket.on('connect', handleConnect);
    socket.on('note:created', handleNoteCreated);
    socket.on('note:updated', handleNoteUpdated);
    socket.on('note:deleted', handleNoteDeleted);
    socket.on('note:restored', handleNoteRestored);
    socket.on('board-note-moved', handleNoteMoved);
    socket.on('board:note-count-updated', handleBoardCountUpdated);
    socket.on('notes:trash-emptied', handleTrashEmptied);
    socket.on('board:changed', handleBoardChanged);
    socket.on('connection:changed', handleConnectionChanged);
    socket.on('reminder:changed', handleReminderChanged);
    socket.on('notification:updated', setRemoteNotificationUpdated);
    socket.on('notification:all-read', setRemoteNotificationAllRead);
    socket.on('notification:deleted', setRemoteNotificationDeleted);
    socket.on('notification:cleared', setRemoteNotificationCleared);

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('note:created', handleNoteCreated);
      socket.off('note:updated', handleNoteUpdated);
      socket.off('note:deleted', handleNoteDeleted);
      socket.off('note:restored', handleNoteRestored);
      socket.off('board-note-moved', handleNoteMoved);
      socket.off('board:note-count-updated', handleBoardCountUpdated);
      socket.off('notes:trash-emptied', handleTrashEmptied);
      socket.off('board:changed', handleBoardChanged);
      socket.off('connection:changed', handleConnectionChanged);
      socket.off('reminder:changed', handleReminderChanged);
      socket.off('notification:updated', setRemoteNotificationUpdated);
      socket.off('notification:all-read', setRemoteNotificationAllRead);
      socket.off('notification:deleted', setRemoteNotificationDeleted);
      socket.off('notification:cleared', setRemoteNotificationCleared);

      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [
    user?.id,
    activeBoardId,
    setRemoteNoteCreated,
    setRemoteNoteUpdated,
    setRemoteNoteDeleted,
    setRemoteNoteRestored,
    setRemoteNoteMoved,
    setRemoteBoardCountUpdated,
    setRemoteTrashEmptied,
    fetchNotes,
    fetchBoards,
    fetchNotebooks,
    fetchLabels,
    fetchConnections,
    fetchReminders,
    setRemoteNotificationUpdated,
    setRemoteNotificationAllRead,
    setRemoteNotificationDeleted,
    setRemoteNotificationCleared,
  ]);
}
