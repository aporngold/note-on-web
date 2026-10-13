import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Plus, Pin, Filter, X, Sparkles, BookOpen, Star, Bell, CalendarDays, Download, AlertCircle, Clock, Calendar, FileText, Share2 } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import NoteCard from '@/components/notes/NoteCard';
import NoteList from '@/components/notes/NoteList';
import StickyBoard from '@/components/board/StickyBoard';
import KanbanView from '@/components/board/KanbanView';
import MasterPasswordModal from '@/components/notes/MasterPasswordModal';
import FullscreenNoteModal from '@/components/notes/FullscreenNoteModal';
import AISearchModal from '@/components/dashboard/AISearchModal';
import BoardShareModal from '@/components/modals/BoardShareModal';
import SortDropdown from '@/components/ui/SortDropdown';
import { useNoteStore } from '@/store/noteStore';
import { useAuthStore } from '@/store/authStore';
import { Note } from '@/types';
import { sortNotes } from '@/utils/sortHelper';
import { isStickerNote } from '@/components/board/stickerData';
import { useReminderStore } from '@/store/reminderStore';
import { exportNotesToIcs } from '@/utils/calendarExport';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { fetchReminders } = useReminderStore();
  const {
    notes,
    boards,
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
    setSearchQuery,
    sortBy,
    setSortBy,
    activeFocusedNoteId,
  } = useNoteStore();

  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);
  const [fullscreenNote, setFullscreenNote] = useState<Note | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'pinned' | 'favorites' | 'reminders'>('all');
  const [isAiSearchOpen, setIsAiSearchOpen] = useState(false);
  const [isBoardShareModalOpen, setIsBoardShareModalOpen] = useState(false);
  const remindersByNote = useReminderStore((state) => state.remindersByNote);
  const reminderNotesCount = notes.filter((n) => Boolean(remindersByNote[n.id])).length;

  // Seamless Cross-View Focus: Scroll to newly created or active note when switching to Grid or List view
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const focusId = activeFocusedNoteId || sessionStorage.getItem('secure_note_focus_note_id');
    if (!focusId || notes.length === 0) return;

    if (viewMode === 'grid' || viewMode === 'list') {
      const timer = setTimeout(() => {
        const el = document.getElementById(`note-card-${focusId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);

      return () => clearTimeout(timer);
    }
  }, [viewMode, activeFocusedNoteId, notes]);

  useEffect(() => {
    if (router.query.tab === 'reminders') {
      setActiveTab('reminders');
    } else if (!router.query.tab) {
      setActiveTab('all');
    }
  }, [router.query.tab]);

  const handleOpenFullscreen = (n: Note) => {
    setFullscreenNote(n);
  };

  const userId = user?.id;
  useEffect(() => {
    if (userId) {
      fetchNotes({ isArchived: false });
      fetchBoards();
      fetchReminders();
    }
  }, [userId, selectedNotebook, selectedLabel, selectedColor, fetchNotes, fetchBoards, fetchReminders]);

  // Client-side search, tab filtering, and auto-sorting
  const filteredNotes = React.useMemo(() => {
    const seen = new Set<string>();
    const matched = notes.filter((n) => {
      if (!n?.id || seen.has(n.id)) return false;
      seen.add(n.id);
      // Fail-safe: Exclude archived / deleted notes from active dashboard views
      if (n.isArchived) return false;
      // Exclude canvas stickers from standard grid / list views
      if (viewMode !== 'board' && isStickerNote(n)) return false;
      // In board mode, stickers stay attached to canvas
      if (viewMode === 'board' && isStickerNote(n)) return true;
      if (activeTab === 'pinned' && !n.isPinned) return false;
      if (activeTab === 'favorites' && !n.isFavorite) return false;
      if (activeTab === 'reminders' && !remindersByNote[n.id]) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const titleMatch = n.title?.toLowerCase().includes(q);
      const contentMatch = n.content?.toLowerCase().includes(q);
      return titleMatch || contentMatch;
    });

    if (activeTab === 'reminders') {
      return matched.sort((a, b) => {
        const timeA = new Date(remindersByNote[a.id]?.reminderDateTime || 0).getTime();
        const timeB = new Date(remindersByNote[b.id]?.reminderDateTime || 0).getTime();
        return timeA - timeB;
      });
    }

    return sortNotes(matched, sortBy);
  }, [notes, activeTab, searchQuery, sortBy, viewMode, remindersByNote]);

  const defaultBoard = boards.find((b) => b.isDefault) || boards[0];
  const currentActiveBoard = boards.find((b) => b.id === activeBoardId) || defaultBoard;
  const isViewingDefaultBoard = !activeBoardId || activeBoardId === defaultBoard?.id;

  // In board mode, show notes belonging to active board (or unassigned notes if on default board)
  // Board notes should NOT be filtered out by activeTab (reminders/pinned/favorites),
  // but should obey search query if user searches on board.
  const boardNotes = React.useMemo(() => {
    const seen = new Set<string>();
    return notes.filter((n) => {
      if (!n?.id || seen.has(n.id)) return false;
      seen.add(n.id);
      if (n.isArchived) return false;
      if (isViewingDefaultBoard) {
        if (n.boardId && n.boardId !== defaultBoard?.id) return false;
      } else {
        if (n.boardId !== activeBoardId) return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return n.title?.toLowerCase().includes(q) || n.content?.toLowerCase().includes(q);
    });
  }, [notes, isViewingDefaultBoard, defaultBoard?.id, activeBoardId, searchQuery]);

  const pinnedNotes = filteredNotes.filter((n) => n.isPinned);
  const regularNotes = filteredNotes.filter((n) => !n.isPinned);

  // Segment reminder notes into timeline buckets when activeTab === 'reminders'
  const reminderTimelineGroups = React.useMemo(() => {
    if (activeTab !== 'reminders') return null;

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const tomorrowStart = todayStart + 24 * 60 * 60 * 1000;
    const dayAfterTomorrowStart = tomorrowStart + 24 * 60 * 60 * 1000;

    const overdue: Note[] = [];
    const today: Note[] = [];
    const tomorrow: Note[] = [];
    const upcoming: Note[] = [];

    filteredNotes.forEach((n) => {
      const rem = remindersByNote[n.id];
      if (!rem || !rem.reminderDateTime) return;
      const t = new Date(rem.reminderDateTime).getTime();

      if (t < now.getTime()) {
        overdue.push(n);
      } else if (t < tomorrowStart) {
        today.push(n);
      } else if (t < dayAfterTomorrowStart) {
        tomorrow.push(n);
      } else {
        upcoming.push(n);
      }
    });

    return { overdue, today, tomorrow, upcoming };
  }, [activeTab, filteredNotes, remindersByNote]);

  const activeNotebook = notebooks.find((nb) => nb.id === selectedNotebook);
  const activeLabel = labels.find((lbl) => lbl.id === selectedLabel);

  const hasActiveFilter = Boolean(selectedNotebook || selectedLabel || selectedColor || searchQuery.trim());

  const clearAllFilters = () => {
    setSelectedNotebook(null);
    setSelectedLabel(null);
    setSelectedColor(null);
    setSearchQuery('');
  };

  return (
    <Layout>
      <div className={viewMode === 'board' ? 'w-full h-full flex-1 flex flex-col min-h-0' : 'max-w-7xl mx-auto space-y-6'}>
        {/* Header Title & Filter Pill (Hidden when on Board mode to let the board use full height and move up) */}
        {viewMode !== 'board' && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {activeNotebook
                    ? activeNotebook.name
                    : activeLabel
                    ? `#${activeLabel.name}`
                    : activeTab === 'reminders'
                    ? 'เตือนความจำ'
                    : activeTab === 'pinned'
                    ? 'โน้ตที่ปักหมุด'
                    : activeTab === 'favorites'
                    ? 'รายการโปรด'
                    : 'โน้ตทั้งหมด'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300">
                  {filteredNotes.length}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-warm-muted dark:text-warm-darkMuted mt-1">
                {activeNotebook?.description ||
                  (activeTab === 'reminders'
                    ? 'โน้ตที่มีการกำหนดวันและเวลาแจ้งเตือนล่วงหน้า'
                    : activeTab === 'pinned'
                    ? 'โน้ตสำคัญที่คุณปักหมุดไว้ด้านบน'
                    : activeTab === 'favorites'
                    ? 'โน้ตที่คุณทำเครื่องหมายเป็นรายการโปรด'
                    : 'บันทึกความคิด ไอเดีย และข้อมูลสำคัญของคุณ')}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
              {/* Quick Filter Tabs (All, Pinned, Favorites, Reminders) */}
              <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-warm-surface dark:bg-warm-darkSurface border border-warm-border/70 dark:border-warm-darkBorder/70 text-xs font-semibold shadow-2xs">
                <button
                  onClick={() => {
                    setActiveTab('all');
                    if (router.query.tab) {
                      const { tab, ...rest } = router.query;
                      router.push({ pathname: router.pathname, query: rest }, undefined, { shallow: true });
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl transition ${
                    activeTab === 'all'
                      ? 'bg-warm-card dark:bg-warm-darkCard text-warm-text dark:text-warm-darkText shadow-xs'
                      : 'text-warm-muted hover:text-warm-text dark:hover:text-warm-darkText'
                  }`}
                >
                  ทั้งหมด ({notes.length})
                </button>
                <button
                  onClick={() => {
                    setActiveTab('pinned');
                    if (router.query.tab) {
                      const { tab, ...rest } = router.query;
                      router.push({ pathname: router.pathname, query: rest }, undefined, { shallow: true });
                    }
                  }}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl transition ${
                    activeTab === 'pinned'
                      ? 'bg-warm-card dark:bg-warm-darkCard text-sand-800 dark:text-sand-300 shadow-xs font-semibold'
                      : 'text-warm-muted hover:text-warm-text dark:hover:text-warm-darkText'
                  }`}
                >
                  <Pin size={13} className="fill-current text-sand-600 dark:text-sand-400" />
                  <span>ปักหมุด ({notes.filter((n) => n.isPinned).length})</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('favorites');
                    if (router.query.tab) {
                      const { tab, ...rest } = router.query;
                      router.push({ pathname: router.pathname, query: rest }, undefined, { shallow: true });
                    }
                  }}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl transition ${
                    activeTab === 'favorites'
                      ? 'bg-warm-card dark:bg-warm-darkCard text-sand-800 dark:text-sand-300 shadow-xs font-semibold'
                      : 'text-warm-muted hover:text-warm-text dark:hover:text-warm-darkText'
                  }`}
                >
                  <Star size={13} className="fill-current text-sand-500" />
                  <span>รายการโปรด ({notes.filter((n) => n.isFavorite).length})</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('reminders');
                    if (router.query.tab !== 'reminders') {
                      router.push({ pathname: router.pathname, query: { ...router.query, tab: 'reminders' } }, undefined, { shallow: true });
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${
                    activeTab === 'reminders'
                      ? 'bg-warm-card dark:bg-warm-darkCard text-amber-700 dark:text-amber-300 font-bold shadow-xs'
                      : 'text-warm-muted hover:text-warm-text dark:hover:text-warm-darkText'
                  }`}
                >
                  <Bell size={13} className={activeTab === 'reminders' ? 'fill-current animate-pulse text-amber-500' : ''} />
                  <span>เตือนความจำ ({reminderNotesCount})</span>
                </button>

                {/* Calendar Export Button for Reminders Tab */}
                {activeTab === 'reminders' && reminderNotesCount > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const success = exportNotesToIcs(notes, remindersByNote);
                      if (success) {
                        toast.success('ดาวน์โหลดไฟล์ปฏิทิน .ics เรียบร้อยแล้ว', { icon: '📅' });
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-xs transition text-xs active:scale-95"
                    title="ดาวน์โหลดไฟล์ .ics เพื่อนำเข้าปฏิทิน Google / Apple Calendar / Outlook"
                  >
                    <Download size={13} />
                    <span className="hidden sm:inline">ส่งออกปฏิทิน (.ics)</span>
                    <span className="sm:hidden">.ics</span>
                  </button>
                )}

                {/* AI Search Trigger Button */}
                <button
                  type="button"
                  onClick={() => setIsAiSearchOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sand-50 hover:bg-sand-100/80 dark:bg-sand-950/40 dark:hover:bg-sand-900/50 text-sand-900 dark:text-sand-200 border border-sand-200/80 dark:border-sand-800/60 font-semibold shadow-2xs transition-all duration-200 active:scale-95"
                  title="ค้นหาโน้ตตามความหมายด้วย AI (ฟรี 100%)"
                >
                  <Sparkles size={13} className="text-sand-600 dark:text-sand-400" />
                  <span>ค้นหา AI</span>
                </button>
              </div>

              {/* Auto Sort Dropdown */}
              <SortDropdown
                value={sortBy}
                onChange={(opt) => setSortBy(opt)}
                variant="dashboard"
              />

              {/* Share Active Board Button */}
              {currentActiveBoard && (
                <button
                  type="button"
                  onClick={() => setIsBoardShareModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl border border-warm-border dark:border-warm-darkBorder bg-warm-card dark:bg-warm-darkCard hover:bg-warm-surface text-warm-text dark:text-warm-darkText text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition"
                  title={`แชร์กระดาน "${currentActiveBoard.name}"`}
                >
                  <Share2 size={13} className="text-brand-600 dark:text-brand-400" />
                  <span className="hidden sm:inline">แชร์กระดาน</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Reminders Tab Header Strip */}
        {activeTab === 'reminders' && reminderTimelineGroups && (
          <div className="p-3 sm:p-4 rounded-2xl bg-warm-surface dark:bg-warm-darkSurface border border-warm-border dark:border-warm-darkBorder flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in shadow-2xs">
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="font-bold text-warm-text dark:text-warm-darkText flex items-center gap-1.5 mr-1">
                <Bell size={16} className="text-amber-500" />
                <span>สถานะการแจ้งเตือน:</span>
              </span>

              {reminderTimelineGroups.overdue.length > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-800">
                  <AlertCircle size={12} className="animate-pulse" />
                  <span>เลยกำหนด {reminderTimelineGroups.overdue.length}</span>
                </span>
              )}

              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 font-semibold border border-amber-200 dark:border-amber-800">
                <Clock size={12} />
                <span>วันนี้ {reminderTimelineGroups.today.length}</span>
              </span>

              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-50 dark:bg-brand-950/70 text-brand-800 dark:text-brand-300 font-semibold border border-brand-200 dark:border-brand-800">
                <Calendar size={12} />
                <span>พรุ่งนี้ {reminderTimelineGroups.tomorrow.length}</span>
              </span>

              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sand-100 dark:bg-sand-950/70 text-sand-800 dark:text-sand-300 font-semibold border border-sand-200 dark:border-sand-800">
                <CalendarDays size={12} />
                <span>เร็วๆ นี้ {reminderTimelineGroups.upcoming.length}</span>
              </span>
            </div>
          </div>
        )}

        {/* Active Filters Bar */}
        {hasActiveFilter && (
          <div className="flex items-center gap-2 flex-wrap p-3 rounded-2xl bg-warm-card dark:bg-warm-darkCard border border-warm-border dark:border-warm-darkBorder text-xs shadow-2xs">
            <span className="flex items-center gap-1.5 font-bold text-warm-muted dark:text-warm-darkMuted">
              <Filter size={14} /> ตัวกรองที่เปิดอยู่:
            </span>

            {activeNotebook && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300 font-medium">
                สมุด: {activeNotebook.name}
                <button onClick={() => setSelectedNotebook(null)} className="hover:opacity-75">
                  <X size={12} />
                </button>
              </span>
            )}

            {activeLabel && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sand-100 dark:bg-sand-950/50 text-sand-800 dark:text-sand-300 font-medium">
                ป้าย: #{activeLabel.name}
                <button onClick={() => setSelectedLabel(null)} className="hover:opacity-75">
                  <X size={12} />
                </button>
              </span>
            )}

            {selectedColor && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-warm-surface dark:bg-warm-darkSurface text-warm-text dark:text-warm-darkText font-medium border border-warm-border/60">
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
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-warm-surface dark:bg-warm-darkSurface text-warm-text dark:text-warm-darkText font-medium border border-warm-border/60">
                คำค้น: "{searchQuery}"
                <button onClick={() => setSearchQuery('')} className="hover:opacity-75">
                  <X size={12} />
                </button>
              </span>
            )}

            <button
              onClick={clearAllFilters}
              className="ml-auto text-brand-600 dark:text-brand-400 hover:underline font-semibold"
            >
              ล้างตัวกรองทั้งหมด
            </button>
          </div>
        )}

        {viewMode === 'board' ? (
          /* Sticky Board Canvas Mode */
          <StickyBoard notes={boardNotes} />
        ) : viewMode === 'kanban' ? (
          <div className="flex-1 w-full h-[calc(100vh-140px)] rounded-2xl border border-warm-border dark:border-warm-darkBorder shadow-lg overflow-hidden bg-warm-card dark:bg-warm-darkCard">
            <KanbanView notes={filteredNotes} />
          </div>
        ) : filteredNotes.length === 0 && !isLoading ? (
          /* Empty State for Grid & List modes */
          <div className="bg-warm-card dark:bg-warm-darkCard border border-warm-border dark:border-warm-darkBorder rounded-2xl p-10 sm:p-12 text-center space-y-4 shadow-xs my-6 max-w-xl mx-auto">
            <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center shadow-inner ${
              activeTab === 'reminders'
                ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-500'
                : 'bg-brand-50 dark:bg-brand-950/50 text-brand-600'
            }`}>
              {activeTab === 'reminders' ? <Bell size={32} className="fill-amber-500/20" /> : <BookOpen size={32} />}
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {activeTab === 'reminders'
                  ? 'ยังไม่มีโน้ตที่ตั้งเตือนความจำไว้'
                  : hasActiveFilter
                  ? 'ไม่พบโน้ตที่ตรงกับตัวกรอง'
                  : 'ยังไม่มีโน้ตในระบบ'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                {activeTab === 'reminders'
                  ? 'คุณสามารถคลิกปุ่มกระดิ่ง 🔔 บนโน้ตหรือการ์ดใด ๆ เพื่อกำหนดวันและเวลาแจ้งเตือนล่วงหน้า'
                  : hasActiveFilter
                  ? 'ลองเปลี่ยนคำค้นหา หรือล้างตัวกรองที่เลือกไว้'
                  : 'เริ่มต้นสร้างบันทึกแรกของคุณ พร้อมการปกป้องด้วยความปลอดภัยระดับสูง'}
              </p>
            </div>
            {activeTab === 'reminders' ? (
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('all');
                    if (router.query.tab) {
                      const { tab, ...rest } = router.query;
                      router.push({ pathname: router.pathname, query: rest }, undefined, { shallow: true });
                    }
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5 active:scale-95"
                >
                  <FileText size={14} />
                  <span>ดูโน้ตทั้งหมด ({notes.length} รายการ)</span>
                </button>
              </div>
            ) : hasActiveFilter ? (
              <button
                onClick={clearAllFilters}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-200 transition"
              >
                ล้างตัวกรอง
              </button>
            ) : (
              <button
                onClick={() => router.push('/notes/new')}
                className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-semibold shadow-sm transition active:scale-95 cursor-pointer"
              >
                + สร้างโน้ตแรกของคุณ
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="space-y-8">
            {/* Reminders Timeline Grouping View (Overdue, Today, Tomorrow, Upcoming) */}
            {activeTab === 'reminders' && reminderTimelineGroups ? (
              <div className="space-y-8">
                {/* 1. Overdue */}
                {reminderTimelineGroups.overdue.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                      <AlertCircle size={15} className="animate-pulse" />
                      <span>เลยกำหนดแล้ว ({reminderTimelineGroups.overdue.length})</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {reminderTimelineGroups.overdue.map((note) => (
                        <NoteCard
                          key={note.id}
                          note={note}
                          onUnlockRequest={() => setIsVaultModalOpen(true)}
                          onOpenFullscreen={handleOpenFullscreen}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Today */}
                {reminderTimelineGroups.today.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                      <Clock size={15} />
                      <span>วันนี้ ({reminderTimelineGroups.today.length})</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {reminderTimelineGroups.today.map((note) => (
                        <NoteCard
                          key={note.id}
                          note={note}
                          onUnlockRequest={() => setIsVaultModalOpen(true)}
                          onOpenFullscreen={handleOpenFullscreen}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Tomorrow */}
                {reminderTimelineGroups.tomorrow.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      <Calendar size={15} />
                      <span>พรุ่งนี้ ({reminderTimelineGroups.tomorrow.length})</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {reminderTimelineGroups.tomorrow.map((note) => (
                        <NoteCard
                          key={note.id}
                          note={note}
                          onUnlockRequest={() => setIsVaultModalOpen(true)}
                          onOpenFullscreen={handleOpenFullscreen}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Upcoming */}
                {reminderTimelineGroups.upcoming.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      <CalendarDays size={15} />
                      <span>เร็วๆ นี้ / กำหนดการถัดไป ({reminderTimelineGroups.upcoming.length})</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {reminderTimelineGroups.upcoming.map((note) => (
                        <NoteCard
                          key={note.id}
                          note={note}
                          onUnlockRequest={() => setIsVaultModalOpen(true)}
                          onOpenFullscreen={handleOpenFullscreen}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Standard Pinned Notes */}
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
                          onOpenFullscreen={handleOpenFullscreen}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Standard Regular Notes */}
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
                          onOpenFullscreen={handleOpenFullscreen}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          /* List Mode */
          <NoteList
            notes={filteredNotes}
            onUnlockRequest={() => setIsVaultModalOpen(true)}
            onOpenFullscreen={handleOpenFullscreen}
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
          key={fullscreenNote.id}
          note={notes.find((n) => n.id === fullscreenNote.id) || fullscreenNote}
          isOpen={!!fullscreenNote}
          onClose={() => {
            setFullscreenNote(null);
            fetchNotes({ isArchived: false });
          }}
        />
      )}

      {/* Semantic AI Search Modal */}
      <AISearchModal
        isOpen={isAiSearchOpen}
        onClose={() => setIsAiSearchOpen(false)}
        onSelectNote={(note) => setFullscreenNote(note)}
      />

      {/* Board Share Modal */}
      {currentActiveBoard && isBoardShareModalOpen && (
        <BoardShareModal
          board={currentActiveBoard}
          isOpen={isBoardShareModalOpen}
          onClose={() => setIsBoardShareModalOpen(false)}
        />
      )}
    </Layout>
  );
}
