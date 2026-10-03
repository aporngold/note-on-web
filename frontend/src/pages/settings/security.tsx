import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  Shield,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  Check,
  X,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Fingerprint,
  Info,
  LogOut,
  Smartphone,
  Laptop,
} from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import { useAuthStore } from '@/store/authStore';
import api from '@/utils/api';
import PasskeyModal from '@/components/modals/PasskeyModal';
import MasterPasswordModal from '@/components/notes/MasterPasswordModal';

const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, 'กรุณากรอกรหัสผ่านปัจจุบัน'),
    newPassword: z
      .string()
      .min(13, 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 13 ตัวอักษร')
      .regex(/[a-z]/, 'ต้องมีตัวพิมพ์เล็กอย่างน้อย 1 ตัว')
      .regex(/[A-Z]/, 'ต้องมีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว')
      .regex(/[0-9]/, 'ต้องมีตัวเลขอย่างน้อย 1 ตัว')
      .regex(/[^A-Za-z0-9]/, 'ต้องมีอักขระพิเศษอย่างน้อย 1 ตัว (!@#$%^&*...)'),
    confirmPassword: z.string().min(1, 'กรุณายืนยันรหัสผ่านใหม่'),
    revokeOtherSessions: z.boolean().default(true),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'รหัสผ่านใหม่ทั้งสองช่องไม่ตรงกัน',
    path: ['confirmPassword'],
  })
  .refine((data) => data.oldPassword !== data.newPassword, {
    message: 'รหัสผ่านใหม่ต้องไม่เหมือนกับรหัสผ่านเดิม',
    path: ['newPassword'],
  });

type ChangePasswordForm = z.infer<typeof changePasswordSchema>;

export default function SecuritySettingsPage() {
  const router = useRouter();
  const { user, token, checkAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPasskeyModalOpen, setIsPasskeyModalOpen] = useState(false);
  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      revokeOtherSessions: true,
    },
    mode: 'onChange',
  });

  const newPasswordVal = watch('newPassword') || '';
  const confirmPasswordVal = watch('confirmPassword') || '';

  // Password rules validation criteria
  const ruleMinLength = newPasswordVal.length >= 13;
  const ruleLowercase = /[a-z]/.test(newPasswordVal);
  const ruleUppercase = /[A-Z]/.test(newPasswordVal);
  const ruleNumber = /[0-9]/.test(newPasswordVal);
  const ruleSpecial = /[^A-Za-z0-9]/.test(newPasswordVal);
  const ruleMatch = Boolean(newPasswordVal && confirmPasswordVal && newPasswordVal === confirmPasswordVal);

  useEffect(() => {
    // Redirect if not logged in
    const storedToken = typeof window !== 'undefined' ? localStorage.getItem('secure_note_token') : null;
    if (!storedToken && !token) {
      router.replace('/login');
    }
  }, [token, router]);

  const onSubmit = async (data: ChangePasswordForm) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/change-password', {
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
        revokeOtherSessions: data.revokeOtherSessions,
      });

      toast.success(res.data.message || 'เปลี่ยนรหัสผ่านสำเร็จเรียบร้อย');
      reset();
      await checkAuth();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'การเปลี่ยนรหัสผ่านล้มเหลว กรุณาตรวจสอบข้อมูล');
    } finally {
      setIsLoading(false);
    }
  };

  const isGoogleOnly = Boolean(user && user.authProvider === 'google' && !user.hasPassword);

  return (
    <>
      <Head>
        <title>ความปลอดภัยและรหัสผ่าน | NoteAll</title>
      </Head>

      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-inter transition-colors duration-200">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
              title="กลับไปหน้าหลัก"
            >
              <ArrowLeft size={18} />
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-500 to-sky-500 text-white flex items-center justify-center shadow-sm">
                <Shield size={17} />
              </div>
              <div>
                <h1 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-tight">
                  ความปลอดภัยของบัญชี
                </h1>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  จัดการรหัสผ่านและสิทธิ์ความปลอดภัย
                </p>
              </div>
            </div>
          </div>

          <Link
            href="/dashboard"
            className="text-xs font-semibold text-teal-600 hover:text-teal-700 dark:text-teal-400 hover:underline px-2 py-1"
          >
            ไปที่หน้ากระดานโน้ต
          </Link>
        </header>

        {/* Main Content Container */}
        <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
          {/* Account Overview Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-extrabold text-base flex items-center justify-center shadow-md shadow-indigo-500/20">
                  {user?.username?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {user?.username}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {user?.email}
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-semibold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {user?.role || 'USER'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
                <span className="text-slate-400 dark:text-slate-500 block text-[11px]">วิธีการเข้าสู่ระบบ</span>
                <div className="flex items-center gap-2 font-medium text-slate-800 dark:text-slate-200">
                  {user?.authProvider === 'google' ? (
                    <>
                      <FcGoogle size={16} />
                      <span>Google Account</span>
                    </>
                  ) : (
                    <>
                      <KeyRound size={16} className="text-teal-600 dark:text-teal-400" />
                      <span>รหัสผ่าน NoteAll</span>
                    </>
                  )}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
                <span className="text-slate-400 dark:text-slate-500 block text-[11px]">สถานะรหัสผ่าน</span>
                <div className="flex items-center gap-1.5 font-medium">
                  {user?.hasPassword !== false ? (
                    <span className="text-teal-600 dark:text-teal-400 flex items-center gap-1">
                      <CheckCircle2 size={15} /> ตั้งค่ารหัสผ่านแล้ว
                    </span>
                  ) : (
                    <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <Info size={15} /> เข้าสู่ระบบผ่าน Google (ไม่มีรหัสผ่านในระบบ)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Password Change Section */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold text-lg">
                <KeyRound size={20} className="text-teal-600 dark:text-teal-400" />
                <span>เปลี่ยนรหัสผ่าน</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                เปลี่ยนรหัสผ่านเพื่อความปลอดภัยของบัญชีโน้ตของคุณ
              </p>
            </div>

            {isGoogleOnly ? (
              /* Google Account notice */
              <div className="p-5 rounded-2xl bg-sky-50/80 dark:bg-sky-950/30 border border-sky-200/80 dark:border-sky-800/50 space-y-2.5">
                <div className="flex items-center gap-2 text-sky-800 dark:text-sky-300 font-bold text-sm">
                  <FcGoogle size={19} />
                  <span>บัญชีนี้เข้าสู่ระบบผ่าน Google</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  บัญชีนี้ได้รับการลงทะเบียนผ่าน Google Identity จึงไม่มีรหัสผ่านของ Note on Web สำหรับเปลี่ยนที่นี่ หากต้องการเปลี่ยนรหัสผ่าน กรุณาจัดการผ่านการตั้งค่าบัญชี Google (Google Account Security) โดยตรง
                </p>
              </div>
            ) : (
              /* Change Password Form */
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
                {/* Current Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    รหัสผ่านปัจจุบัน
                  </label>
                  <div className="relative">
                    <input
                      {...register('oldPassword')}
                      type={showOldPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="•••••••••••••"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 placeholder-slate-400 text-sm focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 focus:outline-none transition shadow-xs"
                    />
                    <Lock size={17} className="absolute left-3.5 top-3 text-slate-400" />
                    <button
                      type="button"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                    >
                      {showOldPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                  {errors.oldPassword && (
                    <p className="mt-1 text-xs text-rose-500 font-medium">
                      {errors.oldPassword.message}
                    </p>
                  )}
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    รหัสผ่านใหม่
                  </label>
                  <div className="relative">
                    <input
                      {...register('newPassword')}
                      type={showNewPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="•••••••••••••"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 placeholder-slate-400 text-sm focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 focus:outline-none transition shadow-xs"
                    />
                    <Lock size={17} className="absolute left-3.5 top-3 text-slate-400" />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                    >
                      {showNewPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                  {errors.newPassword && (
                    <p className="mt-1 text-xs text-rose-500 font-medium">
                      {errors.newPassword.message}
                    </p>
                  )}
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    ยืนยันรหัสผ่านใหม่
                  </label>
                  <div className="relative">
                    <input
                      {...register('confirmPassword')}
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="•••••••••••••"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 placeholder-slate-400 text-sm focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 focus:outline-none transition shadow-xs"
                    />
                    <Lock size={17} className="absolute left-3.5 top-3 text-slate-400" />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                    >
                      {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-xs text-rose-500 font-medium">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                {/* Password Requirement Checklist */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-1.5 text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    เงื่อนไขความปลอดภัยของรหัสผ่าน:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                    <div className={`flex items-center gap-1.5 ${ruleMinLength ? 'text-teal-600 dark:text-teal-400 font-semibold' : 'text-slate-400 dark:text-slate-500'}`}>
                      {ruleMinLength ? <Check size={13} className="text-teal-600 dark:text-teal-400" /> : <X size={13} />}
                      <span>ความยาวอย่างน้อย 13 ตัว</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${ruleLowercase ? 'text-teal-600 dark:text-teal-400 font-semibold' : 'text-slate-400 dark:text-slate-500'}`}>
                      {ruleLowercase ? <Check size={13} className="text-teal-600 dark:text-teal-400" /> : <X size={13} />}
                      <span>ตัวพิมพ์เล็ก (a-z)</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${ruleUppercase ? 'text-teal-600 dark:text-teal-400 font-semibold' : 'text-slate-400 dark:text-slate-500'}`}>
                      {ruleUppercase ? <Check size={13} className="text-teal-600 dark:text-teal-400" /> : <X size={13} />}
                      <span>ตัวพิมพ์ใหญ่ (A-Z)</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${ruleNumber ? 'text-teal-600 dark:text-teal-400 font-semibold' : 'text-slate-400 dark:text-slate-500'}`}>
                      {ruleNumber ? <Check size={13} className="text-teal-600 dark:text-teal-400" /> : <X size={13} />}
                      <span>ตัวเลข (0-9)</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${ruleSpecial ? 'text-teal-600 dark:text-teal-400 font-semibold' : 'text-slate-400 dark:text-slate-500'}`}>
                      {ruleSpecial ? <Check size={13} className="text-teal-600 dark:text-teal-400" /> : <X size={13} />}
                      <span>อักขระพิเศษ (!@#$%^...)</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${ruleMatch ? 'text-teal-600 dark:text-teal-400 font-semibold' : 'text-slate-400 dark:text-slate-500'}`}>
                      {ruleMatch ? <Check size={13} className="text-teal-600 dark:text-teal-400" /> : <X size={13} />}
                      <span>รหัสผ่านตรงกัน</span>
                    </div>
                  </div>
                </div>

                {/* Revoke Sessions Option */}
                <div className="p-4 rounded-2xl bg-teal-50/70 dark:bg-teal-950/20 border border-teal-200/60 dark:border-teal-900/40 space-y-2">
                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input
                      {...register('revokeOtherSessions')}
                      type="checkbox"
                      className="mt-0.5 w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300 dark:border-slate-700"
                    />
                    <div className="text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                        ออกจากระบบอุปกรณ์อื่นทั้งหมด (Log out of all other devices)
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed block mt-0.5">
                        แนะนำเพื่อความปลอดภัย: ยกเลิกเซสชันบนอุปกรณ์อื่น สมาร์ทโฟน หรือแท็บเล็ตเครื่องอื่นทันทีหลังเปลี่ยนรหัสผ่าน
                      </span>
                    </div>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-teal-500 to-sky-500 hover:from-teal-600 hover:to-sky-600 text-white rounded-xl font-semibold shadow-md shadow-teal-500/20 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>กำลังบันทึกรหัสผ่าน...</span>
                    </>
                  ) : (
                    <span>เปลี่ยนรหัสผ่าน</span>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Quick Access to Other Security Features */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              การรักษาความปลอดภัยขั้นสูง
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <button
                type="button"
                onClick={() => setIsPasskeyModalOpen(true)}
                className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-teal-500/50 hover:bg-teal-50/50 dark:hover:bg-teal-950/20 text-left transition flex items-center gap-3.5 group"
              >
                <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <Fingerprint size={20} />
                </div>
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">
                    Passkey (WebAuthn / FIDO2)
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    เข้าสู่ระบบด้วยสแกนนิ้วมือ / Face ID
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setIsVaultModalOpen(true)}
                className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 text-left transition flex items-center gap-3.5 group"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <Lock size={20} />
                </div>
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">
                    Master Password (E2EE Vault)
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    ห้องนิรภัยเข้ารหัสโน้ตระดับสูง
                  </span>
                </div>
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* Auxiliary Modals */}
      <PasskeyModal
        isOpen={isPasskeyModalOpen}
        onClose={() => setIsPasskeyModalOpen(false)}
      />
      <MasterPasswordModal
        isOpen={isVaultModalOpen}
        onClose={() => setIsVaultModalOpen(false)}
      />
    </>
  );
}
