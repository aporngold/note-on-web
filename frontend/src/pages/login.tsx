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
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f5f3ff] via-[#f0fdf4] to-[#fdf2f8] overflow-hidden p-6 sm:p-10 select-none font-inter">
      {/* Soft Ambient Pastel Glows (Mauve/Lavender → Mint Green → Blush Pink) */}
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#c4b5fd]/25 blur-[90px] pointer-events-none" />
      <div className="absolute top-1/3 -right-24 w-96 h-96 rounded-full bg-[#a7f3d0]/25 blur-[90px] pointer-events-none" />
      <div className="absolute -bottom-24 left-1/4 w-96 h-96 rounded-full bg-[#fbcfe8]/25 blur-[90px] pointer-events-none" />

      {/* 3D Animated Grid Bloom Background Effect (Light Pastel Mode, Normal Blending) */}
      <GridBloom
        className="opacity-40 pointer-events-none"
        color="#86efac"
        speed={0.4}
        gridScale={15.0}
        fadeFalloff={7.0}
        distortionAmount={0.025}
        hoverLightRadius={0.7}
        hoverRepulsionRadius={1.2}
        hoverRepulsionStrength={0.4}
        blending="normal"
      />

      {/* Light Glassmorphic Card (Translucent, Bright, Airy, Soothing) */}
      <div className="relative z-10 w-full max-w-[440px] p-8 sm:p-11 bg-white/75 backdrop-blur-2xl border border-white/80 rounded-[28px] shadow-[0_20px_50px_rgba(180,162,216,0.12)] space-y-7 animate-fade-in">
        {/* Header Branding */}
        <div className="text-center space-y-2.5">
          <div className="inline-flex p-3.5 rounded-2xl bg-gradient-to-tr from-[#b4a2d8] via-[#a7f3d0] to-[#f9a8d4] text-slate-800 shadow-md shadow-purple-100 mb-1">
            <ShieldCheck size={32} className="stroke-[2.2]" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            เข้าสู่ระบบ SecureNote
          </h1>
          <p className="text-xs text-slate-500 font-normal leading-relaxed">
            ระบบจดบันทึกความปลอดภัยสูง ป้องกันข้อมูลลับของคุณ
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4.5">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-600 tracking-wide">
              อีเมล หรือ ชื่อผู้ใช้
            </label>
            <div className="relative">
              <input
                {...register('email')}
                type="text"
                autoComplete="email"
                placeholder="name@example.com หรือ username"
                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200/80 bg-white/70 backdrop-blur-md text-slate-800 placeholder-slate-400 text-sm focus:bg-white focus:ring-2 focus:ring-[#a7f3d0] focus:border-[#a7f3d0] focus:outline-none transition-all shadow-sm"
              />
              <Mail size={17} className="absolute left-4 top-3.5 text-slate-400" />
            </div>
            {errors.email && (
              <p className="text-xs text-rose-500 font-medium pl-1">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-600 tracking-wide">
                รหัสผ่าน
              </label>
            </div>
            <div className="relative">
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full pl-11 pr-11 py-3 rounded-2xl border border-slate-200/80 bg-white/70 backdrop-blur-md text-slate-800 placeholder-slate-400 text-sm focus:bg-white focus:ring-2 focus:ring-[#a7f3d0] focus:border-[#a7f3d0] focus:outline-none transition-all shadow-sm"
              />
              <Lock size={17} className="absolute left-4 top-3.5 text-slate-400" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-rose-500 font-medium pl-1">{errors.password.message}</p>
            )}
          </div>

          {/* Pastel Button: Mauve/Lavender → Mint Green → Blush Pink */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 mt-2 bg-gradient-to-r from-[#b4a2d8] via-[#a7f3d0] to-[#f9a8d4] hover:opacity-90 active:scale-[0.99] text-slate-800 font-semibold rounded-2xl shadow-md shadow-emerald-100/60 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 text-sm tracking-wide"
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
        <div className="text-center pt-3 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            ยังไม่มีบัญชีใช้งาน?{' '}
            <Link
              href="/register"
              className="text-teal-600 hover:text-pink-500 font-semibold transition-colors duration-200"
            >
              สมัครสมาชิกใหม่
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
