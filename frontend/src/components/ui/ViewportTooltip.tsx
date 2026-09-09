import React, { useState, useRef } from 'react';
import ViewportPopover from './ViewportPopover';

interface ViewportTooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  placement?: 'top-center' | 'bottom-center' | 'bottom-start' | 'top-start';
  delay?: number;
}

export default function ViewportTooltip({
  content,
  children,
  placement = 'top-center',
  delay = 200,
}: ViewportTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    timerRef.current = setTimeout(() => {
      setIsOpen(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsOpen(false);
  };

  const child = React.cloneElement(children, {
    ref: triggerRef,
    onMouseEnter: (e: React.MouseEvent) => {
      children.props.onMouseEnter?.(e);
      handleMouseEnter();
    },
    onMouseLeave: (e: React.MouseEvent) => {
      children.props.onMouseLeave?.(e);
      handleMouseLeave();
    },
  });

  return (
    <>
      {child}
      {isOpen && (
        <ViewportPopover
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          triggerRef={triggerRef}
          placement={placement}
          offset={6}
          viewportPadding={8}
          zIndex={99999}
          className="pointer-events-none"
        >
          <div className="bg-slate-900/90 dark:bg-slate-800/95 text-white text-[11px] font-medium px-2.5 py-1 rounded-lg shadow-lg border border-slate-700/50 backdrop-blur-xs whitespace-nowrap">
            {content}
          </div>
        </ViewportPopover>
      )}
    </>
  );
}
