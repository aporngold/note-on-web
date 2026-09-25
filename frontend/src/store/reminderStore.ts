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
        toast.success('บันทึกการแจ้งเตือนเรียบร้อยแล้ว', { icon: '⏰' });
        return saved;
      }
      return null;
    } catch (err: any) {
      set({ isLoading: false });
      toast.error(err.response?.data?.error || 'บันทึกการแจ้งเตือนไม่สำเร็จ');
      return null;
    }
  },

  deleteReminder: async (id: string, noteId?: string) => {
    try {
      set({ isLoading: true });
      const res = await api.delete(`/reminders/${id}`);
      if (res.data.success) {
        set((state) => {
          const nextMap = { ...state.remindersByNote };
          if (noteId) {
            delete nextMap[noteId];
          } else if (state.currentNoteReminder?.id === id) {
            delete nextMap[state.currentNoteReminder.noteId];
          } else {
            // Find noteId from reminders array
            const found = state.reminders.find((r) => r.id === id);
            if (found) delete nextMap[found.noteId];
          }
          return {
            reminders: state.reminders.filter((r) => r.id !== id),
            remindersByNote: nextMap,
            currentNoteReminder: state.currentNoteReminder?.id === id ? null : state.currentNoteReminder,
            isLoading: false,
          };
        });
        toast.success('ลบการแจ้งเตือนแล้ว');
        return true;
      }
      return false;
    } catch (err) {
      set({ isLoading: false });
      toast.error('ไม่สามารถลบการแจ้งเตือนได้');
      return false;
    }
  },
}));
