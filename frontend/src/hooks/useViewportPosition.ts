import { useState, useEffect, useCallback, useLayoutEffect } from 'react';
import {
  computeViewportPosition,
  ComputePositionOptions,
  ComputedPositionResult,
  RectLike,
} from '@/utils/viewportPosition';

// Use isomorphic layout effect for SSR safety
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export interface UseViewportPositionOptions extends ComputePositionOptions {
  isOpen: boolean;
  triggerRef: React.RefObject<HTMLElement | null>;
  floatingRef: React.RefObject<HTMLElement | null>;
  onClose?: () => void;
  closeOnScroll?: boolean;
  closeOnEscape?: boolean;
  closeOnOutsideClick?: boolean;
}

export function useViewportPosition({
  isOpen,
  triggerRef,
  floatingRef,
  placement = 'bottom-start',
  offset = 6,
  viewportPadding = 12,
  matchTriggerWidth = false,
  onClose,
  closeOnScroll = false,
  closeOnEscape = true,
  closeOnOutsideClick = true,
}: UseViewportPositionOptions) {
  const [position, setPosition] = useState<ComputedPositionResult>(() => {
    return {
      top: 0,
      left: 0,
      maxHeight: 600,
      maxWidth: 400,
      actualPlacement: placement,
      isFlippedY: false,
      isFlippedX: false,
    };
  });

  const [isReady, setIsReady] = useState(false);

  const updatePosition = useCallback(() => {
    if (!isOpen || !triggerRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    if (triggerRect.width === 0 && triggerRect.height === 0) return;

    // Measure floating element or provide fallback if still mounting
    let floatingRect: RectLike;
    if (floatingRef.current) {
      const rect = floatingRef.current.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        floatingRect = rect;
      } else {
        floatingRect = {
          top: 0,
          left: 0,
          right: 200,
          bottom: 150,
          width: 200,
          height: 150,
        };
      }
    } else {
      floatingRect = {
        top: 0,
        left: 0,
        right: 200,
        bottom: 150,
        width: 200,
        height: 150,
      };
    }

    const result = computeViewportPosition(triggerRect, floatingRect, {
      placement,
      offset,
      viewportPadding,
      matchTriggerWidth,
    });

    setPosition(result);
    setIsReady(true);
  }, [isOpen, triggerRef, floatingRef, placement, offset, viewportPadding, matchTriggerWidth]);

  // Initial measurement & re-measurement when open
  useIsomorphicLayoutEffect(() => {
    if (isOpen) {
      updatePosition();
      const raf = requestAnimationFrame(() => {
        updatePosition();
      });
      return () => cancelAnimationFrame(raf);
    } else {
      setIsReady(false);
    }
  }, [isOpen, updatePosition]);

  // Listeners for window resize, scroll, zoom, outside click, escape key
  useEffect(() => {
    if (!isOpen) return;

    // Multi-frame verification to guarantee precise alignment once DOM finishes paint
    let frameCount = 0;
    let frameId: number;
    const verifyPosition = () => {
      updatePosition();
      if (frameCount < 4) {
        frameCount++;
        frameId = requestAnimationFrame(verifyPosition);
      }
    };
    frameId = requestAnimationFrame(verifyPosition);

    const handleScroll = (e: Event) => {
      if (closeOnScroll) {
        onClose?.();
      } else {
        updatePosition();
      }
    };

    const handleResize = () => {
      updatePosition();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (closeOnEscape && e.key === 'Escape') {
        onClose?.();
      }
    };

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (!closeOnOutsideClick) return;
      const target = e.target as Node;
      if (!target) return;

      const isInsideTrigger = triggerRef.current?.contains(target);
      const isInsideFloating = floatingRef.current?.contains(target);

      if (!isInsideTrigger && !isInsideFloating) {
        onClose?.();
      }
    };

    // Global listeners
    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('scroll', handleScroll, { capture: true, passive: true });
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handlePointerDown);

    // Mobile visual viewport support for pinch-to-zoom
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      window.visualViewport.addEventListener('scroll', handleScroll);
    }

    // ResizeObserver on trigger & menu element
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        updatePosition();
      });
      if (triggerRef.current) resizeObserver.observe(triggerRef.current);
      if (floatingRef.current) resizeObserver.observe(floatingRef.current);
    }

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll, { capture: true });
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handlePointerDown);

      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
        window.visualViewport.removeEventListener('scroll', handleScroll);
      }

      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [isOpen, closeOnScroll, closeOnEscape, closeOnOutsideClick, onClose, updatePosition, triggerRef, floatingRef]);

  return {
    ...position,
    updatePosition,
    isReady,
  };
}

