import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Pin,
  Trash2,
  Maximize2,
  Lock,
  Palette,
  Type,
  Check,
  MoreHorizontal,
  GripHorizontal,
  Paperclip,
  Link2,
  FileText,
  Image as ImageIcon,
  Download,
  X,
  File,
  Star,
  RotateCw,
  Volume2,
  Share2,
} from 'lucide-react';
import { Note, FileAttachment } from '@/types';
import { useNoteStore } from '@/store/noteStore';
import { useAuthStore } from '@/store/authStore';
import { EncryptionService } from '@/utils/encryption';
import toast from 'react-hot-toast';
import ViewportPopover from '../ui/ViewportPopover';
import ViewportContextMenu from '../ui/ViewportContextMenu';
import ShareNoteModal from '../notes/ShareNoteModal';

interface StickyNoteItemProps {
  note: Note;
  index: number;
  onDragEnd: (id: string, x: number, y: number) => void;
  onUnlockRequest?: () => void;
  onStartConnect?: (noteId: string) => void;
  onTargetConnect?: (noteId: string) => void;
  isConnectingSource?: boolean;
  isConnectingMode?: boolean;
  onOpenFullscreen?: (note: Note) => void;
  onBringToFront?: () => void;
  customZIndex?: number;
  isFocused?: boolean;
  isHighlighted?: boolean;
  zoom?: number;
}

const PAPER_COLORS = [
  { name: 'Yellow', bg: '#FEF08A', border: '#FDE047' }, // Classic Post-it Yellow
  { name: 'Pink', bg: '#FBCFE8', border: '#F472B6' },   // Pastel Pink
  { name: 'Green', bg: '#BBF7D0', border: '#86EFAC' },  // Mint Green
  { name: 'Blue', bg: '#BAE6FD', border: '#7DD3FC' },   // Sky Blue
  { name: 'Orange', bg: '#FED7AA', border: '#FDBA74' }, // Peach Orange
  { name: 'Purple', bg: '#E9D5FF', border: '#D8B4FE' }, // Lavender
  { name: 'White', bg: '#FFFFFF', border: '#E2E8F0' },  // Clean White
  { name: 'Dark', bg: '#1E293B', border: '#334155' },   // Slate Dark
];

const TEXT_COLORS = [
  { name: 'Slate', color: '#0F172A' },
  { name: 'Blue Ink', color: '#1E3A8A' },
  { name: 'Red Ink', color: '#991B1B' },
  { name: 'Emerald', color: '#065F46' },
  { name: 'Deep Purple', color: '#5B21B6' },
  { name: 'Amber', color: '#B45309' },
  { name: 'Pink', color: '#BE185D' },
  { name: 'White', color: '#F8FAFC' },
];

const FONT_SIZES = [
  { label: 'S', value: 'small', className: 'text-xs' },
  { label: 'M', value: 'normal', className: 'text-sm' },
  { label: 'L', value: 'large', className: 'text-base' },
];

const FONT_FAMILIES = [
  { label: 'ปกติ', value: 'sans', className: 'font-sans-note' },
  { label: 'ลายมือ', value: 'handwriting', className: 'font-handwriting text-base font-semibold' },
  { label: 'ซีรีฟ', value: 'serif', className: 'font-serif-note' },
  { label: 'โค้ด', value: 'mono', className: 'font-mono-note' },
];

const KANBAN_STATUSES = [
  { label: 'To Do', value: 'todo', color: 'bg-amber-100 text-amber-800' },
  { label: 'Doing', value: 'doing', color: 'bg-sky-100 text-sky-800' },
  { label: 'Done', value: 'done', color: 'bg-emerald-100 text-emerald-800' },
];

type ResizeDirection = 'right' | 'left' | 'bottom' | 'bottom-right' | 'bottom-left';

interface StickyContentEditableProps {
  html: string;
  onChange: (newHtml: string) => void;
  onBlur: () => void;
  onFocus?: () => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const StickyContentEditable: React.FC<StickyContentEditableProps> = ({
  html,
  onChange,
  onBlur,
  onFocus,
  placeholder = 'เขียนข้อความของคุณตรงนี้...',
  disabled = false,
  className = '',
  style,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const lastHtmlRef = useRef(html);
  const [isEmpty, setIsEmpty] = useState(() => {
    return !html || html.replace(/<[^>]*>/g, '').trim() === '';
  });

  useEffect(() => {
    if (ref.current && html !== lastHtmlRef.current) {
      lastHtmlRef.current = html;
      ref.current.innerHTML = html;
      setIsEmpty(!html || html.replace(/<[^>]*>/g, '').trim() === '');
    }
  }, [html]);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const newHtml = e.currentTarget.innerHTML;
    lastHtmlRef.current = newHtml;
    setIsEmpty(!newHtml || newHtml.replace(/<[^>]*>/g, '').trim() === '');
    onChange(newHtml);
  };

  return (
    <div className="relative w-full h-full min-h-0">
      <div
        ref={ref}
        contentEditable={!disabled}
        suppressContentEditableWarning
        onInput={handleInput}
        onFocus={onFocus}
        onBlur={onBlur}
        className={`${className} px-2 py-1 focus:outline-none select-text cursor-text no-drag min-h-full`}
        style={style}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {isEmpty && (
        <div
          className="absolute top-1 left-2 pointer-events-none opacity-30 select-none leading-relaxed text-inherit"
          style={style}
        >
          {placeholder}
        </div>
      )}
    </div>
  );
};

export default function StickyNoteItem({
  note,
  index,
  onDragEnd,
  onUnlockRequest,
  onStartConnect,
  onTargetConnect,
  isConnectingSource = false,
  isConnectingMode = false,
  onOpenFullscreen,
  onBringToFront,
  customZIndex,
  isFocused = false,
  isHighlighted = false,
  zoom = 1,
}: StickyNoteItemProps) {
  const router = useRouter();
  const {
    updateNote,
    deleteNote,
    togglePin,
    toggleFavorite,
    boards,
    fetchNotes,
    uploadAttachment,
    deleteAttachment,
  } = useNoteStore();
  const isVaultUnlocked = useAuthStore((state) => state.isVaultUnlocked);
  const [isMoveBoardOpen, setIsMoveBoardOpen] = useState(false);
  const [isFontFamilyOpen, setIsFontFamilyOpen] = useState(false);
  const [isKanbanStatusOpen, setIsKanbanStatusOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const paperColorBtnRef = useRef<HTMLButtonElement>(null);
  const textColorBtnRef = useRef<HTMLButtonElement>(null);
  const fontFamilyBtnRef = useRef<HTMLButtonElement>(null);
  const moreBtnRef = useRef<HTMLButtonElement>(null);
  const kanbanBtnRef = useRef<HTMLButtonElement>(null);
  const [contextMenu, setContextMenu] = useState<{ isOpen: boolean; x: number; y: number }>({
    isOpen: false,
    x: 0,
    y: 0,
  });

  // Position state
  const [pos, setPos] = useState({
    x: note.posX ?? 80 + (index % 5) * 280,
    y: note.posY ?? 80 + Math.floor(index / 5) * 320,
  });

  // Size state (customizable width & height, remembered in DB)
  const [size, setSize] = useState({
    width: note.width ?? 260,
    height: note.height ?? 260,
  });

  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const [resizingDir, setResizingDir] = useState<ResizeDirection | null>(null);
  const [resizeStart, setResizeStart] = useState({
    clientX: 0,
    clientY: 0,
    posX: 0,
    posY: 0,
    w: 260,
    h: 260,
  });

  // Inline editing state
  const [title, setTitle] = useState(note.title || '');
  const [content, setContent] = useState(note.content || '');
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [isTextColorOpen, setIsTextColorOpen] = useState(false);

  // Paper styling
  const paperColor = note.color || '#FEF08A';
  const textColor = note.textColor || (paperColor === '#1E293B' ? '#F8FAFC' : '#0F172A');
  const fontSize = note.fontSize || 'normal';
  const fontFamily = note.fontFamily || 'sans';
  const kanbanStatus = note.kanbanStatus || 'todo';

  // Rotation state: persistent from note.rotation (defaults to 0, no tilt)
  const [rotation, setRotation] = useState<number>(() => {
    if (note.rotation !== undefined && note.rotation !== null) {
      return note.rotation;
    }
    return 0;
  });

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const currentRotationRef = useRef<number>(rotation);
  const lastClickTimeRef = useRef<number>(0);
  const rotateStartRef = useRef<{ startY: number; startRotation: number; hasMoved: boolean }>({
    startY: 0,
    startRotation: 0,
    hasMoved: false,
  });

  useEffect(() => {
    if (note.rotation !== undefined && note.rotation !== null) {
      setRotation(note.rotation);
      currentRotationRef.current = note.rotation;
    }
  }, [note.rotation]);

  // Optimistic position tracker: prevents note from bouncing when dragging finishes
  const lastSavedPosRef = useRef<{ x: number; y: number }>({
    x: note.posX ?? 80 + (index % 5) * 280,
    y: note.posY ?? 125 + Math.floor(index / 5) * 320,
  });

  useEffect(() => {
    // Only update pos from external props if note.posX / posY are valid and different from last saved pos
    if (!isDragging && !resizingDir) {
      if (typeof note.posX === 'number' && typeof note.posY === 'number') {
        if (
          Math.abs(note.posX - lastSavedPosRef.current.x) > 4 ||
          Math.abs(note.posY - lastSavedPosRef.current.y) > 4
        ) {
          lastSavedPosRef.current = { x: note.posX, y: note.posY };
          setPos({ x: note.posX, y: note.posY });
        }
      }
    }
  }, [note.posX, note.posY, isDragging, resizingDir]);

  // Synchronize title and content when note prop updates (from fullscreen editor or external edit)
  useEffect(() => {
    setTitle(note.title || '');
    setContent(note.content || '');
  }, [note.title, note.content]);

  // Synchronize size when note prop updates
  useEffect(() => {
    if (!resizingDir) {
      setSize({
        width: note.width || 260,
        height: note.height || 260,
      });
    }
  }, [note.width, note.height, resizingDir]);

  const handleRotateMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsRotating(true);
    rotateStartRef.current = {
      startY: e.clientY,
      startRotation: currentRotationRef.current,
      hasMoved: false,
    };
  };

  const handleRotateNote = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    let nextAngle = Math.round(currentRotationRef.current + 5);
    if (nextAngle > 180) nextAngle = -175;
    currentRotationRef.current = nextAngle;
    setRotation(nextAngle);
    updateNote(note.id, { rotation: nextAngle });
  };

  const handleResetRotation = (e: React.MouseEvent) => {
    e.stopPropagation();
    currentRotationRef.current = 0;
    setRotation(0);
    updateNote(note.id, { rotation: 0 });
    toast.success('รีเซ็ตการหมุนเป็น 0° แล้ว');
  };

  // Handle encrypted notes
  let isEncrypted = false;
  let displayContent = content;

  if (note.isLocked) {
    if (isVaultUnlocked) {
      try {
        const parsed = JSON.parse(note.content);
        if (parsed.encrypted && parsed.iv) {
          displayContent = EncryptionService.getInstance().decrypt(parsed.encrypted, parsed.iv);
        }
      } catch (e) {
        // ignore
      }
    } else {
      isEncrypted = true;
      displayContent = '🔒 โน้ตนี้ถูกเข้ารหัสลับ (คลิกเพื่อปลดล็อกด้วย Master Password)';
    }
  }

  // Drag start helper for both Mouse and Touch
  const initDrag = (clientX: number, clientY: number, target: HTMLElement) => {
    onBringToFront?.();

    if (isConnectingMode) {
      if (onTargetConnect) {
        onTargetConnect(note.id);
      }
      return false;
    }

    // Prevent drag if interacting with buttons, inputs, textareas, links, or specific no-drag elements
    if (
      target.closest('button') ||
      target.closest('input') ||
      target.closest('textarea') ||
      target.closest('a') ||
      target.closest('.no-drag')
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

  // Drag start handler - Instant 1:1 mouse tracking
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only primary left-click
    const started = initDrag(e.clientX, e.clientY, e.target as HTMLElement);
    if (started) {
      e.preventDefault();
    }
  };

  // Drag start handler - Mobile/Tablet Touch tracking
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    initDrag(touch.clientX, touch.clientY, e.target as HTMLElement);
  };

  // Start multi-directional resize (Mouse)
  const handleResizeStart = (e: React.MouseEvent, dir: ResizeDirection) => {
    e.stopPropagation();
    e.preventDefault();
    setResizingDir(dir);
    setResizeStart({
      clientX: e.clientX,
      clientY: e.clientY,
      posX: pos.x,
      posY: pos.y,
      w: size.width,
      h: size.height,
    });
  };

  // Start multi-directional resize (Touch)
  const handleResizeTouchStart = (e: React.TouchEvent, dir: ResizeDirection) => {
    if (e.touches.length !== 1) return;
    e.stopPropagation();
    const touch = e.touches[0];
    setResizingDir(dir);
    setResizeStart({
      clientX: touch.clientX,
      clientY: touch.clientY,
      posX: pos.x,
      posY: pos.y,
      w: size.width,
      h: size.height,
    });
  };

  // Window mouse and touch listeners for smooth real-time response
  useEffect(() => {
    const handleMove = (clientX: number, clientY: number) => {
      if (isRotating) {
        const deltaY = rotateStartRef.current.startY - clientY;
        if (Math.abs(deltaY) > 3) {
          rotateStartRef.current.hasMoved = true;
        }
        let newAngle = Math.round(rotateStartRef.current.startRotation + deltaY * 0.6);
        while (newAngle > 180) newAngle -= 360;
        while (newAngle < -180) newAngle += 360;
        currentRotationRef.current = newAngle;
        setRotation(newAngle);
      } else if (isDragging) {
        const canvas = document.getElementById('sticky-board-canvas');
        const canvasRect = canvas ? canvas.getBoundingClientRect() : { left: 0, top: 0 };
        const rawX = (clientX - canvasRect.left) / zoom - dragOffset.x;
        const rawY = (clientY - canvasRect.top) / zoom - dragOffset.y;
        
        // Follow mouse smoothly and fluidly without any left resistance or wall
        setPos({ x: rawX, y: rawY });
      } else if (resizingDir) {
        const deltaX = (clientX - resizeStart.clientX) / zoom;
        const deltaY = (clientY - resizeStart.clientY) / zoom;

        let newW = resizeStart.w;
        let newH = resizeStart.h;
        let newX = resizeStart.posX;

        if (resizingDir === 'right' || resizingDir === 'bottom-right') {
          newW = Math.max(200, Math.min(900, resizeStart.w + deltaX));
        }

        if (resizingDir === 'left' || resizingDir === 'bottom-left') {
          const computedW = resizeStart.w - deltaX;
          if (computedW >= 200 && computedW <= 900) {
            newW = computedW;
            newX = resizeStart.posX + deltaX;
          }
        }

        if (resizingDir === 'bottom' || resizingDir === 'bottom-right' || resizingDir === 'bottom-left') {
          newH = Math.max(180, Math.min(900, resizeStart.h + deltaY));
        }

        setSize({ width: Math.round(newW), height: Math.round(newH) });
        if (newX !== pos.x) {
          setPos((prev) => ({ ...prev, x: Math.round(newX) }));
        }
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging && !isRotating && !resizingDir) return;
      if (e.touches.length !== 1) return;
      if (e.cancelable) e.preventDefault();
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    };

    const handleEnd = () => {
      if (isRotating) {
        setIsRotating(false);
        if (rotateStartRef.current.hasMoved) {
          updateNote(note.id, { rotation: currentRotationRef.current });
        } else {
          const now = Date.now();
          if (now - lastClickTimeRef.current < 320) {
            // Double click: reset rotation to 0°
            lastClickTimeRef.current = 0;
            currentRotationRef.current = 0;
            setRotation(0);
            updateNote(note.id, { rotation: 0 });
            toast.success('รีเซ็ตการหมุนเป็น 0° แล้ว');
          } else {
            // Single click: rotate +5°
            lastClickTimeRef.current = now;
            let nextAngle = Math.round(currentRotationRef.current + 5);
            if (nextAngle > 180) nextAngle = -175;
            currentRotationRef.current = nextAngle;
            setRotation(nextAngle);
            updateNote(note.id, { rotation: nextAngle });
          }
        }
      }
      if (isDragging) {
        setIsDragging(false);
        // Truly freeform positioning across the board, neatly bounded within 7 columns
        const maxX = 2060 - size.width - 24;
        const freeX = Math.max(0, Math.min(maxX, Math.round(pos.x)));
        const freeY = Math.max(0, Math.round(pos.y));

        setPos({ x: freeX, y: freeY });
        lastSavedPosRef.current = { x: freeX, y: freeY };
        onDragEnd(note.id, freeX, freeY);
      }
      if (resizingDir) {
        setResizingDir(null);
        updateNote(note.id, {
          width: size.width,
          height: size.height,
          posX: pos.x,
          posY: pos.y,
        });
      }
    };

    const handleMouseUp = () => handleEnd();
    const handleTouchEnd = () => handleEnd();

    if (isDragging || resizingDir || isRotating) {
      window.addEventListener('mousemove', handleMouseMove, { passive: true });
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);
      window.addEventListener('touchcancel', handleTouchEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [isDragging, resizingDir, isRotating, dragOffset, resizeStart, note.id, onDragEnd, pos, size, updateNote]);

  // Save inline text changes on blur
  const handleBlur = () => {
    if (!note.isLocked && (title !== note.title || content !== note.content)) {
      updateNote(note.id, { title, content });
    }
  };

  // Change paper background color
  const handleColorChange = (newColor: string) => {
    updateNote(note.id, { color: newColor });
    setIsColorPickerOpen(false);
  };

  // Change text/content ink color
  const handleTextColorChange = (newTextColor: string) => {
    updateNote(note.id, { textColor: newTextColor });
    setIsTextColorOpen(false);
  };

  // Change font size
  const handleFontSizeChange = (newSize: string) => {
    updateNote(note.id, { fontSize: newSize });
  };

  // Change font family
  const handleFontFamilyChange = (newFamily: string) => {
    updateNote(note.id, { fontFamily: newFamily });
    setIsFontFamilyOpen(false);
  };

  // Change kanban status
  const handleKanbanStatusChange = (newStatus: string) => {
    updateNote(note.id, { kanbanStatus: newStatus });
    setIsKanbanStatusOpen(false);
  };

  // File upload handler
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      await uploadAttachment(file, note.id);
    } catch (err) {
      console.error('File upload error:', err);
      toast.error('อัปโหลดไฟล์ไม่สำเร็จ');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'small':
        return 'text-xs';
      case 'large':
        return 'text-base';
      default:
        return 'text-sm';
    }
  };

  const getFontFamilyClass = () => {
    switch (fontFamily) {
      case 'handwriting':
        return 'font-handwriting text-[17px] leading-relaxed';
      case 'serif':
        return 'font-serif-note text-sm';
      case 'mono':
        return 'font-mono-note text-xs';
      case 'sans':
      default:
        return 'font-sans-note text-sm';
    }
  };

  const isCompact = size.width < 340;
  const isNarrow = size.width < 270;

  const currentKanbanObj = KANBAN_STATUSES.find((k) => k.value === kanbanStatus) || KANBAN_STATUSES[0];
  const attachments = note.attachments || [];

  return (
    <>
      <div
        id={`note-card-${note.id}`}
        style={{
          left: `${pos.x}px`,
          top: `${pos.y}px`,
          width: `${size.width}px`,
          height: `${size.height}px`,
          backgroundColor: paperColor,
          color: textColor,
          transform: isDragging
            ? `scale(1.03) rotate(${rotation}deg)`
            : isFocused
            ? `scale(1.02) rotate(${rotation}deg)`
            : `rotate(${rotation}deg)`,
          zIndex: isDragging || resizingDir
            ? 9999
            : isConnectingSource
            ? 8888
            : customZIndex !== undefined
            ? customZIndex
            : note.isPinned
            ? 30
            : 10,
          boxShadow: isDragging || resizingDir
            ? '0 25px 50px -12px rgba(0, 0, 0, 0.4)'
            : isHighlighted
            ? '0 0 0 3px #6366F1, 0 10px 25px -5px rgba(99, 102, 241, 0.35)'
            : isFocused
            ? '0 0 0 2px #6366F1, 0 10px 20px -5px rgba(99, 102, 241, 0.2)'
            : isConnectingSource
            ? '0 0 0 4px #6366F1, 0 10px 25px -5px rgba(99, 102, 241, 0.5)'
            : '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          transition: isDragging || resizingDir || isRotating
            ? 'none'
            : 'box-shadow 0.25s ease-out, transform 0.2s ease-out, opacity 0.25s ease-out',
        }}
        data-note-card="true"
        className={`sticky-note-item absolute rounded-sm p-3.5 sm:p-4 pt-3.5 flex flex-col justify-between select-none cursor-grab active:cursor-grabbing border-t-2 transition-all duration-200 ${
          note.isPinned ? 'ring-2 ring-indigo-500/50' : ''
        } ${
          isHighlighted
            ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-white dark:ring-offset-slate-900'
            : isFocused
            ? 'ring-1 ring-indigo-400/80'
            : ''
        } ${
          isConnectingMode && !isConnectingSource ? 'hover:ring-4 hover:ring-indigo-400 cursor-pointer' : ''
        }`}
        onClick={() => onBringToFront?.()}
        onFocusCapture={() => onBringToFront?.()}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onDoubleClick={(e) => {
          e.stopPropagation();
          // Never open fullscreen when double-clicking on buttons, controls, inputs, or .no-drag elements
          if (
            (e.target as HTMLElement).closest('button') ||
            (e.target as HTMLElement).closest('.no-drag') ||
            (e.target as HTMLElement).closest('input') ||
            (e.target as HTMLElement).closest('textarea')
          ) {
            return;
          }
          if (onOpenFullscreen) onOpenFullscreen(note);
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setContextMenu({ isOpen: true, x: e.clientX, y: e.clientY });
        }}
      >
        {/* ── Tape (when not pinned) - Dedicated Drag Handle ── */}
        {!note.isPinned && (
          <div
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-30 cursor-grab active:cursor-grabbing group/tape transition-transform hover:scale-105 select-none"
            style={{ touchAction: 'none' }}
            title="คลิกค้างแล้วลากเพื่อย้ายแผ่นโน้ต (หรือแตะลากบนมือถือ)"
          >
            <div className="w-28 h-5 bg-white/40 dark:bg-white/20 backdrop-blur-md shadow-xs border border-white/40 -rotate-1 rounded-xs transition group-hover/tape:bg-white/60 dark:group-hover/tape:bg-white/30" />
          </div>
        )}

        {/* ── Visual Push Pin Badge at Top-Right (as requested) ── */}
        {note.isPinned && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              togglePin(note.id);
            }}
            className="no-drag absolute -top-2.5 -right-2.5 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center shadow-md border-2 border-white z-30 cursor-pointer hover:scale-110 transition active:scale-95"
            title="คลิกเพื่อยกเลิกการปักหมุด"
          >
            <Pin size={12} className="fill-current" />
          </div>
        )}

        {/* ── Top Header Controls (Adaptive to Note Width) ── */}
        <div
          style={{ touchAction: 'none' }}
          className="flex items-center justify-between gap-1 mb-1.5 shrink-0 w-full overflow-hidden cursor-grab active:cursor-grabbing select-none"
        >
          <div className="flex items-center gap-0.5 shrink-0">
            {/* Rotate Button (ตรงมุมซ้ายบน - ลากขึ้นหมุนขวา ลากลงหมุนซ้าย) */}
            <button
              type="button"
              onMouseDown={handleRotateMouseDown}
              onDoubleClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                handleResetRotation(e);
              }}
              onClick={(e) => {
                e.stopPropagation();
              }}
              className={`p-1 rounded hover:bg-black/15 transition flex items-center gap-0.5 cursor-ns-resize ${
                isRotating
                  ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-100/70 dark:bg-indigo-950/70 ring-2 ring-indigo-500 scale-105'
                  : rotation !== 0
                  ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-black/5'
                  : 'opacity-40 hover:opacity-100'
              }`}
              title={`คลิกค้างแล้วเลื่อนขึ้นเพื่อหมุนขวา / เลื่อนลงเพื่อหมุนซ้าย (ดับเบิลคลิกเพื่อรีเซ็ต 0°)`}
            >
              <RotateCw size={12} className={rotation !== 0 ? 'text-indigo-600' : ''} />
              {(rotation !== 0 || isRotating) && (
                <span className="text-[9px] font-mono leading-none">{rotation > 0 ? `+${rotation}` : rotation}°</span>
              )}
            </button>

            {note.isLocked && (
              <button
                onClick={() => {
                  if (!isVaultUnlocked && onUnlockRequest) onUnlockRequest();
                }}
                className="p-1 rounded hover:bg-black/10 transition"
                title="โน้ตเข้ารหัส E2EE"
              >
                <Lock size={12} className="text-amber-700" />
              </button>
            )}

            {/* Pin toggle */}
            <button
              onClick={() => togglePin(note.id)}
              className={`p-1 rounded hover:bg-black/10 transition ${
                note.isPinned ? 'text-indigo-600' : 'opacity-40 hover:opacity-100'
              }`}
              title={note.isPinned ? 'ยกเลิกการปักหมุด' : 'ปักหมุดบนบอร์ด'}
            >
              <Pin size={12} className={note.isPinned ? 'fill-current' : ''} />
            </button>

            {/* Favorite toggle */}
            <button
              onClick={() => toggleFavorite(note.id)}
              className={`p-1 rounded hover:bg-black/10 transition ${
                note.isFavorite ? 'text-amber-500' : 'opacity-40 hover:opacity-100'
              }`}
              title={note.isFavorite ? 'ยกเลิกรายการโปรด' : 'เพิ่มในรายการโปรด'}
            >
              <Star size={12} className={note.isFavorite ? 'fill-current' : ''} />
            </button>

            {/* Connect Note button */}
            <button
              type="button"
              onClick={() => onStartConnect && onStartConnect(note.id)}
              className={`p-1 rounded hover:bg-black/10 transition ${
                isConnectingSource ? 'bg-indigo-600 text-white shadow-xs' : ''
              }`}
              style={{ color: isConnectingSource ? '#FFFFFF' : textColor }}
              title="เชื่อมโยงโน้ตนี้กับโน้ตอื่นด้วยเส้นลูกศร"
            >
              <Link2 size={12} />
            </button>
          </div>

          {/* Styling controls (Adaptive based on width) */}
          <div className="flex items-center gap-0.5 opacity-90 hover:opacity-100 transition shrink-0">
            {/* Attach File Button (hidden on narrow) */}
            {!isNarrow && (
              <>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="p-1 rounded hover:bg-black/10 transition relative"
                  title="แนบไฟล์ (รูปภาพ, PDF, เอกสาร ฯลฯ)"
                >
                  <Paperclip size={12} />
                  {attachments.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-600 text-white rounded-full text-[8px] flex items-center justify-center font-bold">
                      {attachments.length}
                    </span>
                  )}
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </>
            )}

            {/* Font Family Picker (hidden on compact) */}
            {!isCompact && (
              <div className="relative">
                <button
                  ref={fontFamilyBtnRef}
                  onClick={() => {
                    setIsFontFamilyOpen(!isFontFamilyOpen);
                    setIsColorPickerOpen(false);
                    setIsTextColorOpen(false);
                    setIsMoveBoardOpen(false);
                    setIsKanbanStatusOpen(false);
                  }}
                  className="px-1 py-0.5 rounded hover:bg-black/10 transition text-[9px] font-bold"
                  title="เปลี่ยนแบบอักษร (Sans / ลายมือ / Serif / Mono)"
                >
                  ฟอนต์
                </button>

                {isFontFamilyOpen && (
                  <ViewportPopover
                    isOpen={isFontFamilyOpen}
                    onClose={() => setIsFontFamilyOpen(false)}
                    triggerRef={fontFamilyBtnRef}
                    placement="bottom-end"
                    offset={4}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1.5 shadow-xl w-28 animate-fade-in text-slate-800 dark:text-slate-100"
                  >
                    <p className="text-[10px] font-bold text-slate-400 mb-1 px-1">แบบอักษร:</p>
                    {FONT_FAMILIES.map((ff) => (
                      <button
                        key={ff.value}
                        onClick={() => handleFontFamilyChange(ff.value)}
                        className={`w-full text-left px-2 py-1 rounded text-xs transition flex items-center justify-between ${
                          fontFamily === ff.value
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span className={ff.className}>{ff.label}</span>
                        {fontFamily === ff.value && <Check size={11} />}
                      </button>
                    ))}
                  </ViewportPopover>
                )}
              </div>
            )}

            {/* Paper Color button */}
            <div className="relative">
              <button
                ref={paperColorBtnRef}
                onClick={() => {
                  setIsColorPickerOpen(!isColorPickerOpen);
                  setIsTextColorOpen(false);
                  setIsFontFamilyOpen(false);
                  setIsMoveBoardOpen(false);
                  setIsKanbanStatusOpen(false);
                }}
                className="p-1 rounded hover:bg-black/10 transition"
                title="เปลี่ยนสีกระดาษโน้ต"
              >
                <Palette size={12} />
              </button>

              {isColorPickerOpen && (
                <ViewportPopover
                  isOpen={isColorPickerOpen}
                  onClose={() => setIsColorPickerOpen(false)}
                  triggerRef={paperColorBtnRef}
                  placement="bottom-end"
                  offset={4}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2 shadow-xl flex gap-1.5 flex-wrap w-36 animate-fade-in text-slate-800 dark:text-slate-100"
                >
                  <p className="w-full text-[10px] font-bold text-slate-400 mb-1 px-1">สีกระดาษ:</p>
                  {PAPER_COLORS.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => handleColorChange(c.bg)}
                      className="w-5 h-5 rounded-full border border-slate-300 shadow-sm transition hover:scale-110 flex items-center justify-center"
                      style={{ backgroundColor: c.bg }}
                      title={c.name}
                    >
                      {paperColor === c.bg && <Check size={10} className="text-slate-800" />}
                    </button>
                  ))}
                </ViewportPopover>
              )}
            </div>

            {/* Text Ink Color button (hidden on narrow) */}
            {!isNarrow && (
              <div className="relative">
                <button
                  ref={textColorBtnRef}
                  onClick={() => {
                    setIsTextColorOpen(!isTextColorOpen);
                    setIsColorPickerOpen(false);
                    setIsFontFamilyOpen(false);
                    setIsMoveBoardOpen(false);
                    setIsKanbanStatusOpen(false);
                  }}
                  className="p-1 rounded hover:bg-black/10 transition font-bold text-xs"
                  title="เปลี่ยนสีหมึกตัวอักษร"
                >
                  <Type size={12} />
                </button>

                {isTextColorOpen && (
                  <ViewportPopover
                    isOpen={isTextColorOpen}
                    onClose={() => setIsTextColorOpen(false)}
                    triggerRef={textColorBtnRef}
                    placement="bottom-end"
                    offset={4}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2 shadow-xl flex gap-1.5 flex-wrap w-36 animate-fade-in text-slate-800 dark:text-slate-100"
                  >
                    <p className="w-full text-[10px] font-bold text-slate-400 mb-1 px-1">สีหมึกตัวอักษร:</p>
                    {TEXT_COLORS.map((tc) => (
                      <button
                        key={tc.name}
                        onClick={() => handleTextColorChange(tc.color)}
                        className="w-5 h-5 rounded-full border border-slate-300 shadow-sm transition hover:scale-110 flex items-center justify-center text-[10px]"
                        style={{ backgroundColor: tc.color }}
                        title={tc.name}
                      >
                        {textColor === tc.color && <Check size={10} className={tc.color === '#F8FAFC' ? 'text-slate-800' : 'text-white'} />}
                      </button>
                    ))}
                  </ViewportPopover>
                )}
              </div>
            )}

            {/* Font Size Selector (hidden on compact) */}
            {!isCompact && (
              <div className="flex bg-black/10 rounded overflow-hidden">
                {FONT_SIZES.map((fs) => (
                  <button
                    key={fs.value}
                    onClick={() => handleFontSizeChange(fs.value)}
                    className={`px-1 py-0.5 text-[8px] font-bold ${
                      fontSize === fs.value ? 'bg-black/20' : 'hover:bg-black/5'
                    }`}
                  >
                    {fs.label}
                  </button>
                ))}
              </div>
            )}

            {/* More Menu (Move board, font sizes in compact mode, etc.) */}
            <div className="relative">
              <button
                ref={moreBtnRef}
                onClick={() => {
                  setIsMoveBoardOpen(!isMoveBoardOpen);
                  setIsColorPickerOpen(false);
                  setIsTextColorOpen(false);
                  setIsFontFamilyOpen(false);
                  setIsKanbanStatusOpen(false);
                }}
                className="p-1 rounded hover:bg-black/10 transition"
                title="ตัวเลือกเพิ่มเติม"
              >
                <MoreHorizontal size={12} />
              </button>

              {isMoveBoardOpen && (
                <ViewportPopover
                  isOpen={isMoveBoardOpen}
                  onClose={() => setIsMoveBoardOpen(false)}
                  triggerRef={moreBtnRef}
                  placement="bottom-end"
                  offset={4}
                  className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 min-w-[170px] animate-fade-in text-slate-800 dark:text-slate-100 space-y-2"
                >
                  {/* Compact Mode: Font Size Selector */}
                  {isCompact && (
                    <div className="border-b border-slate-100 dark:border-slate-700 pb-2">
                      <p className="text-[10px] font-bold text-slate-400 mb-1 px-1">ขนาดตัวอักษร:</p>
                      <div className="flex bg-slate-100 dark:bg-slate-700 p-0.5 rounded-lg">
                        {FONT_SIZES.map((fs) => (
                          <button
                            key={fs.value}
                            onClick={() => handleFontSizeChange(fs.value)}
                            className={`flex-1 py-0.5 text-[9px] font-bold rounded ${
                              fontSize === fs.value
                                ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-400 shadow-xs'
                                : 'text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {fs.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Compact Mode: Font Family */}
                  {isCompact && (
                    <div className="border-b border-slate-100 dark:border-slate-700 pb-2">
                      <p className="text-[10px] font-bold text-slate-400 mb-1 px-1">แบบอักษร:</p>
                      <div className="grid grid-cols-2 gap-1">
                        {FONT_FAMILIES.map((ff) => (
                          <button
                            key={ff.value}
                            onClick={() => handleFontFamilyChange(ff.value)}
                            className={`px-1.5 py-1 text-[10px] rounded text-left truncate ${
                              fontFamily === ff.value
                                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 font-bold'
                                : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {ff.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Narrow Mode: Text Ink Colors */}
                  {isNarrow && (
                    <div className="border-b border-slate-100 dark:border-slate-700 pb-2">
                      <p className="text-[10px] font-bold text-slate-400 mb-1 px-1">สีหมึกตัวอักษร:</p>
                      <div className="flex gap-1 flex-wrap">
                        {TEXT_COLORS.map((tc) => (
                          <button
                            key={tc.name}
                            onClick={() => handleTextColorChange(tc.color)}
                            className="w-4 h-4 rounded-full border border-slate-300 shadow-sm"
                            style={{ backgroundColor: tc.color }}
                            title={tc.name}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Narrow Mode: Attach File */}
                  {isNarrow && (
                    <div className="border-b border-slate-100 dark:border-slate-700 pb-2">
                      <button
                        onClick={() => {
                          fileInputRef.current?.click();
                          setIsMoveBoardOpen(false);
                        }}
                        className="w-full flex items-center gap-1.5 px-2 py-1 rounded text-xs hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                      >
                        <Paperclip size={12} />
                        <span>แนบไฟล์ ({attachments.length})</span>
                      </button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </div>
                  )}

                  {/* Move to Board */}
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 mb-1.5 px-1">ย้ายไปที่กระดาน:</p>
                    <div className="space-y-1 max-h-36 overflow-y-auto">
                      {boards.map((b) => {
                        const isCurrent = note.boardId === b.id;
                        return (
                          <button
                            key={b.id}
                            onClick={async () => {
                              await updateNote(note.id, { boardId: b.id });
                              setIsMoveBoardOpen(false);
                              fetchNotes({ isArchived: false });
                            }}
                            className={`w-full flex items-center gap-2 px-2 py-1 rounded-lg text-xs font-semibold text-left transition ${
                              isCurrent
                                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold'
                                : 'hover:bg-slate-100 dark:hover:bg-slate-700'
                            }`}
                          >
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: b.color || '#4F46E5' }}
                            />
                            <span className="truncate flex-1">{b.name}</span>
                            {isCurrent && <Check size={12} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Delete to Trash option in menu */}
                  <div className="border-t border-slate-100 dark:border-slate-700 pt-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsMoveBoardOpen(false);
                        deleteNote(note.id);
                      }}
                      className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition text-left"
                    >
                      <Trash2 size={13} />
                      <span>ย้ายโน้ตไปที่ถังขยะ</span>
                    </button>
                  </div>
                </ViewportPopover>
              )}
            </div>

            {/* Share Note Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsShareModalOpen(true);
              }}
              className="p-1 rounded hover:bg-black/10 transition"
              style={{ color: textColor }}
              title="แชร์โน้ตนี้"
            >
              <Share2 size={12} className={note.shareCode ? 'text-indigo-600' : ''} />
            </button>

            {/* Open note in Fullscreen focus mode */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onOpenFullscreen) onOpenFullscreen(note);
              }}
              className="p-1 rounded hover:bg-black/10 transition flex items-center justify-center"
              style={{ color: textColor }}
              title="ขยายขนาดโน้ต"
            >
              <Maximize2 size={12} />
            </button>

            {/* Delete to trash */}
            <button
              type="button"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                deleteNote(note.id);
              }}
              className="p-1 rounded hover:bg-rose-500/20 hover:text-rose-700 transition cursor-pointer"
              title="ลบลงถังขยะ"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* ── Kanban Status Quick Switcher Badge ── */}
        <div className="flex items-center justify-between mb-1">
          <div className="relative">
            <button
              ref={kanbanBtnRef}
              onClick={() => setIsKanbanStatusOpen(!isKanbanStatusOpen)}
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 transition ${currentKanbanObj.color}`}
            >
              <span>{currentKanbanObj.label}</span>
              <span className="text-[9px]">▾</span>
            </button>

            {isKanbanStatusOpen && (
              <ViewportPopover
                isOpen={isKanbanStatusOpen}
                onClose={() => setIsKanbanStatusOpen(false)}
                triggerRef={kanbanBtnRef}
                placement="bottom-start"
                offset={4}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1 shadow-lg w-28 text-slate-800 dark:text-slate-100 animate-fade-in no-drag"
              >
                {KANBAN_STATUSES.map((k) => (
                  <button
                    key={k.value}
                    onClick={() => handleKanbanStatusChange(k.value)}
                    className={`w-full text-left px-2 py-1 rounded text-xs font-semibold flex items-center justify-between ${
                      kanbanStatus === k.value ? 'bg-slate-100 dark:bg-slate-700 font-bold' : 'hover:bg-slate-50'
                    }`}
                  >
                    <span>{k.label}</span>
                    {kanbanStatus === k.value && <Check size={11} />}
                  </button>
                ))}
              </ViewportPopover>
            )}
          </div>

          {isUploading && (
            <span className="text-[10px] text-indigo-600 font-bold animate-pulse">กำลังอัปโหลด...</span>
          )}
        </div>

        {/* ── Note Title Input ── */}
        <div className="mb-1.5 shrink-0 px-1">
          {note.isLocked && !isVaultUnlocked ? (
            <div className="font-bold text-sm tracking-tight line-clamp-1 opacity-80 px-1">
              {note.title || 'โน้ตที่เข้ารหัสลับ'}
            </div>
          ) : (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onFocus={() => onBringToFront?.()}
              onBlur={handleBlur}
              placeholder="หัวข้อโน้ต..."
              className={`w-full font-bold bg-transparent border-b border-black/10 focus:border-black/30 focus:outline-none px-1.5 pb-0.5 placeholder-black/30 ${getFontFamilyClass()}`}
              style={{ color: textColor }}
            />
          )}
        </div>

        {/* ── File Attachments Gallery / List ── */}
        {attachments.length > 0 && (
          <div className="mb-2 no-drag space-y-1.5 max-h-32 overflow-y-auto pr-1">
            {attachments.map((att) => {
              const isImg = att.mimeType.startsWith('image/');
              const isPdf = att.mimeType.includes('pdf');
              const isAudio = att.mimeType.startsWith('audio/') || /\.(webm|mp3|wav|m4a|aac|ogg)$/i.test(att.originalName || att.filename);
              const host = typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:5000` : 'http://localhost:5000';
              const fileUrl = `${host}${att.url}`;

              return (
                <div
                  key={att.id}
                  className="flex items-center justify-between gap-1.5 p-1.5 bg-black/5 hover:bg-black/10 rounded-lg text-xs transition border border-black/5"
                >
                  <div className="flex items-center gap-1.5 overflow-hidden flex-1">
                    {isImg ? (
                      <img
                        src={fileUrl}
                        alt={att.originalName}
                        onClick={() => setPreviewImage(fileUrl)}
                        className="w-8 h-8 object-cover rounded cursor-pointer shrink-0 border border-black/10 shadow-xs"
                      />
                    ) : isPdf ? (
                      <span className="p-1.5 bg-rose-500/20 text-rose-700 rounded shrink-0">
                        <FileText size={14} />
                      </span>
                    ) : isAudio ? (
                      <span className="p-1.5 bg-violet-500/20 text-violet-700 rounded shrink-0" title="ไฟล์เสียง">
                        <Volume2 size={14} />
                      </span>
                    ) : (
                      <span className="p-1.5 bg-indigo-500/20 text-indigo-700 rounded shrink-0">
                        <File size={14} />
                      </span>
                    )}

                    <div className="overflow-hidden flex-1">
                      <p className="text-[11px] font-semibold truncate leading-tight">{att.originalName}</p>
                      <span className="text-[9px] opacity-60">
                        {(att.size / 1024).toFixed(1)} KB {isPdf ? '• PDF' : isImg ? '• รูปภาพ' : isAudio ? '• ไฟล์เสียง' : ''}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5 shrink-0">
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      download={att.originalName}
                      className="p-1 rounded hover:bg-black/10 text-slate-700 dark:text-slate-200 transition"
                      title="ดาวน์โหลด / เปิดดูไฟล์"
                    >
                      <Download size={12} />
                    </a>
                    <button
                      onClick={() => deleteAttachment(att.id, note.id)}
                      className="p-1 rounded hover:bg-rose-500/20 text-rose-600 transition"
                      title="ลบไฟล์แนบ"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Note Content Area ── */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {isEncrypted ? (
            <div
              onClick={() => {
                if (onUnlockRequest) onUnlockRequest();
              }}
              className="text-xs italic cursor-pointer p-2 rounded bg-black/5 hover:bg-black/10 transition leading-relaxed h-full overflow-y-auto no-drag"
            >
              {displayContent}
            </div>
          ) : (
            <div
              onDoubleClick={(e) => {
                e.stopPropagation();
                if (onOpenFullscreen) onOpenFullscreen(note);
              }}
              className={`w-full h-full overflow-y-auto leading-relaxed cursor-text ${getFontSizeClass()} ${getFontFamilyClass()}`}
              style={{ color: textColor }}
            >
              <StickyContentEditable
                html={displayContent}
                onChange={(newHtml) => {
                  setContent(newHtml);
                }}
                onFocus={() => onBringToFront?.()}
                onBlur={handleBlur}
                disabled={note.isLocked}
                placeholder="เขียนข้อความของคุณตรงนี้..."
                className="w-full h-full prose dark:prose-invert max-w-none text-inherit leading-relaxed"
                style={{ color: textColor }}
              />
            </div>
          )}
        </div>

        {/* ── Note Bottom Bar ── */}
        <div
          style={{ touchAction: 'none' }}
          className="flex items-center justify-between pt-1.5 mt-1 border-t border-black/10 text-[10px] opacity-70 shrink-0 relative cursor-grab active:cursor-grabbing select-none"
        >
          <div className="flex items-center gap-1 truncate max-w-[140px]">
            {note.notebook && <span>📁 {note.notebook.name}</span>}
            {note.labels && note.labels.length > 0 && (
              <span className="truncate">#{note.labels[0].name}</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center text-black/40 hover:text-black/80 transition" title="คลิกหรือแตะลากแผ่นโน้ตเพื่อย้ายตำแหน่ง">
              <GripHorizontal size={14} />
            </div>
          </div>
        </div>

        {/* ── RESIZE HANDLES (Left, Right, Bottom, Bottom-Right, Bottom-Left) ── */}
        <div
          onMouseDown={(e) => handleResizeStart(e, 'right')}
          onTouchStart={(e) => handleResizeTouchStart(e, 'right')}
          style={{ touchAction: 'none' }}
          className="no-drag absolute top-2 right-0 bottom-3 w-2 cursor-ew-resize hover:bg-indigo-500/20 transition-colors z-20"
          title="ลากขอบขวาเพื่อปรับความกว้าง"
        />
        <div
          onMouseDown={(e) => handleResizeStart(e, 'left')}
          onTouchStart={(e) => handleResizeTouchStart(e, 'left')}
          style={{ touchAction: 'none' }}
          className="no-drag absolute top-2 left-0 bottom-3 w-2 cursor-ew-resize hover:bg-indigo-500/20 transition-colors z-20"
          title="ลากขอบซ้ายเพื่อปรับความกว้าง"
        />
        <div
          onMouseDown={(e) => handleResizeStart(e, 'bottom')}
          onTouchStart={(e) => handleResizeTouchStart(e, 'bottom')}
          style={{ touchAction: 'none' }}
          className="no-drag absolute bottom-0 left-3 right-3 h-2 cursor-ns-resize hover:bg-indigo-500/20 transition-colors z-20"
          title="ลากขอบล่างเพื่อปรับความสูง"
        />
        <div
          onMouseDown={(e) => handleResizeStart(e, 'bottom-right')}
          onTouchStart={(e) => handleResizeTouchStart(e, 'bottom-right')}
          style={{ touchAction: 'none' }}
          className="no-drag absolute bottom-0 right-0 w-4 h-4 cursor-se-resize flex items-end justify-end p-0.5 text-black/30 hover:text-black/80 transition-colors z-30"
          title="ลากมุมขวาล่างเพื่อปรับทั้งกว้างและสูง"
        >
          <svg viewBox="0 0 10 10" className="w-2.5 h-2.5 fill-current">
            <path d="M9 9H7V7h2v2zm0-4H7V3h2v2zm-4 4H3V7h2v2z" />
          </svg>
        </div>
        <div
          onMouseDown={(e) => handleResizeStart(e, 'bottom-left')}
          onTouchStart={(e) => handleResizeTouchStart(e, 'bottom-left')}
          style={{ touchAction: 'none' }}
          className="no-drag absolute bottom-0 left-0 w-4 h-4 cursor-sw-resize flex items-end justify-start p-0.5 text-black/30 hover:text-black/80 transition-colors z-30"
          title="ลากมุมซ้ายล่างเพื่อปรับทั้งกว้างและสูง"
        >
          <svg viewBox="0 0 10 10" className="w-2.5 h-2.5 fill-current">
            <path d="M1 9h2V7H1v2zm0-4h2V3H1v2zm4 4h2V7H5v2z" />
          </svg>
        </div>
      </div>

      {/* Full Image Preview Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={previewImage}
              alt="Preview"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-3 -right-3 p-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-full shadow-lg hover:scale-110 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Context Menu with Viewport Collision Detection */}
      <ViewportContextMenu
        isOpen={contextMenu.isOpen}
        x={contextMenu.x}
        y={contextMenu.y}
        onClose={() => setContextMenu({ isOpen: false, x: 0, y: 0 })}
      >
        <div className="space-y-0.5 min-w-[160px]">
          <button
            type="button"
            onClick={() => {
              setContextMenu({ isOpen: false, x: 0, y: 0 });
              if (onOpenFullscreen) onOpenFullscreen(note);
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left font-medium text-xs transition"
          >
            <Maximize2 size={13} className="text-indigo-500" />
            <span>ขยายขนาดโน้ต</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setContextMenu({ isOpen: false, x: 0, y: 0 });
              setIsShareModalOpen(true);
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left font-medium text-xs transition text-indigo-600 dark:text-indigo-400"
          >
            <Share2 size={13} />
            <span>แชร์โน้ตนี้</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setContextMenu({ isOpen: false, x: 0, y: 0 });
              togglePin(note.id);
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left font-medium text-xs transition"
          >
            <Pin size={13} className={note.isPinned ? 'fill-current text-indigo-600' : 'text-slate-400'} />
            <span>{note.isPinned ? 'ถอดหมุด' : 'ปักหมุด'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setContextMenu({ isOpen: false, x: 0, y: 0 });
              toggleFavorite(note.id);
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left font-medium text-xs transition"
          >
            <Star size={13} className={note.isFavorite ? 'fill-current text-amber-500' : 'text-slate-400'} />
            <span>{note.isFavorite ? 'ลบออกจากรายการโปรด' : 'เพิ่มในรายการโปรด'}</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              setContextMenu({ isOpen: false, x: 0, y: 0 });
              handleRotateNote(e);
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left font-medium text-xs transition text-indigo-600 dark:text-indigo-400"
          >
            <RotateCw size={13} />
            <span>หมุนโน้ต (+5°) [ปัจจุบัน: {rotation}°]</span>
          </button>
          {rotation !== 0 && (
            <button
              type="button"
              onClick={(e) => {
                setContextMenu({ isOpen: false, x: 0, y: 0 });
                handleResetRotation(e);
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left font-medium text-xs transition text-slate-500"
            >
              <span>↺ รีเซ็ตการหมุน (0°)</span>
            </button>
          )}
          <hr className="my-1 border-slate-100 dark:border-slate-800" />
          <button
            type="button"
            onClick={() => {
              setContextMenu({ isOpen: false, x: 0, y: 0 });
              deleteNote(note.id);
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 text-left font-medium text-xs transition"
          >
            <Trash2 size={13} />
            <span>ย้ายไปถังขยะ</span>
          </button>
        </div>
      </ViewportContextMenu>

      {/* Share Note Modal */}
      <ShareNoteModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        noteId={note.id}
        noteTitle={note.title || title}
        isLocked={note.isLocked}
      />
    </>
  );
}
