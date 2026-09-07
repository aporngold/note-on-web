import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Lock, Unlock, ShieldAlert, KeyRound, Plus, ShieldCheck, AlertCircle } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import NoteCard from '@/components/notes/NoteCard';
import MasterPasswordModal from '@/components/notes/MasterPasswordModal';
import { useNoteStore } from '@/store/noteStore';
import { useAuthStore } from '@/store/authStore';

export default function VaultPage() {
  const router = useRouter();
  const { user, isVaultUnlocked, lockVault, unlockVault } = useAuthStore();
  const { notes, fetchNotes } = useNoteStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      fetchNotes({ isArchived: false, isLocked: true });
    }
  }, [user, fetchNotes]);

  const vaultNotes = notes.filter((n) => n.isLocked);

  const handleUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput) {
      setError('กรุณากรอก Master Password');
      return;
    }
    const ok = unlockVault(passwordInput);
    if (ok) {
      setPasswordInput('');
      setError('');
      fetchNotes({ isArchived: false, isLocked: true });
    } else {
      setError('เกิดข้อผิดพลาดในการปลดล็อก');
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 text-white flex items-center justify-center shadow-lg shadow-amber-500/25">
                <Lock size={22} />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  ห้องนิรภัย (Secure Vault)
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  เข้ารหัสลับระดับสูง (AES-256-GCM / CBC) เฉพาะคุณที่มี Master Password เท่านั้นที่เปิดอ่านได้
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isVaultUnlocked ? (
              <button
                onClick={lockVault}
                className="px-4 py-2 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <Lock size={15} />
                <span>ล็อกห้องนิรภัยทันที</span>
              </button>
            ) : (
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-500/20 transition flex items-center gap-1.5"
              >
                <KeyRound size={15} />
                <span>ใส่รหัสปลดล็อก</span>
              </button>
            )}
          </div>
        </div>

        {/* Vault Locked State Card */}
        {!isVaultUnlocked ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-8 sm:p-12 text-center max-w-xl mx-auto space-y-6 shadow-xl my-6 animate-fade-in">
            <div className="w-20 h-20 rounded-3xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 mx-auto flex items-center justify-center shadow-inner">
              <Lock size={40} />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                ห้องนิรภัยถูกล็อกอยู่
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                เนื้อหาโน้ตทั้งหมดในหมวดนี้ได้รับการเข้ารหัสแบบ End-to-End ด้วยมาตรฐานความปลอดภัยสูงสุด
                กรุณาป้อน Master Password เพื่อถอดรหัสเนื้อหา
              </p>
            </div>

            <form onSubmit={handleUnlockSubmit} className="space-y-4 max-w-sm mx-auto">
              <div className="relative">
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setError('');
                  }}
                  placeholder="กรอก Master Password..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <KeyRound size={17} className="absolute left-3.5 top-3 text-slate-400" />
              </div>
              {error && (
                <p className="text-xs text-rose-500 flex items-center justify-center gap-1">
                  <AlertCircle size={14} /> {error}
                </p>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-amber-500/25 transition"
              >
                ปลดล็อกห้องนิรภัย
              </button>
            </form>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2">
              <ShieldCheck size={16} className="text-emerald-500 flex-shrink-0" />
              <span>กุญแจรหัสผ่านจะถูกเก็บเฉพาะในหน่วยความจำเครื่อง ไม่ถูกส่งไปยังเซิร์ฟเวอร์</span>
            </div>
          </div>
        ) : (
          /* Vault Unlocked State */
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/40 flex items-center justify-between gap-3 text-xs text-emerald-800 dark:text-emerald-300">
              <div className="flex items-center gap-2">
                <Unlock size={17} className="text-emerald-600 flex-shrink-0" />
                <span className="font-semibold">
                  ห้องนิรภัยปลดล็อกแล้ว (E2EE Session Active) - คุณสามารถอ่านและแก้ไขโน้ตลับได้ตามปกติ
                </span>
              </div>
              <button
                onClick={lockVault}
                className="font-bold underline hover:opacity-80"
              >
                ล็อกกลับทันที
              </button>
            </div>

            {vaultNotes.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-12 text-center space-y-3">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  ยังไม่มีโน้ตที่เข้ารหัสลับในห้องนิรภัย
                </p>
                <p className="text-xs text-slate-400">
                  เวลาสร้างหรือแก้ไขโน้ต กดปุ่ม "เข้ารหัส E2EE" เพื่อเพิ่มเข้าห้องนิรภัย
                </p>
                <button
                  onClick={() => router.push('/notes/new')}
                  className="mt-2 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl"
                >
                  สร้างโน้ตใหม่
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {vaultNotes.map((note) => (
                  <NoteCard key={note.id} note={note} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <MasterPasswordModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchNotes({ isArchived: false, isLocked: true })}
      />
    </Layout>
  );
}
