import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Trash2, RotateCcw, AlertTriangle, ArrowLeft, RefreshCw, Loader2 } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { useNoteStore } from '@/store/noteStore';
import { useAuthStore } from '@/store/authStore';
import { formatDistanceToNow } from 'date-fns';

export default function TrashPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    trashNotes,
    isTrashLoading,
    fetchTrashNotes,
    restoreNote,
    deleteNote,
    emptyTrash,
  } = useNoteStore();

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchTrashNotes();
    }
  }, [user, fetchTrashNotes]);

  const handleEmptyTrash = () => {
    if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบโน้ตทั้งหมดในถังขยะอย่างถาวร? การกระทำนี้ไม่สามารถย้อนกลับได้')) {
      emptyTrash();
    }
  };

  const handlePermanentDelete = (id: string, title?: string) => {
    if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบโน้ต "${title || 'ไม่มีชื่อ'}" อย่างถาวร?`)) {
      deleteNote(id);
    }
  };

  const safeFormatDate = (dateString?: string | Date) => {
    if (!dateString) return 'แก้ไขล่าสุดไม่นานนี้';
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return 'แก้ไขล่าสุดไม่นานนี้';
      return `แก้ไขล่าสุด: ${formatDistanceToNow(d, { addSuffix: true })}`;
    } catch {
      return 'แก้ไขล่าสุดไม่นานนี้';
    }
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-xs">
              <Trash2 size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  ถังขยะ (Trash)
                </h1>
                {!isTrashLoading && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                    {trashNotes.length} รายการ
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                โน้ตที่ถูกลบจะถูกเก็บไว้ที่นี่ สามารถกู้คืนกลับไปยังกระดานเดิมได้ตลอดเวลา
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => fetchTrashNotes()}
              disabled={isTrashLoading}
              className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition disabled:opacity-50"
              title="รีเฟรชข้อมูลถังขยะ"
            >
              <RefreshCw size={15} className={isTrashLoading ? 'animate-spin text-indigo-600' : ''} />
            </button>

            {trashNotes.length > 0 && (
              <button
                onClick={handleEmptyTrash}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-rose-500/20 transition flex items-center gap-1.5"
              >
                <Trash2 size={15} />
                <span>ล้างถังขยะทั้งหมด</span>
              </button>
            )}
          </div>
        </div>

        {/* Loading Spinner */}
        {isTrashLoading && trashNotes.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-16 text-center space-y-3 shadow-sm my-6">
            <Loader2 size={32} className="animate-spin text-rose-600 mx-auto" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              กำลังโหลดรายการในถังขยะ...
            </p>
          </div>
        ) : trashNotes.length === 0 ? (
          /* Empty Trash State */
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-16 text-center space-y-3 shadow-sm my-6">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/30 text-rose-500 mx-auto flex items-center justify-center shadow-inner">
              <Trash2 size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">
              ถังขยะว่างเปล่า
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              ไม่มีโน้ตที่ถูกทิ้งอยู่ในถังขยะขณะนี้ เมื่อคุณลบโน้ตจากหน้ากระดานหรือสมุดบันทึก โน้ตจะถูกนำมาเก็บไว้ที่นี่
            </p>
            <button
              onClick={() => router.push('/board')}
              className="mt-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition inline-flex items-center gap-1.5"
            >
              <ArrowLeft size={14} />
              <span>กลับสู่หน้ากระดาน</span>
            </button>
          </div>
        ) : (
          /* List of Trash Notes */
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 shadow-sm">
            {trashNotes.map((note) => (
              <div
                key={note.id}
                className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition group"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs border border-black/10"
                      style={{ backgroundColor: note.color || '#FEF08A' }}
                    />
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                      {note.title || 'ไม่มีชื่อบันทึก'}
                    </h4>
                    {note.board && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                        กระดาน: {note.board.name}
                      </span>
                    )}
                    {note.notebook && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300">
                        {note.notebook.name}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    {note.content?.replace(/<[^>]*>?/gm, ' ') || 'ไม่มีเนื้อหา'}
                  </p>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    {safeFormatDate(note.updatedAt)}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => restoreNote(note.id)}
                    className="px-3.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
                    title="กู้คืนโน้ตนี้กลับไปยังกระดานเดิม"
                  >
                    <RotateCcw size={14} />
                    <span>กู้คืน</span>
                  </button>

                  <button
                    onClick={() => handlePermanentDelete(note.id, note.title)}
                    className="px-3.5 py-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
                    title="ลบโน้ตนี้อย่างถาวร (ไม่สามารถย้อนกลับได้)"
                  >
                    <Trash2 size={14} />
                    <span>ลบถาวร</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
