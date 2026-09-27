import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ShieldCheck, RotateCcw, CheckCircle2 } from 'lucide-react';

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onError?: (error: string) => void;
  onExpire?: () => void;
  className?: string;
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          'error-callback'?: (err: any) => void;
          'expired-callback'?: () => void;
          theme?: 'light' | 'dark' | 'auto';
          size?: 'normal' | 'compact' | 'flexible';
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

export default function TurnstileWidget({
  onVerify,
  onError,
  onExpire,
  className = '',
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [hasVerified, setHasVerified] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Preserve latest callbacks in refs to prevent infinite re-render / destruction loops
  const onVerifyRef = useRef(onVerify);
  const onErrorRef = useRef(onError);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onVerifyRef.current = onVerify;
    onErrorRef.current = onError;
    onExpireRef.current = onExpire;
  });

  // Project Cloudflare Turnstile Site Key
  const siteKey =
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '0x4AAAAAAFC5WSh4GUW5XmNn';

  const renderWidget = useCallback(() => {
    if (!containerRef.current || !window.turnstile) return;
    if (widgetIdRef.current) return; // Prevent duplicate render

    try {
      setErrorMessage(null);
      const id = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme: 'light',
        callback: (token: string) => {
          setHasVerified(true);
          setErrorMessage(null);
          onVerifyRef.current?.(token);
        },
        'error-callback': (err: any) => {
          console.warn('Turnstile challenge error:', err);
          setHasVerified(false);
          setErrorMessage('การตรวจสอบของ Cloudflare ไม่ผ่าน กรุณากดลองใหม่');
          onErrorRef.current?.('การตรวจสอบความปลอดภัยไม่สำเร็จ');
        },
        'expired-callback': () => {
          setHasVerified(false);
          setErrorMessage('การตรวจสอบความปลอดภัยหมดอายุ กรุณาลองใหม่อีกครั้ง');
          onExpireRef.current?.();
        },
      });
      widgetIdRef.current = id;
    } catch (e: any) {
      console.warn('Turnstile render warning:', e);
    }
  }, [siteKey]);

  const handleRetry = () => {
    if (widgetIdRef.current && window.turnstile) {
      try {
        window.turnstile.reset(widgetIdRef.current);
      } catch (e) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (_) {}
        widgetIdRef.current = null;
        renderWidget();
      }
    } else {
      renderWidget();
    }
  };

  useEffect(() => {
    // Check if Cloudflare script already exists
    if (window.turnstile) {
      renderWidget();
    } else {
      const existingScript = document.getElementById('cf-turnstile-script');
      if (!existingScript) {
        const script = document.createElement('script');
        script.id = 'cf-turnstile-script';
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true;
        script.defer = true;
        script.onload = () => {
          renderWidget();
        };
        script.onerror = () => {
          // If script blocked (e.g. adblocker in local dev), allow test pass
          if (process.env.NODE_ENV === 'development') {
            setHasVerified(true);
            onVerifyRef.current?.('1x00000000000000000000AA');
          } else {
            setErrorMessage('ไม่สามารถโหลดระบบ Cloudflare ได้ กรุณาปิด AdBlock หรือลองใหม่');
          }
        };
        document.head.appendChild(script);
      } else {
        const interval = setInterval(() => {
          if (window.turnstile) {
            clearInterval(interval);
            renderWidget();
          }
        }, 100);
        return () => clearInterval(interval);
      }
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (e) {}
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, renderWidget]); // Stable dependency only! Never include volatile callbacks

  return (
    <div className={`flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50/90 border border-slate-200/90 shadow-sm transition-all ${className}`}>
      <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium mb-2">
        <ShieldCheck size={15} className="text-teal-600 shrink-0" />
        <span>ระบบตรวจสอบความปลอดภัย (Cloudflare Turnstile)</span>
      </div>

      <div ref={containerRef} className="min-h-[65px] flex items-center justify-center" />

      {hasVerified && (
        <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold mt-2 animate-in fade-in">
          <CheckCircle2 size={14} className="text-emerald-500" />
          <span>ยืนยันความเป็นมนุษย์สำเร็จเรียบร้อย</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex flex-col items-center gap-1 mt-2">
          <span className="text-xs text-rose-500 font-medium text-center">
            {errorMessage}
          </span>
          <button
            type="button"
            onClick={handleRetry}
            className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 font-semibold mt-0.5 underline hover:no-underline"
          >
            <RotateCcw size={12} />
            <span>กดเพื่อลองใหม่อีกครั้ง</span>
          </button>
        </div>
      )}
    </div>
  );
}
