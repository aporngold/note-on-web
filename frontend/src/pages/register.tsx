import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';
import {
  Eye,
  EyeOff,
  Loader2,
  Lock,
  User,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import { useAuthStore } from '@/store/authStore';
import TurnstileWidget from '@/components/ui/TurnstileWidget';

const GridBloom = dynamic(() => import('@/components/ui/grid-bloom'), {
  ssr: false,
});

export default function RegisterPage() {
  const router = useRouter();
  const registerUser = useAuthStore((state) => state.register);

  // Step 1 = Google Verification prompt
  // Step 2 = Account details (Username, Optional Password, Turnstile)
  const [step, setStep] = useState<1 | 2>(1);

  // Verification Data from Google
  const [registrationToken, setRegistrationToken] = useState<string>('');
  const [verifiedEmail, setVerifiedEmail] = useState<string>('');
  const [verifiedName, setVerifiedName] = useState<string>('');

  // Step 2 Form States
  const [username, setUsername] = useState<string>('');
  const [wantPassword, setWantPassword] = useState<boolean>(false);
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Password Validation Rules
  const isMinLength = password.length >= 13;
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const isPasswordValid =
    isMinLength && hasLower && hasUpper && hasNumber && hasSpecial;
  const isPasswordMatch = password === confirmPassword;

  // Handle incoming redirect queries from Google Callback
  useEffect(() => {
    if (!router.isReady) return;

    const {
      step: qStep,
      token: qToken,
      email: qEmail,
      name: qName,
      error: qError,
    } = router.query;

    if (qError) {
      if (qError === 'not_gmail') {
        toast.error('NoteAll รองรับการสมัครด้วย Gmail เท่านั้น');
      } else if (qError === 'google_not_verified') {
        toast.error('ไม่สามารถยืนยันบัญชี Google ได้ กรุณาลองใหม่อีกครั้ง');
      } else if (qError === 'account_already_exists') {
        toast.error('อีเมลนี้มีบัญชี NoteAll อยู่แล้ว กรุณาเข้าสู่ระบบ');
        router.replace('/login');
        return;
      } else if (qError === 'authorization_denied') {
        toast('ยกเลิกการยืนยันตัวตนด้วย Google แล้ว', { icon: 'ℹ️' });
      } else {
        toast.error('การยืนยันตัวตนด้วย Google ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
      }
      return;
    }

    if (qStep === '2' && qToken && typeof qToken === 'string') {
      setStep(2);
      setRegistrationToken(qToken);
      if (qEmail && typeof qEmail === 'string') {
        setVerifiedEmail(qEmail);
        const autoUser = (
          (typeof qName === 'string' && qName ? qName : qEmail.split('@')[0])
        )
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, '_')
          .slice(0, 18);
        setUsername(autoUser.length >= 3 ? autoUser : 'user_' + autoUser);
      }
      if (qName && typeof qName === 'string') {
        setVerifiedName(qName);
      }
      toast.success('ยืนยันบัญชี Google สำเร็จ!');
    }
  }, [router.isReady, router.query, router]);

  // Handle Google Sign-In click
  const handleGoogleSignIn = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    window.location.href = `${apiUrl}/auth/google?origin=${encodeURIComponent(origin)}`;
  };

  // Handle Step 2 Registration Submit
  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!registrationToken) {
      toast.error('ไม่พบข้อมูลการยืนยันตัวตนจาก Google กรุณาเริ่มต้นใหม่');
      setStep(1);
      return;
    }

    if (!username || username.trim().length < 3) {
      toast.error('ชื่อผู้ใช้ต้องมีความยาวอย่างน้อย 3 ตัวอักษร');
      return;
    }

    if (wantPassword) {
      if (!isPasswordValid) {
        toast.error('รหัสผ่านยังไม่ตรงตามมาตรฐานความปลอดภัย (อย่างน้อย 13 ตัวอักษร)');
        return;
      }
      if (!isPasswordMatch) {
        toast.error('รหัสผ่านทั้งสองช่องไม่ตรงกัน');
        return;
      }
    }

    if (!turnstileToken) {
      toast.error('กรุณารอการตรวจสอบความปลอดภัยของ Cloudflare Turnstile ให้เสร็จสิ้น');
      return;
    }

    setIsLoading(true);
    try {
      await registerUser({
        registrationToken,
        username: username.trim().toLowerCase(),
        password: wantPassword ? password : '',
        turnstileToken,
      });

      toast.success('สร้างบัญชีสำเร็จ ยินดีต้อนรับสู่ NoteAll!');
      router.push('/dashboard');
    } catch (error: any) {
      const serverMsg =
        error.response?.data?.error ||
        error.message ||
        'เกิดข้อผิดพลาดในการสมัครสมาชิก';

      if (serverMsg.includes('มีการส่งคำขอมากเกินไป')) {
        toast.error('มีการส่งคำขอมากเกินไป กรุณารอสักครู่แล้วลองใหม่');
      } else if (serverMsg.includes('ไม่สามารถยืนยันคำขอ')) {
        toast.error('ไม่สามารถยืนยันคำขอนี้ได้ กรุณาลองใหม่อีกครั้ง');
      } else if (serverMsg.includes('อีเมลนี้มีบัญชี')) {
        toast.error('อีเมลนี้มีบัญชี NoteAll อยู่แล้ว กรุณาเข้าสู่ระบบ');
        router.push('/login');
      } else if (serverMsg.includes('Gmail')) {
        toast.error('NoteAll รองรับการสมัครด้วย Gmail เท่านั้น');
      } else {
        toast.error(serverMsg);
      }
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

      {/* Register Card: Bright, Eye-Pleasing, Glassmorphic Form */}
      <div className="relative z-10 w-full max-w-md p-7 sm:p-9 bg-white/75 backdrop-blur-2xl border border-white/60 rounded-3xl shadow-2xl shadow-slate-950/20 space-y-6 animate-fade-in">
        {/* Header Branding */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center justify-center mb-1">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden shadow-md flex items-center justify-center bg-slate-900">
              <img
                src="/NoteAll-icon.png"
                alt="NoteAll"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            NoteAll
          </h1>
          <p className="text-xs text-slate-500 font-normal">
            ระบบจดบันทึกความปลอดภัยสูง ป้องกันข้อมูลลับของคุณ
          </p>
        </div>

        {/* STEP 1: Google Verification Requirement */}
        {step === 1 && (
          <div className="space-y-5 animate-fade-in">
            <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200/70 text-center space-y-2">
              <div className="inline-flex p-2 rounded-xl bg-teal-100 text-teal-700 mb-0.5">
                <ShieldCheck size={22} />
              </div>
              <h2 className="text-sm font-bold text-teal-950">
                ใช้ Gmail เพื่อสร้างบัญชี
              </h2>
              <p className="text-xs text-teal-800 leading-relaxed">
                คุณต้องใช้บัญชี Google ที่มี Gmail เพื่อยืนยันตัวตนก่อนสมัครสมาชิก
              </p>
            </div>

            {/* Continue with Google Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full py-3.5 px-4 bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-200 hover:border-slate-300 rounded-2xl font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-3 active:scale-[0.99] group"
            >
              <FcGoogle size={24} className="group-hover:scale-110 transition-transform" />
              <span>Continue with Google</span>
              <ArrowRight size={16} className="text-slate-400 group-hover:translate-x-1 transition-transform ml-auto" />
            </button>

            <div className="text-center pt-1">
              <p className="text-[11px] text-slate-400 font-medium">
                * NoteAll รองรับการสมัครด้วย Gmail เท่านั้น (@gmail.com)
              </p>
            </div>

            <div className="text-center pt-3 border-t border-slate-200/60">
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
        )}

        {/* STEP 2: Complete Account Setup */}
        {step === 2 && (
          <form onSubmit={handleCompleteRegistration} className="space-y-4 animate-fade-in">
            {/* Google Verified Banner */}
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
                <div className="truncate">
                  <p className="text-xs font-bold text-emerald-800">
                    Google account verified
                  </p>
                  <p className="text-[11px] text-emerald-600 truncate">
                    {verifiedEmail}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 shrink-0 ml-2 px-2 py-1 rounded-lg hover:bg-emerald-100/50 transition"
                title="เปลี่ยนบัญชี Google"
              >
                <RefreshCw size={11} />
                <span>เปลี่ยน</span>
              </button>
            </div>

            {/* Username Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                ชื่อผู้ใช้ (Username)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="เช่น john_doe"
                  required
                  minLength={3}
                  maxLength={30}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300/80 bg-white/70 text-slate-900 text-sm focus:bg-white focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 focus:outline-none transition shadow-sm"
                />
                <User size={17} className="absolute left-3.5 top-3 text-slate-400" />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                อย่างน้อย 3 ตัวอักษร (ตัวอักษรภาษาอังกฤษ, ตัวเลข หรือเครื่องหมาย _)
              </p>
            </div>

            {/* Optional Password Checkbox */}
            <div className="pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={wantPassword}
                  onChange={(e) => setWantPassword(e.target.checked)}
                  className="w-4 h-4 rounded text-teal-600 border-slate-300 focus:ring-teal-500 transition"
                />
                <span className="text-xs font-semibold text-slate-700">
                  สร้าง Password สำหรับเข้าสู่ระบบ NoteAll
                </span>
              </label>
              {!wantPassword && (
                <p className="text-[11px] text-slate-500 mt-1 pl-6">
                  💡 หากไม่สร้างรหัสผ่าน คุณสามารถเข้าสู่ระบบด้วยปุ่ม Google ได้ตลอดเวลา
                </p>
              )}
            </div>

            {/* Password Fields (Conditional) */}
            {wantPassword && (
              <div className="space-y-3 p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 animate-fade-in">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    รหัสผ่าน (มาตรฐานสากล 13+ ตัวอักษร)
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="อย่างน้อย 13 ตัวอักษร"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300/80 bg-white text-slate-900 text-sm focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 focus:outline-none transition"
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
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    ยืนยันรหัสผ่าน
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="กรอกรหัสผ่านซ้ำอีกครั้ง"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300/80 bg-white text-slate-900 text-sm focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 focus:outline-none transition"
                    />
                    <Lock size={17} className="absolute left-3.5 top-3 text-slate-400" />
                  </div>
                </div>

                {/* Password Strength Checklist */}
                <div className="p-2 rounded-xl bg-white border border-slate-200 space-y-1">
                  <div className="grid grid-cols-2 gap-1 text-[11px]">
                    <span className={`flex items-center gap-1.5 ${isMinLength ? 'text-emerald-600 font-semibold' : 'text-slate-500'}`}>
                      <span>{isMinLength ? '✓' : '○'}</span>
                      <span>ความยาว 13+ ตัว ({password.length}/13)</span>
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
                      <span>ตัวเลข & สัญลักษณ์ (!@#)</span>
                    </span>
                  </div>
                  {confirmPassword && !isPasswordMatch && (
                    <p className="text-[11px] text-rose-500 font-medium pt-1">
                      ⚠️ รหัสผ่านทั้งสองช่องไม่ตรงกัน
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Cloudflare Turnstile Verification */}
            <TurnstileWidget onVerify={(t) => setTurnstileToken(t)} />

            {/* Submit Button */}
            <button
              type="submit"
              disabled={
                isLoading ||
                (wantPassword && (!isPasswordValid || !isPasswordMatch)) ||
                !turnstileToken
              }
              className="w-full py-3 bg-gradient-to-r from-teal-500 to-sky-500 hover:from-teal-600 hover:to-sky-600 text-white rounded-xl font-semibold shadow-lg shadow-teal-500/20 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm mt-3"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>กำลังสร้างบัญชี...</span>
                </>
              ) : (
                <span>สร้างบัญชี NoteAll</span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
