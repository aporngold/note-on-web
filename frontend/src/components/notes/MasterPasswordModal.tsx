import React, { useState } from 'react';
import { Lock, KeyRound, AlertCircle, X } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

interface MasterPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  title?: string;
  description?: string;
}

export default function MasterPasswordModal({
  isOpen,
  onClose,
  onSuccess,
  title = 'ปลดล็อกห้องนิรภัย (Secure Vault)',
  description = 'กรุณาใส่ Master Password เพื่อถอดรหัสและดูเนื้อหาโน้ตที่เข้ารหัสแบบ End-to-End Encryption',
}: MasterPasswordModalProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const unlockVault = useAuthStore((state) => state.unlockVault);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('กรุณากรอกรหัสผ่าน');
      return;
    }

    const success = unlockVault(password);
    if (success) {
      toast.success('ปลดล็อกห้องนิรภัยสำเร็จ!');
      setPassword('');
      setError('');
      if (onSuccess) onSuccess();
      onClose();
    } else {
      setError('เกิดข้อผิดพลาดในการปลดล็อก');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Lock size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">AES-256-GCM Protection</p>
          </div>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
          {description}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Master Password
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="กรอกรหัสผ่านหลักของคุณ..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                autoFocus
              />
              <KeyRound size={18} className="absolute left-3 top-3 text-slate-400" />
            </div>
            {error && (
              <p className="flex items-center gap-1.5 text-xs text-rose-500 mt-2">
                <AlertCircle size={14} />
                {error}
              </p>
            )}
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 rounded-xl shadow-md shadow-indigo-500/25 transition"
            >
              ปลดล็อก
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
