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
    <div className="relative min-h-screen flex items-center justify-center bg-[#070b14] overflow-hidden p-4 select-none">
      {/* 3D Animated Grid Bloom Background - Soothing Sky Blue */}
      <GridBloom
        color="#38bdf8"
        speed={0.5}
        gridScale={15.0}
        fadeFalloff={9.0}
        distortionAmount={0.03}
        hoverLightRadius={0.65}
        hoverRepulsionRadius={1.1}
        hoverRepulsionStrength={0.4}
      />

      {/* Translucent Glassmorphic Card */}
      <div className="relative z-10 w-full max-w-md p-8 sm:p-10 bg-slate-900/45 backdrop-blur-2xl border border-white/10 dark:border-slate-700/50 rounded-3xl shadow-2xl shadow-sky-500/5 space-y-6 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-sky-500 to-teal-500 text-white shadow-lg shadow-sky-500/20 mb-1">
            <ShieldCheck size={34} />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            สร้างบัญชี SecureNote
          </h1>
          <p className="text-xs text-slate-300">
            เริ่มใช้งานสมุดบันทึกที่ปลอดภัย พร้อมระบบ E2EE Vault ฟรี
          </p>
        </div>

        {/* Register Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wider mb-1">
              อีเมล
            </label>
            <div className="relative">
              <input
                {...register('email')}
                type="email"
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-700/80 bg-slate-950/40 backdrop-blur-sm text-white placeholder-slate-400 text-sm focus:ring-2 focus:ring-sky-500/40 focus:border-sky-400 focus:outline-none transition"
              />
              <Mail size={17} className="absolute left-3.5 top-3 text-slate-400" />
            </div>
            {errors.email && (
              <p className="mt-1 text-xs text-rose-400 font-medium">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wider mb-1">
              ชื่อผู้ใช้ (Username)
            </label>
            <div className="relative">
              <input
                {...register('username')}
                type="text"
                placeholder="john_doe"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-700/80 bg-slate-950/40 backdrop-blur-sm text-white placeholder-slate-400 text-sm focus:ring-2 focus:ring-sky-500/40 focus:border-sky-400 focus:outline-none transition"
              />
              <User size={17} className="absolute left-3.5 top-3 text-slate-400" />
            </div>
            {errors.username && (
              <p className="mt-1 text-xs text-rose-400 font-medium">{errors.username.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wider mb-1">
              รหัสผ่าน
            </label>
            <div className="relative">
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="อย่างน้อย 6 ตัวอักษร"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-700/80 bg-slate-950/40 backdrop-blur-sm text-white placeholder-slate-400 text-sm focus:ring-2 focus:ring-sky-500/40 focus:border-sky-400 focus:outline-none transition"
              />
              <Lock size={17} className="absolute left-3.5 top-3 text-slate-400" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-200 transition"
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-rose-400 font-medium">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wider mb-1">
              ยืนยันรหัสผ่าน
            </label>
            <div className="relative">
              <input
                {...register('confirmPassword')}
                type={showPassword ? 'text' : 'password'}
                placeholder="กรอกรหัสผ่านซ้ำอีกครั้ง"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-700/80 bg-slate-950/40 backdrop-blur-sm text-white placeholder-slate-400 text-sm focus:ring-2 focus:ring-sky-500/40 focus:border-sky-400 focus:outline-none transition"
              />
              <Lock size={17} className="absolute left-3.5 top-3 text-slate-400" />
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-rose-400 font-medium">{errors.confirmPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-400 hover:to-teal-400 text-white rounded-xl font-semibold shadow-lg shadow-sky-500/20 transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm mt-3"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>กำลังสร้างบัญชี...</span>
              </>
            ) : (
              <span>สมัครสมาชิก</span>
            )}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-white/10">
          <p className="text-xs text-slate-300">
            มีบัญชีผู้ใช้อยู่แล้ว?{' '}
            <Link
              href="/login"
              className="text-sky-400 font-semibold hover:text-sky-300 hover:underline transition"
            >
              เข้าสู่ระบบที่นี่
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
