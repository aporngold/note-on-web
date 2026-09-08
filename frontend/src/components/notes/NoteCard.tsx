import React from 'react';
import { useRouter } from 'next/router';
import { formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';
import { Pin, Trash2, Copy, Lock, Book, Tag, Star, Paperclip, Music } from 'lucide-react';
import { Note } from '@/types';
import { useNoteStore } from '@/store/noteStore';
import { useAuthStore } from '@/store/authStore';
import { EncryptionService } from '@/utils/encryption';
import { stripHtmlTags } from '@/utils/editorHelper';

interface NoteCardProps {
  note: Note;
  onUnlockRequest?: () => void;
}

export default function NoteCard({ note, onUnlockRequest }: NoteCardProps) {
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

  const handleClick = () => {
    if (note.isLocked && !isVaultUnlocked && onUnlockRequest) {
      onUnlockRequest();
      return;
    }
    router.push(`/notes/${note.id}`);
  };

  return (
    <div
      onClick={handleClick}
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
        </div>
      </div>
    </div>
  );
}
