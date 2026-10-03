import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Lock, Eye, EyeOff, Check, X, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import api from '@/utils/api';

const GridBloom = dynamic(() => import('@/components/ui/grid-bloom'), {
  ssr: false,
});

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(13, 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 13 ตัวอักษร')
      .regex(/[a-z]/, 'ต้องมีตัวพิมพ์เล็กอย่างน้อย 1 ตัว')
      .regex(/[A-Z]/, 'ต้องมีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว')
      .regex(/[0-9]/, 'ต้องมีตัวเลขอย่างน้อย 1 ตัว')
      .regex(/[^A-Za-z0-9]/, 'ต้องมีอักขระพิเศษอย่างน้อย 1 ตัว (!@#$%^&*...)'),
    confirmPassword: z.string().min(1, 'กรุณายืนยันรหัสผ่านใหม่'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'รหัสผ่านทั้งสองช่องไม่ตรงกัน',
    path: ['confirmPassword'],
  });

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const [token, setToken] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onChange',
  });

  const passwordVal = watch('password') || '';
  const confirmPasswordVal = watch('confirmPassword') || '';

  // Password rules validation criteria
  const ruleMinLength = passwordVal.length >= 13;
  const ruleLowercase = /[a-z]/.test(passwordVal);
  const ruleUppercase = /[A-Z]/.test(passwordVal);
  const ruleNumber = /[0-9]/.test(passwordVal);
  const ruleSpecial = /[^A-Za-z0-9]/.test(passwordVal);
  const ruleMatch = Boolean(passwordVal && confirmPasswordVal && passwordVal === confirmPasswordVal);

  useEffect(() => {
    if (!router.isReady) return;
    const queryToken = router.query.token;
    if (typeof queryToken === 'string' && queryToken.trim().length > 0) {
      setToken(queryToken.trim());
    }
  }, [router.isReady, router.query.token]);

  const onSubmit = async (data: ResetPasswordForm) => {
    if (!token) {
      toast.error('ไม่พบโทเคนสำหรับรีเซ็ตรหัสผ่าน กรุณากดลิงก์จากอีเมลของคุณ');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post('/auth/reset-password', {
        token,
        password: data.password,
      });

      toast.success(res.data.message || 'ตั้งรหัสผ่านใหม่เรียบร้อยแล้ว');
      // Redirect to login page
      setTimeout(() => {
        router.push('/login');
      }, 1200);
    } catch (error: any) {
      toast.error(
        error.response?.data?.error ||
          'การรีเซ็ตรหัสผ่านล้มเหลว ลิงก์อาจหมดอายุหรือถูกใช้งานแล้ว กรุณาส่งคำขอใหม่'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-950 overflow-hidden p-4 sm:p-6 select-none font-inter">
      {/* 3D Animated Grid Bloom Background */}
      <GridBloom
        color="#818cf8"
        speed={0.8}
        gridScale={14.0}
        fadeFalloff={8.0}
        distortionAmount={0.06}
        hoverLightRadius={0.7}
        hoverRepulsionRadius={1.2}
        hoverRepulsionStrength={0.5}
        blending="additive"
      />

      {/* Reset Password Card: Glassmorphic Container */}
      <div className="relative z-10 w-full max-w-md p-8 sm:p-10 bg-white/75 backdrop-blur-2xl border border-white/60 rounded-3xl shadow-2xl shadow-slate-950/25 space-y-6 animate-fade-in">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center mb-1">
            <img
              src="/NoteAll-icon.png"
              alt="NoteAll"
              className="w-14 h-14 sm:w-16 sm:h-16 object-contain drop-shadow-md rounded-2xl hover:scale-105 transition-transform"
            />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            ตั้งรหัสผ่านใหม่
          </h1>
          <p className="text-xs text-slate-500 font-normal">
            กำหนดรหัสผ่านใหม่สำหรับเข้าสู่ระบบ NoteAll ของคุณ
          </p>
        </div>

        {router.isReady && !token ? (
          /* Missing or Invalid Token Alert */
          <div className="space-y-5 pt-2 animate-fade-in">
            <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-900 space-y-2">
              <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
                <AlertCircle size={18} className="text-amber-600 flex-shrink-0" />
                <span>ไม่พบลิงก์รีเซ็ตรหัสผ่าน</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                ไม่พบข้อมูลโทเคนยืนยัน กรุณาตรวจสอบว่าคุณได้คัดลอกหรือเปิดลิงก์จากอีเมลถูกต้องครบถ้วน
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <Link
                href="/forgot-password"
                className="w-full py-3 bg-gradient-to-r from-teal-500 to-sky-500 hover:from-teal-600 hover:to-sky-600 text-white rounded-xl font-semibold shadow-lg shadow-teal-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-sm"
              >
                <span>ขอลิงก์รีเซ็ตรหัสผ่านใหม่</span>
              </Link>

              <Link
                href="/login"
                className="w-full py-2.5 text-center text-slate-600 hover:text-slate-900 text-xs font-medium block hover:underline transition"
              >
                กลับไปหน้าเข้าสู่ระบบ
              </Link>
            </div>
          </div>
        ) : (
          /* Reset Password Form */
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* New Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                รหัสผ่านใหม่
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  autoFocus
                  placeholder="•••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300/80 bg-white/70 backdrop-blur-sm text-slate-900 placeholder-slate-400 text-sm focus:bg-white focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 focus:outline-none transition shadow-sm"
                />
                <Lock size={17} className="absolute left-3.5 top-3 text-slate-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-rose-500 font-medium">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                ยืนยันรหัสผ่านใหม่
              </label>
              <div className="relative">
                <input
                  {...register('confirmPassword')}
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="•••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300/80 bg-white/70 backdrop-blur-sm text-slate-900 placeholder-slate-400 text-sm focus:bg-white focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 focus:outline-none transition shadow-sm"
                />
                <Lock size={17} className="absolute left-3.5 top-3 text-slate-400" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition"
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

            {/* Password Requirement Checklist (Live Realtime Feedback) */}
            <div className="p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/80 space-y-1.5 text-xs">
              <span className="font-semibold text-slate-700 block mb-1">
                เงื่อนไขความปลอดภัยของรหัสผ่าน:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                <div className={`flex items-center gap-1.5 ${ruleMinLength ? 'text-teal-600 font-semibold' : 'text-slate-400'}`}>
                  {ruleMinLength ? <Check size={13} className="text-teal-600" /> : <X size={13} />}
                  <span>ความยาวอย่างน้อย 13 ตัว</span>
                </div>
                <div className={`flex items-center gap-1.5 ${ruleLowercase ? 'text-teal-600 font-semibold' : 'text-slate-400'}`}>
                  {ruleLowercase ? <Check size={13} className="text-teal-600" /> : <X size={13} />}
                  <span>ตัวพิมพ์เล็ก (a-z)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${ruleUppercase ? 'text-teal-600 font-semibold' : 'text-slate-400'}`}>
                  {ruleUppercase ? <Check size={13} className="text-teal-600" /> : <X size={13} />}
                  <span>ตัวพิมพ์ใหญ่ (A-Z)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${ruleNumber ? 'text-teal-600 font-semibold' : 'text-slate-400'}`}>
                  {ruleNumber ? <Check size={13} className="text-teal-600" /> : <X size={13} />}
                  <span>ตัวเลข (0-9)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${ruleSpecial ? 'text-teal-600 font-semibold' : 'text-slate-400'}`}>
                  {ruleSpecial ? <Check size={13} className="text-teal-600" /> : <X size={13} />}
                  <span>อักขระพิเศษ (!@#$%^...)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${ruleMatch ? 'text-teal-600 font-semibold' : 'text-slate-400'}`}>
                  {ruleMatch ? <Check size={13} className="text-teal-600" /> : <X size={13} />}
                  <span>รหัสผ่านตรงกัน</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !token}
              className="w-full py-3 bg-gradient-to-r from-teal-500 to-sky-500 hover:from-teal-600 hover:to-sky-600 text-white rounded-xl font-semibold shadow-lg shadow-teal-500/20 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm mt-3"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>กำลังบันทึกรหัสผ่านใหม่...</span>
                </>
              ) : (
                <span>ตั้งรหัสผ่านใหม่</span>
              )}
            </button>

            <div className="text-center pt-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-teal-600 transition"
              >
                <ArrowLeft size={14} />
                <span>กลับไปหน้าเข้าสู่ระบบ</span>
              </Link>
            </div>
          </form>
        )}

        {/* Footer info */}
        <div className="text-center pt-2 border-t border-slate-200/60">
          <p className="text-[11px] text-slate-400">
            <Link href="/privacy" className="hover:text-slate-600 hover:underline transition">
              นโยบายความเป็นส่วนตัว (PDPA)
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
