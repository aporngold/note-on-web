import React, { useRef, useEffect, useState, useLayoutEffect, useCallback } from 'react';
import ViewportPortal from './ViewportPortal';
import { computeViewportPosition } from '@/utils/viewportPosition';

interface ViewportContextMenuProps {
  isOpen: boolean;
  onClose: () => void;
  x: number;
  y: number;
  children: React.ReactNode;
  className?: string;
  viewportPadding?: number;
  zIndex?: number;
}

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export default function ViewportContextMenu({
  isOpen,
  onClose,
  x,
  y,
  children,
  className = '',
  viewportPadding = 12,
  zIndex = 10000,
}: ViewportContextMenuProps) {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [, setAttached] = useState(0);
  const [coords, setCoords] = useState(() => ({ top: y, left: x }));
  const [isReady, setIsReady] = useState(false);

  const setMenuRef = useCallback((node: HTMLDivElement | null) => {
    menuRef.current = node;
    if (node) setAttached((c) => c + 1);
  }, []);

  const calculatePosition = useCallback(() => {
    const virtualTrigger = {
      top: y,
      bottom: y,
      left: x,
      right: x,
      width: 0,
      height: 0,
    };

    let menuRect: { top: number; bottom: number; left: number; right: number; width: number; height: number };
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      menuRect = rect.width > 0 && rect.height > 0 ? rect : { top: 0, bottom: 150, left: 0, right: 180, width: 180, height: 150 };
    } else {
      menuRect = { top: 0, bottom: 150, left: 0, right: 180, width: 180, height: 150 };
    }

    const computed = computeViewportPosition(virtualTrigger, menuRect, {
      placement: 'bottom-start',
      offset: 2,
      viewportPadding,
    });

    setCoords({ top: computed.top, left: computed.left });
    setIsReady(true);
  }, [x, y, viewportPadding]);

  useIsomorphicLayoutEffect(() => {
    if (isOpen) {
      calculatePosition();
      const raf = requestAnimationFrame(calculatePosition);
      return () => cancelAnimationFrame(raf);
    } else {
      setIsReady(false);
    }
  }, [isOpen, calculatePosition]);

  useEffect(() => {
    if (!isOpen) return;

    // Multi-frame verify
    let frameCount = 0;
    let frameId: number;
    const verify = () => {
      calculatePosition();
      if (frameCount < 3) {
        frameCount++;
        frameId = requestAnimationFrame(verify);
      }
    };
    frameId = requestAnimationFrame(verify);


    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    const handleResize = () => {
      calculatePosition();
    };

    const handleScroll = () => {
      onClose();
    };

    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('scroll', handleScroll, { capture: true, passive: true });

    return () => {
      cancelAnimationFrame(frameId);
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll, { capture: true });
    };
  }, [isOpen, onClose, calculatePosition]);

  if (!isOpen) return null;

  return (
    <ViewportPortal>
      <div
        ref={setMenuRef}
        style={{
          position: 'fixed',
          top: `${coords.top}px`,
          left: `${coords.left}px`,
          zIndex,
          visibility: isReady ? 'visible' : 'hidden',
          opacity: isReady ? 1 : 0,
          transition: 'opacity 0.1s ease-out',
        }}
        className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-1.5 min-w-[180px] text-xs text-slate-800 dark:text-slate-100 animate-fade-in select-none ${className}`}
        onContextMenu={(e) => e.preventDefault()}
      >
        {children}
      </div>
    </ViewportPortal>
  );
}

export interface ViewportMenuItemProps {
  icon?: React.ReactNode;
  label: string;
  shortcut?: string;
  danger?: boolean;
  disabled?: boolean;
  onClick: (e: React.MouseEvent) => void;
}

export function ViewportMenuItem({
  icon,
  label,
  shortcut,
  danger = false,
  disabled = false,
  onClick,
}: ViewportMenuItemProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onClick(e);
      }}
      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-left text-xs font-medium transition ${
        disabled
          ? 'opacity-40 cursor-not-allowed'
          : danger
          ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
      }`}
    >
      <div className="flex items-center gap-2">
        {icon && <span className="opacity-80">{icon}</span>}
        <span>{label}</span>
      </div>
      {shortcut && <span className="text-[10px] text-slate-400 ml-3">{shortcut}</span>}
    </button>
  );
}
