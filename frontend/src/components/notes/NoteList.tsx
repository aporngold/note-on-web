import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { formatDistanceToNow } from 'date-fns';
import { Pin, Trash2, Copy, Lock, Unlock, Book, Tag, Maximize2, Share2, Bell } from 'lucide-react';
import { Note } from '@/types';
import { useNoteStore } from '@/store/noteStore';
import { useAuthStore } from '@/store/authStore';
import { useReminderStore } from '@/store/reminderStore';
import ShareNoteModal from './ShareNoteModal';
import NoteReminderModal from './NoteReminderModal';
import { FONT_PRESETS } from './editorExtensions';

interface NoteListProps {
  notes: Note[];
  onUnlockRequest?: () => void;
  onOpenFullscreen?: (note: Note) => void;
}

export default function NoteList({ notes, onUnlockRequest, onOpenFullscreen }: NoteListProps) {
  const router = useRouter();
  const { deleteNote, duplicateNote, togglePin, toggleNoteLock } = useNoteStore();
  const isVaultUnlocked = useAuthStore((state) => state.isVaultUnlocked);
  const remindersByNote = useReminderStore((state) => state.remindersByNote);
  const [shareNote, setShareNote] = useState<Note | null>(null);
  const [selectedReminderNote, setSelectedReminderNote] = useState<Note | null>(null);

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

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
      <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
        {notes.map((note) => {
          const reminder = remindersByNote[note.id];
          const fontPreset = FONT_PRESETS.find(
            (f) =>
              f.id === note.fontFamily ||
              f.family === note.fontFamily ||
              f.id.toLowerCase() === String(note.fontFamily).toLowerCase() ||
              f.name.toLowerCase().includes(String(note.fontFamily).toLowerCase())
          );

          return (
            <div
              key={note.id}
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
              className="p-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition cursor-pointer group"
            >
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: note.color || '#6366F1' }}
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4
                      className="font-semibold text-sm text-slate-900 dark:text-white truncate"
                      style={{ fontFamily: fontPreset?.family }}
                    >
                      {note.title || 'ไม่มีชื่อบันทึก'}
                    </h4>
                  {note.isPinned && (
                    <Pin size={13} className="text-indigo-500 fill-indigo-500 flex-shrink-0" />
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
                      isVaultUnlocked ? <Unlock size={13} /> : <Lock size={13} />
                    ) : (
                      <Unlock size={13} />
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-slate-400">
                  {note.notebook && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                      <Book size={11} /> {note.notebook.name}
                    </span>
                  )}
                  {reminder && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedReminderNote(note);
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/20 hover:scale-105 transition cursor-pointer select-none"
                      title="คลิกเพื่อแก้ไขการเตือนความจำ"
                    >
                      <Bell size={10} className="fill-current animate-pulse text-amber-500" />
                      <span>{formatReminderDate(reminder.reminderDateTime)}</span>
                    </button>
                  )}
                  {note.labels && note.labels.map((lbl) => (
                    <span
                      key={lbl.id}
                      className="text-[10px] px-1.5 py-0.2 rounded"
                      style={{ backgroundColor: `${lbl.color}20`, color: lbl.color }}
                    >
                      #{lbl.name}
                    </span>
                  ))}
                  <span>•</span>
                  <span>{formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}</span>
                </div>
              </div>
            </div>

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
                className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600"
                title="ดูและแก้ไขโน้ตนี้แบบเต็มจอ (เหมือนหน้าคัมบัง)"
              >
                <Maximize2 size={15} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNoteLock(note, onUnlockRequest);
                }}
                className={`p-1.5 rounded-lg transition hover:bg-slate-200 dark:hover:bg-slate-600 ${
                  note.isLocked
                    ? isVaultUnlocked
                      ? 'text-emerald-500 hover:text-emerald-600'
                      : 'text-amber-500 hover:text-amber-600'
                    : 'text-slate-400 hover:text-amber-500'
                }`}
                title={
                  note.isLocked
                    ? isVaultUnlocked
                      ? 'ยกเลิกการเข้ารหัสและปลดล็อก'
                      : 'ปลดล็อกโน้ตที่เข้ารหัส'
                    : 'เข้ารหัสและล็อกโน้ต (E2EE)'
                }
              >
                {note.isLocked ? (isVaultUnlocked ? <Unlock size={15} /> : <Lock size={15} />) : <Unlock size={15} />}
              </button>

              {/* Reminder Bell Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedReminderNote(note);
                }}
                className={`p-1.5 rounded-lg transition hover:bg-slate-200 dark:hover:bg-slate-600 ${
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
                <Bell size={15} className={reminder ? 'fill-current' : ''} />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  togglePin(note.id);
                }}
                className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600"
                title="ปักหมุด"
              >
                <Pin size={15} className={note.isPinned ? 'fill-current' : ''} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShareNote(note);
                }}
                className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600"
                title="แชร์โน้ตนี้"
              >
                <Share2 size={15} className={note.shareCode ? 'text-blue-500' : ''} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  duplicateNote(note.id);
                }}
                className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600"
                title="คัดลอก"
              >
                <Copy size={15} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNote(note.id);
                }}
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
                title="ย้ายไปถังขยะ"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        );
      })}
      </div>

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
