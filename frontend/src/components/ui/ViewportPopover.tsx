import React, { useRef, useState, useCallback } from 'react';
import { useViewportPosition } from '@/hooks/useViewportPosition';
import ViewportPortal from './ViewportPortal';
import { Placement } from '@/utils/viewportPosition';

export interface ViewportPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLElement | null>;
  children: React.ReactNode;
  placement?: Placement;
  offset?: number;
  viewportPadding?: number;
  className?: string;
  zIndex?: number;
  matchTriggerWidth?: boolean;
}

export default function ViewportPopover({
  isOpen,
  onClose,
  triggerRef,
  children,
  placement = 'bottom-start',
  offset = 6,
  viewportPadding = 12,
  className = '',
  zIndex = 9999,
  matchTriggerWidth = false,
}: ViewportPopoverProps) {
  const floatingRef = useRef<HTMLDivElement | null>(null);
  const [, setAttached] = useState(0);

  const setFloatingRef = useCallback((node: HTMLDivElement | null) => {
    floatingRef.current = node;
    if (node) {
      setAttached((c) => c + 1);
    }
  }, []);

  const { top, left, maxHeight, maxWidth, isReady } = useViewportPosition({
    isOpen,
    triggerRef,
    floatingRef,
    placement,
    offset,
    viewportPadding,
    matchTriggerWidth,
    onClose,
  });

  if (!isOpen) return null;

  return (
    <ViewportPortal>
      <div
        ref={setFloatingRef}
        style={{
          position: 'fixed',
          top: `${top}px`,
          left: `${left}px`,
          maxHeight: `${maxHeight}px`,
          maxWidth: `${maxWidth}px`,
          zIndex,
          visibility: isReady ? 'visible' : 'hidden',
          opacity: isReady ? 1 : 0,
          transition: 'opacity 0.12s ease-out',
        }}
        className={`overflow-y-auto overflow-x-hidden ${className}`}
      >
        {children}
      </div>
    </ViewportPortal>
  );
}

