import { create } from 'zustand';
import api from '@/utils/api';
import { InAppNotification } from '@/types';
import toast from 'react-hot-toast';

interface NotificationState {
  notifications: InAppNotification[];
  unreadCount: number;
  isLoading: boolean;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  addRealtimeNotification: (notification: InAppNotification) => void;
  setRemoteNotificationUpdated: (data: { id: string; isRead: boolean; unreadCount?: number }) => void;
  setRemoteNotificationAllRead: () => void;
  setRemoteNotificationDeleted: (data: { id: string; unreadCount?: number }) => void;
  setRemoteNotificationCleared: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  isOpen: false,

  setIsOpen: (open: boolean) => set({ isOpen: open }),

  fetchNotifications: async () => {
    try {
      set({ isLoading: true });
      const res = await api.get('/notifications');
      if (res.data.success) {
        set({
          notifications: res.data.notifications,
          unreadCount: res.data.unreadCount,
          isLoading: false,
        });
      }
    } catch (err) {
      set({ isLoading: false });
    }
  },

  markAsRead: async (id: string) => {
    try {
      // Optimistic update
      set((state) => ({
        notifications: state.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));

      const res = await api.patch(`/notifications/${id}/read`);
      if (typeof res.data?.unreadCount === 'number') {
        set({ unreadCount: res.data.unreadCount });
      }
    } catch (err) {
      // Fallback refetch
      get().fetchNotifications();
    }
  },

  markAllAsRead: async () => {
    try {
      // Optimistic update
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      }));

      await api.post('/notifications/read-all');
      toast.success('อ่านการแจ้งเตือนทั้งหมดแล้ว');
    } catch (err) {
      get().fetchNotifications();
    }
  },

  deleteNotification: async (id: string) => {
    try {
      const target = get().notifications.find((n) => n.id === id);
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
        unreadCount: target && !target.isRead ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
      }));

      const res = await api.delete(`/notifications/${id}`);
      if (typeof res.data?.unreadCount === 'number') {
        set({ unreadCount: res.data.unreadCount });
      }
    } catch (err) {
      get().fetchNotifications();
    }
  },

  clearAll: async () => {
    try {
      set({ notifications: [], unreadCount: 0 });
      await api.delete('/notifications');
      toast.success('ล้างรายการแจ้งเตือนทั้งหมดแล้ว');
    } catch (err) {
      get().fetchNotifications();
    }
  },

  addRealtimeNotification: (newNotif: InAppNotification) => {
    set((state) => {
      // Prevent duplicate
      if (state.notifications.some((n) => n.id === newNotif.id)) {
        return state;
      }
      return {
        notifications: [newNotif, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      };
    });

    // In-app alert audio chime or subtle toast
    toast(newNotif.title, {
      icon: '🔔',
      duration: 5000,
    });
  },

  setRemoteNotificationUpdated: (data: { id: string; isRead: boolean; unreadCount?: number }) => {
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === data.id ? { ...n, isRead: data.isRead } : n)),
      unreadCount: typeof data.unreadCount === 'number' ? data.unreadCount : Math.max(0, state.unreadCount - 1),
    }));
  },

  setRemoteNotificationAllRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    }));
  },

  setRemoteNotificationDeleted: (data: { id: string; unreadCount?: number }) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== data.id),
      unreadCount: typeof data.unreadCount === 'number' ? data.unreadCount : Math.max(0, state.unreadCount - 1),
    }));
  },

  setRemoteNotificationCleared: () => {
    set({ notifications: [], unreadCount: 0 });
  },
}));
