import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/store/authStore';

export default function Home() {
  const router = useRouter();
  const { user, token, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
    if (localStorage.getItem('secure_note_token')) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [router, checkAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-400">กำลังเข้าสู่ระบบ SecureNote...</p>
      </div>
    </div>
  );
}
