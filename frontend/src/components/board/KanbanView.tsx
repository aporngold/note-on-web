import React, { useState } from 'react';
import { Note } from '@/types';
import { useNoteStore } from '@/store/noteStore';
import {
  Plus,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Clock,
  ListTodo,
  Paperclip,
  Trash2,
  Maximize2,
  Pin,
} from 'lucide-react';
import { useRouter } from 'next/router';
import FullscreenNoteModal from '../notes/FullscreenNoteModal';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { EncryptionService } from '@/utils/encryption';
import { stripHtmlTags } from '@/utils/editorHelper';

interface KanbanViewProps {
  notes: Note[];
}

const COLUMNS = [
  {
    id: 'todo',
    title: 'To Do (ต้องทำ)',
    icon: ListTodo,
    badgeBg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
    headerBorder: 'border-t-4 border-amber-400',
    columnBg: 'bg-amber-50/40 dark:bg-slate-900/40',
  },
  {
    id: 'doing',
    title: 'Doing (กำลังทำ)',
    icon: Clock,
    badgeBg: 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300',
    headerBorder: 'border-t-4 border-sky-500',
    columnBg: 'bg-sky-50/40 dark:bg-slate-900/40',
  },
  {
    id: 'done',
    title: 'Done (เสร็จแล้ว)',
    icon: CheckCircle2,
    badgeBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
    headerBorder: 'border-t-4 border-emerald-500',
    columnBg: 'bg-emerald-50/40 dark:bg-slate-900/40',
  },
];

export default function KanbanView({ notes }: KanbanViewProps) {
  const router = useRouter();
  const { updateNote, deleteNote, createNote, activeBoardId, togglePin } = useNoteStore();
  const isVaultUnlocked = useAuthStore((state) => state.isVaultUnlocked);
  const [draggedNoteId, setDraggedNoteId] = useState<string | null>(null);
  const [fullscreenNote, setFullscreenNote] = useState<Note | null>(null);
  const [activeMobileCol, setActiveMobileCol] = useState<string>('todo');

  const handleOpenFullscreen = (n: Note) => {
    if (typeof document !== 'undefined' && !document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    }
    setFullscreenNote(n);
  };

  const handleDragStart = (e: React.DragEvent, noteId: string) => {
    e.dataTransfer.setData('text/plain', noteId);
    setDraggedNoteId(noteId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    const noteId = e.dataTransfer.getData('text/plain') || draggedNoteId;
    if (!noteId) return;

    try {
      await updateNote(noteId, { kanbanStatus: targetStatus });
      toast.success(`ย้ายโน้ตไปยัง ${targetStatus.toUpperCase()}`);
    } catch (err) {
      console.error(err);
    } finally {
      setDraggedNoteId(null);
    }
  };

  const handleAddNoteToColumn = async (status: string) => {
    await createNote({
      title: 'งานใหม่',
      content: '',
      kanbanStatus: status,
      boardId: activeBoardId || undefined,
      color: status === 'done' ? '#BBF7D0' : status === 'doing' ? '#BAE6FD' : '#FEF08A',
    });
  };

  const moveNote = async (id: string, newStatus: string) => {
    await updateNote(id, { kanbanStatus: newStatus });
  };

  return (
    <div className="flex-1 w-full h-full overflow-x-hidden md:overflow-x-auto p-2.5 sm:p-4 md:p-6 bg-slate-50/50 dark:bg-slate-950/50 flex flex-col">
      {/* Mobile Column Switcher Tabs */}
      <div className="flex md:hidden items-center gap-1.5 p-1 bg-slate-200/70 dark:bg-slate-800/70 rounded-2xl mb-2.5 shrink-0 border border-slate-200/80 dark:border-slate-700/80">
        {COLUMNS.map((col) => {
          const count = notes.filter((n) => (n.kanbanStatus || 'todo') === col.id).length;
          const isSelected = activeMobileCol === col.id;
          const ColIcon = col.icon;
          return (
            <button
              key={col.id}
              type="button"
              onClick={() => setActiveMobileCol(col.id)}
              className={`flex-1 py-2 px-1 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 ${
                isSelected
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <ColIcon size={14} className={isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'} />
              <span className="truncate">{col.title.split(' ')[0]}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${col.badgeBg}`}>{count}</span>
            </button>
          );
        })}
      </div>

      <div className="flex-1 w-full min-w-0 md:min-w-[780px] md:grid md:grid-cols-3 gap-4 sm:gap-6 items-start">
        {COLUMNS.map((col) => {
          const colNotes = notes.filter((n) => {
            const status = n.kanbanStatus || 'todo';
            return status === col.id;
          });

          const IconComponent = col.icon;

          return (
            <div
              key={col.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`${
                activeMobileCol === col.id ? 'flex' : 'hidden md:flex'
              } flex-col w-full min-w-0 h-[calc(100vh-230px)] md:h-[calc(100vh-210px)] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm ${col.columnBg} ${col.headerBorder} backdrop-blur-sm overflow-hidden`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between p-3.5 border-b border-slate-200/60 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70">
                <div className="flex items-center gap-2">
                  <IconComponent size={18} className="text-slate-600 dark:text-slate-400" />
                  <h3 className="font-bold text-sm text-slate-800 dark:text-white">
                    {col.title}
                  </h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${col.badgeBg}`}>
                    {colNotes.length}
                  </span>
                </div>

                <button
                  onClick={() => handleAddNoteToColumn(col.id)}
                  className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
                  title="เพิ่มการ์ดในคอลัมน์นี้"
                >
                  <Plus size={16} />
                </button>
              </div>

              {/* Cards Container */}
              <div className="flex-1 p-3 overflow-y-auto space-y-3 scrollbar-thin">
                {colNotes.length === 0 ? (
                  <div className="h-40 border-2 border-dashed border-slate-300 dark:border-slate-700/60 rounded-xl flex flex-col items-center justify-center text-slate-400 text-xs p-4 text-center">
                    <span>ยังไม่มีการ์ดในคอลัมน์นี้</span>
                    <button
                      onClick={() => handleAddNoteToColumn(col.id)}
                      className="mt-2 text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                    >
                      + เพิ่มโน้ตใหม่
                    </button>
                  </div>
                ) : (
                  colNotes.map((note) => {
                    const attachments = note.attachments || [];

                    // Handle encryption & strip HTML tags for clean preview
                    let previewText = note.content || '';
                    if (note.isLocked) {
                      if (isVaultUnlocked) {
                        try {
                          const parsed = JSON.parse(note.content);
                          if (parsed.encrypted && parsed.iv) {
                            previewText = EncryptionService.getInstance().decrypt(parsed.encrypted, parsed.iv);
                          }
                        } catch (e) {
                          // ignore
                        }
                      } else {
                        previewText = '🔒 เนื้อหานี้ถูกเข้ารหัสลับ';
                      }
                    }
                    const cleanPreview = stripHtmlTags(previewText);

                    return (
                      <div
                        key={note.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, note.id)}
                        onClick={() => handleOpenFullscreen(note)}
                        onDoubleClick={() => handleOpenFullscreen(note)}
                        style={{
                          backgroundColor: note.color || '#FEF08A',
                          color: note.textColor || '#0F172A',
                        }}
                        className="p-4 rounded-xl shadow-sm hover:shadow-md border border-black/10 transition-all cursor-grab active:cursor-grabbing group select-none relative cursor-pointer"
                        title="คลิกหรือดับเบิ้ลคลิกเพื่อเปิดแก้ไขเต็มจอ / ลากเพื่อเปลี่ยนสถานะ"
                      >
                        {/* Pin status badge at Top-Right (as in reference) */}
                        {note.isPinned && (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePin(note.id);
                            }}
                            className="absolute -top-2.5 -right-2 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center shadow-md border-2 border-white z-20 cursor-pointer hover:scale-110 transition active:scale-95"
                            title="คลิกเพื่อยกเลิกการปักหมุด"
                          >
                            <Pin size={12} className="fill-current" />
                          </div>
                        )}

                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <h4 className="font-bold text-sm line-clamp-2">
                            {note.title || 'ไม่มีชื่อ'}
                          </h4>

                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenFullscreen(note);
                              }}
                              className="p-1 rounded hover:bg-black/10 text-black/60"
                              title="ดูและแก้ไขโน้ตนี้แบบเต็มจอ"
                            >
                              <Maximize2 size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNote(note.id);
                              }}
                              className="p-1 rounded hover:bg-rose-500/20 text-rose-600"
                              title="ลบลงถังขยะ"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>

                        {cleanPreview && (
                          <p className="text-xs opacity-80 line-clamp-3 mb-2 whitespace-pre-wrap leading-relaxed">
                            {cleanPreview}
                          </p>
                        )}

                        {/* Attachments preview indicator */}
                        {attachments.length > 0 && (
                          <div className="flex items-center gap-1.5 text-[10px] font-semibold opacity-70 mb-2">
                            <Paperclip size={12} />
                            <span>{attachments.length} ไฟล์แนบ</span>
                          </div>
                        )}

                        {/* Bottom Actions and Navigation Arrows */}
                        <div className="flex items-center justify-between pt-2 mt-1 border-t border-black/10 text-[10px]">
                          <div className="flex items-center gap-1 opacity-60">
                            {note.notebook && <span>📁 {note.notebook.name}</span>}
                          </div>

                          <div className="flex items-center gap-1">
                            {col.id !== 'todo' && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveNote(note.id, col.id === 'done' ? 'doing' : 'todo');
                                }}
                                className="p-1 rounded hover:bg-black/10 transition"
                                title="ย้ายไปคอลัมน์ก่อนหน้า"
                              >
                                <ArrowLeft size={13} />
                              </button>
                            )}
                            {col.id !== 'done' && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveNote(note.id, col.id === 'todo' ? 'doing' : 'done');
                                }}
                                className="p-1 rounded hover:bg-black/10 transition"
                                title="ย้ายไปคอลัมน์ถัดไป"
                              >
                                <ArrowRight size={13} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Fullscreen Note Focus Modal */}
      {fullscreenNote && (
        <FullscreenNoteModal
          note={fullscreenNote}
          isOpen={!!fullscreenNote}
          onClose={() => {
            if (typeof document !== 'undefined' && document.fullscreenElement) {
              document.exitFullscreen?.().catch(() => {});
            }
            setFullscreenNote(null);
          }}
        />
      )}
    </div>
  );
}
