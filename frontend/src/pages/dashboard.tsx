import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Plus, Pin, Filter, X, Sparkles, BookOpen, Star } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import NoteCard from '@/components/notes/NoteCard';
import NoteList from '@/components/notes/NoteList';
import StickyBoard from '@/components/board/StickyBoard';
import KanbanView from '@/components/board/KanbanView';
import MasterPasswordModal from '@/components/notes/MasterPasswordModal';
import FullscreenNoteModal from '@/components/notes/FullscreenNoteModal';
import { useNoteStore } from '@/store/noteStore';
import { useAuthStore } from '@/store/authStore';
import { Note } from '@/types';

export default function Dashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    notes,
    notebooks,
    labels,
    selectedNotebook,
    selectedLabel,
    selectedColor,
    searchQuery,
    viewMode,
    isLoading,
    activeBoardId,
    fetchNotes,
    fetchBoards,
    setSelectedNotebook,
    setSelectedLabel,
    setSelectedColor,
  } = useNoteStore();

  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);
  const [fullscreenNote, setFullscreenNote] = useState<Note | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'pinned' | 'favorites'>('all');

  useEffect(() => {
    if (user) {
      fetchNotes({ isArchived: false });
      fetchBoards();
    }
  }, [user, selectedNotebook, selectedLabel, selectedColor, fetchNotes, fetchBoards]);

  // Client-side search and tab filtering
  const filteredNotes = notes.filter((n) => {
    if (activeTab === 'pinned' && !n.isPinned) return false;
    if (activeTab === 'favorites' && !n.isFavorite) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const titleMatch = n.title?.toLowerCase().includes(q);
    const contentMatch = n.content?.toLowerCase().includes(q);
    return titleMatch || contentMatch;
  });

  // In board mode, show notes belonging to active board (or unassigned notes if on default board)
  const boardNotes = filteredNotes.filter((n) => {
    if (!activeBoardId) return true;
    return n.boardId === activeBoardId;
  });

  const pinnedNotes = filteredNotes.filter((n) => n.isPinned);
  const regularNotes = filteredNotes.filter((n) => !n.isPinned);

  const activeNotebook = notebooks.find((nb) => nb.id === selectedNotebook);
  const activeLabel = labels.find((lbl) => lbl.id === selectedLabel);

  const hasActiveFilter = selectedNotebook || selectedLabel || selectedColor || searchQuery || activeTab !== 'all';

  const clearAllFilters = () => {
    setSelectedNotebook(null);
    setSelectedLabel(null);
    setSelectedColor(null);
    setActiveTab('all');
  };

  return (
    <Layout>
      <div className={`max-w-7xl mx-auto ${viewMode === 'board' ? 'space-y-0' : 'space-y-6'}`}>
        {/* Header Title & Filter Pill (Hidden when on Board mode to let the board use full height and move up) */}
        {viewMode !== 'board' && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {activeNotebook ? activeNotebook.name : activeLabel ? `#${activeLabel.name}` : 'โน้ตทั้งหมด'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  {filteredNotes.length}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                {activeNotebook?.description || 'บันทึกความคิด ไอเดีย และข้อมูลสำคัญของคุณ'}
              </p>
            </div>

            {/* Quick Filter Tabs (All, Pinned, Favorites) */}
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-xs font-semibold self-start sm:self-auto shadow-xs">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-xl transition ${
                  activeTab === 'all'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                ทั้งหมด ({notes.length})
              </button>
              <button
                onClick={() => setActiveTab('pinned')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl transition ${
                  activeTab === 'pinned'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Pin size={13} className="fill-current" />
                <span>ปักหมุด ({notes.filter((n) => n.isPinned).length})</span>
              </button>
              <button
                onClick={() => setActiveTab('favorites')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl transition ${
                  activeTab === 'favorites'
                    ? 'bg-white dark:bg-slate-900 text-amber-500 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Star size={13} className="fill-current" />
                <span>รายการโปรด ({notes.filter((n) => n.isFavorite).length})</span>
              </button>
            </div>
          </div>
        )}

        {/* Active Filters Bar */}
        {hasActiveFilter && (
          <div className="flex items-center gap-2 flex-wrap p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs">
            <span className="flex items-center gap-1.5 font-bold text-slate-500 dark:text-slate-400">
              <Filter size={14} /> ตัวกรองที่เปิดอยู่:
            </span>

            {activeNotebook && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-medium">
                สมุด: {activeNotebook.name}
                <button onClick={() => setSelectedNotebook(null)} className="hover:opacity-75">
                  <X size={12} />
                </button>
              </span>
            )}

            {activeLabel && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-medium">
                ป้าย: #{activeLabel.name}
                <button onClick={() => setSelectedLabel(null)} className="hover:opacity-75">
                  <X size={12} />
                </button>
              </span>
            )}

            {selectedColor && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: selectedColor }}
                />
                สีโน้ต
                <button onClick={() => setSelectedColor(null)} className="hover:opacity-75">
                  <X size={12} />
                </button>
              </span>
            )}

            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                คำค้น: "{searchQuery}"
              </span>
            )}

            <button
              onClick={clearAllFilters}
              className="ml-auto text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
            >
              ล้างตัวกรองทั้งหมด
            </button>
          </div>
        )}

        {viewMode === 'board' ? (
          /* Sticky Board Canvas Mode */
          <StickyBoard notes={boardNotes} />
        ) : viewMode === 'kanban' ? (
          <div className="flex-1 w-full h-[calc(100vh-140px)] rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl overflow-hidden bg-white dark:bg-slate-900">
            <KanbanView notes={filteredNotes} />
          </div>
        ) : filteredNotes.length === 0 && !isLoading ? (
          /* Empty State for Grid & List modes */
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-12 text-center space-y-4 shadow-sm my-8">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-500 mx-auto flex items-center justify-center shadow-inner">
              <BookOpen size={32} />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {hasActiveFilter ? 'ไม่พบโน้ตที่ตรงกับตัวกรอง' : 'ยังไม่มีโน้ตในระบบ'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {hasActiveFilter
                  ? 'ลองเปลี่ยนคำค้นหา หรือล้างตัวกรองที่เลือกไว้'
                  : 'เริ่มต้นสร้างบันทึกแรกของคุณ พร้อมการปกป้องด้วยความปลอดภัยระดับสูง'}
              </p>
            </div>
            {hasActiveFilter ? (
              <button
                onClick={clearAllFilters}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-200 transition"
              >
                ล้างตัวกรอง
              </button>
            ) : (
              <button
                onClick={() => router.push('/notes/new')}
                className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-500/25 hover:from-indigo-500 hover:to-purple-500 transition"
              >
                + สร้างโน้ตแรกของคุณ
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="space-y-8">
            {/* Pinned Notes */}
            {pinnedNotes.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  <Pin size={14} className="fill-current" />
                  <span>โน้ตที่ปักหมุด ({pinnedNotes.length})</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {pinnedNotes.map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      onUnlockRequest={() => setIsVaultModalOpen(true)}
                      onOpenFullscreen={(n) => setFullscreenNote(n)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Regular Notes */}
            {regularNotes.length > 0 && (
              <div className="space-y-3">
                {pinnedNotes.length > 0 && (
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    โน้ตอื่นๆ ({regularNotes.length})
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {regularNotes.map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      onUnlockRequest={() => setIsVaultModalOpen(true)}
                      onOpenFullscreen={(n) => setFullscreenNote(n)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* List Mode */
          <NoteList
            notes={filteredNotes}
            onUnlockRequest={() => setIsVaultModalOpen(true)}
            onOpenFullscreen={(n) => setFullscreenNote(n)}
          />
        )}
      </div>

      <MasterPasswordModal
        isOpen={isVaultModalOpen}
        onClose={() => setIsVaultModalOpen(false)}
        onSuccess={() => fetchNotes({ isArchived: false })}
      />

      {/* Fullscreen Note Focus Modal (เหมือนหน้าคัมบัง ทุกโหมด Grid, List, Kanban, Sticky Board) */}
      {fullscreenNote && (
        <FullscreenNoteModal
          note={fullscreenNote}
          isOpen={!!fullscreenNote}
          onClose={() => {
            setFullscreenNote(null);
            fetchNotes({ isArchived: false });
          }}
        />
      )}
    </Layout>
  );
}
