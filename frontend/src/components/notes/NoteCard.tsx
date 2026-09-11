import React, { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';
import { Pin, Trash2, Copy, Lock, Book, Tag, Star, Paperclip, Music, Maximize2, Share2, MoreVertical, Edit3 } from 'lucide-react';
import { Note } from '@/types';
import { useNoteStore } from '@/store/noteStore';
import { useAuthStore } from '@/store/authStore';
import { EncryptionService } from '@/utils/encryption';
import { stripHtmlTags } from '@/utils/editorHelper';
import ViewportContextMenu, { ViewportMenuItem } from '../ui/ViewportContextMenu';
import ViewportPopover from '../ui/ViewportPopover';
import ShareNoteModal from './ShareNoteModal';

interface NoteCardProps {
  note: Note;
  onUnlockRequest?: () => void;
  onOpenFullscreen?: (note: Note) => void;
}

export default function NoteCard({ note, onUnlockRequest, onOpenFullscreen }: NoteCardProps) {
  const router = useRouter();
  const { deleteNote, duplicateNote, togglePin, toggleFavorite, setSelectedLabel } = useNoteStore();
  const isVaultUnlocked = useAuthStore((state) => state.isVaultUnlocked);

  // Content preview logic
  let previewText = note.content;
  let isEncrypted = false;

  if (note.isLocked) {
    if (isVaultUnlocked) {
      try {
        const parsed = JSON.parse(note.content);
        if (parsed.encrypted && parsed.iv) {
          previewText = EncryptionService.getInstance().decrypt(parsed.encrypted, parsed.iv);
        }
      } catch (e) {
        // Not parsed JSON or failed decrypt
      }
    } else {
      isEncrypted = true;
      previewText = '🔒 เนื้อหานี้ถูกเข้ารหัสลับด้วย Master Password กรุณาปลดล็อกเพื่อดู';
    }
  }

  // Strip markdown/html tags for clean preview
  const cleanPreview = stripHtmlTags(previewText);

  const [contextMenu, setContextMenu] = useState<{ isOpen: boolean; x: number; y: number }>({
    isOpen: false,
    x: 0,
    y: 0,
  });
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const moreBtnRef = useRef<HTMLButtonElement>(null);

  const handleClick = () => {
    if (note.isLocked && !isVaultUnlocked && onUnlockRequest) {
      onUnlockRequest();
      return;
    }
    if (onOpenFullscreen) {
      onOpenFullscreen(note);
      return;
    }
    router.push(`/notes/${note.id}`);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
    });
  };

  return (
    <div
      onClick={handleClick}
      onDoubleClick={(e) => {
        e.stopPropagation();
        if (onOpenFullscreen) onOpenFullscreen(note);
      }}
      onContextMenu={handleContextMenu}
      className={`group relative bg-white dark:bg-slate-800/90 rounded-2xl p-5 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 cursor-pointer border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between overflow-hidden ${
        note.isPinned ? 'ring-2 ring-indigo-500/30' : ''
      }`}
      style={{
        borderTop: `4px solid ${note.color || '#6366F1'}`,
      }}
    >
      <div>
        {/* Header Badges */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            {note.isLocked && (
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
                  isVaultUnlocked
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                    : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                }`}
              >
                <Lock size={12} />
                {isVaultUnlocked ? 'ปลดล็อกแล้ว' : 'เข้ารหัส E2EE'}
              </span>
            )}

            {note.notebook && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                <Book size={11} />
                {note.notebook.name}
              </span>
            )}

            {note.attachments && note.attachments.length > 0 && (
              <span
                className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400"
                title={`มีไฟล์แนบ ${note.attachments.length} รายการ`}
              >
                <Paperclip size={11} />
                {note.attachments.length}
              </span>
            )}

            {note.shareCode && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsShareModalOpen(true);
                }}
                className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition"
                title="คลิกเพื่อจัดการหรือคัดลอกลิงก์แชร์"
              >
                <Share2 size={11} />
                <span>แชร์อยู่</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Favorite Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(note.id);
              }}
              className={`p-1.5 rounded-lg transition ${
                note.isFavorite
                  ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/50'
                  : 'text-slate-300 dark:text-slate-600 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
              title={note.isFavorite ? 'ยกเลิกรายการโปรด' : 'เพิ่มในรายการโปรด'}
            >
              <Star size={15} className={note.isFavorite ? 'fill-current' : ''} />
            </button>

            {/* Pin Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                togglePin(note.id);
              }}
              className={`p-1.5 rounded-lg transition ${
                note.isPinned
                  ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
              title={note.isPinned ? 'ยกเลิกการปักหมุด' : 'ปักหมุดโน้ต'}
            >
              <Pin size={15} className={note.isPinned ? 'fill-current' : ''} />
            </button>

            {/* Fullscreen Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onOpenFullscreen) {
                  onOpenFullscreen(note);
                } else {
                  router.push(`/notes/${note.id}`);
                }
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              title="ดูและแก้ไขโน้ตนี้แบบเต็มจอ (เหมือนหน้าคัมบัง)"
            >
              <Maximize2 size={15} />
            </button>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2 line-clamp-2 leading-snug">
          {note.title || 'ไม่มีชื่อบันทึก'}
        </h3>

        {/* Content snippet */}
        <p
          className={`text-xs leading-relaxed line-clamp-4 ${
            isEncrypted
              ? 'text-amber-600 dark:text-amber-400 italic'
              : 'text-slate-600 dark:text-slate-300'
          }`}
        >
          {cleanPreview || 'ไม่มีเนื้อหา...'}
        </p>

        {/* Labels list */}
        {note.labels && note.labels.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3 pt-2">
            {note.labels.map((lbl) => (
              <button
                key={lbl.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedLabel(lbl.id);
                }}
                className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md hover:scale-105 transition"
                style={{
                  backgroundColor: `${lbl.color}15`,
                  color: lbl.color,
                }}
                title={`กรองตามป้าย #${lbl.name}`}
              >
                <Tag size={9} />
                {lbl.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 text-[11px] text-slate-400">
        <span>
          {formatDistanceToNow(new Date(note.updatedAt), {
            addSuffix: true,
          })}
        </span>

        {/* Action icons on hover */}
        <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onOpenFullscreen) {
                onOpenFullscreen(note);
              } else {
                router.push(`/notes/${note.id}`);
              }
            }}
            className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
            title="ดูและแก้ไขโน้ตนี้แบบเต็มจอ"
          >
            <Maximize2 size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              duplicateNote(note.id);
            }}
            className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
            title="คัดลอกโน้ต"
          >
            <Copy size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteNote(note.id);
            }}
            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition"
            title="ย้ายไปถังขยะ"
          >
            <Trash2 size={14} />
          </button>

          {/* More options button with Viewport Collision Detection */}
          <div className="relative">
            <button
              ref={moreBtnRef}
              onClick={(e) => {
                e.stopPropagation();
                setIsMoreOpen(!isMoreOpen);
              }}
              className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
              title="เมนูตัวเลือก"
            >
              <MoreVertical size={14} />
            </button>
            <ViewportPopover
              triggerRef={moreBtnRef}
              isOpen={isMoreOpen}
              onClose={() => setIsMoreOpen(false)}
              className="w-44 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-1 text-xs divide-y divide-slate-100 dark:divide-slate-700"
            >
              <div className="py-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMoreOpen(false);
                    if (onOpenFullscreen) onOpenFullscreen(note);
                    else router.push(`/notes/${note.id}`);
                  }}
                  className="w-full text-left px-3 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-200"
                >
                  <Maximize2 size={13} />
                  <span>เปิดอ่าน / แก้ไข</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMoreOpen(false);
                    toggleFavorite(note.id);
                  }}
                  className="w-full text-left px-3 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-200"
                >
                  <Star size={13} className={note.isFavorite ? 'fill-amber-500 text-amber-500' : ''} />
                  <span>{note.isFavorite ? 'ยกเลิกรายการโปรด' : 'เพิ่มในรายการโปรด'}</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMoreOpen(false);
                    togglePin(note.id);
                  }}
                  className="w-full text-left px-3 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-200"
                >
                  <Pin size={13} className={note.isPinned ? 'fill-indigo-500 text-indigo-500' : ''} />
                  <span>{note.isPinned ? 'ยกเลิกปักหมุด' : 'ปักหมุด'}</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMoreOpen(false);
                    duplicateNote(note.id);
                  }}
                  className="w-full text-left px-3 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-200"
                >
                  <Copy size={13} />
                  <span>คัดลอกโน้ต</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMoreOpen(false);
                    setIsShareModalOpen(true);
                  }}
                  className="w-full text-left px-3 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-200"
                >
                  <Share2 size={13} className="text-indigo-500" />
                  <span>แชร์โน้ตนี้</span>
                </button>
              </div>
              <div className="py-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMoreOpen(false);
                    deleteNote(note.id);
                  }}
                  className="w-full text-left px-3 py-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 text-rose-600 font-medium"
                >
                  <Trash2 size={13} />
                  <span>ย้ายไปถังขยะ</span>
                </button>
              </div>
            </ViewportPopover>
          </div>
        </div>
      </div>

      {/* Right-click Viewport Collision-Aware Context Menu */}
      <ViewportContextMenu
        isOpen={contextMenu.isOpen}
        x={contextMenu.x}
        y={contextMenu.y}
        onClose={() => setContextMenu((prev) => ({ ...prev, isOpen: false }))}
      >
        <div className="py-1">
          <ViewportMenuItem
            icon={<Maximize2 size={14} />}
            label="เปิดดู / แก้ไข"
            onClick={() => {
              if (onOpenFullscreen) onOpenFullscreen(note);
              else router.push(`/notes/${note.id}`);
            }}
          />
          <ViewportMenuItem
            icon={<Star size={14} className={note.isFavorite ? 'fill-amber-500 text-amber-500' : ''} />}
            label={note.isFavorite ? 'ยกเลิกรายการโปรด' : 'เพิ่มในรายการโปรด'}
            onClick={() => toggleFavorite(note.id)}
          />
          <ViewportMenuItem
            icon={<Pin size={14} className={note.isPinned ? 'fill-indigo-500 text-indigo-500' : ''} />}
            label={note.isPinned ? 'ยกเลิกการปักหมุด' : 'ปักหมุดโน้ต'}
            onClick={() => togglePin(note.id)}
          />
          <ViewportMenuItem
            icon={<Copy size={14} />}
            label="คัดลอกโน้ตนี้"
            onClick={() => duplicateNote(note.id)}
          />
          <ViewportMenuItem
            icon={<Share2 size={14} className="text-indigo-500" />}
            label="แชร์โน้ตนี้"
            onClick={() => setIsShareModalOpen(true)}
          />
        </div>
        <div className="py-1 border-t border-slate-100 dark:border-slate-800">
          <ViewportMenuItem
            icon={<Trash2 size={14} />}
            label="ย้ายไปถังขยะ"
            danger
            onClick={() => deleteNote(note.id)}
          />
        </div>
      </ViewportContextMenu>

      {/* Share Note Modal */}
      <ShareNoteModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        noteId={note.id}
        noteTitle={note.title}
        isLocked={note.isLocked}
      />
    </div>
  );
}
