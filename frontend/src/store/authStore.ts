import { create } from 'zustand';
import api from '@/utils/api';
import { User } from '@/types';
import { EncryptionService } from '@/utils/encryption';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isVaultUnlocked: boolean;
  masterPassword: string;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  unlockVault: (password: string) => boolean;
  lockVault: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('secure_note_token') : null,
  isLoading: true,
  isVaultUnlocked: false,
  masterPassword: '',

  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { token, user } = response.data;
    localStorage.setItem('secure_note_token', token);
    localStorage.setItem('secure_note_user', JSON.stringify(user));
    set({ token, user, isLoading: false });
  },

  register: async (email, username, password) => {
    const response = await api.post('/auth/register', { email, username, password });
    const { token, user } = response.data;
    localStorage.setItem('secure_note_token', token);
    localStorage.setItem('secure_note_user', JSON.stringify(user));
    set({ token, user, isLoading: false });
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Ignore
    }
    localStorage.removeItem('secure_note_token');
    localStorage.removeItem('secure_note_user');
    EncryptionService.getInstance().clear();
    set({ user: null, token: null, isVaultUnlocked: false, masterPassword: '' });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('secure_note_token');
    if (!token) {
      set({ user: null, token: null, isLoading: false });
      return;
    }

    try {
      const response = await api.get('/auth/me');
      set({ user: response.data, token, isLoading: false });
    } catch (error) {
      localStorage.removeItem('secure_note_token');
      localStorage.removeItem('secure_note_user');
      set({ user: null, token: null, isLoading: false });
    }
  },

  unlockVault: (password: string) => {
    if (!password) return false;
    try {
      EncryptionService.getInstance().setMasterPassword(password);
      set({ isVaultUnlocked: true, masterPassword: password });
      return true;
    } catch (e) {
      return false;
    }
  },

  lockVault: () => {
    EncryptionService.getInstance().clear();
    set({ isVaultUnlocked: false, masterPassword: '' });
  },
}));
