import React, { useState, useEffect } from 'react';
import { Lock, Unlock, KeyRound, AlertCircle, Eye, EyeOff, ShieldCheck, Copy, Check, ArrowLeft, RefreshCw, X } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useNoteStore } from '@/store/noteStore';
import toast from 'react-hot-toast';
import ViewportPortal from '@/components/ui/ViewportPortal';

interface MasterPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  title?: string;
  description?: string;
}

type ModalMode = 'unlock' | 'setup' | 'setup_success' | 'recover';

export default function MasterPasswordModal({
  isOpen,
  onClose,
  onSuccess,
  title,
  description,
}: MasterPasswordModalProps) {
  const { hasMasterPassword, unlockVault, setupMasterPassword, recoverMasterPassword } = useAuthStore();
  const [mode, setMode] = useState<ModalMode>('unlock');

  // Input states
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [recoveryKeyInput, setRecoveryKeyInput] = useState('');
  const [generatedRecoveryKey, setGeneratedRecoveryKey] = useState('');

  // UI helpers
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [hasCopiedKey, setHasCopiedKey] = useState(false);
  const [hasConfirmedSavedKey, setHasConfirmedSavedKey] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync initial mode based on whether user has set master password yet
  useEffect(() => {
    if (isOpen) {
      if (!hasMasterPassword) {
        setMode('setup');
      } else {
        setMode('unlock');
      }
      setPassword('');
      setConfirmPassword('');
      setRecoveryKeyInput('');
      setGeneratedRecoveryKey('');
      setError('');
      setShowPassword(false);
      setHasCopiedKey(false);
      setHasConfirmedSavedKey(false);
      setIsSubmitting(false);
    }
  }, [isOpen, hasMasterPassword]);

  if (!isOpen) return null;

  // Password requirement validations
  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isPasswordValid = hasMinLength && hasUpperCase && hasLowerCase && hasNumber;

  // 1. Handle Unlock
  const handleUnlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('กรุณากรอก Master Password');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      const success = await unlockVault(password);
      if (success) {
        toast.success('ปลดล็อกห้องนิรภัยสำเร็จ!');
        useNoteStore.getState().processPendingLock();
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setError('Master Password ไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
      }
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการตรวจสอบรหัสผ่าน');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Handle Setup Master Password
  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) {
      setError('กรุณาตั้งรหัสผ่านให้ตรงตามข้อกำหนดความปลอดภัย');
      return;
    }
    if (password !== confirmPassword) {
      setError('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      const result = await setupMasterPassword(password);
      if (result.success) {
        setGeneratedRecoveryKey(result.recoveryKey);
        setMode('setup_success');
        toast.success('ตั้งค่า Master Password สำเร็จแล้ว!');
      }
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการตั้งค่ารหัสผ่าน');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Handle Finish Setup after saving recovery key
  const handleFinishSetup = () => {
    if (!hasConfirmedSavedKey) {
      setError('กรุณายืนยันว่าคุณได้บันทึก Recovery Key แล้ว');
      return;
    }
    useNoteStore.getState().processPendingLock();
    if (onSuccess) onSuccess();
    onClose();
  };

  // 4. Handle Recovery with Recovery Key
  const handleRecoverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryKeyInput.trim()) {
      setError('กรุณากรอก Recovery Key');
      return;
    }
    if (!isPasswordValid) {
      setError('กรุณาตั้งรหัสผ่านใหม่ให้ตรงตามข้อกำหนด');
      return;
    }
    if (password !== confirmPassword) {
      setError('รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      const result = await recoverMasterPassword(recoveryKeyInput.trim(), password);
      if (result.success) {
        setGeneratedRecoveryKey(result.newRecoveryKey || '');
        setMode('setup_success');
        toast.success('รีเซ็ต Master Password สำเร็จแล้ว!');
      }
    } catch (err: any) {
      setError(err.message || 'Recovery Key ไม่ถูกต้อง หรือเกิดข้อผิดพลาด');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setHasCopiedKey(true);
    toast.success('คัดลอก Recovery Key แล้ว!');
    setTimeout(() => setHasCopiedKey(false), 3000);
  };

  return (
    <ViewportPortal>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in select-none"
        onClick={onClose}
      >
        <div
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-7 relative overflow-hidden select-text"
          onClick={(e) => e.stopPropagation()}
        >
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          <X size={20} />
        </button>

        {/* Header Section */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 shrink-0">
            {mode === 'setup' || mode === 'setup_success' ? <ShieldCheck size={26} /> : <Lock size={24} />}
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
              {mode === 'setup'
                ? 'ตั้ง Master Password ครั้งแรก'
                : mode === 'setup_success'
                ? 'บันทึก Recovery Key สำคัญ'
                : mode === 'recover'
                ? 'กู้คืน Master Password'
                : title || 'ปลดล็อกโน้ตที่เข้ารหัส (E2EE)'}
            </h3>
            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
              End-to-End Encryption (AES-256-GCM / PBKDF2)
            </p>
          </div>
        </div>

        {/* ----------------- MODE 1: UNLOCK ----------------- */}
        {mode === 'unlock' && (
          <form onSubmit={handleUnlockSubmit} className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {description || 'กรุณาใส่ Master Password เพื่อถอดรหัสและดูเนื้อหาโน้ตที่เข้ารหัสลับ'}
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Master Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="กรอก Master Password ของคุณ..."
                  className="w-full pl-10 pr-11 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium transition"
                  autoFocus
                />
                <KeyRound size={18} className="absolute left-3.5 top-3.5 text-slate-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {error && (
                <p className="flex items-center gap-1.5 text-xs text-rose-500 dark:text-rose-400 mt-2 font-medium">
                  <AlertCircle size={15} />
                  {error}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => {
                  setMode('recover');
                  setError('');
                }}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium cursor-pointer"
              >
                ลืม Master Password? กู้คืนด้วย Recovery Key
              </button>
            </div>

            <div className="flex gap-3 justify-end pt-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 active:scale-98 rounded-xl shadow-md shadow-indigo-500/25 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Unlock size={16} />
                <span>{isSubmitting ? 'กำลังตรวจสอบ...' : 'ปลดล็อกโน้ต'}</span>
              </button>
            </div>
          </form>
        )}

        {/* ----------------- MODE 2: SETUP FIRST TIME ----------------- */}
        {mode === 'setup' && (
          <form onSubmit={handleSetupSubmit} className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60">
              <p className="text-xs text-indigo-900 dark:text-indigo-200 leading-relaxed font-medium">
                🔒 <strong>Zero-Knowledge Encryption:</strong> โน้ตของคุณจะถูกเข้ารหัสบนอุปกรณ์นี้เท่านั้น เซิร์ฟเวอร์ไม่สามารถเข้าถึงเนื้อหาของคุณได้ กรุณาตั้ง Master Password สำหรับล็อกโน้ต
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                ตั้ง Master Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="อย่างน้อย 8 ตัวอักษร..."
                  className="w-full pl-10 pr-11 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium transition"
                  autoFocus
                />
                <KeyRound size={18} className="absolute left-3.5 top-3 text-slate-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                ยืนยัน Master Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="กรอกรหัสผ่านซ้ำอีกครั้ง..."
                  className="w-full pl-10 pr-11 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium transition"
                />
                <KeyRound size={18} className="absolute left-3.5 top-3 text-slate-400" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Checklist requirements */}
            <div className="grid grid-cols-2 gap-2 text-[11px] p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
              <span className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-400'}`}>
                {hasMinLength ? <Check size={13} /> : '•'} อย่างน้อย 8 ตัวอักษร
              </span>
              <span className={`flex items-center gap-1.5 ${hasUpperCase ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-400'}`}>
                {hasUpperCase ? <Check size={13} /> : '•'} มีตัวพิมพ์ใหญ่ (A-Z)
              </span>
              <span className={`flex items-center gap-1.5 ${hasLowerCase ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-400'}`}>
                {hasLowerCase ? <Check size={13} /> : '•'} มีตัวพิมพ์เล็ก (a-z)
              </span>
              <span className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-400'}`}>
                {hasNumber ? <Check size={13} /> : '•'} มีตัวเลข (0-9)
              </span>
            </div>

            {error && (
              <p className="flex items-center gap-1.5 text-xs text-rose-500 dark:text-rose-400 font-medium">
                <AlertCircle size={15} />
                {error}
              </p>
            )}

            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={!isPasswordValid || password !== confirmPassword || isSubmitting}
                className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 active:scale-98 rounded-xl shadow-md shadow-indigo-500/25 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>{isSubmitting ? 'กำลังประมวลผล...' : 'ถัดไป: รับ Recovery Key'}</span>
              </button>
            </div>
          </form>
        )}

        {/* ----------------- MODE 3: SETUP SUCCESS & RECOVERY KEY ----------------- */}
        {mode === 'setup_success' && (
          <div className="space-y-4 animate-fade-in">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs leading-relaxed space-y-1.5">
              <p className="font-bold flex items-center gap-1.5 text-amber-700 dark:text-amber-400 text-sm">
                <AlertCircle size={18} />
                คำเตือนสำคัญเกี่ยวกับความปลอดภัย
              </p>
              <p>
                Master Password ใช้สำหรับเข้าถึง Note ที่เข้ารหัสลับ <strong>หากคุณลืมรหัสผ่านและไม่มี Recovery Key คุณจะไม่สามารถถอดรหัส Note ได้อีกต่อไป</strong>
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Recovery Key ของคุณ (ใช้สำหรับกู้คืนรหัสผ่าน)
              </label>
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-indigo-400/60 dark:border-indigo-500/60">
                <span className="font-mono text-sm sm:text-base font-bold text-indigo-700 dark:text-indigo-300 tracking-wider select-all">
                  {generatedRecoveryKey}
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(generatedRecoveryKey)}
                  className="px-3 py-1.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  {hasCopiedKey ? <Check size={14} /> : <Copy size={14} />}
                  <span>{hasCopiedKey ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
                </button>
              </div>
            </div>

            <label className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={hasConfirmedSavedKey}
                onChange={(e) => {
                  setHasConfirmedSavedKey(e.target.checked);
                  setError('');
                }}
                className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <span className="text-xs text-slate-700 dark:text-slate-300 leading-snug font-medium">
                ฉันได้คัดลอกและบันทึก Recovery Key ไว้ในที่ปลอดภัยเรียบร้อยแล้ว
              </span>
            </label>

            {error && (
              <p className="flex items-center gap-1.5 text-xs text-rose-500 dark:text-rose-400 font-medium">
                <AlertCircle size={15} />
                {error}
              </p>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleFinishSetup}
                disabled={!hasConfirmedSavedKey}
                className="w-full sm:w-auto px-7 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 active:scale-98 rounded-xl shadow-md shadow-indigo-500/25 transition cursor-pointer disabled:opacity-50"
              >
                เริ่มใช้งานโน้ตที่เข้ารหัสลับ
              </button>
            </div>
          </div>
        )}

        {/* ----------------- MODE 4: RECOVER WITH RECOVERY KEY ----------------- */}
        {mode === 'recover' && (
          <form onSubmit={handleRecoverSubmit} className="space-y-4 animate-fade-in">
            <button
              type="button"
              onClick={() => {
                setMode('unlock');
                setError('');
              }}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition cursor-pointer mb-2"
            >
              <ArrowLeft size={14} />
              <span>กลับสู่หน้าปลดล็อก</span>
            </button>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Recovery Key 24 หลัก
              </label>
              <input
                type="text"
                value={recoveryKeyInput}
                onChange={(e) => {
                  setRecoveryKeyInput(e.target.value.toUpperCase());
                  setError('');
                }}
                placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX"
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder-slate-400 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                ตั้ง Master Password ใหม่
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="รหัสผ่านใหม่ (อย่างน้อย 8 ตัวอักษร)..."
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                ยืนยัน Master Password ใหม่
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError('');
                }}
                placeholder="ยืนยันรหัสผ่านใหม่..."
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
            </div>

            {error && (
              <p className="flex items-center gap-1.5 text-xs text-rose-500 dark:text-rose-400 font-medium">
                <AlertCircle size={15} />
                {error}
              </p>
            )}

            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !recoveryKeyInput.trim() || !isPasswordValid || password !== confirmPassword}
                className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 active:scale-98 rounded-xl shadow-md shadow-indigo-500/25 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw size={16} className={isSubmitting ? 'animate-spin' : ''} />
                <span>{isSubmitting ? 'กำลังตรวจสอบ...' : 'กู้คืนและตั้งรหัสผ่าน'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  </ViewportPortal>
);
}
