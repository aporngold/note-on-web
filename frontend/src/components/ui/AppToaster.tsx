import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useToaster, ToastBar, toast, resolveValue, Toast, ToastPosition } from 'react-hot-toast';
import { X } from 'lucide-react';

interface AppToasterProps {
  position?: ToastPosition;
  maxToasts?: number;
}

export const AppToaster: React.FC<AppToasterProps> = ({
  position = 'top-right',
  maxToasts = 3,
}) => {
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const pauseWatchdogRef = useRef<NodeJS.Timeout | null>(null);

  // Check screen width for responsive layout
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const { toasts, handlers } = useToaster({
    duration: 3000,
    success: {
      duration: 3000, // 3s for success per standard
    },
    blank: {
      duration: 3000, // 3s for general info per standard
    },
    error: {
      duration: 5000, // 5s for error per standard
    },
    custom: {
      duration: 4000, // 4s for warning/custom per standard
    },
    style: {
      borderRadius: '12px',
      background: '#1e293b',
      color: '#f8fafc',
      fontSize: '13px',
      fontWeight: 500,
      padding: '10px 14px',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      maxWidth: '380px',
    },
  });

  // Limit stacked toasts to maxToasts (default 3) to prevent screen blocking
  useEffect(() => {
    const visibleToasts = toasts.filter((t) => t.visible);
    if (visibleToasts.length > maxToasts) {
      // Dismiss the oldest visible toasts exceeding the limit
      const excessCount = visibleToasts.length - maxToasts;
      for (let i = 0; i < excessCount; i++) {
        toast.dismiss(visibleToasts[i].id);
      }
    }
  }, [toasts, maxToasts]);

  // Touch device check: Touchscreens (iOS/Android/iPad) must NEVER pause indefinitely on touch
  const isTouchDevice = useCallback(() => {
    if (typeof window === 'undefined') return false;
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }, []);

  const handleMouseEnter = useCallback(() => {
    // Disable hover-pause on touch devices to prevent stuck toasts on mobile/tablet
    if (isTouchDevice()) return;

    handlers.startPause();

    // Safety watchdog: Automatically end pause after max 3.5 seconds
    if (pauseWatchdogRef.current) clearTimeout(pauseWatchdogRef.current);
    pauseWatchdogRef.current = setTimeout(() => {
      handlers.endPause();
    }, 3500);
  }, [handlers, isTouchDevice]);

  const handleMouseLeave = useCallback(() => {
    if (pauseWatchdogRef.current) {
      clearTimeout(pauseWatchdogRef.current);
      pauseWatchdogRef.current = null;
    }
    handlers.endPause();
  }, [handlers]);

  const activePosition: ToastPosition = isMobile ? 'top-center' : position;

  return (
    <div
      data-app-toaster="note-on-web"
      style={{
        position: 'fixed',
        zIndex: 9999,
        top: isMobile ? 12 : 16,
        left: 16,
        right: 16,
        bottom: 16,
        pointerEvents: 'none',
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {toasts.map((t) => {
        const toastPosition = t.position || activePosition;
        const offset = handlers.calculateOffset(t, {
          reverseOrder: false,
          gutter: 8,
          defaultPosition: activePosition,
        });

        const top = toastPosition.includes('top');
        const verticalStyle: React.CSSProperties = top ? { top: 0 } : { bottom: 0 };
        const horizontalStyle: React.CSSProperties = toastPosition.includes('center')
          ? { justifyContent: 'center' }
          : toastPosition.includes('right')
          ? { justifyContent: 'flex-end' }
          : { justifyContent: 'flex-start' };

        const wrapperStyle: React.CSSProperties = {
          left: 0,
          right: 0,
          display: 'flex',
          position: 'absolute',
          transition: 'all 230ms cubic-bezier(.21, 1.02, .73, 1)',
          transform: `translateY(${offset * (top ? 1 : -1)}px)`,
          ...verticalStyle,
          ...horizontalStyle,
        };

        return (
          <div
            key={t.id}
            id={t.id}
            ref={(el) => {
              if (el) {
                const height = el.getBoundingClientRect().height;
                handlers.updateHeight(t.id, height);
              }
            }}
            style={wrapperStyle}
            className={t.visible ? 'pointer-events-auto' : 'pointer-events-none opacity-0 scale-95 transition-all duration-200'}
          >
            {t.type === 'custom' ? (
              // Custom toasts (e.g. Actionable banner) render directly with click-to-dismiss capability
              <div
                className="relative cursor-pointer"
                onClick={(e) => {
                  const target = e.target as HTMLElement;
                  // Only dismiss if clicked outside interactive buttons/links/inputs
                  if (!target.closest('button') && !target.closest('a') && !target.closest('input')) {
                    toast.dismiss(t.id);
                  }
                }}
              >
                {resolveValue(t.message, t)}
              </div>
            ) : (
              <ToastBar toast={t} position={toastPosition} style={{ ...t.style, pointerEvents: 'auto' }}>
                {({ icon, message }) => (
                  <div
                    className="flex items-center gap-2.5 w-full select-none cursor-pointer"
                    onClick={(e) => {
                      const target = e.target as HTMLElement;
                      if (!target.closest('button') && !target.closest('a')) {
                        toast.dismiss(t.id);
                      }
                    }}
                  >
                    {icon}
                    <div className="flex-1 text-[13px] leading-snug break-words">
                      {resolveValue(t.message, t)}
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
          </div>
        );
      })}
    </div>
  );
};

export default AppToaster;
