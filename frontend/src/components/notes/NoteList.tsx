import React from 'react';
import { useRouter } from 'next/router';
import { formatDistanceToNow } from 'date-fns';
import { Pin, Trash2, Copy, Lock, Book, Tag, Maximize2 } from 'lucide-react';
import { Note } from '@/types';
import { useNoteStore } from '@/store/noteStore';
import { useAuthStore } from '@/store/authStore';

interface NoteListProps {
  notes: Note[];
  onUnlockRequest?: () => void;
  onOpenFullscreen?: (note: Note) => void;
}

export default function NoteList({ notes, onUnlockRequest, onOpenFullscreen }: NoteListProps) {
  const router = useRouter();
  const { deleteNote, duplicateNote, togglePin } = useNoteStore();
  const isVaultUnlocked = useAuthStore((state) => state.isVaultUnlocked);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
      <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
        {notes.map((note) => (
          <div
            key={note.id}
            onClick={() => {
              if (note.isLocked && !isVaultUnlocked && onUnlockRequest) {
                onUnlockRequest();
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
                  <h4 className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                    {note.title || 'ไม่มีชื่อบันทึก'}
                  </h4>
                  {note.isPinned && (
                    <Pin size={13} className="text-indigo-500 fill-indigo-500 flex-shrink-0" />
                  )}
                  {note.isLocked && (
                    <Lock
                      size={13}
                      className={
                        isVaultUnlocked ? 'text-emerald-500' : 'text-amber-500'
                      }
                    />
                  )}
                </div>

                <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-slate-400">
                  {note.notebook && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                      <Book size={11} /> {note.notebook.name}
                    </span>
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
        ))}
      </div>
    </div>
  );
}
