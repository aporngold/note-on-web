import React, { useEffect, useRef, useState } from 'react';
import { ShieldCheck, Loader2 } from 'lucide-react';

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
    onTurnstileLoaded?: () => void;
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
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasVerified, setHasVerified] = useState(false);

  // Cloudflare official always-passes test sitekey: 1x00000000000000000000AA
  const siteKey =
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA';

  useEffect(() => {
    let isMounted = true;

    const renderWidget = () => {
      if (!isMounted || !containerRef.current || !window.turnstile) return;
      if (widgetIdRef.current) return; // Already rendered

      try {
        const id = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme: 'light',
          callback: (token: string) => {
            if (isMounted) {
              setHasVerified(true);
              onVerify(token);
            }
          },
          'error-callback': (err: any) => {
            if (isMounted) {
              setHasVerified(false);
              if (onError) onError('การตรวจสอบความปลอดภัยไม่สำเร็จ');
            }
          },
          'expired-callback': () => {
            if (isMounted) {
              setHasVerified(false);
              if (onExpire) onExpire();
            }
          },
        });
        widgetIdRef.current = id;
        setIsLoaded(true);
      } catch (e) {
        console.warn('Turnstile render warning:', e);
      }
    };

    // Check if script already exists
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
          // If script blocked (e.g. offline/adblock in local dev), allow dummy token in local dev
          if (process.env.NODE_ENV === 'development') {
            onVerify('1x00000000000000000000AA');
            setHasVerified(true);
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
      isMounted = false;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (e) {}
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, onVerify, onError, onExpire]);

  return (
    <div className={`flex flex-col items-center justify-center p-2 rounded-2xl bg-slate-50/80 border border-slate-200/80 ${className}`}>
      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1.5">
        <ShieldCheck size={14} className="text-teal-600" />
        <span>ระบบตรวจสอบความปลอดภัย (Cloudflare Turnstile)</span>
      </div>
      <div ref={containerRef} className="min-h-[65px] flex items-center justify-center" />
      {hasVerified && (
        <span className="text-[11px] text-emerald-600 font-semibold mt-1">
          ✓ การยืนยันความปลอดภัยสำเร็จ
        </span>
      )}
    </div>
  );
}
