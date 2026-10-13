import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Menu, Search, Plus, Grid, List, Columns, ShieldAlert, PanelLeft, PanelLeftClose, Database, Star } from 'lucide-react';
import Sidebar from './Sidebar';
import MobileBottomNav from './MobileBottomNav';
import BackupModal from '../modals/BackupModal';
import NotificationCenter from '../notifications/NotificationCenter';
import SystemAnnouncementBanner from './SystemAnnouncementBanner';
import { useAuthStore } from '@/store/authStore';
import { useNoteStore } from '@/store/noteStore';
import { useReminderStore } from '@/store/reminderStore';
import { useRealtimeNotes } from '@/hooks/useRealtimeNotes';
import toast from 'react-hot-toast';

interface LayoutProps {
  children: React.ReactNode;
  showSearch?: boolean;
}

export default function Layout({ children, showSearch = true }: LayoutProps) {
  useRealtimeNotes();
  const router = useRouter();
  const { user, isLoading, checkAuth } = useAuthStore();
  const {
    searchQuery,
    setSearchQuery,
    viewMode,
    setViewMode,
    defaultViewMode,
    setDefaultViewMode,
    boardViewMode,
    setBoardViewMode,
    toggleViewMode,
    fetchNotes,
    fetchTrashNotes,
    fetchNotebooks,
    fetchLabels,
    fetchBoards,
    activeBoardId,
  } = useNoteStore();

  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  const { fetchReminders } = useReminderStore();

  useEffect(() => {
    if (user) {
      fetchTrashNotes();
      fetchNotebooks();
      fetchLabels();
      fetchBoards();
      fetchReminders();
    }
  }, [user, fetchTrashNotes, fetchNotebooks, fetchLabels, fetchBoards, fetchReminders]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warm-bg dark:bg-warm-darkBg">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-warm-muted dark:text-warm-darkMuted">
            กำลังโหลดข้อมูลความปลอดภัย...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-warm-bg dark:bg-warm-darkBg text-warm-text dark:text-warm-darkText">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block flex-shrink-0 transition-all duration-300">
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative z-10 w-72 h-full">
            <Sidebar onCloseMobile={() => setIsMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-300">
        {/* System Announcement Banner */}
        <SystemAnnouncementBanner />

        {/* Top Navbar */}
        <header
          className={`h-16 px-4 sm:px-8 items-center justify-between gap-4 border-b border-warm-border dark:border-warm-darkBorder bg-warm-bg/90 dark:bg-warm-darkBg/90 backdrop-blur-md z-10 ${
            router.pathname.startsWith('/notes/') ? 'hidden lg:flex' : 'flex'
          }`}
        >
          <div className="flex items-center gap-3 flex-1 max-w-xl">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 text-warm-muted hover:text-warm-text dark:hover:text-warm-darkText rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition"
            >
              <Menu size={20} />
            </button>

            {showSearch && (
              <div className="relative flex items-center">
                {/* Search Toggle Button or Input Container */}
                <div
                  className={`flex items-center transition-all duration-300 ease-in-out ${
                    isSearchExpanded
                      ? 'w-[calc(100vw-110px)] max-w-xs sm:w-96 sm:max-w-none bg-warm-surface dark:bg-warm-darkSurface border border-brand-500/50 ring-2 ring-brand-500/20 rounded-xl shadow-xs'
                      : 'w-10 h-10 justify-center rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-warm-muted hover:text-brand-600 dark:hover:text-brand-400 cursor-pointer transition'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setIsSearchExpanded(!isSearchExpanded);
                    }}
                    className={`p-2.5 rounded-xl transition flex items-center justify-center shrink-0 ${
                      isSearchExpanded
                        ? 'text-brand-600 dark:text-brand-400'
                        : 'text-warm-muted hover:text-brand-600 dark:hover:text-brand-400'
                    }`}
                    title={isSearchExpanded ? 'ย่อแถบค้นหา' : 'คลิกเพื่อค้นหาโน้ต'}
                  >
                    <Search size={18} />
                  </button>

                  {isSearchExpanded && (
                    <>
                      <input
                        type="text"
                        autoFocus
                        placeholder="ค้นหาโน้ตตามชื่อหรือเนื้อหา..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pr-8 py-2 bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                      />
                      {searchQuery ? (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="p-1.5 mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold"
                          title="ล้างคำค้น"
                        >
                          ✕
                        </button>
                      ) : (
                        <button
                          onClick={() => setIsSearchExpanded(false)}
                          className="p-1.5 mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
                          title="ปิดแถบค้นหา"
                        >
                          ✕
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-warm-surface dark:bg-warm-darkSurface border border-warm-border/70 dark:border-warm-darkBorder/70 p-1 rounded-xl gap-0.5 shadow-2xs">
              <button
                onClick={() => {
                  setViewMode('grid');
                  if (router.pathname !== '/dashboard') {
                    router.push('/dashboard');
                  }
                }}
                className={`p-1.5 rounded-lg transition relative ${
                  viewMode === 'grid' && router.pathname === '/dashboard'
                    ? 'bg-warm-card dark:bg-warm-darkCard text-brand-600 dark:text-brand-400 shadow-xs'
                    : 'text-warm-muted hover:text-warm-text dark:hover:text-warm-darkText'
                }`}
                title="มุมมองการ์ด (Grid)"
              >
                <Grid size={17} />
                {defaultViewMode === 'grid' && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-sand-400 ring-2 ring-warm-surface dark:ring-warm-darkSurface" />
                )}
              </button>
              <button
                onClick={() => {
                  setViewMode('list');
                  if (router.pathname !== '/dashboard') {
                    router.push('/dashboard');
                  }
                }}
                className={`p-1.5 rounded-lg transition relative ${
                  viewMode === 'list' && router.pathname === '/dashboard'
                    ? 'bg-warm-card dark:bg-warm-darkCard text-brand-600 dark:text-brand-400 shadow-xs'
                    : 'text-warm-muted hover:text-warm-text dark:hover:text-warm-darkText'
                }`}
                title="มุมมองรายการ (List)"
              >
                <List size={17} />
                {defaultViewMode === 'list' && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-sand-400 ring-2 ring-warm-surface dark:ring-warm-darkSurface" />
                )}
              </button>
              <button
                onClick={() => {
                  setViewMode('kanban');
                  setBoardViewMode('kanban');
                  if (router.pathname !== '/dashboard') {
                    router.push('/dashboard');
                  }
                }}
                className={`p-1.5 rounded-lg transition flex items-center gap-1 relative ${
                  viewMode === 'kanban' || (viewMode === 'board' && boardViewMode === 'kanban')
                    ? 'bg-warm-card dark:bg-warm-darkCard text-brand-600 dark:text-brand-400 shadow-xs'
                    : 'text-warm-muted hover:text-warm-text dark:hover:text-warm-darkText'
                }`}
                title="มุมมองกระดานคัมบัง (Kanban)"
              >
                <Columns size={17} />
                <span className="hidden md:inline text-[11px] font-bold">คัมบัง</span>
                {defaultViewMode === 'kanban' && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-sand-400 ring-2 ring-warm-surface dark:ring-warm-darkSurface" />
                )}
              </button>
              <button
                onClick={() => {
                  setViewMode('board');
                  setBoardViewMode('freeform');
                  if (router.query.tab) {
                    const { tab, ...rest } = router.query;
                    router.push({ pathname: router.pathname, query: rest }, undefined, { shallow: true });
                  }
                  if (router.pathname !== '/board' && router.pathname !== '/dashboard') {
                    router.push('/board');
                  }
                }}
                className={`p-1.5 rounded-lg transition flex items-center gap-1 text-xs font-bold relative ${
                  (viewMode === 'board' && boardViewMode === 'freeform') || (router.pathname === '/board' && boardViewMode === 'freeform')
                    ? 'bg-sand-200 dark:bg-sand-950/80 text-sand-900 dark:text-sand-200 shadow-xs'
                    : 'text-warm-muted hover:text-warm-text dark:hover:text-warm-darkText'
                }`}
                title="มุมมองกระดานโพสต์อิทอิสระ (Sticky Board)"
              >
                <span>📌</span>
                <span className="hidden md:inline text-[11px]">บอร์ด</span>
                {defaultViewMode === 'board' && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-sand-400 ring-2 ring-warm-surface dark:ring-warm-darkSurface" />
                )}
              </button>

              {/* Set as Default View Mode button */}
              <button
                type="button"
                onClick={() => {
                  const currentMode = (router.pathname === '/board' ? 'board' : viewMode);
                  setDefaultViewMode(currentMode);
                  const modeLabels: Record<string, string> = {
                    board: 'Sticky Board (กระดานโน้ต)',
                    grid: 'Grid (การ์ด)',
                    list: 'List (รายการ)',
                    kanban: 'Kanban (คัมบัง)',
                  };
                  toast.success(`ตั้งโหมด ${modeLabels[currentMode] || currentMode} เป็นหน้าหลักเริ่มต้นแล้ว`, { icon: '⭐' });
                }}
                className={`p-1.5 rounded-lg transition ml-0.5 flex items-center gap-1 ${
                  viewMode === defaultViewMode
                    ? 'text-sand-600 dark:text-sand-300 bg-sand-100/70 dark:bg-sand-950/50'
                    : 'text-warm-muted hover:text-sand-600 hover:bg-black/5 dark:hover:bg-white/5'
                }`}
                title={
                  viewMode === defaultViewMode
                    ? 'โหมดนี้เป็นหน้าหลักเริ่มต้น (Default) อยู่แล้ว'
                    : 'คลิกเพื่อตั้งโหมดที่เปิดอยู่นี้เป็นหน้าหลักเริ่มต้นเมื่อเปิดแอป'
                }
              >
                <Star size={14} className={viewMode === defaultViewMode ? 'fill-sand-400 text-sand-500' : ''} />
                <span className="text-[10px] font-bold hidden xl:inline">
                  หน้าหลัก
                </span>
              </button>
            </div>

            {/* Backup Button */}
            <button
              onClick={() => setIsBackupModalOpen(true)}
              className="px-3 py-2 bg-warm-surface hover:bg-black/5 dark:bg-warm-darkSurface dark:hover:bg-white/5 border border-warm-border/70 dark:border-warm-darkBorder/70 text-warm-text dark:text-warm-darkText rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ml-1 shadow-2xs"
              title="สำรองและกู้คืนข้อมูลโน้ต (Backup & Restore)"
            >
              <Database size={15} className="text-brand-600 dark:text-brand-400" />
              <span className="hidden sm:inline">สำรองข้อมูล</span>
            </button>

            {/* Notification Center */}
            <NotificationCenter />

            {/* Quick New Note - Desktop only (Mobile has bottom-right FAB) */}
            {!(
              router.query.tab === 'reminders' ||
              router.pathname === '/trash' ||
              router.pathname.startsWith('/admin')
            ) && (
              <button
                onClick={() => {
                  const url = activeBoardId ? `/notes/new?boardId=${activeBoardId}` : '/notes/new';
                  router.push(url);
                }}
                className="hidden md:flex px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-semibold shadow-xs hover:shadow transition-all duration-200 active:scale-95 ml-1 shrink-0 items-center gap-1.5"
                title="สร้างโน้ตใหม่"
                aria-label="สร้างโน้ตใหม่"
              >
                <Plus size={16} className="stroke-[2.5]" />
                <span>โน้ตใหม่</span>
              </button>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main
          className={`flex-1 ${
            router.pathname === '/board' || (router.pathname === '/dashboard' && viewMode === 'board')
              ? 'overflow-hidden flex flex-col p-0'
              : router.pathname.startsWith('/notes/')
              ? 'flex flex-col min-h-0 overflow-hidden p-0 transition-all duration-300'
              : router.pathname.startsWith('/admin')
              ? 'overflow-y-auto p-4 sm:p-6 lg:px-8 lg:py-5 pb-20 lg:pb-6'
              : 'overflow-y-auto p-4 sm:p-8 pb-24 lg:pb-8'
          }`}
        >
          {children}
        </main>

        {/* Mobile Bottom Navigation (Visible on lg:hidden) */}
        <MobileBottomNav />

        {/* Backup & Restore Modal */}
        <BackupModal
          isOpen={isBackupModalOpen}
          onClose={() => setIsBackupModalOpen(false)}
        />
      </div>
    </div>
  );
}
