import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Loader2, Lock, Mail, Fingerprint } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import { startAuthentication, browserSupportsWebAuthn } from '@simplewebauthn/browser';
import { useAuthStore } from '@/store/authStore';
import api, { getResolvedApiUrl } from '@/utils/api';

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
  const [isPasskeyLoading, setIsPasskeyLoading] = useState(false);
  const login = useAuthStore((state) => state.login);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
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
    if (router.query.error === 'not_gmail') {
      toast.error('NoteAll รองรับการสมัครด้วย Gmail เท่านั้น');
    } else if (router.query.error === 'google_not_verified') {
      toast.error('ไม่สามารถยืนยันบัญชี Google ได้ กรุณาลองใหม่อีกครั้ง');
    } else if (router.query.error === 'account_already_exists') {
      toast.error('อีเมลนี้มีบัญชี NoteAll อยู่แล้ว กรุณาเข้าสู่ระบบ');
    } else if (router.query.error === 'google_oauth_not_configured') {
      toast.error('ยังไม่ได้ตั้งค่า GOOGLE_CLIENT_ID และ GOOGLE_CLIENT_SECRET ในระบบ');
    } else if (router.query.error === 'authorization_denied') {
      toast('ยกเลิกการเข้าสู่ระบบด้วย Google แล้ว', { icon: 'ℹ️' });
    } else if (router.query.error) {
      const details = router.query.details ? ` (${router.query.details})` : '';
      toast.error(`การเข้าสู่ระบบด้วย Google ไม่สำเร็จ${details} กรุณาลองใหม่อีกครั้ง`);
    }
  }, [router.isReady, router.query.error, router.query.details]);

  const handleGoogleSignIn = () => {
    const apiUrl = getResolvedApiUrl();
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    window.location.href = `${apiUrl}/auth/google?origin=${encodeURIComponent(origin)}`;
  };

  const handlePasskeySignIn = async () => {
    if (!browserSupportsWebAuthn()) {
      toast.error('เบราว์เซอร์หรืออุปกรณ์นี้ไม่รองรับระบบ Passkey');
      return;
    }

    try {
      setIsPasskeyLoading(true);
      const currentEmail = watch('email');
      
      // 1. Get options from server
      const optionsRes = await api.post('/auth/passkey/login-options', {
        emailOrUsername: currentEmail?.trim() || undefined,
      });

      // 2. Trigger browser passkey authentication prompt
      const authResponse = await startAuthentication(optionsRes.data);

      // 3. Send response to server for verification
      const verifyRes = await api.post('/auth/passkey/login-verify', {
        response: authResponse,
      });

      localStorage.setItem('secure_note_token', verifyRes.data.token);
      localStorage.setItem('secure_note_user', JSON.stringify(verifyRes.data.user));
      await useAuthStore.getState().checkAuth();

      toast.success(verifyRes.data.message || 'เข้าสู่ระบบด้วย Passkey สำเร็จ!');
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Passkey sign-in error:', err);
      if (err.name === 'NotAllowedError') {
        toast('ยกเลิกการสแกน Passkey แล้ว', { icon: 'ℹ️' });
      } else {
        toast.error(err.response?.data?.error || err.message || 'การเข้าสู่ระบบด้วย Passkey ไม่สำเร็จ');
      }
    } finally {
      setIsPasskeyLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#1E201E] overflow-hidden p-4 sm:p-6 select-none font-inter">
      {/* 3D Animated Grid Bloom Background - Warm Forest Green */}
      <GridBloom
        color="#47745C"
        speed={0.8}
        gridScale={14.0}
        fadeFalloff={8.0}
        distortionAmount={0.06}
        hoverLightRadius={0.7}
        hoverRepulsionRadius={1.2}
        hoverRepulsionStrength={0.5}
        blending="additive"
      />

      {/* Login Card: Warm Minimalist Clean Form */}
      <div className="relative z-10 w-full max-w-md p-8 sm:p-10 bg-[#FCFBF9]/95 backdrop-blur-xl border border-[#E4E0D6] rounded-2xl shadow-xl space-y-6 animate-fade-in">
        {/* Header Branding */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center justify-center mb-1">
            <img
              src="/NoteAll-icon.png"
              alt="NoteAll"
              className="w-16 h-16 sm:w-18 sm:h-18 object-contain rounded-2xl shadow-xs hover:scale-105 transition-transform"
            />
          </div>
          <h1 className="text-2xl font-extrabold text-warm-text tracking-tight">
            เข้าสู่ระบบ NoteAll
          </h1>
          <p className="text-xs text-warm-muted font-normal">
            ระบบจดบันทึกความปลอดภัยสูง ป้องกันข้อมูลลับของคุณ
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-warm-text uppercase tracking-wider mb-1.5">
              อีเมล หรือ ชื่อผู้ใช้
            </label>
            <div className="relative">
              <input
                {...register('email')}
                type="text"
                autoComplete="email"
                placeholder="name@example.com หรือ username"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#DCD8CE] bg-white text-warm-text placeholder-warm-muted/70 text-sm focus:bg-white focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 focus:outline-none transition shadow-2xs"
              />
              <Mail size={17} className="absolute left-3.5 top-3 text-warm-muted" />
            </div>
            {errors.email && (
              <p className="mt-1 text-xs text-rose-500 font-medium">{errors.email.message}</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-warm-text uppercase tracking-wider">
                รหัสผ่าน
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-brand-600 hover:text-brand-700 hover:underline transition-colors"
              >
                ลืมรหัสผ่าน?
              </Link>
            </div>
            <div className="relative">
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#DCD8CE] bg-white text-warm-text placeholder-warm-muted/70 text-sm focus:bg-white focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 focus:outline-none transition shadow-2xs"
              />
              <Lock size={17} className="absolute left-3.5 top-3 text-warm-muted" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-warm-muted hover:text-warm-text transition"
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
            className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-semibold shadow-xs hover:shadow active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm mt-2"
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
          <div className="border-t border-[#E4E0D6] w-full" />
          <span className="bg-[#FCFBF9] px-3 text-[11px] font-semibold text-warm-muted uppercase tracking-wider absolute rounded-full border border-[#E4E0D6] shadow-2xs">
            หรือ
          </span>
        </div>

        {/* Google Sign In Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="w-full py-2.5 px-4 bg-white hover:bg-[#FAF8F5] text-warm-text border border-[#DCD8CE] hover:border-warm-muted rounded-xl font-medium text-sm shadow-2xs hover:shadow-xs transition-all flex items-center justify-center gap-3 active:scale-[0.99]"
        >
          <FcGoogle size={20} />
          <span>เข้าสู่ระบบด้วย Google</span>
        </button>

        {/* Passkey Sign In Button */}
        <button
          type="button"
          onClick={handlePasskeySignIn}
          disabled={isPasskeyLoading}
          className="w-full py-2.5 px-4 bg-sand-50/70 hover:bg-sand-100/80 text-warm-text border border-sand-200/90 hover:border-sand-300 rounded-xl font-semibold text-sm shadow-2xs hover:shadow-xs transition-all flex items-center justify-center gap-2.5 active:scale-[0.99] disabled:opacity-50"
        >
          {isPasskeyLoading ? (
            <>
              <Loader2 size={18} className="animate-spin text-brand-600" />
              <span className="text-brand-700">กำลังตรวจสอบอุปกรณ์ Passkey...</span>
            </>
          ) : (
            <>
              <Fingerprint size={19} className="text-brand-600" />
              <span>เข้าสู่ระบบด้วย Passkey (สแกนนิ้ว / Face ID)</span>
            </>
          )}
        </button>

        {/* Footer info */}
        <div className="text-center pt-2 border-t border-[#E4E0D6] space-y-1.5">
          <p className="text-xs text-warm-muted">
            ยังไม่มีบัญชีใช้งาน?{' '}
            <Link
              href="/register"
              className="text-brand-600 hover:text-brand-700 font-semibold hover:underline transition-colors"
            >
              สมัครสมาชิกใหม่
            </Link>
          </p>
          <p className="text-[11px] text-warm-muted/80">
            <Link href="/privacy" className="hover:text-warm-text hover:underline transition">
              นโยบายความเป็นส่วนตัว (PDPA)
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
