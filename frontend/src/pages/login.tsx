import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Loader2, ShieldCheck, Lock, Mail } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
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

  useEffect(() => {
    if (!router.isReady) return;
    if (router.query.error === 'google_oauth_not_configured') {
      toast.error('ยังไม่ได้ตั้งค่า GOOGLE_CLIENT_ID และ GOOGLE_CLIENT_SECRET ในระบบ');
    } else if (router.query.error === 'authorization_denied') {
      toast('ยกเลิกการเข้าสู่ระบบด้วย Google แล้ว', { icon: 'ℹ️' });
    } else if (router.query.error) {
      const details = router.query.details ? ` (${router.query.details})` : '';
      toast.error(`การเข้าสู่ระบบด้วย Google ไม่สำเร็จ${details} กรุณาลองใหม่อีกครั้ง`);
    }
  }, [router.isReady, router.query.error, router.query.details]);

  const handleGoogleSignIn = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    window.location.href = `${apiUrl}/auth/google`;
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-950 overflow-hidden p-4 sm:p-6 select-none font-inter">
      {/* 3D Animated Grid Bloom Background - Original First Effect */}
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

      {/* Login Card: Bright, Eye-Pleasing (สบายตา), 30% Transparent Glassmorphic Form */}
      <div className="relative z-10 w-full max-w-md p-8 sm:p-10 bg-white/70 backdrop-blur-2xl border border-white/50 rounded-3xl shadow-2xl shadow-slate-950/20 space-y-7 animate-fade-in">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-teal-500 to-sky-500 text-white shadow-xl shadow-teal-500/20 mb-1">
            <ShieldCheck size={34} />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            เข้าสู่ระบบ SecureNote
          </h1>
          <p className="text-xs text-slate-500 font-normal">
            ระบบจดบันทึกความปลอดภัยสูง ป้องกันข้อมูลลับของคุณ
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              อีเมล หรือ ชื่อผู้ใช้
            </label>
            <div className="relative">
              <input
                {...register('email')}
                type="text"
                autoComplete="email"
                placeholder="name@example.com หรือ username"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300/80 bg-white/60 backdrop-blur-sm text-slate-900 placeholder-slate-400 text-sm focus:bg-white focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 focus:outline-none transition shadow-sm"
              />
              <Mail size={17} className="absolute left-3.5 top-3 text-slate-400" />
            </div>
            {errors.email && (
              <p className="mt-1 text-xs text-rose-500 font-medium">{errors.email.message}</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                รหัสผ่าน
              </label>
            </div>
            <div className="relative">
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300/80 bg-white/60 backdrop-blur-sm text-slate-900 placeholder-slate-400 text-sm focus:bg-white focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 focus:outline-none transition shadow-sm"
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
              <p className="mt-1 text-xs text-rose-500 font-medium">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-teal-500 to-sky-500 hover:from-teal-600 hover:to-sky-600 text-white rounded-xl font-semibold shadow-lg shadow-teal-500/20 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>กำลังเข้าสู่ระบบ...</span>
              </>
            ) : (
              <span>เข้าสู่ระบบ</span>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-1">
          <div className="border-t border-slate-300/80 w-full" />
          <span className="bg-white/90 backdrop-blur-md px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider absolute rounded-full border border-slate-200/60 shadow-xs">
            หรือ
          </span>
        </div>

        {/* Google Sign In Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="w-full py-2.5 px-4 bg-white/90 hover:bg-white text-slate-700 hover:text-slate-900 border border-slate-300/90 hover:border-slate-400 rounded-xl font-medium text-sm shadow-sm hover:shadow transition-all flex items-center justify-center gap-3 active:scale-[0.99]"
        >
          <FcGoogle size={20} />
          <span>เข้าสู่ระบบด้วย Google</span>
        </button>

        {/* Footer info */}
        <div className="text-center pt-2 border-t border-slate-200/60">
          <p className="text-xs text-slate-600">
            ยังไม่มีบัญชีใช้งาน?{' '}
            <Link
              href="/register"
              className="text-teal-600 hover:text-sky-600 font-semibold hover:underline transition-colors"
            >
              สมัครสมาชิกใหม่
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
