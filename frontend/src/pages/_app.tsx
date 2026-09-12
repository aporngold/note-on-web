import type { AppProps } from 'next/app';
import Head from 'next/head';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from 'next-themes';
import GlobalTooltip from '@/components/ui/GlobalTooltip';
import '@/styles/globals.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>SecureNote - ปลอดภัย ทันสมัย จดบันทึกไร้กังวล</title>
        <meta
          name="description"
          content="เว็บแอปพลิเคชันจดบันทึกความปลอดภัยสูงพร้อมระบบ End-to-End Encryption (AES-256) และระบบจัดหมวดหมู่ที่ใช้งานง่าย"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🔒</text></svg>" />
      </Head>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Component {...pageProps} />
          <GlobalTooltip />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                borderRadius: '12px',
                background: '#1e293b',
                color: '#f8fafc',
                fontSize: '13px',
                fontWeight: 500,
              },
            }}
          />
        </ThemeProvider>
      </QueryClientProvider>
    </>
  );
}
