/**
 * Viewport Collision Detection & Positioning Engine
 * Implements: Collision Detection + Auto Flip + Auto Shift + Safe Boundary Padding (8-16px)
 * Supports Desktop, Tablet, Mobile, Window Resize, and Browser Zoom
 */

export interface RectLike {
  top: number;
  left: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

export type Placement =
  | 'bottom-start'
  | 'bottom-end'
  | 'bottom-center'
  | 'top-start'
  | 'top-end'
  | 'top-center'
  | 'left-start'
  | 'left-center'
  | 'right-start'
  | 'right-center'
  | 'auto';

export interface ComputePositionOptions {
  placement?: Placement;
  offset?: number;          // Gap between trigger and floating element (default: 6px)
  viewportPadding?: number; // Minimum padding from window edge (default: 12px, between 8-16px)
  matchTriggerWidth?: boolean;
}

export interface ComputedPositionResult {
  top: number;
  left: number;
  maxHeight: number;
  maxWidth: number;
  actualPlacement: string;
  isFlippedY: boolean;
  isFlippedX: boolean;
}

export function computeViewportPosition(
  triggerRect: RectLike,
  floatingRect: RectLike,
  options: ComputePositionOptions = {}
): ComputedPositionResult {
  const {
    placement = 'bottom-start',
    offset = 6,
    viewportPadding = 12,
    matchTriggerWidth = false,
  } = options;

  // Viewport dimensions (handle visualViewport for mobile zoom if available)
  const vw = typeof window !== 'undefined'
    ? (window.visualViewport ? window.visualViewport.width : window.innerWidth)
    : 1024;
  const vh = typeof window !== 'undefined'
    ? (window.visualViewport ? window.visualViewport.height : window.innerHeight)
    : 768;

  const menuWidth = matchTriggerWidth ? Math.max(floatingRect.width, triggerRect.width) : floatingRect.width;
  const menuHeight = floatingRect.height;

  // Max bounds allowed within viewport
  const maxSafeWidth = Math.max(120, vw - viewportPadding * 2);
  const maxSafeHeight = Math.max(100, vh - viewportPadding * 2);

  const effectiveMenuWidth = Math.min(menuWidth, maxSafeWidth);
  const effectiveMenuHeight = Math.min(menuHeight, maxSafeHeight);

  // Available free space in 4 directions
  const spaceBelow = vh - triggerRect.bottom - offset - viewportPadding;
  const spaceAbove = triggerRect.top - offset - viewportPadding;
  const spaceRight = vw - triggerRect.left - viewportPadding;
  const spaceLeft = triggerRect.right - viewportPadding;

  let isFlippedY = false;
  let isFlippedX = false;
  let top = 0;
  let left = 0;

  // ─────────────────────────────────────────────────────────────
  // 1. VERTICAL AXIS (Collision Detection & Auto-Flip)
  // ─────────────────────────────────────────────────────────────
  const prefersTop = placement.startsWith('top');
  const fitsBelow = spaceBelow >= effectiveMenuHeight;
  const fitsAbove = spaceAbove >= effectiveMenuHeight;

  if (prefersTop) {
    if (fitsAbove) {
      // Fits above as requested
      top = triggerRect.top - effectiveMenuHeight - offset;
    } else if (fitsBelow) {
      // Auto-flip down
      top = triggerRect.bottom + offset;
      isFlippedY = true;
    } else {
      // Neither fits completely -> choose the side with more space
      if (spaceAbove >= spaceBelow) {
        top = triggerRect.top - effectiveMenuHeight - offset;
      } else {
        top = triggerRect.bottom + offset;
        isFlippedY = true;
      }
    }
  } else {
    // Prefers bottom (default)
    if (fitsBelow) {
      // Fits below
      top = triggerRect.bottom + offset;
    } else if (fitsAbove) {
      // Auto-flip up
      top = triggerRect.top - effectiveMenuHeight - offset;
      isFlippedY = true;
    } else {
      // Neither fits completely -> choose side with more space
      if (spaceBelow >= spaceAbove) {
        top = triggerRect.bottom + offset;
      } else {
        top = triggerRect.top - effectiveMenuHeight - offset;
        isFlippedY = true;
      }
    }
  }

  // Auto-Shift Vertical: Ensure menu never overflows the viewport top or bottom
  top = Math.max(viewportPadding, Math.min(top, vh - effectiveMenuHeight - viewportPadding));

  // ─────────────────────────────────────────────────────────────
  // 2. HORIZONTAL AXIS (Collision Detection & Auto-Flip)
  // ─────────────────────────────────────────────────────────────
  const prefersEnd = placement.endsWith('end');
  const prefersCenter = placement.endsWith('center');

  if (prefersCenter) {
    left = triggerRect.left + (triggerRect.width - effectiveMenuWidth) / 2;
  } else if (prefersEnd) {
    // Aligns right edge of menu to right edge of trigger
    left = triggerRect.right - effectiveMenuWidth;

    // If overflowing left edge, check if opening to the right fits
    if (left < viewportPadding && spaceRight >= effectiveMenuWidth) {
      left = triggerRect.left;
      isFlippedX = true;
    }
  } else {
    // Prefers start (align left edge of menu with left edge of trigger)
    left = triggerRect.left;

    // If overflowing right edge, check if flipping to right-aligned fits
    if (left + effectiveMenuWidth > vw - viewportPadding) {
      if (spaceLeft >= effectiveMenuWidth) {
        left = triggerRect.right - effectiveMenuWidth;
        isFlippedX = true;
      }
    }
  }

  // Auto-Shift Horizontal: Ensure menu never overflows the viewport left or right
  left = Math.max(viewportPadding, Math.min(left, vw - effectiveMenuWidth - viewportPadding));

  return {
    top: Math.round(top),
    left: Math.round(left),
    maxHeight: Math.round(maxSafeHeight),
    maxWidth: Math.round(maxSafeWidth),
    actualPlacement: `${isFlippedY ? 'top' : 'bottom'}-${isFlippedX ? (prefersEnd ? 'start' : 'end') : (prefersEnd ? 'end' : 'start')}`,
    isFlippedY,
    isFlippedX,
  };
}
