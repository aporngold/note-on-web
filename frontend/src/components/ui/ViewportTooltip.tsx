import React, { useState, useRef, useEffect, useCallback } from 'react';
import ViewportPopover from './ViewportPopover';
import { Placement } from '@/utils/viewportPosition';

export interface ViewportTooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  placement?: Placement;
  delay?: number;
  disabled?: boolean;
}

/**
 * Standardized Viewport Tooltip Component
 * - Renders via ViewportPopover / ViewportPortal directly into document.body
 * - Immune to container overflow (hidden/clip) and z-index stacking issues
 * - Collision detection: flips and shifts dynamically near viewport edges
 * - Supports mouse hover (with 150ms gentle delay) and keyboard focus
 * - Strips native title attribute to permanently block Windows OS native empty box glitches
 * - Hides immediately on click/pointer-down or scroll
 */
export default function ViewportTooltip({
  content,
  children,
  placement = 'top-center',
  delay = 150,
  disabled = false,
}: ViewportTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const showTooltip = useCallback(() => {
    if (disabled || !content) return;
    clearTimer();
    timerRef.current = setTimeout(() => {
      setIsOpen(true);
    }, delay);
  }, [clearTimer, content, delay, disabled]);

  const hideTooltip = useCallback(() => {
    clearTimer();
    setIsOpen(false);
  }, [clearTimer]);

  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  // Hide on scroll/wheel anywhere in the window
  useEffect(() => {
    if (!isOpen) return;
    const handleScroll = () => hideTooltip();
    window.addEventListener('scroll', handleScroll, { capture: true, passive: true });
    window.addEventListener('wheel', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll, { capture: true });
      window.removeEventListener('wheel', handleScroll);
    };
  }, [isOpen, hideTooltip]);

  // If content is empty or disabled, just render the child element
  if (!content || disabled) {
    return children;
  }

  // Safely merge child ref with triggerRef to preserve any existing refs (e.g. popover triggers)
  const setRefs = (node: HTMLElement | null) => {
    triggerRef.current = node;
    const childRef = (children as any).ref;
    if (typeof childRef === 'function') {
      childRef(node);
    } else if (childRef && typeof childRef === 'object' && 'current' in childRef) {
      childRef.current = node;
    }
  };

  // Strip native title to permanently prevent browser/Windows native empty tooltip box
  const childProps: Record<string, any> = {
    ref: setRefs,
    title: undefined, // Strips native title to eliminate empty box bug
    onPointerEnter: (e: React.PointerEvent) => {
      if (e.pointerType === 'touch') return; // Ignore on touch screens
      (children.props as any).onPointerEnter?.(e);
      showTooltip();
    },
    onPointerLeave: (e: React.PointerEvent) => {
      (children.props as any).onPointerLeave?.(e);
      hideTooltip();
    },
    onPointerDown: (e: React.PointerEvent) => {
      (children.props as any).onPointerDown?.(e);
      hideTooltip(); // Hide on press
    },
    onFocus: (e: React.FocusEvent) => {
      (children.props as any).onFocus?.(e);
      showTooltip();
    },
    onBlur: (e: React.FocusEvent) => {
      (children.props as any).onBlur?.(e);
      hideTooltip();
    },
  };

  const child = React.cloneElement(children, childProps);

  return (
    <>
      {child}
      {isOpen && (
        <ViewportPopover
          isOpen={isOpen}
          onClose={hideTooltip}
          triggerRef={triggerRef}
          placement={placement}
          offset={6}
          viewportPadding={8}
          zIndex={999999}
          className="pointer-events-none select-none"
        >
          <div className="bg-white/95 dark:bg-slate-800/95 text-slate-800 dark:text-slate-100 text-[11px] font-semibold px-2.5 py-1 rounded-lg shadow-md shadow-slate-900/10 dark:shadow-2xl border border-slate-200/90 dark:border-slate-700/80 backdrop-blur-md whitespace-nowrap animate-fade-in">
            {content}
          </div>
        </ViewportPopover>
      )}
    </>
  );
}
