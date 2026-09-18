import React, { useState, useRef, useEffect } from 'react';
import { RotateCw, Trash2, Copy, ArrowUpRight, Check } from 'lucide-react';
import { Note } from '@/types';
import { useNoteStore } from '@/store/noteStore';
import { getStickerUrl } from './stickerData';
import toast from 'react-hot-toast';

interface StickyStickerItemProps {
  note: Note;
  zoom?: number;
  onDragEnd: (id: string, x: number, y: number) => void;
  onBringToFront?: () => void;
  customZIndex?: number;
  isFocused?: boolean;
}

type ResizeDirection = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

export default function StickyStickerItem({
  note,
  zoom = 1,
  onDragEnd,
  onBringToFront,
  customZIndex,
  isFocused = false,
}: StickyStickerItemProps) {
  const { updateNote, deleteNote, createNote } = useNoteStore();
  const stickerUrl = getStickerUrl(note);

  // Position state
  const [pos, setPos] = useState({
    x: note.posX ?? 100,
    y: note.posY ?? 100,
  });

  // Size state
  const [size, setSize] = useState({
    width: note.width ?? 140,
    height: note.height ?? 140,
  });

  // Rotation state
  const [rotation, setRotation] = useState<number>(note.rotation ?? 0);
  const currentRotationRef = useRef<number>(rotation);

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
      x: (clientX - canvasRect.left) / zoom - pos.x,
      y: (clientY - canvasRect.top) / zoom - pos.y,
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
    const touch = e.touches[0];
    initDrag(touch.clientX, touch.clientY, e.target as HTMLElement);
  };

  // ── Resizing logic ──
  const handleResizeStart = (e: React.MouseEvent | React.TouchEvent, dir: ResizeDirection) => {
    e.stopPropagation();
    setResizingDir(dir);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setResizeStart({
      clientX,
      clientY,
      posX: pos.x,
      posY: pos.y,
      w: size.width,
      h: size.height,
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
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      if (isDragging) {
        const canvas = document.getElementById('sticky-board-canvas');
        const canvasRect = canvas ? canvas.getBoundingClientRect() : { left: 0, top: 0 };
        const newX = Math.round((touch.clientX - canvasRect.left) / zoom - dragOffset.x);
        const newY = Math.round((touch.clientY - canvasRect.top) / zoom - dragOffset.y);
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
        setSize({ width: newW, height: newH });
      }
    };

    const handleEnd = () => {
      if (isDragging) {
        setIsDragging(false);
        onDragEnd(note.id, pos.x, pos.y);
      }
      if (resizingDir) {
        setResizingDir(null);
        updateNote(note.id, { width: size.width, height: size.height });
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
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, resizingDir, isRotating, dragOffset, pos, resizeStart, size, zoom, note.id, onDragEnd, updateNote]);

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
      toast.error(err.response?.data?.error || 'Board นี้มีครบ 56 Notes แล้ว กรุณาสร้าง Board ใหม่เพื่อเพิ่ม Note');
    }
  };

  return (
    <div
      id={`sticker-item-${note.id}`}
      style={{
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        transform: isDragging
          ? `scale(1.05) rotate(${rotation}deg)`
          : `rotate(${rotation}deg)`,
        zIndex: isDragging || resizingDir || isRotating
          ? 9999
          : customZIndex !== undefined
          ? customZIndex
          : 25,
        transition: isDragging || resizingDir || isRotating ? 'none' : 'transform 0.15s ease-out',
      }}
      className="absolute select-none cursor-grab active:cursor-grabbing group/sticker"
      onClick={() => onBringToFront?.()}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      {/* ── Floating Action Bar (as in s.mp4: Rotate, Duplicate, Delete) ── */}
      <div
        className={`absolute -top-11 left-1/2 -translate-x-1/2 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-1.5 py-1 rounded-full shadow-lg border border-slate-200/80 dark:border-slate-700 flex items-center gap-1 transition-opacity duration-150 no-drag ${
          isFocused ? 'opacity-100' : 'opacity-0 group-hover/sticker:opacity-100'
        }`}
        style={{ touchAction: 'none' }}
      >
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
      <div className="w-full h-full flex items-center justify-center relative pointer-events-auto">
        <img
          src={stickerUrl}
          alt={note.title || 'Sticker'}
          draggable={false}
          className="w-full h-full object-contain drop-shadow-md group-hover/sticker:drop-shadow-xl transition-all duration-150 pointer-events-none"
        />

        {/* Selection / Focus Border */}
        <div
          className={`absolute inset-0 rounded-xl pointer-events-none transition-opacity ${
            isFocused ? 'ring-2 ring-indigo-500/60 ring-offset-2' : 'group-hover/sticker:ring-1 group-hover/sticker:ring-indigo-400/40'
          }`}
        />
      </div>

      {/* ── Bottom-Right Resize Handle (Corner drag as in s.mp4) ── */}
      <div
        onMouseDown={(e) => handleResizeStart(e, 'bottom-right')}
        onTouchStart={(e) => handleResizeStart(e, 'bottom-right')}
        style={{ touchAction: 'none' }}
        className={`resize-handle no-drag absolute -bottom-2 -right-2 w-5 h-5 rounded-full bg-white dark:bg-slate-800 border-2 border-indigo-500 shadow-md cursor-se-resize flex items-center justify-center transition-transform hover:scale-125 z-30 ${
          isFocused ? 'opacity-100' : 'opacity-0 group-hover/sticker:opacity-100'
        }`}
        title="คลิกลากเพื่อย่อ-ขยายขนาดสติกเกอร์"
      >
        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
      </div>

      {/* ── Top-Right Free Rotation Handle (Drag up/down to rotate freely) ── */}
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
        style={{ touchAction: 'none' }}
        className={`rotate-handle no-drag absolute -top-2 -right-2 w-5 h-5 rounded-full bg-white dark:bg-slate-800 border-2 border-amber-500 shadow-md cursor-grab active:cursor-grabbing flex items-center justify-center transition-transform hover:scale-125 z-30 ${
          isFocused ? 'opacity-100' : 'opacity-0 group-hover/sticker:opacity-100'
        }`}
        title="คลิกค้างแล้วลากเมาส์ขึ้น-ลงเพื่อหมุนองศาแบบละเอียด"
      >
        <RotateCw size={10} className="text-amber-600 dark:text-amber-400" />
      </div>
    </div>
  );
}
