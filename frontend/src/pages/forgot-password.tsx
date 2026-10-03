import React, { useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Mail, ArrowLeft, Loader2, CheckCircle2, ShieldCheck } from 'lucide-react';
import api from '@/utils/api';

const GridBloom = dynamic(() => import('@/components/ui/grid-bloom'), {
  ssr: false,
});

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'กรุณากรอกอีเมล')
    .email('รูปแบบอีเมลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง'),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', {
        email: data.email,
      });

      setSubmittedEmail(data.email);
      setIsSubmitted(true);
      toast.success(res.data.message || 'ส่งคำขอรีเซ็ตรหัสผ่านแล้ว');
    } catch (error: any) {
      // Always show generic error if network fails, or generic success to protect enumeration
      toast.error(error.response?.data?.error || 'เกิดข้อผิดพลาดในการส่งคำขอ กรุณาลองใหม่อีกครั้ง');
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

      {/* Forgot Password Card: Glassmorphic Container */}
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
            ลืมรหัสผ่าน?
          </h1>
          <p className="text-xs text-slate-500 font-normal">
            กรุณากรอกอีเมลที่ผูกไว้กับบัญชี NoteAll ของคุณ
          </p>
        </div>

        {isSubmitted ? (
          /* Success Notification Card (Account Enumeration Defense) */
          <div className="space-y-6 pt-2 animate-fade-in">
            <div className="p-5 rounded-2xl bg-teal-50/90 border border-teal-200/80 text-teal-900 space-y-3">
              <div className="flex items-center gap-2.5 text-teal-700 font-bold text-sm">
                <CheckCircle2 size={20} className="text-teal-600 flex-shrink-0" />
                <span>ส่งคำขอรีเซ็ตรหัสผ่านเรียบร้อยแล้ว</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                หากอีเมล <span className="font-semibold text-slate-900">{submittedEmail}</span> มีบัญชีอยู่ในระบบ NoteAll ระบบได้จัดส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปยังอีเมลของคุณเรียบร้อยแล้ว
              </p>
              <div className="text-[11px] text-slate-500 pt-2 border-t border-teal-200/50 flex items-start gap-1.5">
                <ShieldCheck size={14} className="text-teal-600 flex-shrink-0 mt-0.5" />
                <span>ลิงก์มีความปลอดภัยและมีอายุการใช้งาน 15 นาที กรุณาตรวจสอบในกล่องจดหมาย หรือโฟลเดอร์ Junk/Spam</span>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              <Link
                href="/login"
                className="w-full py-3 bg-gradient-to-r from-teal-500 to-sky-500 hover:from-teal-600 hover:to-sky-600 text-white rounded-xl font-semibold shadow-lg shadow-teal-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-sm"
              >
                <ArrowLeft size={16} />
                <span>กลับไปหน้าเข้าสู่ระบบ</span>
              </Link>

              <button
                type="button"
                onClick={() => setIsSubmitted(false)}
                className="w-full py-2.5 text-slate-600 hover:text-slate-900 text-xs font-medium hover:underline transition"
              >
                กรอกอีเมลอื่น
              </button>
            </div>
          </div>
        ) : (
          /* Forgot Password Form */
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                อีเมลของคุณ
              </label>
              <div className="relative">
                <input
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  autoFocus
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300/80 bg-white/70 backdrop-blur-sm text-slate-900 placeholder-slate-400 text-sm focus:bg-white focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 focus:outline-none transition shadow-sm"
                />
                <Mail size={17} className="absolute left-3.5 top-3 text-slate-400" />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs text-rose-500 font-medium">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="p-3.5 rounded-xl bg-slate-100/70 border border-slate-200/60 text-slate-600 text-xs flex items-start gap-2.5">
              <ShieldCheck size={16} className="text-teal-600 flex-shrink-0 mt-0.5" />
              <span>
                เพื่อความปลอดภัยสูงสุด ระบบจะส่งลิงก์แบบใช้ครั้งเดียว (One-Time Link) ที่มีอายุ 15 นาที
              </span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-teal-500 to-sky-500 hover:from-teal-600 hover:to-sky-600 text-white rounded-xl font-semibold shadow-lg shadow-teal-500/20 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>กำลังส่งลิงก์...</span>
                </>
              ) : (
                <span>ส่งลิงก์รีเซ็ตรหัสผ่าน</span>
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
