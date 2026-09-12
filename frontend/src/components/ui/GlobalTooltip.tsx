import React, { useState, useEffect, useRef } from 'react';
import ViewportPortal from './ViewportPortal';
import { computeViewportPosition, Placement } from '@/utils/viewportPosition';

interface TooltipState {
  isOpen: boolean;
  text: string;
  triggerEl: HTMLElement | null;
  placement: Placement;
}

/**
 * Global In-App Tooltip Engine
 * - Automatically intercepts any HTML element with `title="..."` or `data-app-tooltip="..."`
 * - Strips native `title` from the DOM to permanently prevent the Windows OS empty box bug
 * - Renders via ViewportPortal to document.body (immune to overflow:hidden and z-index issues)
 * - Auto-flips and auto-shifts near screen boundaries to prevent clipping
 * - Works universally across Note Editor, Toolbars, Sticky Board, and Sidebar
 */
export default function GlobalTooltip() {
  const [state, setState] = useState<TooltipState>({
    isOpen: false,
    text: '',
    triggerEl: null,
    placement: 'top-center',
  });

  const [coords, setCoords] = useState<{ top: number; left: number; isReady: boolean }>({
    top: 0,
    left: 0,
    isReady: false,
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const activeTriggerRef = useRef<HTMLElement | null>(null);
  const floatingRef = useRef<HTMLDivElement | null>(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    // Only run on client-side desktop / pointer devices
    if (typeof window === 'undefined') return;

    const handlePointerOver = (e: PointerEvent) => {
      // Ignore touch devices to prevent stuck tooltips on mobile/tablet
      if (e.pointerType === 'touch') return;

      const target = (e.target as HTMLElement | null)?.closest<HTMLElement>(
        '[title], [data-app-tooltip]'
      );

      if (!target) return;

      // Extract tooltip text
      let text = target.getAttribute('title') || target.getAttribute('data-app-tooltip') || '';
      text = text.trim();

      if (!text) {
        if (target.hasAttribute('title')) target.removeAttribute('title');
        return;
      }

      // Strip native title to permanently disable Windows OS native empty box rendering
      if (target.hasAttribute('title')) {
        target.setAttribute('data-app-tooltip', text);
        target.removeAttribute('title');
      }

      activeTriggerRef.current = target;
      clearTimer();

      // Show after 150ms gentle delay
      timerRef.current = setTimeout(() => {
        if (activeTriggerRef.current === target) {
          // Choose placement based on element position
          const rect = target.getBoundingClientRect();
          let placement: Placement = 'top-center';
          if (rect.top < 45) {
            placement = 'bottom-center';
          }

          setState({
            isOpen: true,
            text,
            triggerEl: target,
            placement,
          });
        }
      }, 150);
    };

    const handlePointerOut = (e: PointerEvent) => {
      const target = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-app-tooltip]');
      if (target && activeTriggerRef.current === target) {
        activeTriggerRef.current = null;
        clearTimer();
        setState((prev) => (prev.isOpen ? { ...prev, isOpen: false, triggerEl: null } : prev));
      }
    };

    const handleDismiss = () => {
      activeTriggerRef.current = null;
      clearTimer();
      setState((prev) => (prev.isOpen ? { ...prev, isOpen: false, triggerEl: null } : prev));
    };

    const handleFocusIn = (e: FocusEvent) => {
      const target = (e.target as HTMLElement | null)?.closest<HTMLElement>(
        '[title], [data-app-tooltip]'
      );
      if (!target) return;

      let text = target.getAttribute('title') || target.getAttribute('data-app-tooltip') || '';
      text = text.trim();
      if (!text) return;

      if (target.hasAttribute('title')) {
        target.setAttribute('data-app-tooltip', text);
        target.removeAttribute('title');
      }

      activeTriggerRef.current = target;
      clearTimer();
      timerRef.current = setTimeout(() => {
        if (activeTriggerRef.current === target) {
          const rect = target.getBoundingClientRect();
          let placement: Placement = 'top-center';
          if (rect.top < 45) {
            placement = 'bottom-center';
          }
          setState({
            isOpen: true,
            text,
            triggerEl: target,
            placement,
          });
        }
      }, 150);
    };

    const handleFocusOut = () => {
      handleDismiss();
    };

    // Listeners on document with capture
    document.addEventListener('pointerover', handlePointerOver, { passive: true });
    document.addEventListener('pointerout', handlePointerOut, { passive: true });
    document.addEventListener('focusin', handleFocusIn, { passive: true });
    document.addEventListener('focusout', handleFocusOut, { passive: true });
    document.addEventListener('pointerdown', handleDismiss, { passive: true });
    window.addEventListener('scroll', handleDismiss, { capture: true, passive: true });
    window.addEventListener('wheel', handleDismiss, { passive: true });
    window.addEventListener('keydown', handleDismiss, { passive: true });

    return () => {
      clearTimer();
      document.removeEventListener('pointerover', handlePointerOver);
      document.removeEventListener('pointerout', handlePointerOut);
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
      document.removeEventListener('pointerdown', handleDismiss);
      window.removeEventListener('scroll', handleDismiss, { capture: true });
      window.removeEventListener('wheel', handleDismiss);
      window.removeEventListener('keydown', handleDismiss);
    };
  }, []);

  // Compute position whenever state changes or floating element mounts
  useEffect(() => {
    if (!state.isOpen || !state.triggerEl) {
      setCoords({ top: 0, left: 0, isReady: false });
      return;
    }

    const triggerRect = state.triggerEl.getBoundingClientRect();
    if (triggerRect.width === 0 && triggerRect.height === 0) {
      setState((prev) => ({ ...prev, isOpen: false }));
      return;
    }

    const floatingEl = floatingRef.current;
    const floatingRect = floatingEl
      ? floatingEl.getBoundingClientRect()
      : { width: 120, height: 28, top: 0, left: 0, right: 120, bottom: 28 };

    const result = computeViewportPosition(triggerRect, floatingRect, {
      placement: state.placement,
      offset: 6,
      viewportPadding: 8,
    });

    setCoords({
      top: result.top,
      left: result.left,
      isReady: true,
    });
  }, [state.isOpen, state.triggerEl, state.placement, state.text]);

  if (!state.isOpen || !state.text) return null;

  return (
    <ViewportPortal>
      <div
        ref={floatingRef}
        style={{
          position: 'fixed',
          top: `${coords.top}px`,
          left: `${coords.left}px`,
          zIndex: 999999,
          opacity: coords.isReady ? 1 : 0,
          visibility: coords.isReady ? 'visible' : 'hidden',
          transition: 'opacity 0.1s ease-out',
        }}
        className="pointer-events-none select-none"
      >
        <div className="bg-white/95 dark:bg-slate-800/95 text-slate-800 dark:text-slate-100 text-[11px] font-semibold px-2.5 py-1 rounded-lg shadow-md shadow-slate-900/10 dark:shadow-2xl border border-slate-200/90 dark:border-slate-700/80 backdrop-blur-md whitespace-nowrap animate-fade-in">
          {state.text}
        </div>
      </div>
    </ViewportPortal>
  );
}
