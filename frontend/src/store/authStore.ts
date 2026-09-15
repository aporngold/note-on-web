import { create } from 'zustand';
import api from '@/utils/api';
import { User } from '@/types';
import { EncryptionService } from '@/utils/encryption';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isVaultUnlocked: boolean;
  hasMasterPassword: boolean;
  masterPasswordSalt: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setupMasterPassword: (password: string) => Promise<{ success: boolean; recoveryKey: string }>;
  unlockVault: (password: string) => Promise<boolean>;
  lockVault: () => void;
  recoverMasterPassword: (recoveryKey: string, newPassword: string) => Promise<{ success: boolean; newRecoveryKey?: string }>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('secure_note_token') : null,
  isLoading: true,
  isVaultUnlocked: false,
  hasMasterPassword: false,
  masterPasswordSalt: null,

  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { token, user } = response.data;
    localStorage.setItem('secure_note_token', token);
    localStorage.setItem('secure_note_user', JSON.stringify(user));
    set({
      token,
      user,
      hasMasterPassword: Boolean(user?.hasMasterPassword),
      masterPasswordSalt: user?.masterPasswordSalt || null,
      isLoading: false,
    });
  },

  register: async (email, username, password) => {
    const response = await api.post('/auth/register', { email, username, password });
    const { token, user } = response.data;
    localStorage.setItem('secure_note_token', token);
    localStorage.setItem('secure_note_user', JSON.stringify(user));
    set({
      token,
      user,
      hasMasterPassword: false,
      masterPasswordSalt: null,
      isLoading: false,
    });
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
    set({
      user: null,
      token: null,
      isVaultUnlocked: false,
      hasMasterPassword: false,
      masterPasswordSalt: null,
    });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('secure_note_token');
    if (!token) {
      set({ user: null, token: null, isLoading: false });
      return;
    }

    try {
      const response = await api.get('/auth/me');
      const u = response.data;
      set({
        user: u,
        token,
        hasMasterPassword: Boolean(u?.hasMasterPassword),
        masterPasswordSalt: u?.masterPasswordSalt || null,
        isLoading: false,
      });
    } catch (error) {
      localStorage.removeItem('secure_note_token');
      localStorage.removeItem('secure_note_user');
      set({ user: null, token: null, isLoading: false });
    }
  },

  setupMasterPassword: async (password: string) => {
    const salt = EncryptionService.generateSalt();
    const masterKey = EncryptionService.deriveKey(password, salt);
    const verifier = EncryptionService.deriveVerifier(masterKey);
    const recoveryKey = EncryptionService.generateRecoveryKey();
    const recoveryKeyHash = EncryptionService.hashRecoveryKey(recoveryKey);

    const res = await api.post('/auth/master-password/setup', {
      verifier,
      salt,
      recoveryKeyHash,
    });

    if (res.data.success) {
      EncryptionService.getInstance().setMasterPassword(password, salt);
      set({
        hasMasterPassword: true,
        masterPasswordSalt: salt,
        isVaultUnlocked: true,
      });
      return { success: true, recoveryKey };
    }
    throw new Error(res.data.error || 'ตั้งค่า Master Password ไม่สำเร็จ');
  },

  unlockVault: async (password: string) => {
    if (!password) return false;
    try {
      const salt = get().masterPasswordSalt || 'secure-note-salt-2026';
      const masterKey = EncryptionService.deriveKey(password, salt);
      const verifier = EncryptionService.deriveVerifier(masterKey);

      const res = await api.post('/auth/master-password/verify', { verifier });
      if (res.data.valid) {
        EncryptionService.getInstance().setMasterPassword(password, salt);
        set({ isVaultUnlocked: true });
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  },

  lockVault: () => {
    EncryptionService.getInstance().clear();
    set({ isVaultUnlocked: false });
  },

  recoverMasterPassword: async (recoveryKey: string, newPassword: string) => {
    const recoveryKeyHash = EncryptionService.hashRecoveryKey(recoveryKey);
    const newSalt = EncryptionService.generateSalt();
    const newMasterKey = EncryptionService.deriveKey(newPassword, newSalt);
    const newVerifier = EncryptionService.deriveVerifier(newMasterKey);
    const newRecoveryKey = EncryptionService.generateRecoveryKey();
    const newRecoveryKeyHash = EncryptionService.hashRecoveryKey(newRecoveryKey);

    const res = await api.post('/auth/master-password/recover', {
      recoveryKeyHash,
      newVerifier,
      newSalt,
      newRecoveryKeyHash,
    });

    if (res.data.success) {
      EncryptionService.getInstance().setMasterPassword(newPassword, newSalt);
      set({
        hasMasterPassword: true,
        masterPasswordSalt: newSalt,
        isVaultUnlocked: true,
      });
      return { success: true, newRecoveryKey };
    }
    throw new Error(res.data.error || 'กู้คืน Master Password ไม่สำเร็จ');
  },
}));
