import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import ViewportPortal from './ViewportPortal';

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  maxHeight?: string;
  className?: string;
  showCloseButton?: boolean;
}

export default function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  maxHeight = 'max-h-[85vh]',
  className = '',
  showCloseButton = true,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent background body scroll when open on mobile
  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <ViewportPortal>
      <div className="fixed inset-0 z-50 flex flex-col justify-end sm:hidden">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 animate-fade-in"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Bottom Sheet Container */}
        <div
          ref={sheetRef}
          role="dialog"
          aria-modal="true"
          className={`relative z-10 w-full bg-white dark:bg-slate-900 rounded-t-3xl border-t border-slate-200/80 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden transition-transform duration-300 animate-slide-up pb-safe ${maxHeight} ${className}`}
        >
          {/* Drag Handle */}
          <div className="pt-3 pb-1 flex justify-center items-center shrink-0 cursor-pointer" onClick={onClose}>
            <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full" />
          </div>

          {/* Header */}
          {(title || showCloseButton) && (
            <div className="px-5 py-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 shrink-0">
              <div className="font-bold text-base text-slate-900 dark:text-white truncate">
                {title}
              </div>
              {showCloseButton && (
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 -mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  aria-label="ปิดเมนู"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          )}

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-5 py-4 overscroll-contain">
            {children}
          </div>
        </div>
      </div>
    </ViewportPortal>
  );
}
