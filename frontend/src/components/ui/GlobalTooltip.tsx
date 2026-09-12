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
 * - Intercepts interactive controls (button, a, select, [role="button"]) with `title` or `data-app-tooltip`
 * - Strips native `title` from the DOM to permanently prevent the Windows OS empty box bug
 * - Uses a standard 450ms hover dwell time: moving the mouse across the page does NOT trigger unwanted tooltips
 * - Auto-dismiss: automatically fades out after 3.5 seconds so tooltips NEVER get stuck on screen
 * - Mouse tracking: disappears instantly the moment the mouse leaves the button or clicks
 * - Renders via ViewportPortal to document.body with collision detection (flips & shifts at viewport boundaries)
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

  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoHideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const activeTriggerRef = useRef<HTMLElement | null>(null);
  const floatingRef = useRef<HTMLDivElement | null>(null);

  const clearTimers = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    if (autoHideTimerRef.current) {
      clearTimeout(autoHideTimerRef.current);
      autoHideTimerRef.current = null;
    }
  };

  const handleDismiss = () => {
    activeTriggerRef.current = null;
    clearTimers();
    setState((prev) => (prev.isOpen ? { ...prev, isOpen: false, triggerEl: null } : prev));
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Trigger tooltips ONLY on interactive buttons and controls
    const getInteractiveTarget = (el: HTMLElement | null): HTMLElement | null => {
      if (!el) return null;
      return el.closest<HTMLElement>(
        'button, a, select, [role="button"], [data-app-tooltip]'
      );
    };

    const handlePointerOver = (e: PointerEvent) => {
      // Ignore touch devices to prevent stuck tooltips on mobile/tablet
      if (e.pointerType === 'touch') return;

      const target = getInteractiveTarget(e.target as HTMLElement | null);
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

      // If already hovering this exact button, don't restart
      if (activeTriggerRef.current === target) return;

      activeTriggerRef.current = target;
      clearTimers();

      // Hover dwell time: 1600ms (1.6 seconds) - perfectly balanced sweet spot
      hoverTimerRef.current = setTimeout(() => {
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

          // Auto-hide after 3.5 seconds: never stays stuck on screen!
          autoHideTimerRef.current = setTimeout(() => {
            handleDismiss();
          }, 3500);
        }
      }, 1600);
    };

    // Track mouse movement: if mouse leaves the active button bounds, dismiss immediately
    const handlePointerMove = (e: PointerEvent) => {
      if (!activeTriggerRef.current) return;
      const target = e.target as HTMLElement | null;
      if (!target || !activeTriggerRef.current.contains(target)) {
        handleDismiss();
      }
    };

    const handlePointerOut = (e: PointerEvent) => {
      if (!activeTriggerRef.current) return;
      const related = e.relatedTarget as HTMLElement | null;
      if (!related || !activeTriggerRef.current.contains(related)) {
        handleDismiss();
      }
    };

    const handleFocusIn = (e: FocusEvent) => {
      const target = getInteractiveTarget(e.target as HTMLElement | null);
      if (!target) return;

      let text = target.getAttribute('title') || target.getAttribute('data-app-tooltip') || '';
      text = text.trim();
      if (!text) return;

      if (target.hasAttribute('title')) {
        target.setAttribute('data-app-tooltip', text);
        target.removeAttribute('title');
      }

      activeTriggerRef.current = target;
      clearTimers();
      hoverTimerRef.current = setTimeout(() => {
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
          autoHideTimerRef.current = setTimeout(() => {
            handleDismiss();
          }, 3500);
        }
      }, 1600);
    };

    const handleFocusOut = () => {
      handleDismiss();
    };

    // Document listeners
    document.addEventListener('pointerover', handlePointerOver, { passive: true });
    document.addEventListener('pointermove', handlePointerMove, { passive: true });
    document.addEventListener('pointerout', handlePointerOut, { passive: true });
    document.addEventListener('focusin', handleFocusIn, { passive: true });
    document.addEventListener('focusout', handleFocusOut, { passive: true });
    document.addEventListener('pointerdown', handleDismiss, { passive: true });
    window.addEventListener('scroll', handleDismiss, { capture: true, passive: true });
    window.addEventListener('wheel', handleDismiss, { passive: true });
    window.addEventListener('keydown', handleDismiss, { passive: true });

    return () => {
      clearTimers();
      document.removeEventListener('pointerover', handlePointerOver);
      document.removeEventListener('pointermove', handlePointerMove);
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
          transition: 'opacity 0.12s ease-out',
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
