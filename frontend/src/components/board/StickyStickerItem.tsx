import React, { useState, useRef, useEffect } from 'react';
import { RotateCw, Trash2, Copy, Pin, ArrowUpRight } from 'lucide-react';
import { Note } from '@/types';
import { useNoteStore } from '@/store/noteStore';
import {
  getStickerUrl,
  getStickerMetadata,
  encodeStickerContent,
  isStickerNote,
} from './stickerData';
import ViewportContextMenu, { ViewportMenuItem } from '../ui/ViewportContextMenu';
import toast from 'react-hot-toast';

interface StickyStickerItemProps {
  note: Note;
  zoom?: number;
  onDragEnd: (id: string, x: number, y: number) => void;
  onBringToFront?: () => void;
  customZIndex?: number;
  isFocused?: boolean;
  isHighlighted?: boolean;
  onZoomToSticker?: (note: Note) => void;
}

type ResizeDirection = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

export default function StickyStickerItem({
  note,
  zoom = 1,
  onDragEnd,
  onBringToFront,
  customZIndex,
  isFocused = false,
  isHighlighted = false,
  onZoomToSticker,
}: StickyStickerItemProps) {
  const { updateNote, deleteNote, createNote } = useNoteStore();
  const allNotes = useNoteStore((state) => state.notes);

  const stickerUrl = getStickerUrl(note);
  const meta = getStickerMetadata(note);
  const attachedToNoteId = meta.attachedToNoteId || meta.anchorId;

  // Find all real notes on this board
  const realNotes = allNotes.filter(
    (n) => !isStickerNote(n) && !n.isArchived && n.boardId === note.boardId
  );
  const attachedNote = attachedToNoteId
    ? realNotes.find((n) => n.id === attachedToNoteId)
    : null;

  // Position state
  const [pos, setPos] = useState({
    x: note.posX ?? 100,
    y: note.posY ?? 100,
  });
  const posRef = useRef(pos);

  // Size state
  const [size, setSize] = useState({
    width: note.width ?? 140,
    height: note.height ?? 140,
  });
  const sizeRef = useRef(size);

  useEffect(() => {
    posRef.current = pos;
  }, [pos]);

  useEffect(() => {
    sizeRef.current = size;
  }, [size]);

  // Rotation state
  const [rotation, setRotation] = useState<number>(note.rotation ?? 0);
  const currentRotationRef = useRef<number>(rotation);

  // Track double-tap on touch devices (Tablet, iPad, Mobile)
  const lastStickerTapRef = useRef<{ time: number; x: number; y: number }>({ time: 0, x: 0, y: 0 });
  const lastStickerTouchTimeRef = useRef<number>(0);

  const handleStickerTouchEnd = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('.no-drag')
    ) {
      return;
    }

    const touch = e.changedTouches?.[0];
    if (!touch) return;
    const now = Date.now();
    const prev = lastStickerTapRef.current;
    const timeDiff = now - prev.time;
    const dist = Math.hypot(touch.clientX - prev.x, touch.clientY - prev.y);

    if (timeDiff > 50 && timeDiff < 380 && dist < 35) {
      // Double-tap on sticker detected on touch screen (iPad / Tablet / Mobile)
      lastStickerTouchTimeRef.current = Date.now();
      if (zoom <= 0.35 && onZoomToSticker) {
        onZoomToSticker(note);
      }
      lastStickerTapRef.current = { time: 0, x: 0, y: 0 };
    } else {
      lastStickerTapRef.current = { time: now, x: touch.clientX, y: touch.clientY };
    }
  };

  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizingDir, setResizingDir] = useState<ResizeDirection | null>(null);
  const [resizeStart, setResizeStart] = useState({
    clientX: 0,
    clientY: 0,
    posX: 0,
    posY: 0,
    w: 140,
    h: 140,
  });

  const [isRotating, setIsRotating] = useState(false);
  const rotateStartRef = useRef<{ startY: number; startRotation: number }>({
    startY: 0,
    startRotation: 0,
  });

  // Context Menu state
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (note.rotation !== undefined && note.rotation !== null) {
      setRotation(note.rotation);
      currentRotationRef.current = note.rotation;
    }
  }, [note.rotation]);

  useEffect(() => {
    if (!isDragging && !resizingDir) {
      if (typeof note.posX === 'number' && typeof note.posY === 'number') {
        setPos({ x: note.posX, y: note.posY });
      }
    }
  }, [note.posX, note.posY, isDragging, resizingDir]);

  useEffect(() => {
    if (!resizingDir) {
      setSize({
        width: note.width || 140,
        height: note.height || 140,
      });
    }
  }, [note.width, note.height, resizingDir]);

  // ── Dragging logic ──
  const initDrag = (clientX: number, clientY: number, target: HTMLElement) => {
    onBringToFront?.();

    if (
      target.closest('button') ||
      target.closest('.no-drag') ||
      target.closest('.resize-handle') ||
      target.closest('.rotate-handle')
    ) {
      return false;
    }

    setIsDragging(true);
    const canvas = document.getElementById('sticky-board-canvas');
    const canvasRect = canvas ? canvas.getBoundingClientRect() : { left: 0, top: 0 };
    setDragOffset({
      x: (clientX - canvasRect.left) / zoom - posRef.current.x,
      y: (clientY - canvasRect.top) / zoom - posRef.current.y,
    });
    return true;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const started = initDrag(e.clientX, e.clientY, e.target as HTMLElement);
    if (started) {
      e.preventDefault();
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const target = e.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('.no-drag') ||
      target.closest('.resize-handle') ||
      target.closest('.rotate-handle')
    ) {
      return;
    }
    // Prevent touch from bubbling up to canvas pinch-zoom or canvas panning
    e.stopPropagation();
    const touch = e.touches[0];
    const started = initDrag(touch.clientX, touch.clientY, target);
    if (started && e.cancelable) {
      e.preventDefault();
    }
  };

  // ── Resizing logic ──
  const handleResizeStart = (e: React.MouseEvent | React.TouchEvent, dir: ResizeDirection) => {
    e.stopPropagation();
    if ('cancelable' in e && e.cancelable) {
      e.preventDefault();
    }
    setResizingDir(dir);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setResizeStart({
      clientX,
      clientY,
      posX: posRef.current.x,
      posY: posRef.current.y,
      w: sizeRef.current.width,
      h: sizeRef.current.height,
    });
  };

  // ── Window listeners for Drag / Resize / Rotate ──
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const canvas = document.getElementById('sticky-board-canvas');
        const canvasRect = canvas ? canvas.getBoundingClientRect() : { left: 0, top: 0 };
        const newX = Math.round((e.clientX - canvasRect.left) / zoom - dragOffset.x);
        const newY = Math.round((e.clientY - canvasRect.top) / zoom - dragOffset.y);
        posRef.current = { x: newX, y: newY };
        setPos({ x: newX, y: newY });
      } else if (resizingDir) {
        const dx = (e.clientX - resizeStart.clientX) / zoom;
        const dy = (e.clientY - resizeStart.clientY) / zoom;
        let newW = resizeStart.w;
        let newH = resizeStart.h;

        if (resizingDir === 'bottom-right') {
          newW = Math.max(50, Math.round(resizeStart.w + dx));
          newH = Math.max(50, Math.round(resizeStart.h + dy));
        } else if (resizingDir === 'bottom-left') {
          newW = Math.max(50, Math.round(resizeStart.w - dx));
          newH = Math.max(50, Math.round(resizeStart.h + dy));
        } else if (resizingDir === 'top-right') {
          newW = Math.max(50, Math.round(resizeStart.w + dx));
          newH = Math.max(50, Math.round(resizeStart.h - dy));
        }

        sizeRef.current = { width: newW, height: newH };
        setSize({ width: newW, height: newH });
      } else if (isRotating) {
        const dy = e.clientY - rotateStartRef.current.startY;
        let nextAngle = Math.round((rotateStartRef.current.startRotation + dy * 0.8) % 360);
        if (nextAngle > 180) nextAngle -= 360;
        if (nextAngle < -180) nextAngle += 360;
        currentRotationRef.current = nextAngle;
        setRotation(nextAngle);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging && !resizingDir && !isRotating) return;
      if (e.touches.length !== 1) return;
      if (e.cancelable) {
        e.preventDefault();
      }
      const touch = e.touches[0];
      if (isDragging) {
        const canvas = document.getElementById('sticky-board-canvas');
        const canvasRect = canvas ? canvas.getBoundingClientRect() : { left: 0, top: 0 };
        const newX = Math.round((touch.clientX - canvasRect.left) / zoom - dragOffset.x);
        const newY = Math.round((touch.clientY - canvasRect.top) / zoom - dragOffset.y);
        posRef.current = { x: newX, y: newY };
        setPos({ x: newX, y: newY });
      } else if (resizingDir) {
        const dx = (touch.clientX - resizeStart.clientX) / zoom;
        const dy = (touch.clientY - resizeStart.clientY) / zoom;
        let newW = resizeStart.w;
        let newH = resizeStart.h;
        if (resizingDir === 'bottom-right') {
          newW = Math.max(50, Math.round(resizeStart.w + dx));
          newH = Math.max(50, Math.round(resizeStart.h + dy));
        }
        sizeRef.current = { width: newW, height: newH };
        setSize({ width: newW, height: newH });
      } else if (isRotating) {
        const dy = touch.clientY - rotateStartRef.current.startY;
        let nextAngle = Math.round((rotateStartRef.current.startRotation + dy * 0.8) % 360);
        if (nextAngle > 180) nextAngle -= 360;
        if (nextAngle < -180) nextAngle += 360;
        currentRotationRef.current = nextAngle;
        setRotation(nextAngle);
      }
    };

    const handleEnd = () => {
      if (isDragging) {
        setIsDragging(false);
        const finalX = posRef.current.x;
        const finalY = posRef.current.y;
        const currentW = sizeRef.current.width;
        const currentH = sizeRef.current.height;
        onDragEnd(note.id, finalX, finalY);

        // ── Sticky Magnet / Grouping Snap Check ──
        const stickerCenterX = finalX + currentW / 2;
        const stickerCenterY = finalY + currentH / 2;

        let bestNote: Note | null = null;
        let minDistance = Infinity;

        for (const rn of realNotes) {
          if (rn.posX == null || rn.posY == null) continue;
          const noteW = rn.width || 260;
          const noteH = rn.height || 260;
          // Boundary check with generous 35px snap padding
          if (
            stickerCenterX >= rn.posX - 35 &&
            stickerCenterX <= rn.posX + noteW + 35 &&
            stickerCenterY >= rn.posY - 35 &&
            stickerCenterY <= rn.posY + noteH + 35
          ) {
            const noteCenterX = rn.posX + noteW / 2;
            const noteCenterY = rn.posY + noteH / 2;
            const dist = Math.hypot(stickerCenterX - noteCenterX, stickerCenterY - noteCenterY);
            if (dist < minDistance) {
              minDistance = dist;
              bestNote = rn;
            }
          }
        }

        if (bestNote && bestNote.posX != null && bestNote.posY != null) {
          const offsetX = finalX - bestNote.posX;
          const offsetY = finalY - bestNote.posY;
          updateNote(note.id, {
            content: encodeStickerContent(stickerUrl, {
              attachedToNoteId: bestNote.id,
              offsetX,
              offsetY,
            }),
          });
          if (attachedToNoteId !== bestNote.id) {
            toast.success(
              `📌 ยึดติดกับ "${bestNote.title || 'โน้ต'}" แล้ว (จะเคลื่อนที่ตามโน้ตนี้)`,
              { id: `snap-${note.id}` }
            );
          }
        } else if (attachedToNoteId) {
          // Dragged away into open board canvas -> detach and become independent
          updateNote(note.id, {
            content: encodeStickerContent(stickerUrl),
          });
          toast('🔓 ปลดการยึดติดแล้ว (เป็นสติกเกอร์บอร์ดอิสระ)', {
            icon: '🍃',
            id: `detach-${note.id}`,
          });
        }
      }
      if (resizingDir) {
        setResizingDir(null);
        updateNote(note.id, { width: sizeRef.current.width, height: sizeRef.current.height });
      }
      if (isRotating) {
        setIsRotating(false);
        updateNote(note.id, { rotation: currentRotationRef.current });
      }
    };

    if (isDragging || resizingDir || isRotating) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleEnd);
      window.addEventListener('touchcancel', handleEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
      window.removeEventListener('touchcancel', handleEnd);
    };
  }, [
    isDragging,
    resizingDir,
    isRotating,
    dragOffset,
    resizeStart,
    zoom,
    note.id,
    onDragEnd,
    updateNote,
    realNotes,
    stickerUrl,
    attachedToNoteId,
  ]);

  // Manual Attach Nearest Note handler
  const handleAttachNearest = () => {
    if (realNotes.length === 0) {
      toast.error('ไม่พบโน้ตบนบอร์ดนี้');
      return;
    }
    const stickerCenterX = pos.x + size.width / 2;
    const stickerCenterY = pos.y + size.height / 2;
    let bestNote: Note | null = null;
    let minDistance = Infinity;

    for (const rn of realNotes) {
      if (rn.posX == null || rn.posY == null) continue;
      const noteW = rn.width || 260;
      const noteH = rn.height || 260;
      const noteCenterX = rn.posX + noteW / 2;
      const noteCenterY = rn.posY + noteH / 2;
      const dist = Math.hypot(stickerCenterX - noteCenterX, stickerCenterY - noteCenterY);
      if (dist < minDistance) {
        minDistance = dist;
        bestNote = rn;
      }
    }

    if (bestNote && bestNote.posX != null && bestNote.posY != null) {
      updateNote(note.id, {
        content: encodeStickerContent(stickerUrl, {
          attachedToNoteId: bestNote.id,
          offsetX: pos.x - bestNote.posX,
          offsetY: pos.y - bestNote.posY,
        }),
      });
      toast.success(`📌 ยึดติดกับ "${bestNote.title || 'โน้ต'}" แล้ว (จะเคลื่อนที่ตามโน้ตนี้)`);
    }
  };

  // Manual Detach handler
  const handleDetach = () => {
    updateNote(note.id, {
      content: encodeStickerContent(stickerUrl),
    });
    toast('🔓 ปลดการยึดติดแล้ว (เป็นสติกเกอร์บอร์ดอิสระ)', { icon: '🍃' });
  };

  // Quick Rotate by +15° on button click
  const handleQuickRotate = (e: React.MouseEvent) => {
    e.stopPropagation();
    let nextAngle = Math.round(currentRotationRef.current + 15);
    if (nextAngle > 180) nextAngle = -165;
    currentRotationRef.current = nextAngle;
    setRotation(nextAngle);
    updateNote(note.id, { rotation: nextAngle });
  };

  // Duplicate Sticker
  const handleDuplicate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await createNote({
        title: '[STICKER]',
        content: note.content,
        width: size.width,
        height: size.height,
        rotation: rotation,
        posX: pos.x + 30,
        posY: pos.y + 30,
        boardId: note.boardId || undefined,
      });
      toast.success('คัดลอกสติกเกอร์แล้ว');
    } catch (err: any) {
      toast.error(
        err.response?.data?.error ||
          'Board นี้มีครบ 56 Notes แล้ว กรุณาสร้าง Board ใหม่เพื่อเพิ่ม Note'
      );
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onBringToFront?.();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  return (
    <>
      <div
        id={`sticker-item-${note.id}`}
        style={{
          left: `${pos.x}px`,
          top: `${pos.y}px`,
          width: `${size.width}px`,
          height: `${size.height}px`,
          touchAction: 'none',
          transform: isDragging
            ? `scale(1.05) rotate(${rotation}deg)`
            : `rotate(${rotation}deg)`,
          zIndex:
            isDragging || resizingDir || isRotating
              ? 9999
              : customZIndex !== undefined
              ? customZIndex
              : isHighlighted
              ? 999
              : 25,
          transition: isDragging || resizingDir || isRotating ? 'none' : 'transform 0.15s ease-out',
        }}
        className="absolute select-none cursor-grab active:cursor-grabbing group/sticker"
        onClick={() => onBringToFront?.()}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleStickerTouchEnd}
        onContextMenu={handleContextMenu}
        onDoubleClick={(e) => {
          e.stopPropagation();
          // Ignore synthetic dblclick generated by touch taps on touch screens
          if (Date.now() - lastStickerTouchTimeRef.current < 450) {
            return;
          }
          if (zoom <= 0.35 && onZoomToSticker) {
            onZoomToSticker(note);
          }
        }}
      >
        {/* ── Floating Action Bar: Attach/Detach, Rotate, Duplicate, Delete ── */}
        <div
          className={`absolute -top-11 left-1/2 -translate-x-1/2 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-1.5 py-1 rounded-full shadow-lg border border-slate-200/80 dark:border-slate-700 flex items-center gap-1 transition-opacity duration-150 no-drag ${
            isFocused ? 'opacity-100' : 'opacity-0 group-hover/sticker:opacity-100'
          }`}
          style={{ touchAction: 'none' }}
        >
          {/* Attach / Detach Magnet Button */}
          {attachedNote ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleDetach();
              }}
              className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-950/60 dark:hover:text-rose-400 transition flex items-center gap-1 text-[11px] font-medium"
              title={`ยึดติดอยู่กับ: "${attachedNote.title || 'โน้ต'}"\n(คลิกเพื่อปลดการยึดติด)`}
            >
              <Pin size={12} className="fill-indigo-600 dark:fill-indigo-400 shrink-0" />
              <span className="max-w-[75px] truncate">{attachedNote.title || 'โน้ต'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleAttachNearest();
              }}
              className="p-1 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-500 hover:text-indigo-600 transition flex items-center"
              title="📌 ยึดติดกับโน้ตที่ใกล้ที่สุด (สติกเกอร์จะย้ายตามโน้ต)"
            >
              <Pin size={13} />
            </button>
          )}

          {/* Quick Rotate Button */}
          <button
            type="button"
            onClick={handleQuickRotate}
            className="p-1 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition"
            title="หมุน +15° (คลิกซ้ำเพื่อหมุนต่อเนื่อง)"
          >
            <RotateCw size={14} />
          </button>

          {/* Duplicate Button */}
          <button
            type="button"
            onClick={handleDuplicate}
            className="p-1 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition"
            title="คัดลอกสติกเกอร์นี้"
          >
            <Copy size={13} />
          </button>

          {/* Delete Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              deleteNote(note.id);
              toast.success('ลบสติกเกอร์แล้ว');
            }}
            className="p-1 rounded-full hover:bg-rose-50 dark:hover:bg-rose-950/50 text-slate-500 hover:text-rose-600 transition"
            title="ลบสติกเกอร์"
          >
            <Trash2 size={13} />
          </button>
        </div>

        {/* ── Sticker Image Content (Transparent, High Res, Drop-Shadow) ── */}
        <div
          className="w-full h-full flex items-center justify-center relative pointer-events-auto select-none"
          style={{ touchAction: 'none' }}
        >
          {/* Active hit surface covering transparent SVG gaps for reliable finger and mouse dragging */}
          <div
            className="absolute inset-0 bg-transparent cursor-grab active:cursor-grabbing pointer-events-auto"
            style={{ touchAction: 'none' }}
          />
          <img
            src={stickerUrl}
            alt={note.title || 'Sticker'}
            draggable={false}
            className="w-full h-full object-contain drop-shadow-md group-hover/sticker:drop-shadow-xl transition-all duration-150 pointer-events-none select-none"
          />

          {/* Selection / Focus Border / Highlight Spawn Ring */}
          <div
            className={`absolute inset-0 rounded-2xl pointer-events-none transition-all duration-300 ${
              isHighlighted
                ? 'ring-4 ring-amber-400 dark:ring-amber-300 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 shadow-2xl opacity-100 animate-pulse'
                : isFocused
                ? 'ring-2 ring-indigo-500/60 ring-offset-2 opacity-100'
                : 'group-hover/sticker:ring-1 group-hover/sticker:ring-indigo-400/40 opacity-0 group-hover/sticker:opacity-100'
            }`}
          />
        </div>

        {/* ── Bottom-Right Resize Handle ── */}
        <div
          onMouseDown={(e) => handleResizeStart(e, 'bottom-right')}
          onTouchStart={(e) => handleResizeStart(e, 'bottom-right')}
          style={{ touchAction: 'none' }}
          className={`resize-handle no-drag absolute -bottom-3 -right-3 w-7 h-7 rounded-full bg-white dark:bg-slate-800 border-2 border-indigo-500 shadow-md cursor-se-resize flex items-center justify-center transition-transform hover:scale-125 z-30 ${
            isFocused ? 'opacity-100' : 'opacity-0 group-hover/sticker:opacity-100'
          }`}
          title="คลิกลากเพื่อย่อ-ขยายขนาดสติกเกอร์"
        >
          <div className="w-2 h-2 rounded-full bg-indigo-500" />
        </div>

        {/* ── Top-Right Free Rotation Handle ── */}
        <div
          onMouseDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setIsRotating(true);
            rotateStartRef.current = {
              startY: e.clientY,
              startRotation: currentRotationRef.current,
            };
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
            if (e.cancelable) e.preventDefault();
            if (e.touches.length !== 1) return;
            setIsRotating(true);
            rotateStartRef.current = {
              startY: e.touches[0].clientY,
              startRotation: currentRotationRef.current,
            };
          }}
          style={{ touchAction: 'none' }}
          className={`rotate-handle no-drag absolute -top-3 -right-3 w-7 h-7 rounded-full bg-white dark:bg-slate-800 border-2 border-amber-500 shadow-md cursor-grab active:cursor-grabbing flex items-center justify-center transition-transform hover:scale-125 z-30 ${
            isFocused ? 'opacity-100' : 'opacity-0 group-hover/sticker:opacity-100'
          }`}
          title="คลิกค้างแล้วลากเมาส์ขึ้น-ลงเพื่อหมุนองศาแบบละเอียด"
        >
          <RotateCw size={13} className="text-amber-600 dark:text-amber-400" />
        </div>
      </div>

      {/* ── Right-Click Context Menu ── */}
      <ViewportContextMenu
        isOpen={Boolean(contextMenu)}
        x={contextMenu?.x ?? 0}
        y={contextMenu?.y ?? 0}
        onClose={() => setContextMenu(null)}
      >
        <div className="py-1">
          {attachedNote ? (
            <ViewportMenuItem
              icon={<Pin size={14} className="fill-indigo-500 text-indigo-500" />}
              label={`🔓 ปลดการยึดติดจาก "${attachedNote.title || 'โน้ต'}"`}
              onClick={() => {
                handleDetach();
                setContextMenu(null);
              }}
            />
          ) : (
            <ViewportMenuItem
              icon={<Pin size={14} />}
              label="📌 ยึดติดกับโน้ตนี้ (โน้ตใกล้เคียงที่สุด)"
              onClick={() => {
                handleAttachNearest();
                setContextMenu(null);
              }}
            />
          )}

          <ViewportMenuItem
            icon={<RotateCw size={14} />}
            label="หมุน +15°"
            onClick={(e) => {
              handleQuickRotate(e);
              setContextMenu(null);
            }}
          />

          <ViewportMenuItem
            icon={<Copy size={14} />}
            label="คัดลอกสติกเกอร์"
            onClick={(e) => {
              handleDuplicate(e);
              setContextMenu(null);
            }}
          />

          <ViewportMenuItem
            icon={<ArrowUpRight size={14} />}
            label="นำมาไว้หน้าสุด"
            onClick={() => {
              onBringToFront?.();
              setContextMenu(null);
            }}
          />

          <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

          <ViewportMenuItem
            icon={<Trash2 size={14} className="text-rose-500" />}
            label="ลบสติกเกอร์"
            danger
            onClick={() => {
              deleteNote(note.id);
              toast.success('ลบสติกเกอร์แล้ว');
              setContextMenu(null);
            }}
          />
        </div>
      </ViewportContextMenu>
    </>
  );
}
