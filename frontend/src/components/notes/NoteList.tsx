import React, { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { formatDistanceToNow } from 'date-fns';
import { Pin, Trash2, Copy, Lock, Unlock, Book, Maximize2, Share2, Bell, MoreVertical } from 'lucide-react';
import { Note } from '@/types';
import { useNoteStore } from '@/store/noteStore';
import { useAuthStore } from '@/store/authStore';
import { useReminderStore } from '@/store/reminderStore';
import ShareNoteModal from './ShareNoteModal';
import NoteReminderModal from './NoteReminderModal';
import { FONT_PRESETS } from './editorExtensions';
import { EncryptionService } from '@/utils/encryption';
import { stripHtmlTags } from '@/utils/editorHelper';
import ViewportPopover from '../ui/ViewportPopover';

interface NoteListProps {
  notes: Note[];
  onUnlockRequest?: () => void;
  onOpenFullscreen?: (note: Note) => void;
}

const formatReminderDate = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = d.toDateString() === tomorrow.toDateString();
    const time = d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    if (isToday) return `วันนี้ ${time}`;
    if (isTomorrow) return `พรุ่งนี้ ${time}`;
    return `${d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })} ${time}`;
  } catch {
    return '';
  }
};

function NoteListItem({
  note,
  onUnlockRequest,
  onOpenFullscreen,
  onOpenShare,
  onOpenReminder,
}: {
  note: Note;
  onUnlockRequest?: () => void;
  onOpenFullscreen?: (note: Note) => void;
  onOpenShare: (note: Note) => void;
  onOpenReminder: (note: Note) => void;
}) {
  const router = useRouter();
  const { deleteNote, duplicateNote, togglePin, toggleNoteLock } = useNoteStore();
  const isVaultUnlocked = useAuthStore((state) => state.isVaultUnlocked);
  const remindersByNote = useReminderStore((state) => state.remindersByNote);
  const reminder = remindersByNote[note.id];

  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const moreBtnRef = useRef<HTMLButtonElement>(null);

  const fontPreset = FONT_PRESETS.find(
    (f) =>
      f.id === note.fontFamily ||
      f.family === note.fontFamily ||
      f.id.toLowerCase() === String(note.fontFamily).toLowerCase() ||
      f.name.toLowerCase().includes(String(note.fontFamily).toLowerCase())
  );

  // Content preview logic with E2EE support
  let previewText = note.content;
  let isEncrypted = false;

  if (note.isLocked) {
    if (isVaultUnlocked) {
      try {
        const parsed = JSON.parse(note.content);
        if (parsed.encrypted && parsed.iv) {
          previewText = EncryptionService.getInstance().decrypt(parsed.encrypted, parsed.iv, note.salt || undefined);
        }
      } catch {
        // Not parsed JSON or failed decrypt
      }
    } else {
      isEncrypted = true;
      previewText = '🔒 เนื้อหานี้ถูกเข้ารหัสลับด้วย Master Password กรุณาปลดล็อกเพื่อดู';
    }
  }

  const cleanPreview = stripHtmlTags(previewText);

  return (
    <div
      onClick={() => {
        if (note.isLocked && !isVaultUnlocked && onUnlockRequest) {
          onUnlockRequest();
          return;
        }
        if (onOpenFullscreen) {
          onOpenFullscreen(note);
          return;
        }
        router.push(`/notes/${note.id}`);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        if (onOpenFullscreen) onOpenFullscreen(note);
      }}
      className="py-3 px-4 sm:px-5 flex items-center justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-700/30 active:bg-slate-100/50 dark:active:bg-slate-700/50 transition cursor-pointer group"
    >
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        {/* Accent dot indicator with soft ring */}
        <div
          className="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-2 ring-black/5 dark:ring-white/10 shadow-xs"
          style={{ backgroundColor: note.color || '#6366F1' }}
        />

        <div className="min-w-0 flex-1">
          {/* Title Row */}
          <div className="flex items-center gap-2">
            <h4
              className="font-semibold text-sm text-slate-900 dark:text-white truncate"
              style={{ fontFamily: fontPreset?.family }}
            >
              {note.title || 'ไม่มีชื่อบันทึก'}
            </h4>
            {note.isPinned && (
              <Pin size={12} className="text-indigo-500 fill-indigo-500 flex-shrink-0" />
            )}
            {/* Lock / E2EE status button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleNoteLock(note, onUnlockRequest);
              }}
              className={`p-0.5 rounded transition cursor-pointer shrink-0 ${
                note.isLocked
                  ? isVaultUnlocked
                    ? 'text-emerald-500 hover:text-emerald-600'
                    : 'text-amber-500 hover:text-amber-600 animate-pulse'
                  : 'text-slate-400 opacity-40 hover:opacity-100 hover:text-amber-500'
              }`}
              title={
                note.isLocked
                  ? isVaultUnlocked
                    ? 'โน้ตนี้ปลดล็อกแล้ว (คลิกเพื่อยกเลิกการเข้ารหัส/ล็อก)'
                    : 'โน้ตถูกล็อกและเข้ารหัสลับ E2EE (คลิกเพื่อปลดล็อก)'
                  : 'คลิกเพื่อเข้ารหัสและล็อกโน้ตนี้ (E2EE)'
              }
            >
              {note.isLocked ? (
                isVaultUnlocked ? <Unlock size={12} /> : <Lock size={12} />
              ) : (
                <Unlock size={12} />
              )}
            </button>
          </div>

          {/* Snippet / Content Preview (1 line) */}
          {cleanPreview && (
            <p
              className={`text-xs mt-0.5 line-clamp-1 leading-normal ${
                isEncrypted
                  ? 'text-amber-600 dark:text-amber-400 italic'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
              style={{ fontFamily: fontPreset?.family }}
            >
              {cleanPreview}
            </p>
          )}

          {/* Metadata Row (Notebook, Reminder, Labels, Date) */}
          <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-slate-400">
            {note.notebook && (
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                <Book size={11} /> {note.notebook.name}
              </span>
            )}
            {reminder && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenReminder(note);
                }}
                className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/20 hover:scale-105 transition cursor-pointer select-none"
                title="คลิกเพื่อแก้ไขการเตือนความจำ"
              >
                <Bell size={10} className="fill-current animate-pulse text-amber-500" />
                <span>{formatReminderDate(reminder.reminderDateTime)}</span>
              </button>
            )}
            {note.labels &&
              note.labels.map((lbl) => (
                <span
                  key={lbl.id}
                  className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                  style={{ backgroundColor: `${lbl.color}20`, color: lbl.color }}
                >
                  #{lbl.name}
                </span>
              ))}
            <span>•</span>
            <span className="text-[11px] text-slate-400">
              {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
            </span>
          </div>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Quick action buttons on Desktop (Hover/Focus) */}
        <div className="hidden sm:flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
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
            className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-200/70 dark:hover:bg-slate-700 transition"
            title="ดูและแก้ไขโน้ตนี้แบบเต็มจอ"
          >
            <Maximize2 size={14} />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenReminder(note);
            }}
            className={`p-1.5 rounded-lg transition hover:bg-slate-200/70 dark:hover:bg-slate-700 ${
              reminder
                ? 'text-amber-500 hover:text-amber-600'
                : 'text-slate-400 hover:text-amber-500'
            }`}
            title={
              reminder
                ? `เตือนความจำ: ${formatReminderDate(reminder.reminderDateTime)} (คลิกเพื่อแก้ไข)`
                : 'ตั้งเวลาแจ้งเตือน (เตือนความจำ)'
            }
          >
            <Bell size={14} className={reminder ? 'fill-current' : ''} />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              togglePin(note.id);
            }}
            className={`p-1.5 rounded-lg transition hover:bg-slate-200/70 dark:hover:bg-slate-700 ${
              note.isPinned
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-slate-400 hover:text-indigo-600'
            }`}
            title={note.isPinned ? 'ยกเลิกปักหมุด' : 'ปักหมุด'}
          >
            <Pin size={14} className={note.isPinned ? 'fill-current' : ''} />
          </button>
        </div>

        {/* Mobile quick reminder bell button if reminder is active */}
        {reminder && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenReminder(note);
            }}
            className="sm:hidden p-1.5 rounded-lg text-amber-500 hover:text-amber-600"
            title="แก้ไขการเตือนความจำ"
          >
            <Bell size={14} className="fill-current" />
          </button>
        )}

        {/* More actions trigger button (•••) */}
        <button
          ref={moreBtnRef}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsMoreOpen((prev) => !prev);
          }}
          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/70 dark:hover:bg-slate-700 transition"
          title="ตัวเลือกเพิ่มเติม"
        >
          <MoreVertical size={15} />
        </button>

        {/* More Dropdown using ViewportPopover for zero screen overflow */}
        <ViewportPopover
          isOpen={isMoreOpen}
          onClose={() => setIsMoreOpen(false)}
          triggerRef={moreBtnRef}
          placement="bottom-end"
          className="w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-1 text-xs divide-y divide-slate-100 dark:divide-slate-700"
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
                onOpenReminder(note);
              }}
              className="w-full text-left px-3 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-200"
            >
              <Bell size={13} className={reminder ? 'fill-amber-500 text-amber-500' : ''} />
              <span>{reminder ? 'แก้ไขการเตือนความจำ' : 'ตั้งเวลาแจ้งเตือน'}</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsMoreOpen(false);
                toggleNoteLock(note, onUnlockRequest);
              }}
              className="w-full text-left px-3 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-200"
            >
              {note.isLocked ? (
                isVaultUnlocked ? <Unlock size={13} className="text-emerald-500" /> : <Lock size={13} className="text-amber-500" />
              ) : (
                <Unlock size={13} className="text-slate-400" />
              )}
              <span>{note.isLocked ? (isVaultUnlocked ? 'ยกเลิกการเข้ารหัสและปลดล็อก' : 'ปลดล็อกโน้ตที่เข้ารหัส') : 'เข้ารหัสและล็อกโน้ต (E2EE)'}</span>
            </button>
          </div>

          <div className="py-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsMoreOpen(false);
                onOpenShare(note);
              }}
              className="w-full text-left px-3 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-200"
            >
              <Share2 size={13} className="text-indigo-500" />
              <span>แชร์โน้ตนี้</span>
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
          </div>

          <div className="py-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsMoreOpen(false);
                deleteNote(note.id);
              }}
              className="w-full text-left px-3 py-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 text-rose-600 dark:text-rose-400"
            >
              <Trash2 size={13} />
              <span>ย้ายไปถังขยะ</span>
            </button>
          </div>
        </ViewportPopover>
      </div>
    </div>
  );
}

export default function NoteList({ notes, onUnlockRequest, onOpenFullscreen }: NoteListProps) {
  const [shareNote, setShareNote] = useState<Note | null>(null);
  const [selectedReminderNote, setSelectedReminderNote] = useState<Note | null>(null);

  const pinnedNotes = notes.filter((n) => n.isPinned);
  const regularNotes = notes.filter((n) => !n.isPinned);
  const hasSeparation = pinnedNotes.length > 0 && regularNotes.length > 0;

  return (
    <div className="space-y-6">
      {hasSeparation ? (
        <>
          {/* Pinned Section */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              <Pin size={13} className="fill-current" />
              <span>โน้ตที่ปักหมุด ({pinnedNotes.length})</span>
            </div>
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-700/80 overflow-hidden shadow-xs divide-y divide-slate-100/80 dark:divide-slate-700/50">
              {pinnedNotes.map((note) => (
                <NoteListItem
                  key={note.id}
                  note={note}
                  onUnlockRequest={onUnlockRequest}
                  onOpenFullscreen={onOpenFullscreen}
                  onOpenShare={setShareNote}
                  onOpenReminder={setSelectedReminderNote}
                />
              ))}
            </div>
          </div>

          {/* Regular Notes Section */}
          <div className="space-y-2.5">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              โน้ตอื่นๆ ({regularNotes.length})
            </div>
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-700/80 overflow-hidden shadow-xs divide-y divide-slate-100/80 dark:divide-slate-700/50">
              {regularNotes.map((note) => (
                <NoteListItem
                  key={note.id}
                  note={note}
                  onUnlockRequest={onUnlockRequest}
                  onOpenFullscreen={onOpenFullscreen}
                  onOpenShare={setShareNote}
                  onOpenReminder={setSelectedReminderNote}
                />
              ))}
            </div>
          </div>
        </>
      ) : (
        /* Single Container when all notes are pinned or all are regular */
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-700/80 overflow-hidden shadow-xs divide-y divide-slate-100/80 dark:divide-slate-700/50">
          {notes.map((note) => (
            <NoteListItem
              key={note.id}
              note={note}
              onUnlockRequest={onUnlockRequest}
              onOpenFullscreen={onOpenFullscreen}
              onOpenShare={setShareNote}
              onOpenReminder={setSelectedReminderNote}
            />
          ))}
        </div>
      )}

      {/* Share Note Modal */}
      {shareNote && (
        <ShareNoteModal
          isOpen={Boolean(shareNote)}
          onClose={() => setShareNote(null)}
          noteId={shareNote.id}
          noteTitle={shareNote.title}
          isLocked={shareNote.isLocked}
        />
      )}

      {/* Reminder Modal */}
      {selectedReminderNote && (
        <NoteReminderModal
          isOpen={Boolean(selectedReminderNote)}
          onClose={() => setSelectedReminderNote(null)}
          noteId={selectedReminderNote.id}
          noteTitle={selectedReminderNote.title}
        />
      )}
    </div>
  );
}
