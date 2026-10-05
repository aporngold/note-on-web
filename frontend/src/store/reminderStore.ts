import { create } from 'zustand';
import api from '@/utils/api';
import { Reminder } from '@/types';
import toast from 'react-hot-toast';

interface ReminderState {
  reminders: Reminder[];
  remindersByNote: Record<string, Reminder>;
  currentNoteReminder: Reminder | null;
  isLoading: boolean;
  fetchReminders: () => Promise<void>;
  fetchReminderByNote: (noteId: string) => Promise<Reminder | null>;
  saveReminder: (data: {
    noteId: string;
    title?: string;
    reminderDateTime: string;
    timezone?: string;
    repeatRule?: 'none' | 'daily' | 'weekly' | 'monthly';
  }) => Promise<Reminder | null>;
  deleteReminder: (id: string, noteId?: string) => Promise<boolean>;
  removeReminderByNoteId: (noteId: string) => void;
}

export const useReminderStore = create<ReminderState>((set, get) => ({
  reminders: [],
  remindersByNote: {},
  currentNoteReminder: null,
  isLoading: false,

  fetchReminders: async () => {
    try {
      set({ isLoading: true });
      const res = await api.get('/reminders');
      if (res.data.success) {
        const map: Record<string, Reminder> = {};
        (res.data.reminders || []).forEach((r: Reminder) => {
          map[r.noteId] = r;
        });
        set({ reminders: res.data.reminders, remindersByNote: map, isLoading: false });
      }
    } catch (err) {
      set({ isLoading: false });
    }
  },

  fetchReminderByNote: async (noteId: string) => {
    try {
      set({ isLoading: true });
      const res = await api.get(`/reminders/note/${noteId}`);
      const reminder = res.data.reminder || null;
      set((state) => {
        const nextMap = { ...state.remindersByNote };
        if (reminder) {
          nextMap[noteId] = reminder;
        } else {
          delete nextMap[noteId];
        }
        return { currentNoteReminder: reminder, remindersByNote: nextMap, isLoading: false };
      });
      return reminder;
    } catch (err) {
      set({ currentNoteReminder: null, isLoading: false });
      return null;
    }
  },

  saveReminder: async (data) => {
    try {
      set({ isLoading: true });
      const res = await api.post('/reminders', data);
      if (res.data.success) {
        const saved = res.data.reminder;
        set((state) => ({
          currentNoteReminder: saved,
          reminders: [saved, ...state.reminders.filter((r) => r.id !== saved.id)],
          remindersByNote: { ...state.remindersByNote, [saved.noteId]: saved },
          isLoading: false,
        }));
        toast.success('บันทึกการแจ้งเตือนเรียบร้อยแล้ว', { id: 'reminder-save', icon: '⏰', duration: 3000 });
        return saved;
      }
      return null;
    } catch (err: any) {
      set({ isLoading: false });
      toast.error(err.response?.data?.error || 'บันทึกการแจ้งเตือนไม่สำเร็จ', { id: 'reminder-save', duration: 5000 });
      return null;
    }
  },

  deleteReminder: async (id: string, noteId?: string) => {
    try {
      set({ isLoading: true });
      const res = await api.delete(`/reminders/${id}`);
      if (res.data.success) {
        const resolvedNoteId = noteId || res.data.noteId || get().currentNoteReminder?.noteId;
        set((state) => {
          const nextMap = { ...state.remindersByNote };
          if (resolvedNoteId) {
            delete nextMap[resolvedNoteId];
          }
          const found = state.reminders.find((r) => r.id === id);
          if (found?.noteId) {
            delete nextMap[found.noteId];
          }
          return {
            reminders: state.reminders.filter((r) => r.id !== id),
            remindersByNote: nextMap,
            currentNoteReminder: state.currentNoteReminder?.id === id ? null : state.currentNoteReminder,
            isLoading: false,
          };
        });
        toast.success('ลบการแจ้งเตือนแล้ว', { id: 'reminder-delete', duration: 3000 });
        return true;
      }
      return false;
    } catch (err) {
      set({ isLoading: false });
      toast.error('ไม่สามารถลบการแจ้งเตือนได้', { id: 'reminder-delete', duration: 5000 });
      return false;
    }
  },

  removeReminderByNoteId: (noteId: string) => {
    set((state) => {
      const nextMap = { ...state.remindersByNote };
      delete nextMap[noteId];
      return {
        reminders: state.reminders.filter((r) => r.noteId !== noteId),
        remindersByNote: nextMap,
        currentNoteReminder: state.currentNoteReminder?.noteId === noteId ? null : state.currentNoteReminder,
      };
    });
  },
}));
