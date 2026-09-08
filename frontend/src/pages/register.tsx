import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Loader2, ShieldCheck, Lock, Mail, User } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

const GridBloom = dynamic(() => import('@/components/ui/grid-bloom'), {
  ssr: false,
});

const registerSchema = z
  .object({
    email: z.string().email('รูปแบบอีเมลไม่ถูกต้อง'),
    username: z.string().min(3, 'ชื่อผู้ใช้ต้องมีความยาวอย่างน้อย 3 ตัวอักษร'),
    password: z.string().min(6, 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร'),
    confirmPassword: z.string().min(6, 'กรุณายืนยันรหัสผ่าน'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'รหัสผ่านทั้งสองช่องไม่ตรงกัน',
    path: ['confirmPassword'],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const registerUser = useAuthStore((state) => state.register);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      await registerUser(data.email, data.username, data.password);
      toast.success('สมัครสมาชิกสำเร็จ ยินดีต้อนรับสู่ SecureNote!');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'เกิดข้อผิดพลาดในการสมัครสมาชิก');
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
      <div className="relative z-10 w-full max-w-[450px] p-8 sm:p-11 bg-white/[0.04] dark:bg-slate-900/[0.35] backdrop-blur-2xl border border-white/[0.12] dark:border-white/[0.08] rounded-[28px] shadow-[0_16px_40px_rgba(0,0,0,0.25)] space-y-7 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex p-3.5 rounded-2xl bg-gradient-to-tr from-[#b4a2d8] via-[#a7f3d0] to-[#f9a8d4] text-slate-800 shadow-lg shadow-purple-900/10 mb-1">
            <ShieldCheck size={32} className="stroke-[2.2]" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
            สร้างบัญชี SecureNote
          </h1>
          <p className="text-xs text-slate-400 font-normal leading-relaxed">
            เริ่มใช้งานสมุดบันทึกที่ปลอดภัย พร้อมระบบ E2EE Vault ฟรี
          </p>
        </div>

        {/* Register Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300 tracking-wide">
              อีเมล
            </label>
            <div className="relative">
              <input
                {...register('email')}
                type="email"
                placeholder="name@example.com"
                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-white/[0.1] bg-white/[0.03] dark:bg-slate-950/[0.3] backdrop-blur-md text-slate-100 placeholder-slate-500 text-sm focus:ring-2 focus:ring-[#a7f3d0]/40 focus:border-[#a7f3d0]/60 focus:outline-none transition-all duration-200"
              />
              <Mail size={17} className="absolute left-4 top-3.5 text-slate-400" />
            </div>
            {errors.email && (
              <p className="text-xs text-rose-400/90 font-normal pl-1">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300 tracking-wide">
              ชื่อผู้ใช้ (Username)
            </label>
            <div className="relative">
              <input
                {...register('username')}
                type="text"
                placeholder="john_doe"
                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-white/[0.1] bg-white/[0.03] dark:bg-slate-950/[0.3] backdrop-blur-md text-slate-100 placeholder-slate-500 text-sm focus:ring-2 focus:ring-[#a7f3d0]/40 focus:border-[#a7f3d0]/60 focus:outline-none transition-all duration-200"
              />
              <User size={17} className="absolute left-4 top-3.5 text-slate-400" />
            </div>
            {errors.username && (
              <p className="text-xs text-rose-400/90 font-normal pl-1">{errors.username.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300 tracking-wide">
              รหัสผ่าน
            </label>
            <div className="relative">
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="อย่างน้อย 6 ตัวอักษร"
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

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300 tracking-wide">
              ยืนยันรหัสผ่าน
            </label>
            <div className="relative">
              <input
                {...register('confirmPassword')}
                type={showPassword ? 'text' : 'password'}
                placeholder="กรอกรหัสผ่านซ้ำอีกครั้ง"
                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-white/[0.1] bg-white/[0.03] dark:bg-slate-950/[0.3] backdrop-blur-md text-slate-100 placeholder-slate-500 text-sm focus:ring-2 focus:ring-[#a7f3d0]/40 focus:border-[#a7f3d0]/60 focus:outline-none transition-all duration-200"
              />
              <Lock size={17} className="absolute left-4 top-3.5 text-slate-400" />
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-rose-400/90 font-normal pl-1">{errors.confirmPassword.message}</p>
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
                <span>กำลังสร้างบัญชี...</span>
              </>
            ) : (
              <span>สมัครสมาชิก</span>
            )}
          </button>
        </form>

        <div className="text-center pt-3 border-t border-white/[0.08]">
          <p className="text-xs text-slate-400">
            มีบัญชีผู้ใช้อยู่แล้ว?{' '}
            <Link
              href="/login"
              className="text-[#a7f3d0] hover:text-[#f9a8d4] font-medium transition-colors duration-200"
            >
              เข้าสู่ระบบที่นี่
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
