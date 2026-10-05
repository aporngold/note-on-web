import type { AppProps } from 'next/app';
import Head from 'next/head';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster, ToastBar, toast } from 'react-hot-toast';
import { X } from 'lucide-react';
import { ThemeProvider } from 'next-themes';
import GlobalTooltip from '@/components/ui/GlobalTooltip';
import '@/styles/globals.css';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { stopGlobalSpeechToText } from '@/components/notes/SpeechToTextButton';
import { registerServiceWorker, subscribeToWebPush } from '@/utils/webPush';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  useEffect(() => {
    registerServiceWorker().then(() => {
      // Auto-sync Web Push Subscription if user is logged in and already granted permission
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        const token = localStorage.getItem('secure_note_token');
        if (token) {
          subscribeToWebPush().catch(() => {});
        }
      }
    });
  }, []);

  useEffect(() => {
    const handleRouteChange = () => {
      stopGlobalSpeechToText(false);
      // Clean up existing page toasts when navigating so old status messages don't linger
      toast.dismiss();
    };

    router.events.on('routeChangeStart', handleRouteChange);
    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
    };
  }, [router]);
  return (
    <>
      <Head>
        <title>NoteAll - ปลอดภัย ทันสมัย จดบันทึกไร้กังวล</title>
        <meta
          name="description"
          content="เว็บแอปพลิเคชันจดบันทึกความปลอดภัยสูงพร้อมระบบ End-to-End Encryption (AES-256) และระบบจัดหมวดหมู่ที่ใช้งานง่าย"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/NoteAll.ico" />
      </Head>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Component {...pageProps} />
          <GlobalTooltip />
          <Toaster
            position="top-right"
            containerStyle={{
              top: 16,
              left: 16,
              right: 16,
              bottom: 16,
            }}
            toastOptions={{
              duration: 3000,
              success: { duration: 3000 },
              error: { duration: 5000 },
              blank: { duration: 3000 },
              custom: { duration: 4000 },
              style: {
                borderRadius: '12px',
                background: '#1e293b',
                color: '#f8fafc',
                fontSize: '13px',
                fontWeight: 500,
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                maxWidth: '380px',
              },
            }}
          >
            {(t) => (
              <ToastBar toast={t} style={{ ...t.style }}>
                {({ icon, message }) => (
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      if (t.type !== 'loading') {
                        toast.dismiss(t.id);
                      }
                    }}
                    className="flex items-center gap-2.5 w-full select-none cursor-pointer"
                  >
                    {icon}
                    <div className="flex-1 text-[13px] leading-snug break-words">
                      {message}
                    </div>
                    {t.type !== 'loading' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toast.dismiss(t.id);
                        }}
                        className="ml-1 -mr-1 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 active:scale-90 transition-all flex items-center justify-center shrink-0"
                        title="ปิดการแจ้งเตือน"
                        aria-label="ปิดการแจ้งเตือน"
                      >
                        <X size={14} className="stroke-[2.5]" />
                      </button>
                    )}
                  </div>
                )}
              </ToastBar>
            )}
          </Toaster>
        </ThemeProvider>
      </QueryClientProvider>
    </>
  );
}
