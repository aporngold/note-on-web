import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import {
  Plus,
  Minus,
  MoreHorizontal,
  Edit2,
  Trash2,
  Check,
  X,
  Palette,
  Layout,
  FolderPlus,
  Share2,
  Columns,
  Link2,
  Image as ImageIcon,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import StickyNoteItem from './StickyNoteItem';
import StickyStickerItem from './StickyStickerItem';
import BoardStickerModal from './BoardStickerModal';
import NoteQuickPeek from './NoteQuickPeek';
import { isStickerNote, BoardStickerItem, getStickerMetadata, encodeStickerContent, getNoteStickers } from './stickerData';
import NoteConnectionCanvas from './NoteConnectionCanvas';
import KanbanView from './KanbanView';
import BoardShareModal from '../modals/BoardShareModal';
import BoardBackgroundModal, { BOARD_PATTERNS, CURATED_WALLPAPERS } from './BoardBackgroundModal';
import FullscreenNoteModal from '../notes/FullscreenNoteModal';
import { Note, Board, BoardViewMode, SortOption } from '@/types';
import { useNoteStore } from '@/store/noteStore';
import { useAuthStore } from '@/store/authStore';
import MasterPasswordModal from '../notes/MasterPasswordModal';
import { getRandomNoteColor } from '../notes/NoteEditor';
import { sortNotes, SORT_OPTIONS } from '@/utils/sortHelper';
import toast from 'react-hot-toast';

interface StickyBoardProps {
  notes: Note[];
}

type BoardTheme = 'cork' | 'grid' | 'dark' | 'clean' | 'custom';

const TAB_COLORS = [
  '#4F46E5', // Indigo
  '#2563EB', // Blue
  '#059669', // Emerald
  '#D97706', // Amber
  '#DC2626', // Red
  '#DB2777', // Pink
  '#7C3AED', // Purple
  '#475569', // Slate
  '#0D9488', // Teal
];

export const MAX_NOTES_PER_BOARD = 56;

export default function StickyBoard({ notes }: StickyBoardProps) {
  const router = useRouter();
  const {
    boards,
    activeBoardId,
    setActiveBoardId,
    createBoard,
    updateBoard,
    deleteBoard,
    createNote,
    updateNote,
    fetchNotes,
    connections,
    createConnection,
    boardViewMode,
    setBoardViewMode,
    notes: allNotes,
    sortBy,
    setSortBy,
  } = useNoteStore();

  const activeBoard = boards.find((b) => b.id === activeBoardId);
  const isVaultUnlocked = useAuthStore((state) => state.isVaultUnlocked);
  const [cachedTheme, setCachedTheme] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('secure_note_active_board_theme');
    }
    return null;
  });

  useEffect(() => {
    if (activeBoard?.theme) {
      setCachedTheme(activeBoard.theme);
      try {
        localStorage.setItem('secure_note_active_board_theme', activeBoard.theme);
      } catch (e) { }
    }
  }, [activeBoard?.theme]);

  // Real-time note count per board from reactive store state
  const getBoardNoteCount = (b: Board) => {
    const isActive = b.id === activeBoardId || (!activeBoardId && b.isDefault);
    if (isActive) {
      return notes.filter((n) => !n.isArchived).length;
    }
    return b.noteCount ?? 0;
  };

  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);
  const [fullscreenNote, setFullscreenNote] = useState<Note | null>(null);
  const [isArranging, setIsArranging] = useState(false);

  const handleOpenFullscreen = (n: Note) => {
    if (typeof document !== 'undefined' && !document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => { });
    }
    setFullscreenNote(n);
  };

  // Modals for Sharing, Backgrounds, and Stickers
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isBackgroundModalOpen, setIsBackgroundModalOpen] = useState(false);
  const [isStickerModalOpen, setIsStickerModalOpen] = useState(false);
  const [stickerTargetNoteId, setStickerTargetNoteId] = useState<string | null>(null);
  const [lastActiveNoteId, setLastActiveNoteId] = useState<string | null>(null);

  // Modals / Dropdowns for Board Management
  const [isAddBoardModalOpen, setIsAddBoardModalOpen] = useState(false);
  const [isBoardDropdownOpen, setIsBoardDropdownOpen] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [newBoardColor, setNewBoardColor] = useState(TAB_COLORS[0]);

  const [editingBoard, setEditingBoard] = useState<Board | null>(null);
  const [editBoardName, setEditBoardName] = useState('');
  const [editBoardColor, setEditBoardColor] = useState('');

  // Interactive Note Connection Mode state
  const [connectingSourceId, setConnectingSourceId] = useState<string | null>(null);

  // Canvas scroll container ref, canvas element ref, and zoom wrapper ref
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const canvasElementRef = useRef<HTMLDivElement>(null);
  const zoomWrapperRef = useRef<HTMLDivElement>(null);
  const [isPinching, setIsPinching] = useState<boolean>(false);

  // Z-index management so clicked or interacted notes always sit on top
  const [noteZIndices, setNoteZIndices] = useState<Record<string, number>>({});
  const highestZRef = useRef<number>(50);
  const [focusedNoteId, setFocusedNoteId] = useState<string | null>(null);
  const [highlightedNoteId, setHighlightedNoteId] = useState<string | null>(null);
  const focusTimerRef = useRef<NodeJS.Timeout | null>(null);
  const highlightTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Zoom-Out Quick Peek state (Desktop Hover, Mobile/iPad Tap)
  const [quickPeekNote, setQuickPeekNote] = useState<Note | null>(null);
  const [quickPeekAnchor, setQuickPeekAnchor] = useState<DOMRect | null>(null);

  // Reservation of slots to prevent overlapping when creating notes rapidly
  const pendingSlotsRef = useRef<Array<{ x: number; y: number }>>([]);

  // Dynamic canvas dimensions: exactly 7 notes wide (2060px), height expands with rows as before
  const dynamicCanvasSize = React.useMemo(() => {
    let maxNoteY = 0;
    notes.forEach((n) => {
      const bottom = (n.posY ?? 0) + (n.height ?? 260);
      if (bottom > maxNoteY) maxNoteY = bottom;
    });
    return {
      minWidth: '2060px',
      width: '2060px',
      minHeight: `${Math.max(1300, maxNoteY + 120)}px`,
    };
  }, [notes]);

  // Zoom level state (0.15 to 3.0, allows seeing entire board)
  const [zoom, setZoom] = useState<number>(1.0);
  const [isZoomOverlayVisible, setIsZoomOverlayVisible] = useState<boolean>(false);
  const zoomTimerRef = useRef<NodeJS.Timeout | null>(null);
  const peekCloseTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-dismiss Quick Peek when zooming back in (> 0.65)
  useEffect(() => {
    if (zoom > 0.65) {
      if (peekCloseTimerRef.current) clearTimeout(peekCloseTimerRef.current);
      setQuickPeekNote(null);
      setQuickPeekAnchor(null);
    }
  }, [zoom]);

  // Hover Bridge handlers for Quick Peek: allows user to move mouse into the card to click Edit/Fullscreen
  const handleOpenQuickPeek = (note: Note, anchorRect: DOMRect) => {
    if (peekCloseTimerRef.current) {
      clearTimeout(peekCloseTimerRef.current);
      peekCloseTimerRef.current = null;
    }
    setQuickPeekNote(note);
    setQuickPeekAnchor(anchorRect);
  };

  const handleScheduleCloseQuickPeek = () => {
    if (peekCloseTimerRef.current) clearTimeout(peekCloseTimerRef.current);
    peekCloseTimerRef.current = setTimeout(() => {
      setQuickPeekNote(null);
      setQuickPeekAnchor(null);
    }, 300); // 300ms grace period to move mouse into card
  };

  const handleCancelCloseQuickPeek = () => {
    if (peekCloseTimerRef.current) {
      clearTimeout(peekCloseTimerRef.current);
      peekCloseTimerRef.current = null;
    }
  };

  const showZoomOverlay = useCallback(() => {
    setIsZoomOverlayVisible(true);
    if (zoomTimerRef.current) clearTimeout(zoomTimerRef.current);
    zoomTimerRef.current = setTimeout(() => {
      setIsZoomOverlayVisible(false);
    }, 1200);
  }, []);

  // Zoom to 100% and smoothly center viewport on a specific note/sticker
  const handleZoomToNote = useCallback((targetNote: Note) => {
    const container = canvasContainerRef.current;
    if (!container) return;

    const noteCenterX = (targetNote.posX ?? 0) + (targetNote.width || 260) / 2;
    const noteCenterY = (targetNote.posY ?? 0) + (targetNote.height || 260) / 2;

    setZoom(1.0);
    showZoomOverlay();

    // If note is in top row area (Y < 380), scrollTop = 0 keeps note and its top stickers perfectly framed
    // without pushing them up under the header bar (fixes cut-off bug in 1.mp4)
    const targetScrollLeft = Math.max(0, noteCenterX - container.clientWidth / 2);
    const targetScrollTop = noteCenterY < 380 ? 0 : Math.max(0, noteCenterY - container.clientHeight / 2);

    setTimeout(() => {
      if (canvasContainerRef.current) {
        canvasContainerRef.current.scrollTo({
          left: Math.round(targetScrollLeft),
          top: Math.round(targetScrollTop),
          behavior: 'smooth',
        });
      }
    }, 40);
  }, [showZoomOverlay]);

  const handleZoomToSticker = useCallback((stickerNote: Note) => {
    const meta = getStickerMetadata(stickerNote);
    const targetNoteId = meta.attachedToNoteId || meta.anchorId;
    const parentNote = targetNoteId ? notes.find((n) => n.id === targetNoteId) : null;
    handleZoomToNote(parentNote || stickerNote);
  }, [notes, handleZoomToNote]);

  // Unified Double-Tap & Double-Click Zoom Toggle across Desktop, Tablet, iPad & Mobile
  const triggerZoomToggleAtPoint = useCallback((clientX: number, clientY: number) => {
    const container = canvasContainerRef.current;
    if (!container) return;

    if (zoom <= 0.25) {
      // ── Zoom IN: Toggle from 20% -> 100% ──
      const containerRect = container.getBoundingClientRect();
      const clickXInViewport = clientX - containerRect.left;
      const clickYInViewport = clientY - containerRect.top;

      // Actual raw canvas click point
      const rawCanvasX = (container.scrollLeft + clickXInViewport) / zoom;
      const rawCanvasY = (container.scrollTop + clickYInViewport) / zoom;

      // Check current board's notes
      const boardNotes = notes.filter(
        (n) => !n.isArchived && (activeBoard ? n.boardId === activeBoard.id : true)
      );

      if (boardNotes.length > 0) {
        // Find nearest note to the click point to prevent zooming into empty desert
        let nearestNote = boardNotes[0];
        let minDist = Infinity;
        for (const n of boardNotes) {
          const nX = (n.posX ?? 0) + (n.width || 260) / 2;
          const nY = (n.posY ?? 0) + (n.height || 260) / 2;
          const d = Math.hypot(rawCanvasX - nX, rawCanvasY - nY);
          if (d < minDist) {
            minDist = d;
            nearestNote = n;
          }
        }
        handleZoomToNote(nearestNote);
      } else {
        // No notes on board, simply zoom in to (0, 0)
        setZoom(1.0);
        showZoomOverlay();
        setTimeout(() => {
          if (canvasContainerRef.current) {
            canvasContainerRef.current.scrollTo({
              left: 0,
              top: 0,
              behavior: 'smooth',
            });
          }
        }, 40);
      }
    } else {
      // ── Zoom OUT: Toggle from 100% -> 20% overview (shows all notes on Mobile/Tablet/iPad/Desktop) ──
      setZoom(0.20);
      showZoomOverlay();
      setTimeout(() => {
        if (canvasContainerRef.current) {
          canvasContainerRef.current.scrollTo({
            left: 0,
            top: 0,
            behavior: 'smooth',
          });
        }
      }, 40);
    }
  }, [zoom, notes, activeBoard, handleZoomToNote, showZoomOverlay]);

  // Guard against synthetic mouse dblclick on touch devices (Mobile, Tablet, iPad)
  const lastTouchActionTimeRef = useRef<number>(0);

  // Handle double-click on empty canvas area on Desktop:
  const handleCanvasDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Ignore synthetic mouse dblclick generated by touch taps on touch screens
    if (Date.now() - lastTouchActionTimeRef.current < 450) {
      return;
    }
    const target = e.target as HTMLElement;
    if (
      !target ||
      target.closest('.sticky-note-item') ||
      target.closest('[data-note-card="true"]') ||
      target.closest('.group\\/sticker') ||
      target.closest('[id^="sticker-item-"]') ||
      target.closest('button') ||
      target.closest('input') ||
      target.closest('textarea') ||
      target.closest('.no-drag')
    ) {
      return;
    }
    triggerZoomToggleAtPoint(e.clientX, e.clientY);
  };

  const handleZoomChange = (newZoom: number) => {
    const clamped = Math.max(0.15, Math.min(3.0, Math.round(newZoom * 100) / 100));
    setZoom(clamped);
    showZoomOverlay();
  };

  // Wheel zoom with Ctrl or Meta key (Desktop)
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.08 : -0.08;
        setZoom((prev) => {
          const next = Math.max(0.15, Math.min(3.0, Math.round((prev + delta) * 100) / 100));
          showZoomOverlay();
          return next;
        });
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [showZoomOverlay]);

  // Keep a ref to the latest zoom for touch gesture math (avoids stale closures)
  const zoomRef = useRef<number>(zoom);
  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  // Ref tracking 2-finger pinch state with Apple-grade smooth physics
  const pinchRef = useRef<{
    isPinching: boolean;
    initialDist: number;
    initialZoom: number;
    centerCanvasX: number;
    centerCanvasY: number;
    startMidX: number;
    startMidY: number;
    latestZoom: number;
    lastTime: number;
    lastZoom: number;
    zoomVelocity: number;
  }>({
    isPinching: false,
    initialDist: 0,
    initialZoom: 1,
    centerCanvasX: 0,
    centerCanvasY: 0,
    startMidX: 0,
    startMidY: 0,
    latestZoom: 1,
    lastTime: 0,
    lastZoom: 1,
    zoomVelocity: 0,
  });

  const rafIdRef = useRef<number | null>(null);
  const settleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track last tap timestamp and position for double-tap zoom toggle on empty board
  const lastTapRef = useRef<{ time: number; x: number; y: number }>({ time: 0, x: 0, y: 0 });

  // Touch handlers on canvasContainerRef: Pinch-to-zoom (2 fingers) & Double-tap (1 finger)
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        if (settleTimeoutRef.current) {
          clearTimeout(settleTimeoutRef.current);
          settleTimeoutRef.current = null;
        }
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        const currentZ = zoomRef.current;
        const viewportW = container.clientWidth;
        const viewportH = container.clientHeight;

        // Anchor to screen center so zoom expands and contracts perfectly steady without wobbling
        const screenCenterX = viewportW / 2;
        const screenCenterY = viewportH / 2;
        const centerCanvasX = (container.scrollLeft + screenCenterX) / currentZ;
        const centerCanvasY = (container.scrollTop + screenCenterY) / currentZ;

        const startMidX = (t1.clientX + t2.clientX) / 2;
        const startMidY = (t1.clientY + t2.clientY) / 2;

        pinchRef.current = {
          isPinching: true,
          initialDist: dist,
          initialZoom: currentZ,
          centerCanvasX,
          centerCanvasY,
          startMidX,
          startMidY,
          latestZoom: currentZ,
          lastTime: Date.now(),
          lastZoom: currentZ,
          zoomVelocity: 0,
        };
        setIsPinching(true);
        if (canvasElementRef.current) {
          canvasElementRef.current.style.transition = 'none';
        }
        if (zoomWrapperRef.current) {
          zoomWrapperRef.current.style.transition = 'none';
        }
        setIsZoomOverlayVisible(true);
        lastTouchActionTimeRef.current = Date.now();
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && pinchRef.current.isPinching && pinchRef.current.initialDist > 0) {
        if (e.cancelable) {
          e.preventDefault();
        }
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        const ratio = dist / pinchRef.current.initialDist;
        let rawZoom = pinchRef.current.initialZoom * ratio;

        // Elastic Rubber-band resistance at boundaries (Apple iOS physics)
        if (rawZoom < 0.15) {
          const under = 0.15 - rawZoom;
          rawZoom = 0.15 - under * 0.28; // gentle rubber-band stretch down to ~0.11
        } else if (rawZoom > 3.0) {
          const over = rawZoom - 3.0;
          rawZoom = 3.0 + over * 0.28; // gentle rubber-band stretch up to ~3.2
        }

        const now = Date.now();
        const dt = Math.max(1, now - pinchRef.current.lastTime);
        const dZoom = rawZoom - pinchRef.current.lastZoom;
        pinchRef.current.zoomVelocity = dZoom / dt;
        pinchRef.current.lastTime = now;
        pinchRef.current.lastZoom = rawZoom;
        pinchRef.current.latestZoom = rawZoom;

        const currentMidX = (t1.clientX + t2.clientX) / 2;
        const currentMidY = (t1.clientY + t2.clientY) / 2;
        const panDeltaX = currentMidX - pinchRef.current.startMidX;
        const panDeltaY = currentMidY - pinchRef.current.startMidY;

        const screenCenterX = container.clientWidth / 2;
        const screenCenterY = container.clientHeight / 2;
        const newScrollLeft = Math.max(0, pinchRef.current.centerCanvasX * rawZoom - screenCenterX - panDeltaX);
        const newScrollTop = Math.max(0, pinchRef.current.centerCanvasY * rawZoom - screenCenterY - panDeltaY);

        if (rafIdRef.current) {
          cancelAnimationFrame(rafIdRef.current);
        }

        rafIdRef.current = requestAnimationFrame(() => {
          rafIdRef.current = null;
          const baseW = parseInt(dynamicCanvasSize.minWidth) || 2200;
          const baseH = parseInt(dynamicCanvasSize.minHeight) || 1600;

          // 1. Direct GPU 3D transform on canvas (hardware-accelerated layer)
          if (canvasElementRef.current) {
            canvasElementRef.current.style.transform = `translate3d(0, 0, 0) scale(${rawZoom})`;
          }
          // 2. Direct size update on zoom wrapper
          if (zoomWrapperRef.current) {
            zoomWrapperRef.current.style.width = `${Math.round(baseW * rawZoom)}px`;
            zoomWrapperRef.current.style.height = `${Math.round(baseH * rawZoom)}px`;
          }
          // 3. Direct synchronized scroll
          container.scrollLeft = newScrollLeft;
          container.scrollTop = newScrollTop;

          // 4. Update overlay text without React re-render
          const overlayText = document.getElementById('zoom-overlay-text');
          if (overlayText) {
            overlayText.innerText = `ZOOM: ${Math.round(rawZoom * 100)}%`;
          }
        });
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (pinchRef.current.isPinching) {
        if (e.touches.length < 2) {
          pinchRef.current.isPinching = false;
          pinchRef.current.initialDist = 0;
          if (rafIdRef.current) {
            cancelAnimationFrame(rafIdRef.current);
            rafIdRef.current = null;
          }

          // Soft momentum + snap back from rubber band
          let targetZoom = pinchRef.current.latestZoom;
          const velocity = pinchRef.current.zoomVelocity;
          if (Math.abs(velocity) > 0.001) {
            targetZoom += velocity * 50; // gentle deceleration glide
          }

          // Strict boundary clamping [0.15, 3.0]
          const finalZoom = Math.max(0.15, Math.min(3.0, Math.round(targetZoom * 100) / 100));

          // Soft-settle momentum transition (Apple-like graceful deceleration)
          if (canvasElementRef.current) {
            canvasElementRef.current.style.transition = 'transform 220ms cubic-bezier(0.16, 1, 0.3, 1)';
            canvasElementRef.current.style.transform = `translate3d(0, 0, 0) scale(${finalZoom})`;
          }
          if (zoomWrapperRef.current) {
            zoomWrapperRef.current.style.transition = 'width 220ms cubic-bezier(0.16, 1, 0.3, 1), height 220ms cubic-bezier(0.16, 1, 0.3, 1)';
            const baseW = parseInt(dynamicCanvasSize.minWidth) || 2200;
            const baseH = parseInt(dynamicCanvasSize.minHeight) || 1600;
            zoomWrapperRef.current.style.width = `${Math.round(baseW * finalZoom)}px`;
            zoomWrapperRef.current.style.height = `${Math.round(baseH * finalZoom)}px`;
          }

          setZoom(finalZoom);
          setIsPinching(false);

          settleTimeoutRef.current = setTimeout(() => {
            if (canvasElementRef.current) {
              canvasElementRef.current.style.transition = '';
            }
            if (zoomWrapperRef.current) {
              zoomWrapperRef.current.style.transition = '';
            }
          }, 240);

          showZoomOverlay();
          lastTouchActionTimeRef.current = Date.now();
          lastTapRef.current = { time: 0, x: 0, y: 0 };
        }
        return;
      }

      // Double-tap on empty canvas detection
      const target = e.target as HTMLElement;
      if (
        !target ||
        target.closest('.sticky-note-item') ||
        target.closest('[data-note-card="true"]') ||
        target.closest('.group\\/sticker') ||
        target.closest('[id^="sticker-item-"]') ||
        target.closest('button') ||
        target.closest('input') ||
        target.closest('textarea') ||
        target.closest('.no-drag')
      ) {
        return;
      }

      const clientX = e.changedTouches?.[0]?.clientX ?? 0;
      const clientY = e.changedTouches?.[0]?.clientY ?? 0;
      const now = Date.now();
      const prev = lastTapRef.current;

      const timeDiff = now - prev.time;
      const dist = Math.hypot(clientX - prev.x, clientY - prev.y);

      if (timeDiff > 50 && timeDiff < 380 && dist < 35) {
        // Valid double-tap on empty canvas on Touch Devices (Mobile / Tablet / iPad)!
        lastTouchActionTimeRef.current = Date.now();
        triggerZoomToggleAtPoint(clientX, clientY);
        lastTapRef.current = { time: 0, x: 0, y: 0 };
      } else {
        lastTapRef.current = { time: now, x: clientX, y: clientY };
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    container.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      if (settleTimeoutRef.current) clearTimeout(settleTimeoutRef.current);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [triggerZoomToggleAtPoint, showZoomOverlay]);

  // Clean up focus & highlight timers on unmount
  useEffect(() => {
    return () => {
      if (focusTimerRef.current) clearTimeout(focusTimerRef.current);
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    };
  }, []);

  const bringToFront = useCallback((noteId: string) => {
    highestZRef.current += 1;
    const newZ = highestZRef.current;
    setNoteZIndices((prev) => ({ ...prev, [noteId]: newZ }));
  }, []);

  // Ensure a note is completely inside the visible viewport and comfortable to read/edit
  const ensureNoteInView = useCallback(
    (targetNote: Note) => {
      const container = canvasContainerRef.current;
      if (!container) return;

      const noteWidth = (targetNote.width ?? 260) * zoom;
      const noteHeight = (targetNote.height ?? 260) * zoom;
      const noteLeft = (targetNote.posX ?? 16) * zoom;
      const noteTop = (targetNote.posY ?? 16) * zoom;
      const noteRight = noteLeft + noteWidth;
      const noteBottom = noteTop + noteHeight;

      const viewLeft = container.scrollLeft;
      const viewTop = container.scrollTop;
      const viewRight = viewLeft + container.clientWidth;
      const viewBottom = viewTop + container.clientHeight;

      const margin = 48;

      const isComfortablyVisible =
        noteLeft >= viewLeft + margin &&
        noteRight <= viewRight - margin &&
        noteTop >= viewTop + margin &&
        noteBottom <= viewBottom - margin;

      if (!isComfortablyVisible) {
        let targetX = viewLeft;
        let targetY = viewTop;

        if (noteRight > viewRight - margin || noteLeft < viewLeft + margin) {
          targetX = Math.max(0, noteLeft - margin);
        }

        if (noteBottom > viewBottom - margin || noteTop < viewTop + margin) {
          targetY = Math.max(0, noteTop - margin);
        }

        if (targetX !== viewLeft || targetY !== viewTop) {
          container.scrollTo({ left: targetX, top: targetY, behavior: 'smooth' });
        }
      }
    },
    [zoom]
  );

  const handleNoteFocus = useCallback(
    (noteId: string) => {
      bringToFront(noteId);
      setFocusedNoteId(noteId);
      setLastActiveNoteId(noteId);
      // Dismiss any active highlight immediately so clicking another note never leaves old highlight stuck
      setHighlightedNoteId(null);
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
      if (focusTimerRef.current) clearTimeout(focusTimerRef.current);
      focusTimerRef.current = setTimeout(() => {
        setFocusedNoteId(null);
      }, 500);

      const targetNote = notes.find((n) => n.id === noteId);
      if (targetNote) {
        ensureNoteInView(targetNote);
      }
    },
    [bringToFront, notes, ensureNoteInView]
  );

  // Auto-resolve overlapping notes on board load (safely unpack any older notes hidden underneath)
  const resolvedOverlapsRef = useRef<boolean>(false);
  useEffect(() => {
    if (notes.length <= 1 || resolvedOverlapsRef.current) return;

    const occupiedSlots: Array<{ id: string; x: number; y: number }> = [];
    const notesToMove: Array<{ id: string; newX: number; newY: number }> = [];

    const isColliding = (x: number, y: number) => {
      return occupiedSlots.some((slot) => Math.abs(slot.x - x) < 60 && Math.abs(slot.y - y) < 60);
    };

    const cols = 7;
    const spacingX = 285;
    const spacingY = 295;
    const startX = 16;
    const startY = 16;

    const findFreeSlot = () => {
      for (let slot = 0; slot < notes.length + 100; slot++) {
        const c = slot % cols;
        const r = Math.floor(slot / cols);
        const candX = startX + c * spacingX;
        const candY = startY + r * spacingY;
        if (!isColliding(candX, candY)) {
          return { x: candX, y: candY };
        }
      }
      return { x: startX, y: startY };
    };

    notes.forEach((note) => {
      const curX = note.posX ?? 24;
      const curY = note.posY ?? 24;
      if (isColliding(curX, curY)) {
        const free = findFreeSlot();
        occupiedSlots.push({ id: note.id, x: free.x, y: free.y });
        notesToMove.push({ id: note.id, newX: free.x, newY: free.y });
      } else {
        occupiedSlots.push({ id: note.id, x: curX, y: curY });
      }
    });

    if (notesToMove.length > 0) {
      resolvedOverlapsRef.current = true;
      useNoteStore.setState((state) => ({
        notes: state.notes.map((n) => {
          const move = notesToMove.find((m) => m.id === n.id);
          return move ? { ...n, posX: move.newX, posY: move.newY } : n;
        }),
      }));
      notesToMove.forEach(({ id, newX, newY }) => {
        updateNote(id, { posX: newX, posY: newY }).catch(() => { });
      });
    }
  }, [notes, updateNote]);

  // Ref to suppress resetting scroll to (0,0) when focusing a newly created/saved note
  const isFocusingSavedNoteRef = useRef(false);

  // Automatically focus newly created note from other views (ensures note is in view while keeping left notes visible)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const focusNoteId = sessionStorage.getItem('secure_note_focus_note_id');
    if (!focusNoteId || notes.length === 0) return;

    const targetNote = notes.find((n) => n.id === focusNoteId);
    if (targetNote) {
      sessionStorage.removeItem('secure_note_focus_note_id');
      isFocusingSavedNoteRef.current = true;
      setTimeout(() => {
        isFocusingSavedNoteRef.current = false;
      }, 2500);

      bringToFront(targetNote.id);
      setFocusedNoteId(targetNote.id);
      setHighlightedNoteId(targetNote.id);

      // Perform smooth scroll immediately and with backups after container layout settles
      ensureNoteInView(targetNote);
      const timer1 = setTimeout(() => {
        ensureNoteInView(targetNote);
      }, 120);
      const timer2 = setTimeout(() => {
        ensureNoteInView(targetNote);
      }, 350);

      // Dismiss subtle highlight and focus cleanly within 0.50s (500ms)
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
      highlightTimerRef.current = setTimeout(() => {
        setHighlightedNoteId(null);
      }, 500);

      if (focusTimerRef.current) clearTimeout(focusTimerRef.current);
      focusTimerRef.current = setTimeout(() => {
        setFocusedNoteId((curr) => (curr === targetNote.id ? null : curr));
      }, 500);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        if (highlightTimerRef.current) {
          clearTimeout(highlightTimerRef.current);
          setHighlightedNoteId(null);
        }
        if (focusTimerRef.current) {
          clearTimeout(focusTimerRef.current);
          setFocusedNoteId((curr) => (curr === targetNote.id ? null : curr));
        }
      };
    }
  }, [notes, bringToFront, ensureNoteInView]);

  // Automatically scroll to top-left when board changes (except when focusing a newly created/saved note)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (sessionStorage.getItem('secure_note_focus_note_id') || isFocusingSavedNoteRef.current) {
        return;
      }
    }
    if (canvasContainerRef.current) {
      canvasContainerRef.current.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }
  }, [activeBoardId]);

  // Handle drag and drop coordinates saving without artificial boundary clamping
  const handleDragEnd = async (id: string, x: number, y: number) => {
    const freeX = Math.max(0, Math.round(x));
    const freeY = Math.max(0, Math.round(y));

    // Check if the dragged item is a note with attached stickers
    const targetNote = notes.find((n) => n.id === id);
    const stickerUpdates: { id: string; posX: number; posY: number }[] = [];

    if (targetNote && !isStickerNote(targetNote) && targetNote.posX != null && targetNote.posY != null) {
      const dx = freeX - targetNote.posX;
      const dy = freeY - targetNote.posY;
      if (dx !== 0 || dy !== 0) {
        const attachedStickers = getNoteStickers(targetNote.id, notes);
        attachedStickers.forEach((stk) => {
          if (stk.posX != null && stk.posY != null) {
            stickerUpdates.push({
              id: stk.id,
              posX: Math.round(stk.posX + dx),
              posY: Math.round(stk.posY + dy),
            });
          }
        });
      }
    }

    // Optimistically update store immediately so the note and attached stickers stay locked in place with zero bounce
    useNoteStore.setState((state) => ({
      notes: state.notes.map((n) => {
        if (n.id === id) return { ...n, posX: freeX, posY: freeY };
        const stkMatch = stickerUpdates.find((u) => u.id === n.id);
        if (stkMatch) return { ...n, posX: stkMatch.posX, posY: stkMatch.posY };
        return n;
      }),
    }));

    try {
      await updateNote(id, { posX: freeX, posY: freeY });
      if (stickerUpdates.length > 0) {
        await Promise.all(
          stickerUpdates.map((u) => updateNote(u.id, { posX: u.posX, posY: u.posY }))
        );
      }
    } catch (e) {
      console.error('Failed to save note position:', e);
    }
  };

  // Start connecting mode from a source note
  const handleStartConnect = (sourceId: string) => {
    if (connectingSourceId === sourceId) {
      setConnectingSourceId(null);
    } else {
      setConnectingSourceId(sourceId);
      toast('คลิกที่โน้ตปลายทางที่ต้องการโยงลูกศร', { icon: '🔗' });
    }
  };

  // Complete connection to target note
  const handleTargetConnect = async (targetId: string) => {
    if (!connectingSourceId) return;

    if (connectingSourceId === targetId) {
      setConnectingSourceId(null);
      return;
    }

    if (!activeBoardId) {
      toast.error('กรุณาเลือกบอร์ดก่อนเชื่อมต่อ');
      setConnectingSourceId(null);
      return;
    }

    await createConnection({
      sourceId: connectingSourceId,
      targetId,
      boardId: activeBoardId,
      label: 'เชื่อมโยง',
      color: '#6366F1',
    });

    setConnectingSourceId(null);
  };

  // Smart slot finder: finds nearest empty grid slot that doesn't overlap any existing note with proper spacing
  const findNextAvailableSlot = () => {
    const spacingX = 285;
    const spacingY = 295;
    const startX = 16;
    const startY = 16;
    // Support 7 notes horizontally across the board before going down to the next row
    const cols = 7;

    const isSlotOccupied = (candX: number, candY: number, candW = 260, candH = 260) => {
      const margin = 16;
      // 1. Check against all existing notes on the board
      const noteCollision = notes.some((n) => {
        const nx = n.posX ?? startX;
        const ny = n.posY ?? startY;
        const nw = n.width ?? 260;
        const nh = n.height ?? 260;
        return (
          candX < nx + nw + margin &&
          candX + candW + margin > nx &&
          candY < ny + nh + margin &&
          candY + candH + margin > ny
        );
      });
      if (noteCollision) return true;

      // 2. Check against pending reservations to prevent race conditions during rapid clicks
      const pendingCollision = pendingSlotsRef.current.some((p) => {
        return (
          candX < p.x + 260 + margin &&
          candX + candW + margin > p.x &&
          candY < p.y + 260 + margin &&
          candY + candH + margin > p.y
        );
      });
      return pendingCollision;
    };

    // Scan slots row by row
    for (let slot = 0; slot < notes.length + 100; slot++) {
      const col = slot % cols;
      const row = Math.floor(slot / cols);
      const candX = startX + col * spacingX;
      const candY = startY + row * spacingY;

      if (!isSlotOccupied(candX, candY)) {
        pendingSlotsRef.current.push({ x: candX, y: candY });
        setTimeout(() => {
          pendingSlotsRef.current = pendingSlotsRef.current.filter((p) => p.x !== candX || p.y !== candY);
        }, 5000);
        return { x: candX, y: candY };
      }
    }

    return { x: startX, y: startY };
  };

  // Quick add sticky note directly onto the active board with proper spacing, bring to front, and auto-focus
  const handleQuickAdd = async (color?: string) => {
    const targetBoard = activeBoard || boards.find((b) => b.isDefault) || boards[0];
    const currentCount = targetBoard ? getBoardNoteCount(targetBoard) : notes.filter((n) => !n.isArchived).length;
    if (currentCount >= MAX_NOTES_PER_BOARD) {
      toast.error('Board นี้มีครบ 56 Notes แล้ว กรุณาสร้าง Board ใหม่เพื่อเพิ่ม Note');
      return;
    }

    const noteColor = color || getRandomNoteColor();
    const { x, y } = findNextAvailableSlot();
    const targetBoardId = targetBoard?.id || undefined;

    let newNote;
    try {
      newNote = await createNote({
        title: 'โน้ตใหม่',
        content: '',
        color: noteColor,
        textColor: '#0F172A',
        fontSize: 'normal',
        fontFamily: 'sans',
        kanbanStatus: 'todo',
        rotation: 0,
        posX: x,
        posY: y,
        isPinned: false,
        boardId: targetBoardId,
      });
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Board นี้มีครบ 56 Notes แล้ว กรุณาสร้าง Board ใหม่เพื่อเพิ่ม Note');
      return;
    }

    if (newNote?.id) {
      bringToFront(newNote.id);
      setFocusedNoteId(newNote.id);
      setHighlightedNoteId(newNote.id);

      // Smoothly scroll ONLY if the note is outside current viewport (keeps screen completely calm and still if already visible)
      const container = canvasContainerRef.current;
      if (container) {
        const noteLeft = (newNote.posX ?? 24) * zoom;
        const noteTop = (newNote.posY ?? 24) * zoom;
        const noteRight = noteLeft + 260 * zoom;
        const noteBottom = noteTop + 260 * zoom;

        const viewLeft = container.scrollLeft;
        const viewTop = container.scrollTop;
        const viewRight = viewLeft + container.clientWidth;
        const viewBottom = viewTop + container.clientHeight;

        const isFullyVisible =
          noteLeft >= viewLeft &&
          noteRight <= viewRight &&
          noteTop >= viewTop &&
          noteBottom <= viewBottom;

        if (!isFullyVisible) {
          container.scrollTo({
            left: Math.max(0, noteLeft - 48),
            top: Math.max(0, noteTop - 48),
            behavior: 'smooth',
          });
        }
      }

      setTimeout(() => {
        const el = document.getElementById(`note-card-${newNote.id}`);
        if (el) {
          const input = el.querySelector('input[type="text"]') as HTMLInputElement | null;
          if (input) {
            input.focus({ preventScroll: true });
            input.select();
          } else {
            const editable = el.querySelector('[contenteditable="true"]') as HTMLElement | null;
            editable?.focus({ preventScroll: true });
          }
        }
      }, 50);

      // Complete subtle highlight and finish all effects within 0.50 second (500ms)
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
      highlightTimerRef.current = setTimeout(() => {
        setHighlightedNoteId(null);
      }, 400);

      if (focusTimerRef.current) clearTimeout(focusTimerRef.current);
      focusTimerRef.current = setTimeout(() => {
        setFocusedNoteId((curr) => (curr === newNote.id ? null : curr));
      }, 550);
    }
  };

  // Open sticker picker targeted specifically to a note
  const handleOpenStickerForNote = (noteId: string) => {
    setStickerTargetNoteId(noteId);
    setLastActiveNoteId(noteId);
    setFocusedNoteId(noteId);
    setIsStickerModalOpen(true);
  };

  // Quick add sticker directly onto the active board canvas
  const handleSelectSticker = async (sticker: BoardStickerItem) => {
    const targetBoard = activeBoard || boards.find((b) => b.isDefault) || boards[0];
    const currentCount = targetBoard ? getBoardNoteCount(targetBoard) : notes.filter((n) => !n.isArchived).length;
    if (currentCount >= MAX_NOTES_PER_BOARD) {
      toast.error('Board นี้มีครบ 56 Notes แล้ว กรุณาสร้าง Board ใหม่เพื่อเพิ่ม Note');
      return;
    }

    const targetBoardId = targetBoard?.id || undefined;
    const slot = findNextAvailableSlot();

    const stickerWidth = sticker.defaultWidth || 140;
    const stickerHeight = sticker.defaultHeight || 140;

    // Check if opened explicitly from a specific note's menu
    const targetNote = stickerTargetNoteId ? notes.find((n) => n.id === stickerTargetNoteId && !isStickerNote(n)) : null;

    let posX = slot.x;
    let posY = slot.y;
    let encodedContent = encodeStickerContent(sticker.url);

    if (targetNote && targetNote.posX != null && targetNote.posY != null) {
      const noteW = targetNote.width || 260;
      posX = Math.round(targetNote.posX + noteW - stickerWidth * 0.7);
      posY = Math.round(targetNote.posY - stickerHeight * 0.3);
      encodedContent = encodeStickerContent(sticker.url, {
        attachedToNoteId: targetNote.id,
        offsetX: posX - targetNote.posX,
        offsetY: posY - targetNote.posY,
      });
    }

    let newNote;
    try {
      newNote = await createNote({
        title: '[STICKER]',
        content: encodedContent,
        color: '#FFFFFF',
        textColor: '#0F172A',
        width: stickerWidth,
        height: stickerHeight,
        rotation: 0,
        posX,
        posY,
        isPinned: false,
        boardId: targetBoardId,
      });
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Board นี้มีครบ 56 Notes แล้ว กรุณาสร้าง Board ใหม่เพื่อเพิ่ม Note');
      return;
    }

    if (newNote?.id) {
      bringToFront(newNote.id);
      setFocusedNoteId(newNote.id);
      setHighlightedNoteId(newNote.id);
      setStickerTargetNoteId(null);
      toast.success(
        targetNote
          ? `📌 ดูดติดสติกเกอร์กับโน้ต "${targetNote.title || 'ไม่มีชื่อ'}" แล้ว`
          : `แปะ ${sticker.thName} บนกระดานแล้ว`,
        { icon: '✨' }
      );
    }
  };

  // Auto-arrange all notes in a neat grid according to selected SortOption
  const handleAutoArrange = async (newSortOption?: SortOption) => {
    // 1. Separate real notes from stickers
    const realNotes = notes.filter((n) => !isStickerNote(n));
    const stickers = notes.filter((n) => isStickerNote(n));

    if (realNotes.length === 0) {
      toast('ไม่มีโน้ตบนกระดานให้จัดเรียง', { icon: 'ℹ️' });
      return;
    }

    const targetSort = newSortOption || sortBy;
    if (newSortOption) {
      setSortBy(newSortOption);
    }

    setIsArranging(true);
    const spacingX = 290;
    const spacingY = 300;
    const startX = 24;
    const startY = 24;
    // Support 7 notes horizontally across the board
    const cols = 7;

    // Sort notes by selected sort option (pinned always first)
    const sortedNotes = sortNotes(realNotes, targetSort);

    // Map each note's delta
    const noteDeltas = new Map<string, { dx: number; dy: number }>();
    const noteUpdates = sortedNotes.map((n, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const newX = startX + col * spacingX;
      const newY = startY + row * spacingY;
      const oldX = n.posX ?? 0;
      const oldY = n.posY ?? 0;
      noteDeltas.set(n.id, { dx: newX - oldX, dy: newY - oldY });
      return { id: n.id, posX: newX, posY: newY };
    });

    // 2. Compute updates ONLY for stickers explicitly attached to a note
    const stickerUpdates: { id: string; posX: number; posY: number }[] = [];
    stickers.forEach((stk) => {
      const meta = getStickerMetadata(stk);
      const targetNoteId = meta.attachedToNoteId || meta.anchorId;

      if (targetNoteId && noteDeltas.has(targetNoteId)) {
        const delta = noteDeltas.get(targetNoteId)!;
        const newStkX = Math.round((stk.posX ?? 0) + delta.dx);
        const newStkY = Math.round((stk.posY ?? 0) + delta.dy);
        stickerUpdates.push({ id: stk.id, posX: newStkX, posY: newStkY });
      }
      // Freeboard stickers without attachedToNoteId remain in place!
    });

    const allUpdates = [...noteUpdates, ...stickerUpdates];

    // Optimistic local state update for instant, smooth animation
    useNoteStore.setState((state) => ({
      notes: state.notes.map((n) => {
        const match = allUpdates.find((u) => u.id === n.id);
        return match ? { ...n, posX: match.posX, posY: match.posY } : n;
      }),
    }));

    try {
      await Promise.all(
        allUpdates.map((u) => updateNote(u.id, { posX: u.posX, posY: u.posY }))
      );
      const sortMeta = SORT_OPTIONS.find((o) => o.value === targetSort);
      toast.success(`จัดเรียงโน้ตตาม: ${sortMeta?.label || 'ลำดับ'} เรียบร้อยแล้ว`);
      if (canvasContainerRef.current) {
        canvasContainerRef.current.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      }
    } catch (err) {
      console.error('Failed to auto-arrange notes:', err);
      toast.error('จัดเรียงโน้ตไม่สำเร็จ');
    } finally {
      setIsArranging(false);
    }
  };

  // Create new board with randomized background (from wallpapers or patterns) and vibrant tab color
  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoardName.trim()) return;

    // 60% chance to pick a curated wallpaper, 40% chance to pick a textured pattern
    const useWallpaper = Math.random() > 0.4;
    let randomTheme = 'cork';
    let randomBgImage: string | null = null;

    if (useWallpaper && CURATED_WALLPAPERS && CURATED_WALLPAPERS.length > 0) {
      const randomWp = CURATED_WALLPAPERS[Math.floor(Math.random() * CURATED_WALLPAPERS.length)];
      randomTheme = 'custom';
      randomBgImage = randomWp.url;
    } else if (BOARD_PATTERNS && BOARD_PATTERNS.length > 0) {
      const randomPattern = BOARD_PATTERNS[Math.floor(Math.random() * BOARD_PATTERNS.length)];
      randomTheme = randomPattern.id;
    }

    const randomColor = TAB_COLORS[Math.floor(Math.random() * TAB_COLORS.length)];

    try {
      await createBoard({
        name: newBoardName.trim(),
        color: newBoardColor || randomColor,
        theme: randomTheme,
        bgImage: randomBgImage,
      });
      setNewBoardName('');
      setIsAddBoardModalOpen(false);
      toast.success('สร้างบอร์ดใหม่พร้อมสุ่มพื้นหลังเรียบร้อยแล้ว!');
    } catch (err) {
      console.error(err);
      toast.error('สร้างบอร์ดไม่สำเร็จ');
    }
  };

  // Save board edit
  const handleSaveBoardEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBoard || !editBoardName.trim()) return;

    try {
      await updateBoard(editingBoard.id, {
        name: editBoardName.trim(),
        color: editBoardColor,
      });
      setEditingBoard(null);
    } catch (err) {
      console.error(err);
      toast.error('อัปเดตบอร์ดไม่สำเร็จ');
    }
  };

  // Delete board confirmation or clear all notes if default board
  const handleDeleteBoard = async (board: Board) => {
    if (board.isDefault) {
      if (confirm(`คุณต้องการลบโน้ตทั้งหมดบน "${board.name}" ใช่หรือไม่?\n(โน้ตทั้งหมดบนกระดานนี้จะถูกย้ายไปที่ถังขยะ แต่ตัวกระดานหลักจะยังคงอยู่)`)) {
        await deleteBoard(board.id);
        setEditingBoard(null);
      }
      return;
    }
    if (confirm(`คุณต้องการลบบอร์ด "${board.name}" ใช่หรือไม่?\n(โน้ตทั้งหมดในบอร์ดนี้จะถูกย้ายไปที่ถังขยะ)`)) {
      await deleteBoard(board.id);
      setEditingBoard(null);
    }
  };

  const openEditBoardModal = (b: Board, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingBoard(b);
    setEditBoardName(b.name);
    setEditBoardColor(b.color || TAB_COLORS[0]);
  };

  // Background styling based on board theme or custom image
  const getBoardStyle = () => {
    if (activeBoard?.bgImage) {
      return {
        backgroundImage: `url('${activeBoard.bgImage}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      };
    }

    const currentThemeId = activeBoard?.theme || cachedTheme;
    if (currentThemeId) {
      const pattern = BOARD_PATTERNS.find((p) => p.id === currentThemeId);
      if (pattern) {
        return pattern.style;
      }
    }

    // Neutral subtle canvas fallback to prevent flashing cork on load/refresh
    return {
      backgroundColor: '#f8fafc',
      backgroundImage: 'radial-gradient(#cbd5e1 1.2px, transparent 1.2px)',
      backgroundSize: '24px 24px',
    };
  };

  return (
    <div className="flex-1 w-full h-full min-h-0 flex flex-col rounded-none border-0 shadow-none overflow-hidden animate-fade-in relative select-none">
      {/* ── TOP SECTION 1: Multi-Board Tabs Bar (Note Board style / Mobile Dropdown) ── */}
      <div className="bg-slate-100/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 px-3 sm:px-4 pt-2 pb-1.5 flex items-center justify-between gap-2 overflow-visible select-none z-30 relative">
        {/* Mobile Dropdown Board Selector (md:hidden) */}
        <div className="relative md:hidden flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsBoardDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 shadow-sm border border-slate-200 dark:border-slate-700 active:scale-95 transition"
            title="คลิกเพื่อเลือกกระดาน หรือ เพิ่มกระดานใหม่"
          >
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
              style={{ backgroundColor: activeBoard?.color || '#4F46E5' }}
            />
            <span className="max-w-[130px] truncate">{activeBoard?.name || 'กระดานหลัก'}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold transition ${
                (activeBoard ? getBoardNoteCount(activeBoard) : 0) >= MAX_NOTES_PER_BOARD
                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
              }`}
            >
              {activeBoard ? `${getBoardNoteCount(activeBoard)} / ${MAX_NOTES_PER_BOARD}` : `0 / ${MAX_NOTES_PER_BOARD}`}
            </span>
            <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${isBoardDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isBoardDropdownOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsBoardDropdownOpen(false)}
              />
              {/* Dropdown Menu */}
              <div className="absolute left-0 top-full mt-1.5 w-60 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-1.5 z-50 animate-in fade-in zoom-in-95 space-y-1">
                <p className="text-[10px] font-bold text-slate-400 px-2.5 py-1 uppercase tracking-wider">เลือกกระดาน</p>
                <div className="max-h-60 overflow-y-auto space-y-1">
                  {boards.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        setActiveBoardId(b.id);
                        setIsBoardDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition ${b.id === activeBoardId
                          ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-200'
                        }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                          style={{ backgroundColor: b.color || '#4F46E5' }}
                        />
                        <span className="truncate">{b.name}</span>
                      </div>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold transition ${
                          getBoardNoteCount(b) >= MAX_NOTES_PER_BOARD
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                        }`}
                      >
                        {getBoardNoteCount(b)} / {MAX_NOTES_PER_BOARD}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="border-t border-slate-200/80 dark:border-slate-700 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsBoardDropdownOpen(false);
                      setNewBoardColor(TAB_COLORS[Math.floor(Math.random() * TAB_COLORS.length)]);
                      setIsAddBoardModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-xl transition"
                  >
                    <Plus size={14} className="stroke-[2.5]" />
                    <span>+ เพิ่มกระดานใหม่</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Desktop Multi-Board Tabs (hidden md:flex) */}
        <div className="hidden md:flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {boards.map((b) => {
            const isActive = b.id === activeBoardId;
            return (
              <div
                key={b.id}
                onClick={() => setActiveBoardId(b.id)}
                onDoubleClick={(e) => openEditBoardModal(b, e)}
                className={`group relative flex items-center gap-2 px-3.5 py-1.5 rounded-t-xl text-xs font-bold cursor-pointer transition-all shrink-0 border-t-2 ${isActive
                    ? 'bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-white'
                    : 'bg-slate-200/60 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                style={{
                  borderTopColor: b.color || '#4F46E5',
                }}
                title="คลิกเพื่อเลือกบอร์ด / ดับเบิ้ลคลิกเพื่อเปลี่ยนชื่อ"
              >
                {/* Dot color indicator */}
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: b.color || '#4F46E5' }}
                />
                <span
                  className="max-w-[120px] truncate cursor-pointer select-none"
                  onDoubleClick={(e) => openEditBoardModal(b, e)}
                >
                  {b.name}
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold transition ${
                    getBoardNoteCount(b) >= MAX_NOTES_PER_BOARD
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {getBoardNoteCount(b)} / {MAX_NOTES_PER_BOARD}
                </span>

                {/* Edit board button */}
                <button
                  onClick={(e) => openEditBoardModal(b, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
                  title="ตั้งค่าบอร์ด (เปลี่ยนชื่อ/สี)"
                >
                  <Edit2 size={12} />
                </button>
              </div>
            );
          })}

          {/* Add Board Tab Button */}
          <button
            onClick={() => {
              setNewBoardColor(TAB_COLORS[Math.floor(Math.random() * TAB_COLORS.length)]);
              setIsAddBoardModalOpen(true);
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-t-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition shrink-0 border-t-2 border-transparent"
          >
            <Plus size={14} />
            <span>+ บอร์ดใหม่</span>
          </button>
        </div>

        {/* Right side controls in Header (Active Board Info) */}
        <div className="flex items-center gap-2 shrink-0 pb-1">
          {/* Active Board Toolbar Info & Edit / Delete */}
          {activeBoard && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 bg-slate-200/50 dark:bg-slate-800/50 px-2.5 py-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
              <span
                onDoubleClick={(e) => openEditBoardModal(activeBoard, e)}
                className="cursor-pointer select-none truncate max-w-[120px]"
                title="ดับเบิ้ลคลิกเพื่อเปลี่ยนชื่อบอร์ด"
              >
                กำลังดู: <b className="text-slate-800 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline">{activeBoard.name}</b>
              </span>
              <button
                onClick={(e) => openEditBoardModal(activeBoard, e)}
                className="p-0.5 hover:bg-slate-300/50 dark:hover:bg-slate-700 rounded text-slate-500 hover:text-indigo-600 transition"
                title="แก้ไขชื่อและสีบอร์ดปัจจุบัน (หรือดับเบิ้ลคลิกที่ชื่อ)"
              >
                <Edit2 size={12} />
              </button>
              <button
                onClick={() => handleDeleteBoard(activeBoard)}
                className="p-0.5 hover:bg-rose-100 dark:hover:bg-rose-950/60 rounded text-slate-400 hover:text-rose-600 transition"
                title={activeBoard.isDefault ? `ลบโน้ตทั้งหมดบนกระดานหลัก (ย้ายลงถังขยะ)` : `ลบบอร์ด "${activeBoard.name}" (ย้ายโน้ตลงถังขยะ)`}
              >
                <Trash2 size={12} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── TOP SECTION 2: Control Toolbar (Freeform Canvas Only - Docked cleanly beneath tabs) ── */}
      {boardViewMode === 'freeform' && (
        <div className="w-full shrink-0 z-20 flex items-center justify-between gap-2 sm:gap-3 px-2.5 sm:px-4 py-1.5 sm:py-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-xs">
          {/* Quick Add Sticky Note Buttons - 4 Circular Buttons with Plus */}
          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => handleQuickAdd('#FEF08A')}
              className="w-8 h-8 rounded-full bg-[#FEF08A] hover:bg-amber-300 text-amber-950 flex items-center justify-center shadow-sm border border-amber-400/40 transition active:scale-90 shrink-0"
              title="แปะโน้ตสีเหลือง"
              aria-label="แปะโน้ตสีเหลือง"
            >
              <Plus size={17} className="stroke-[2.5]" />
            </button>
            <button
              type="button"
              onClick={() => handleQuickAdd('#FBCFE8')}
              className="w-8 h-8 rounded-full bg-[#FBCFE8] hover:bg-pink-300 text-pink-950 flex items-center justify-center shadow-sm border border-pink-400/40 transition active:scale-90 shrink-0"
              title="แปะโน้ตสีชมพู"
              aria-label="แปะโน้ตสีชมพู"
            >
              <Plus size={17} className="stroke-[2.5]" />
            </button>
            <button
              type="button"
              onClick={() => handleQuickAdd('#BBF7D0')}
              className="w-8 h-8 rounded-full bg-[#BBF7D0] hover:bg-emerald-300 text-emerald-950 flex items-center justify-center shadow-sm border border-emerald-400/40 transition active:scale-90 shrink-0"
              title="แปะโน้ตสีเขียว"
              aria-label="แปะโน้ตสีเขียว"
            >
              <Plus size={17} className="stroke-[2.5]" />
            </button>
            <button
              type="button"
              onClick={() => handleQuickAdd('#BAE6FD')}
              className="w-8 h-8 rounded-full bg-[#BAE6FD] hover:bg-sky-300 text-sky-950 flex items-center justify-center shadow-sm border border-sky-400/40 transition active:scale-90 shrink-0"
              title="แปะโน้ตสีฟ้า"
              aria-label="แปะโน้ตสีฟ้า"
            >
              <Plus size={17} className="stroke-[2.5]" />
            </button>
            <button
              type="button"
              onClick={() => handleQuickAdd()}
              className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-200 via-pink-200 to-sky-200 hover:from-amber-300 hover:via-pink-300 hover:to-sky-300 text-slate-800 flex items-center justify-center shadow-sm border border-slate-300/60 transition active:scale-90 shrink-0"
              title="แปะโน้ตสุ่มสี (พาสเทลอ่านง่าย)"
              aria-label="แปะโน้ตสุ่มสี"
            >
              <Sparkles size={15} className="text-indigo-600" />
            </button>

            {/* + โน้ตใหม่ - Desktop only (Mobile has bottom-right FAB) */}
            <button
              onClick={() => {
                const targetBoard = activeBoard || boards.find((b) => b.isDefault) || boards[0];
                const currentCount = targetBoard ? getBoardNoteCount(targetBoard) : notes.filter((n) => !n.isArchived).length;
                if (currentCount >= MAX_NOTES_PER_BOARD) {
                  toast.error('Board นี้มีครบ 56 Notes แล้ว กรุณาสร้าง Board ใหม่เพื่อเพิ่ม Note');
                  return;
                }
                const url = activeBoardId ? `/notes/new?boardId=${activeBoardId}` : '/notes/new';
                router.push(url);
              }}
              className="hidden md:flex px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-full text-xs items-center gap-1.5 shadow-md shadow-indigo-500/25 transition-all duration-200 active:scale-95 shrink-0"
              title="สร้างโน้ตใหม่"
            >
              <Plus size={15} className="stroke-[2.5]" />
              <span>โน้ตใหม่</span>
            </button>

            {/* Board Full Banner Warning */}
            {(activeBoard ? getBoardNoteCount(activeBoard) : notes.filter((n) => !n.isArchived).length) >= MAX_NOTES_PER_BOARD && (
              <span className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 shrink-0 animate-pulse">
                <span>⚠️ Board นี้มีครบ 56 Notes แล้ว กรุณาสร้าง Board ใหม่เพื่อเพิ่ม Note</span>
              </span>
            )}
          </div>

          {/* Right Tools: Share Board, Freeform mode, Change Background */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Share Board Button */}
            {activeBoard && (
              <button
                onClick={() => setIsShareModalOpen(true)}
                className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition active:scale-95"
                title="แชร์กระดานนี้ให้ผู้อื่น (แก้ไขเรียลไทม์ หรือ ดูอย่างเดียว)"
              >
                <Share2 size={13} />
                <span className="hidden sm:inline">แชร์บอร์ด</span>
              </button>
            )}

            {/* Change Background Button */}
            <button
              onClick={() => setIsBackgroundModalOpen(true)}
              className="px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs border border-slate-200 dark:border-slate-700 transition active:scale-95"
              title="เปลี่ยนพื้นหลังและลวดลายกระดาน"
            >
              <Palette size={14} className="text-indigo-600 dark:text-indigo-400" />
              <span className="hidden sm:inline">เปลี่ยนพื้นหลัง</span>
            </button>

            {/* Board Stickers Button */}
            <button
              onClick={() => setIsStickerModalOpen(true)}
              className="px-2.5 py-1.5 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs border border-amber-200 dark:border-amber-800/60 transition active:scale-95"
              title="แปะสติกเกอร์, ลูกศร, ไอเดีย และสัญลักษณ์ตกแต่งบนกระดาน"
            >
              <Sparkles size={14} className="text-amber-500 animate-pulse" />
              <span className="hidden sm:inline">สติกเกอร์</span>
            </button>
          </div>
        </div>
      )}

      {/* ── CONNECTION IN PROGRESS BANNER ── */}
      {connectingSourceId && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 bg-indigo-600 text-white px-4 py-2 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-bold animate-bounce">
          <Link2 size={16} />
          <span>🔗 โหมดเชื่อมต่อโน้ต: คลิกที่โน้ตปลายทางเพื่อเชื่อมโยงเส้นลูกศร</span>
          <button
            onClick={() => setConnectingSourceId(null)}
            className="px-2 py-0.5 bg-white/20 hover:bg-white/30 rounded-lg text-white"
          >
            ยกเลิก
          </button>
        </div>
      )}

      {/* ── MAIN SURFACE: Freeform Canvas OR Kanban View ── */}
      {boardViewMode === 'kanban' ? (
        <div className="flex-1 w-full h-full overflow-hidden">
          <KanbanView notes={notes} onUnlockRequest={() => setIsVaultModalOpen(true)} />
        </div>
      ) : (
        <div
          ref={canvasContainerRef}
          style={getBoardStyle()}
          onDoubleClick={handleCanvasDoubleClick}
          onClick={(e) => {
            const target = e.target as HTMLElement | null;
            if (
              target === e.currentTarget ||
              target?.id === 'sticky-board-canvas' ||
              target?.classList.contains('board-canvas-container')
            ) {
              setFocusedNoteId(null);
              setHighlightedNoteId(null);
              if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
              if (focusTimerRef.current) clearTimeout(focusTimerRef.current);
            }
          }}
          className="flex-1 w-full h-full min-h-0 overflow-auto relative p-0 cursor-default board-canvas-container"
        >
          {/* Zoom Wrapper to allow accurate container scrolling */}
          <div
            ref={zoomWrapperRef}
            style={{
              width: `${Math.round((parseInt(dynamicCanvasSize.minWidth) || 2200) * zoom)}px`,
              height: `${Math.round((parseInt(dynamicCanvasSize.minHeight) || 1600) * zoom)}px`,
            }}
          >
            <div
              id="sticky-board-canvas"
              ref={canvasElementRef}
              style={{
                ...dynamicCanvasSize,
                transform: `translate3d(0, 0, 0) scale(${zoom})`,
                transformOrigin: 'top left',
                transition: isPinching ? 'none' : 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1)',
                willChange: isPinching ? 'transform' : 'auto',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
              }}
              className="relative"
            >
              {/* SVG Visual Connection Lines Canvas */}
              <NoteConnectionCanvas
                connections={connections.filter((c) => !activeBoardId || c.boardId === activeBoardId)}
                notes={notes}
              />

              {/* Sticky Notes & Canvas Stickers */}
              {notes.map((note, idx) =>
                isStickerNote(note) ? (
                  <StickyStickerItem
                    key={note.id}
                    note={note}
                    zoom={zoom}
                    onDragEnd={handleDragEnd}
                    onBringToFront={() => handleNoteFocus(note.id)}
                    customZIndex={noteZIndices[note.id]}
                    isFocused={focusedNoteId === note.id}
                    onZoomToSticker={handleZoomToSticker}
                  />
                ) : (
                  <StickyNoteItem
                    key={note.id}
                    note={note}
                    index={idx}
                    zoom={zoom}
                    onDragEnd={handleDragEnd}
                    onUnlockRequest={() => setIsVaultModalOpen(true)}
                    onStartConnect={handleStartConnect}
                    onTargetConnect={handleTargetConnect}
                    onOpenFullscreen={handleOpenFullscreen}
                    isConnectingSource={connectingSourceId === note.id}
                    isConnectingMode={!!connectingSourceId}
                    onBringToFront={() => handleNoteFocus(note.id)}
                    customZIndex={noteZIndices[note.id]}
                    isFocused={focusedNoteId === note.id}
                    isHighlighted={highlightedNoteId === note.id}
                    onQuickPeek={handleOpenQuickPeek}
                    onQuickPeekClose={handleScheduleCloseQuickPeek}
                    onOpenStickerModal={() => handleOpenStickerForNote(note.id)}
                    onZoomToNote={handleZoomToNote}
                  />
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Zoom-Out Quick Peek Reader (Hover on Desktop, Tap on Mobile/iPad) ── */}
      {quickPeekNote && (
        <NoteQuickPeek
          note={quickPeekNote}
          anchorRect={quickPeekAnchor}
          onMouseEnter={handleCancelCloseQuickPeek}
          onMouseLeave={handleScheduleCloseQuickPeek}
          onClose={() => {
            setQuickPeekNote(null);
            setQuickPeekAnchor(null);
          }}
          onEdit={(n) => {
            setQuickPeekNote(null);
            setQuickPeekAnchor(null);
            router.push(`/notes/${n.id}`);
          }}
          onFullscreen={(n) => {
            setQuickPeekNote(null);
            setQuickPeekAnchor(null);
            handleOpenFullscreen(n);
          }}
        />
      )}

      {/* ── Center Zoom Indicator (Big overlay as in video zoom.mp4) ── */}
      {isZoomOverlayVisible && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none animate-fade-in select-none">
          <div className="bg-black/75 dark:bg-slate-900/90 backdrop-blur-md text-white px-8 py-3.5 rounded-2xl shadow-2xl border border-white/20 text-2xl sm:text-3xl font-mono font-black tracking-wider flex items-center justify-center">
            <span id="zoom-overlay-text">ZOOM: {Math.round(zoom * 100)}%</span>
          </div>
        </div>
      )}

      {/* ── Floating Zoom Controller Bar (Right-side widget as in zoom.mp4, desktop/tablet only) ── */}
      {boardViewMode === 'freeform' && (
        <div className="hidden md:flex absolute right-6 md:max-lg:right-24 bottom-6 md:max-lg:bottom-20 z-30 items-center gap-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-1.5 px-2.5 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 select-none animate-fade-in">
          {/* 100% Reset Button */}
          <button
            type="button"
            onClick={() => handleZoomChange(1.0)}
            className={`px-2.5 py-1 text-xs font-mono font-bold rounded-xl transition active:scale-95 flex items-center justify-center min-w-[52px] shadow-xs ${Math.round(zoom * 100) === 100
                ? 'bg-indigo-600 text-white shadow-indigo-500/20'
                : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
              }`}
            title="คลิกเพื่อรีเซ็ตขนาดการซูมเป็น 100%"
          >
            {Math.round(zoom * 100)}%
          </button>

          {/* Zoom Out (-) Button */}
          <button
            type="button"
            onClick={() => handleZoomChange(zoom - 0.1)}
            disabled={zoom <= 0.15}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-slate-700 dark:text-slate-200 transition active:scale-90"
            title="ซูมออก (-10%)"
          >
            <Minus size={15} />
          </button>

          {/* Zoom Slider */}
          <input
            type="range"
            min="15"
            max="300"
            step="5"
            value={Math.round(zoom * 100)}
            onChange={(e) => handleZoomChange(Number(e.target.value) / 100)}
            className="w-24 sm:w-32 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            title={`ระดับการซูม: ${Math.round(zoom * 100)}%`}
          />

          {/* Zoom In (+) Button */}
          <button
            type="button"
            onClick={() => handleZoomChange(zoom + 0.1)}
            disabled={zoom >= 3.0}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-slate-700 dark:text-slate-200 transition active:scale-90"
            title="ซูมเข้า (+10%)"
          >
            <Plus size={15} />
          </button>
        </div>
      )}

      {/* ── MODAL: Create New Board ── */}
      {isAddBoardModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderPlus className="text-indigo-600" size={20} />
                <h3 className="font-bold text-slate-900 dark:text-white">เพิ่มกระดานโน้ตใหม่</h3>
              </div>
              <button
                onClick={() => setIsAddBoardModalOpen(false)}
                className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateBoard} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                  ชื่อกระดาน (Board Name)
                </label>
                <input
                  type="text"
                  value={newBoardName}
                  onChange={(e) => setNewBoardName(e.target.value)}
                  placeholder="เช่น หุ้นและพอร์ตลงทุน, แผนงานด่วน..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                  สีของแท็บกระดาน
                </label>
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  {TAB_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewBoardColor(color)}
                      style={{ backgroundColor: color }}
                      className="w-6 h-6 rounded-full shadow-sm flex items-center justify-center transition hover:scale-110"
                    >
                      {newBoardColor === color && <Check size={12} className="text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddBoardModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition"
                >
                  สร้างกระดาน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Edit Board Name/Color ── */}
      {editingBoard && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit2 className="text-indigo-600" size={18} />
                <h3 className="font-bold text-slate-900 dark:text-white">ตั้งค่ากระดาน</h3>
              </div>
              <button
                onClick={() => setEditingBoard(null)}
                className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveBoardEdit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                  ชื่อกระดาน
                </label>
                <input
                  type="text"
                  value={editBoardName}
                  onChange={(e) => setEditBoardName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                  สีของแท็บกระดาน
                </label>
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  {TAB_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setEditBoardColor(color)}
                      style={{ backgroundColor: color }}
                      className="w-6 h-6 rounded-full shadow-sm flex items-center justify-center transition hover:scale-110"
                    >
                      {editBoardColor === color && <Check size={12} className="text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                {!editingBoard.isDefault ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteBoard(editingBoard)}
                    className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition flex items-center gap-1"
                  >
                    <Trash2 size={13} />
                    <span>ลบบอร์ด</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleDeleteBoard(editingBoard)}
                    className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition flex items-center gap-1"
                    title="ลบโน้ตทั้งหมดบนกระดานหลักนี้ (ย้ายลงถังขยะ)"
                  >
                    <Trash2 size={13} />
                    <span>ลบโน้ตทั้งหมด</span>
                  </button>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingBoard(null)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition"
                  >
                    บันทึก
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Board Background & Patterns ── */}
      <BoardBackgroundModal
        isOpen={isBackgroundModalOpen}
        onClose={() => setIsBackgroundModalOpen(false)}
        currentTheme={activeBoard?.theme || cachedTheme || 'canvas'}
        currentBgImage={activeBoard?.bgImage || null}
        onSelectTheme={async (themeId) => {
          setCachedTheme(themeId);
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem('secure_note_active_board_theme', themeId);
            } catch (e) { }
          }
          if (activeBoardId) {
            await updateBoard(activeBoardId, { theme: themeId, bgImage: null });
          }
        }}
        onSelectWallpaper={async (url) => {
          if (activeBoardId) {
            await updateBoard(activeBoardId, { bgImage: url });
          }
        }}
      />

      {/* ── MODAL: Board Stickers & Decorators ── */}
      <BoardStickerModal
        isOpen={isStickerModalOpen}
        onClose={() => {
          setIsStickerModalOpen(false);
          setStickerTargetNoteId(null);
        }}
        onSelectSticker={handleSelectSticker}
      />

      {/* ── MODAL: Board Sharing ── */}
      {activeBoard && isShareModalOpen && (
        <BoardShareModal
          board={activeBoard}
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
        />
      )}

      {/* Master Password Modal for unlocking encrypted notes */}
      <MasterPasswordModal
        isOpen={isVaultModalOpen}
        onClose={() => setIsVaultModalOpen(false)}
      />

      {/* Fullscreen Note Focus Modal (เหมือนหน้าคัมบัง) */}
      {fullscreenNote && (
        <FullscreenNoteModal
          note={fullscreenNote}
          isOpen={!!fullscreenNote}
          onClose={() => {
            if (typeof document !== 'undefined' && document.fullscreenElement) {
              document.exitFullscreen?.().catch(() => { });
            }
            setFullscreenNote(null);
            fetchNotes({ isArchived: false });
          }}
        />
      )}
    </div>
  );
}
