import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Loader2, ShieldCheck, Lock, Mail, User } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import { useAuthStore } from '@/store/authStore';

const GridBloom = dynamic(() => import('@/components/ui/grid-bloom'), {
  ssr: false,
});

const registerSchema = z
  .object({
    email: z.string().email('รูปแบบอีเมลไม่ถูกต้อง'),
    username: z.string().min(3, 'ชื่อผู้ใช้ต้องมีความยาวอย่างน้อย 3 ตัวอักษร'),
    password: z
      .string()
      .min(13, 'รหัสผ่านต้องมีความยาวอย่างน้อย 13 ตัวอักษร ตามมาตรฐานความปลอดภัยสากล')
      .regex(/[a-z]/, 'ต้องมีตัวพิมพ์เล็กอย่างน้อย 1 ตัว')
      .regex(/[A-Z]/, 'ต้องมีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว')
      .regex(/[0-9]/, 'ต้องมีตัวเลขอย่างน้อย 1 ตัว')
      .regex(/[^A-Za-z0-9]/, 'ต้องมีอักขระพิเศษอย่างน้อย 1 ตัว (!@#$%^&*...)'),
    confirmPassword: z.string().min(13, 'กรุณายืนยันรหัสผ่านอย่างน้อย 13 ตัวอักษร'),
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
    watch,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const pwdValue = watch('password') || '';
  const isMinLength = pwdValue.length >= 13;
  const hasLower = /[a-z]/.test(pwdValue);
  const hasUpper = /[A-Z]/.test(pwdValue);
  const hasNumber = /[0-9]/.test(pwdValue);
  const hasSpecial = /[^A-Za-z0-9]/.test(pwdValue);

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

  const handleGoogleSignIn = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    window.location.href = `${apiUrl}/auth/google?origin=${encodeURIComponent(origin)}`;
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

      {/* Register Card: Bright, Eye-Pleasing (สบายตา), 30% Transparent Glassmorphic Form */}
      <div className="relative z-10 w-full max-w-md p-8 sm:p-10 bg-white/70 backdrop-blur-2xl border border-white/50 rounded-3xl shadow-2xl shadow-slate-950/20 space-y-6 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-teal-500 to-sky-500 text-white shadow-xl shadow-teal-500/20 mb-1">
            <ShieldCheck size={34} />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            สร้างบัญชี SecureNote
          </h1>
          <p className="text-xs text-slate-500 font-normal">
            เริ่มใช้งานสมุดบันทึกที่ปลอดภัย พร้อมระบบ E2EE Vault ฟรี
          </p>
        </div>

        {/* Register Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              อีเมล
            </label>
            <div className="relative">
              <input
                {...register('email')}
                type="email"
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300/80 bg-white/60 backdrop-blur-sm text-slate-900 placeholder-slate-400 text-sm focus:bg-white focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 focus:outline-none transition shadow-sm"
              />
              <Mail size={17} className="absolute left-3.5 top-3 text-slate-400" />
            </div>
            {errors.email && (
              <p className="mt-1 text-xs text-rose-500 font-medium">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              ชื่อผู้ใช้ (Username)
            </label>
            <div className="relative">
              <input
                {...register('username')}
                type="text"
                placeholder="john_doe"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300/80 bg-white/60 backdrop-blur-sm text-slate-900 placeholder-slate-400 text-sm focus:bg-white focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 focus:outline-none transition shadow-sm"
              />
              <User size={17} className="absolute left-3.5 top-3 text-slate-400" />
            </div>
            {errors.username && (
              <p className="mt-1 text-xs text-rose-500 font-medium">{errors.username.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              รหัสผ่าน (มาตรฐานสากล 13+ ตัวอักษร)
            </label>
            <div className="relative">
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="อย่างน้อย 13 ตัวอักษร (A-Z, a-z, 0-9, !@#)"
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

            {/* Live Security Requirements Checklist */}
            <div className="mt-2 p-2.5 rounded-xl bg-slate-50/70 border border-slate-200/60 space-y-1">
              <p className="text-[11px] font-semibold text-slate-600 mb-1">
                มาตรฐานความปลอดภัยสากล:
              </p>
              <div className="grid grid-cols-2 gap-1 text-[11px]">
                <span className={`flex items-center gap-1.5 ${isMinLength ? 'text-emerald-600 font-semibold' : 'text-slate-500'}`}>
                  <span>{isMinLength ? '✓' : '○'}</span>
                  <span>ความยาว 13+ ตัว ({pwdValue.length}/13)</span>
                </span>
                <span className={`flex items-center gap-1.5 ${hasUpper ? 'text-emerald-600 font-semibold' : 'text-slate-500'}`}>
                  <span>{hasUpper ? '✓' : '○'}</span>
                  <span>ตัวพิมพ์ใหญ่ (A-Z)</span>
                </span>
                <span className={`flex items-center gap-1.5 ${hasLower ? 'text-emerald-600 font-semibold' : 'text-slate-500'}`}>
                  <span>{hasLower ? '✓' : '○'}</span>
                  <span>ตัวพิมพ์เล็ก (a-z)</span>
                </span>
                <span className={`flex items-center gap-1.5 ${hasNumber && hasSpecial ? 'text-emerald-600 font-semibold' : 'text-slate-500'}`}>
                  <span>{hasNumber && hasSpecial ? '✓' : '○'}</span>
                  <span>ตัวเลข & สัญลักษณ์พิเศษ</span>
                </span>
              </div>
            </div>

            {errors.password && (
              <p className="mt-1 text-xs text-rose-500 font-medium">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              ยืนยันรหัสผ่าน
            </label>
            <div className="relative">
              <input
                {...register('confirmPassword')}
                type={showPassword ? 'text' : 'password'}
                placeholder="กรอกรหัสผ่านซ้ำอีกครั้ง (อย่างน้อย 13 ตัวอักษร)"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300/80 bg-white/60 backdrop-blur-sm text-slate-900 placeholder-slate-400 text-sm focus:bg-white focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 focus:outline-none transition shadow-sm"
              />
              <Lock size={17} className="absolute left-3.5 top-3 text-slate-400" />
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-rose-500 font-medium">{errors.confirmPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-teal-500 to-sky-500 hover:from-teal-600 hover:to-sky-600 text-white rounded-xl font-semibold shadow-lg shadow-teal-500/20 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm mt-3"
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
          <span>สมัครสมาชิกด้วย Google</span>
        </button>

        <div className="text-center pt-2 border-t border-slate-200/60">
          <p className="text-xs text-slate-600">
            มีบัญชีผู้ใช้อยู่แล้ว?{' '}
            <Link
              href="/login"
              className="text-teal-600 hover:text-sky-600 font-semibold hover:underline transition-colors"
            >
              เข้าสู่ระบบที่นี่
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
