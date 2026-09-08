import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Loader2, ShieldCheck, Lock, Mail } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

const GridBloom = dynamic(() => import('@/components/ui/grid-bloom'), {
  ssr: false,
});

const loginSchema = z.object({
  email: z.string().min(1, 'กรุณากรอกอีเมลหรือชื่อผู้ใช้'),
  password: z.string().min(6, 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const login = useAuthStore((state) => state.login);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      await login(data.email, data.password);
      toast.success('ยินดีต้อนรับ! เข้าสู่ระบบสำเร็จ');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#0d1117] overflow-hidden p-6 sm:p-10 select-none font-inter">
      {/* Subtle Pastel Ambient Orbs (Mauve/Lavender → Mint Green → Blush Pink) */}
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#c4b5fd]/15 blur-[100px] pointer-events-none" />
      <div className="absolute top-1/3 -right-24 w-96 h-96 rounded-full bg-[#a7f3d0]/12 blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-24 left-1/4 w-96 h-96 rounded-full bg-[#fbcfe8]/12 blur-[100px] pointer-events-none" />

      {/* 3D Animated Grid Bloom Background - Ethereal, Thin & Subtle Pastel Mint */}
      <GridBloom
        className="opacity-30 pointer-events-none"
        color="#a7f3d0"
        speed={0.3}
        gridScale={16.0}
        fadeFalloff={6.5}
        distortionAmount={0.02}
        hoverLightRadius={0.6}
        hoverRepulsionRadius={1.0}
        hoverRepulsionStrength={0.3}
      />

      {/* Glassmorphism Card (Trend 2025: Translucent, Soft, Airy Spacing) */}
      <div className="relative z-10 w-full max-w-[440px] p-8 sm:p-11 bg-white/[0.04] dark:bg-slate-900/[0.35] backdrop-blur-2xl border border-white/[0.12] dark:border-white/[0.08] rounded-[28px] shadow-[0_16px_40px_rgba(0,0,0,0.25)] space-y-8 animate-fade-in">
        {/* Header Branding */}
        <div className="text-center space-y-3">
          <div className="inline-flex p-3.5 rounded-2xl bg-gradient-to-tr from-[#b4a2d8] via-[#a7f3d0] to-[#f9a8d4] text-slate-800 shadow-lg shadow-purple-900/10 mb-1">
            <ShieldCheck size={32} className="stroke-[2.2]" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
            เข้าสู่ระบบ SecureNote
          </h1>
          <p className="text-xs text-slate-400 font-normal leading-relaxed">
            ระบบจดบันทึกความปลอดภัยสูง ป้องกันข้อมูลลับของคุณ
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-300 tracking-wide">
              อีเมล หรือ ชื่อผู้ใช้
            </label>
            <div className="relative">
              <input
                {...register('email')}
                type="text"
                autoComplete="email"
                placeholder="name@example.com หรือ username"
                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-white/[0.1] bg-white/[0.03] dark:bg-slate-950/[0.3] backdrop-blur-md text-slate-100 placeholder-slate-500 text-sm focus:ring-2 focus:ring-[#a7f3d0]/40 focus:border-[#a7f3d0]/60 focus:outline-none transition-all duration-200"
              />
              <Mail size={17} className="absolute left-4 top-3.5 text-slate-400" />
            </div>
            {errors.email && (
              <p className="text-xs text-rose-400/90 font-normal pl-1">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-slate-300 tracking-wide">
                รหัสผ่าน
              </label>
            </div>
            <div className="relative">
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full pl-11 pr-11 py-3 rounded-2xl border border-white/[0.1] bg-white/[0.03] dark:bg-slate-950/[0.3] backdrop-blur-md text-slate-100 placeholder-slate-500 text-sm focus:ring-2 focus:ring-[#a7f3d0]/40 focus:border-[#a7f3d0]/60 focus:outline-none transition-all duration-200"
              />
              <Lock size={17} className="absolute left-4 top-3.5 text-slate-400" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-200 transition-colors"
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-rose-400/90 font-normal pl-1">{errors.password.message}</p>
            )}
          </div>

          {/* Pastel Button: Mauve/Lavender → Mint Green → Blush Pink */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 mt-2 bg-gradient-to-r from-[#b4a2d8] via-[#a7f3d0] to-[#f9a8d4] hover:opacity-90 active:scale-[0.99] text-slate-800 font-semibold rounded-2xl shadow-md shadow-slate-900/10 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 text-sm tracking-wide"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin text-slate-800" />
                <span>กำลังเข้าสู่ระบบ...</span>
              </>
            ) : (
              <span>เข้าสู่ระบบ</span>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="text-center pt-3 border-t border-white/[0.08]">
          <p className="text-xs text-slate-400">
            ยังไม่มีบัญชีใช้งาน?{' '}
            <Link
              href="/register"
              className="text-[#a7f3d0] hover:text-[#f9a8d4] font-medium transition-colors duration-200"
            >
              สมัครสมาชิกใหม่
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
