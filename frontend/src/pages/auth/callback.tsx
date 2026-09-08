import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';

export default function GoogleAuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState('กำลังประมวลผลการเข้าสู่ระบบด้วย Google...');

  useEffect(() => {
    if (!router.isReady) return;

    const { token, user: userParam, error } = router.query;

    if (error) {
      const errorMsg =
        error === 'google_oauth_not_configured'
          ? 'ยังไม่ได้กำหนดค่า Google Client ID/Secret ในระบบ'
          : error === 'authorization_denied'
          ? 'คุณยกเลิกการเข้าสู่ระบบด้วย Google'
          : 'การเข้าสู่ระบบด้วย Google ล้มเหลว กรุณาลองใหม่อีกครั้ง';

      toast.error(errorMsg);
      router.replace('/login');
      return;
    }

    if (token && typeof token === 'string') {
      try {
        localStorage.setItem('secure_note_token', token);

        if (userParam && typeof userParam === 'string') {
          try {
            const userObj = JSON.parse(decodeURIComponent(userParam));
            localStorage.setItem('secure_note_user', JSON.stringify(userObj));
          } catch (e) {
            // Ignore parse error
          }
        }

        // Refresh auth store state
        useAuthStore.getState().checkAuth();

        toast.success('เข้าสู่ระบบด้วย Google สำเร็จ!');
        router.replace('/dashboard');
      } catch (err) {
        toast.error('เกิดข้อผิดพลาดในการบันทึกข้อมูลเข้าสู่ระบบ');
        router.replace('/login');
      }
    } else {
      setStatus('ไม่พบข้อมูล Token การเข้าสู่ระบบ กำลังกลับสู่หน้า Login...');
      setTimeout(() => {
        router.replace('/login');
      }, 1500);
    }
  }, [router.isReady, router.query, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="p-8 bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl shadow-2xl text-center space-y-4 max-w-sm w-full">
        <Loader2 className="w-10 h-10 text-teal-600 animate-spin mx-auto" />
        <p className="text-sm font-medium text-slate-700">{status}</p>
      </div>
    </div>
  );
}
