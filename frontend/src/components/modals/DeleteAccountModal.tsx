import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { AlertTriangle, Trash2, X, RefreshCw, Lock, ShieldAlert } from 'lucide-react';
import api from '@/utils/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DeleteAccountModal({ isOpen, onClose }: DeleteAccountModalProps) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const isLocalUser = user?.authProvider === 'local' || !user?.googleId;

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLocalUser && !password) {
      toast.error('กรุณากรอกรหัสผ่านปัจจุบันเพื่อยืนยัน');
      return;
    }

    if (!isLocalUser && confirmText !== 'DELETE_MY_ACCOUNT') {
      toast.error('กรุณาพิมพ์คำว่า DELETE_MY_ACCOUNT เพื่อยืนยัน');
      return;
    }

    try {
      setIsDeleting(true);
      const res = await api.delete('/auth/me', {
        data: {
          password: isLocalUser ? password : undefined,
          confirmText: !isLocalUser ? confirmText : undefined,
        },
      });

      if (res.data?.success) {
        toast.success('ลบบัญชีและข้อมูลส่วนบุคคลทั้งหมดออกจากระบบถาวรเรียบร้อยแล้ว');
        onClose();
        await logout();
        router.push('/login');
      } else {
        toast.error(res.data?.error || 'ไม่สามารถลบบัญชีได้');
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || 'เกิดข้อผิดพลาดในการลบบัญชี';
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 border border-rose-500/30 dark:border-rose-500/40 rounded-3xl p-6 sm:p-7 w-full max-w-lg shadow-2xl space-y-5 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              <ShieldAlert size={22} />
            </span>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg">
                ลบบัญชีถาวร (Right to Erasure)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                สิทธิการขอให้ลบข้อมูลส่วนบุคคลตาม พ.ร.บ. PDPA
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Warning Callout */}
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs sm:text-sm space-y-2">
          <div className="font-bold flex items-center gap-1.5">
            <AlertTriangle size={16} />
            <span>คำเตือน: ข้อมูลจะถูกทำลายถาวรและไม่สามารถกู้คืนได้</span>
          </div>
          <p className="text-xs leading-relaxed text-rose-600 dark:text-rose-300/90">
            เมื่อยืนยัน ระบบจะทำการลบบัญชีของท่าน โน้ตทั้งหมด (รวมถึงห้องนิรภัย E2EE), กระดาน, รูปภาพ, ไฟล์แนบ, รายการเตือนความจำ และประวัติการล็อกอิน ออกจากเซิร์ฟเวอร์โดยสมบูรณ์
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
            💡 <i>คำแนะนำ: หากต้องการเก็บข้อมูลไว้ กรุณาดาวน์โหลดสำรองข้อมูล (JSON / Markdown) ในเมนู "สำรองข้อมูล" ก่อนกดยืนยัน</i>
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleDelete} className="space-y-4">
          {isLocalUser ? (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Lock size={13} className="text-slate-400" />
                <span>กรุณากรอกรหัสผ่านปัจจุบันเพื่อยืนยันตัวตน:</span>
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="รหัสผ่านปัจจุบันของคุณ"
                className="w-full px-4 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                พิมพ์คำว่า <span className="font-mono text-rose-600 dark:text-rose-400 font-black">DELETE_MY_ACCOUNT</span> เพื่อยืนยัน:
              </label>
              <input
                type="text"
                required
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE_MY_ACCOUNT"
                className="w-full px-4 py-2.5 rounded-xl font-mono text-xs sm:text-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isDeleting || (isLocalUser ? !password : confirmText !== 'DELETE_MY_ACCOUNT')}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition active:scale-95"
            >
              {isDeleting ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
              <span>{isDeleting ? 'กำลังลบข้อมูล...' : 'ยืนยันลบบัญชีถาวร'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
