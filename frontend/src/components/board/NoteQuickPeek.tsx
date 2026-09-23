import React, { useEffect, useRef, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Maximize2,
  Edit3,
  Lock,
  Pin,
  Star,
  Paperclip,
  CheckCircle2,
  Clock,
  Tag,
  ArrowRight,
} from 'lucide-react';
import { Note } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { EncryptionService } from '@/utils/encryption';
import { stripHtmlTags } from '@/utils/editorHelper';
import { isStickerNote } from './stickerData';

interface NoteQuickPeekProps {
  note: Note;
  anchorRect: DOMRect | null;
  onClose: () => void;
  onEdit?: (note: Note) => void;
  onFullscreen?: (note: Note) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

const KANBAN_LABELS: Record<string, { label: string; color: string }> = {
  todo: { label: 'To Do', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300' },
  doing: { label: 'In Progress', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300' },
  done: { label: 'Done', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300' },
};

type Placement = 'right' | 'left' | 'top' | 'bottom';

export default function NoteQuickPeek({
  note,
  anchorRect,
  onClose,
  onEdit,
  onFullscreen,
  onMouseEnter,
  onMouseLeave,
}: NoteQuickPeekProps) {
  const isVaultUnlocked = useAuthStore((state) => state.isVaultUnlocked);
  const cardRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;

  // Process and decrypt content for clean human-readable preview
  const { previewText, isEncrypted, isSticker, stickerUrl } = useMemo(() => {
    if (isStickerNote(note)) {
      const match = note.content.match(/\[STICKER\]:(.+)/);
      return {
        previewText: '',
        isEncrypted: false,
        isSticker: true,
        stickerUrl: match ? match[1] : null,
      };
    }

    let text = note.content;
    let encrypted = false;

    if (note.isLocked) {
      if (isVaultUnlocked) {
        try {
          const parsed = JSON.parse(note.content);
          if (parsed.encrypted && parsed.iv) {
            text = EncryptionService.getInstance().decrypt(
              parsed.encrypted,
              parsed.iv,
              note.salt || undefined
            );
          }
        } catch (e) {
          // Keep raw text
        }
      } else {
        encrypted = true;
        text = 'โน้ตนี้ถูกเข้ารหัสลับด้วย Master Password (E2EE)';
      }
    }

    return {
      previewText: stripHtmlTags(text).trim(),
      isEncrypted: encrypted,
      isSticker: false,
      stickerUrl: null,
    };
  }, [note, isVaultUnlocked]);

  // Smart Magnetic Positioning for Desktop & Tablet Popover
  // Automatically anchors tightly beside target note and adapts direction (right/left/top/bottom)
  const { popoverStyle, placement, arrowStyle } = useMemo(() => {
    if (isMobile || !anchorRect || typeof window === 'undefined') {
      return {
        popoverStyle: {} as React.CSSProperties,
        placement: 'right' as Placement,
        arrowStyle: {} as React.CSSProperties,
      };
    }

    const cardWidth = 320;
    const cardHeight = 330;
    const gap = 12;
    const padding = 16;
    const { innerWidth, innerHeight } = window;

    const noteCenterX = anchorRect.left + anchorRect.width / 2;
    const noteCenterY = anchorRect.top + anchorRect.height / 2;

    const canFitRight = anchorRect.right + gap + cardWidth <= innerWidth - padding;
    const canFitLeft = anchorRect.left - gap - cardWidth >= padding;
    const canFitBottom = anchorRect.bottom + gap + cardHeight <= innerHeight - padding;
    const canFitTop = anchorRect.top - gap - cardHeight >= padding;

    let chosenPlacement: Placement = 'right';

    if (canFitRight) {
      chosenPlacement = 'right';
    } else if (canFitLeft) {
      chosenPlacement = 'left';
    } else if (canFitBottom) {
      chosenPlacement = 'bottom';
    } else if (canFitTop) {
      chosenPlacement = 'top';
    } else {
      // Horizontal fallback: choose whichever side has more room
      const spaceRight = innerWidth - anchorRect.right;
      const spaceLeft = anchorRect.left;
      chosenPlacement = spaceRight >= spaceLeft ? 'right' : 'left';
    }

    let left = 0;
    let top = 0;
    let arrowCss: React.CSSProperties = {};

    if (chosenPlacement === 'right') {
      left = anchorRect.right + gap;
      top = noteCenterY - cardHeight / 2;
      top = Math.max(padding, Math.min(innerHeight - cardHeight - padding, top));
      left = Math.max(padding, Math.min(innerWidth - cardWidth - padding, left));

      const rawArrowY = noteCenterY - top;
      const clampedArrowY = Math.max(26, Math.min(cardHeight - 26, rawArrowY));
      arrowCss = {
        top: `${Math.round(clampedArrowY)}px`,
        left: '-7px',
        transform: 'translateY(-50%) rotate(45deg)',
      };
    } else if (chosenPlacement === 'left') {
      left = anchorRect.left - gap - cardWidth;
      top = noteCenterY - cardHeight / 2;
      top = Math.max(padding, Math.min(innerHeight - cardHeight - padding, top));
      left = Math.max(padding, Math.min(innerWidth - cardWidth - padding, left));

      const rawArrowY = noteCenterY - top;
      const clampedArrowY = Math.max(26, Math.min(cardHeight - 26, rawArrowY));
      arrowCss = {
        top: `${Math.round(clampedArrowY)}px`,
        right: '-7px',
        transform: 'translateY(-50%) rotate(45deg)',
      };
    } else if (chosenPlacement === 'top') {
      top = anchorRect.top - gap - cardHeight;
      left = noteCenterX - cardWidth / 2;
      left = Math.max(padding, Math.min(innerWidth - cardWidth - padding, left));
      top = Math.max(padding, Math.min(innerHeight - cardHeight - padding, top));

      const rawArrowX = noteCenterX - left;
      const clampedArrowX = Math.max(26, Math.min(cardWidth - 26, rawArrowX));
      arrowCss = {
        left: `${Math.round(clampedArrowX)}px`,
        bottom: '-7px',
        transform: 'translateX(-50%) rotate(45deg)',
      };
    } else {
      // bottom
      top = anchorRect.bottom + gap;
      left = noteCenterX - cardWidth / 2;
      left = Math.max(padding, Math.min(innerWidth - cardWidth - padding, left));
      top = Math.max(padding, Math.min(innerHeight - cardHeight - padding, top));

      const rawArrowX = noteCenterX - left;
      const clampedArrowX = Math.max(26, Math.min(cardWidth - 26, rawArrowX));
      arrowCss = {
        left: `${Math.round(clampedArrowX)}px`,
        top: '-7px',
        transform: 'translateX(-50%) rotate(45deg)',
      };
    }

    return {
      popoverStyle: {
        position: 'fixed' as const,
        left: `${Math.round(left)}px`,
        top: `${Math.round(top)}px`,
        width: `${cardWidth}px`,
        maxHeight: `${cardHeight}px`,
      },
      placement: chosenPlacement,
      arrowStyle: arrowCss,
    };
  }, [isMobile, anchorRect]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Close on click outside for Desktop Popover
  useEffect(() => {
    if (isMobile) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // Use slight delay to allow clicking inside
    const timer = setTimeout(() => {
      window.addEventListener('pointerdown', handleClickOutside);
    }, 50);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('pointerdown', handleClickOutside);
    };
  }, [isMobile, onClose]);

  const kanbanInfo = KANBAN_LABELS[note.kanbanStatus || 'todo'] || KANBAN_LABELS.todo;
  const noteColor = note.color || '#FEF08A';

  if (!mounted || typeof document === 'undefined') {
    return null;
  }

  // ─────────────────────────────────────────────────────────────
  // 1. Mobile Bottom Sheet View (< 768px)
  // ─────────────────────────────────────────────────────────────
  if (isMobile) {
    const mobileContent = (
      <div className="fixed inset-0 z-[999999] flex flex-col justify-end">
        {/* Backdrop */}
        <div
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-fade-in"
        />

        {/* Bottom Sheet Drawer */}
        <div
          ref={cardRef}
          className="relative w-full bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl border-t border-slate-200 dark:border-slate-800 p-5 max-h-[75vh] flex flex-col animate-slide-up z-10"
        >
          {/* Pull handle indicator */}
          <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-3" />

          {/* Header Row */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="w-4 h-4 rounded-full shrink-0 border border-black/10 shadow-xs"
                style={{ backgroundColor: noteColor }}
              />
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${kanbanInfo.color}`}>
                {kanbanInfo.label}
              </span>
              {note.isPinned && (
                <span className="text-amber-500 flex items-center gap-0.5 text-xs font-bold">
                  <Pin size={12} className="fill-current" />
                </span>
              )}
              {note.isLocked && (
                <span className="text-rose-500 flex items-center gap-0.5 text-xs font-bold">
                  <Lock size={12} />
                </span>
              )}
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition active:scale-95"
              aria-label="ปิด"
            >
              <X size={18} />
            </button>
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug mb-2">
            {note.title || 'โน้ตไม่มีชื่อ'}
          </h3>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar my-2 pr-1 text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-h-48 whitespace-pre-wrap">
            {isSticker && stickerUrl ? (
              <div className="flex justify-center p-3">
                <img src={stickerUrl} alt="Sticker" className="w-28 h-28 object-contain" />
              </div>
            ) : isEncrypted ? (
              <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl text-rose-700 dark:text-rose-300 text-xs font-medium">
                <Lock size={15} />
                <span>{previewText}</span>
              </div>
            ) : previewText ? (
              <p>{previewText}</p>
            ) : (
              <p className="italic text-slate-400 dark:text-slate-500 text-xs">
                (โน้ตนี้ยังไม่มีข้อความ)
              </p>
            )}
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 mt-2">
            {onFullscreen && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onFullscreen(note);
                }}
                className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
              >
                <Maximize2 size={14} />
                <span>ขยายเต็มจอ</span>
              </button>
            )}

            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(note);
                }}
                className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-500/20 transition active:scale-95 cursor-pointer"
              >
                <Edit3 size={14} />
                <span>แก้ไขโน้ต</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
    return createPortal(mobileContent, document.body);
  }

  // Determine arrow border classes based on placement to create seamless triangle pointer
  const arrowBorderClass =
    placement === 'right'
      ? 'border-l border-b'
      : placement === 'left'
      ? 'border-r border-t'
      : placement === 'top'
      ? 'border-r border-b'
      : 'border-l border-t';

  // ─────────────────────────────────────────────────────────────
  // 2. Desktop & Tablet/iPad Smart Magnetic Popover (>= 768px)
  // ─────────────────────────────────────────────────────────────
  const desktopPopover = (
    <div
      ref={cardRef}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={popoverStyle}
      className="z-[999999] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-700/90 p-4 flex flex-col animate-in fade-in zoom-in-95 duration-150 select-none text-slate-800 dark:text-slate-100 before:content-[''] before:absolute before:inset-[-12px] before:z-[-2] before:pointer-events-auto"
    >
      {/* Magnetic Direction Pointer Arrow */}
      <div
        style={arrowStyle}
        className={`absolute w-3.5 h-3.5 bg-white dark:bg-slate-900 ${arrowBorderClass} border-slate-200/90 dark:border-slate-700/90 shadow-2xs z-10 pointer-events-none`}
      />

      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-100 dark:border-slate-800 shrink-0 relative z-20">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="w-3.5 h-3.5 rounded-full shrink-0 border border-black/15 shadow-2xs"
            style={{ backgroundColor: noteColor }}
            title="สีโน้ต"
          />
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${kanbanInfo.color}`}>
            {kanbanInfo.label}
          </span>
          {note.isPinned && (
            <span className="text-amber-500" title="ปักหมุดแล้ว">
              <Pin size={12} className="fill-current" />
            </span>
          )}
          {note.isLocked && (
            <span className="text-rose-500" title="เข้ารหัสลับ E2EE">
              <Lock size={12} />
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
          title="ปิดการพรีวิว (Esc)"
        >
          <X size={15} />
        </button>
      </div>

      {/* Note Title */}
      <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-snug line-clamp-2 mb-1.5 shrink-0 relative z-20">
        {note.title || 'โน้ตไม่มีชื่อ'}
      </h4>

      {/* Body Preview */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 my-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap select-text relative z-20">
        {isSticker && stickerUrl ? (
          <div className="flex justify-center p-2">
            <img src={stickerUrl} alt="Sticker" className="w-24 h-24 object-contain" />
          </div>
        ) : isEncrypted ? (
          <div className="flex items-center gap-2 p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl text-rose-700 dark:text-rose-300 text-[11px] font-medium">
            <Lock size={13} className="shrink-0" />
            <span>{previewText}</span>
          </div>
        ) : previewText ? (
          <p className="line-clamp-6">{previewText}</p>
        ) : (
          <p className="italic text-slate-400 dark:text-slate-500 text-[11px]">
            (โน้ตนี้ยังไม่มีข้อความ)
          </p>
        )}
      </div>

      {/* Footer Quick Action Row */}
      <div className="flex items-center justify-between gap-2 pt-2.5 mt-1 border-t border-slate-100 dark:border-slate-800 shrink-0 relative z-20">
        <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1 font-mono">
          <Clock size={11} />
          <span>Quick Peek 100%</span>
        </span>

        <div className="flex items-center gap-1.5">
          {onFullscreen && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onFullscreen(note);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[11px] flex items-center gap-1 transition active:scale-95 cursor-pointer"
              title="ขยายโน้ตเต็มจอ"
            >
              <Maximize2 size={12} />
              <span>ขยาย</span>
            </button>
          )}

          {onEdit && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(note);
              }}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm transition active:scale-95 cursor-pointer"
              title="เข้าสู่หน้าแก้ไขโน้ต"
            >
              <Edit3 size={12} />
              <span>แก้ไข</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(desktopPopover, document.body);
}
