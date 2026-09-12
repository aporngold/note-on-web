import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Menu, Search, Plus, Grid, List, Columns, ShieldAlert, PanelLeft, PanelLeftClose, Database, Star } from 'lucide-react';
import Sidebar from './Sidebar';
import MobileBottomNav from './MobileBottomNav';
import BackupModal from '../modals/BackupModal';
import { useAuthStore } from '@/store/authStore';
import { useNoteStore } from '@/store/noteStore';
import toast from 'react-hot-toast';

interface LayoutProps {
  children: React.ReactNode;
  showSearch?: boolean;
}

export default function Layout({ children, showSearch = true }: LayoutProps) {
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

  useEffect(() => {
    if (user) {
      fetchNotebooks();
      fetchLabels();
      fetchBoards();
    }
  }, [user, fetchNotebooks, fetchLabels, fetchBoards]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
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
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
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
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header
          className={`h-16 px-4 sm:px-8 items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-10 ${
            router.pathname.startsWith('/notes/') ? 'hidden lg:flex' : 'flex'
          }`}
        >
          <div className="flex items-center gap-3 flex-1 max-w-xl">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Menu size={20} />
            </button>

            {showSearch && (
              <div className="relative flex items-center">
                {/* Search Toggle Button or Input Container */}
                <div
                  className={`flex items-center transition-all duration-300 ease-in-out ${
                    isSearchExpanded
                      ? 'w-72 sm:w-96 bg-slate-50 dark:bg-slate-800/90 border border-indigo-500/50 ring-2 ring-indigo-500/20 rounded-xl shadow-sm'
                      : 'w-10 h-10 justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setIsSearchExpanded(!isSearchExpanded);
                    }}
                    className={`p-2.5 rounded-xl transition flex items-center justify-center shrink-0 ${
                      isSearchExpanded
                        ? 'text-indigo-600 dark:text-indigo-400'
                        : 'text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400'
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
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl gap-0.5">
              <button
                onClick={() => {
                  setViewMode('grid');
                  if (router.pathname !== '/dashboard') {
                    router.push('/dashboard');
                  }
                }}
                className={`p-1.5 rounded-lg transition relative ${
                  viewMode === 'grid' && router.pathname === '/dashboard'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                }`}
                title="มุมมองการ์ด (Grid)"
              >
                <Grid size={17} />
                {defaultViewMode === 'grid' && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-white dark:ring-slate-800" title="โหมดหลักเริ่มต้น" />
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
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                }`}
                title="มุมมองรายการ (List)"
              >
                <List size={17} />
                {defaultViewMode === 'list' && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-white dark:ring-slate-800" title="โหมดหลักเริ่มต้น" />
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
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                }`}
                title="มุมมองกระดานคัมบัง (Kanban)"
              >
                <Columns size={17} />
                <span className="hidden md:inline text-[11px] font-bold">คัมบัง</span>
                {defaultViewMode === 'kanban' && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-white dark:ring-slate-800" title="โหมดหลักเริ่มต้น" />
                )}
              </button>
              <button
                onClick={() => {
                  setViewMode('board');
                  setBoardViewMode('freeform');
                  if (router.pathname !== '/board' && router.pathname !== '/dashboard') {
                    router.push('/board');
                  }
                }}
                className={`p-1.5 rounded-lg transition flex items-center gap-1 text-xs font-bold relative ${
                  (viewMode === 'board' && boardViewMode === 'freeform') || (router.pathname === '/board' && boardViewMode === 'freeform')
                    ? 'bg-amber-300 text-amber-950 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                }`}
                title="มุมมองกระดานโพสต์อิทอิสระ (Sticky Board)"
              >
                <span>📌</span>
                <span className="hidden md:inline text-[11px]">บอร์ด</span>
                {defaultViewMode === 'board' && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white dark:ring-slate-800" title="โหมดหลักเริ่มต้น" />
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
                    ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'
                    : 'text-slate-400 hover:text-amber-500 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
                }`}
                title={
                  viewMode === defaultViewMode
                    ? 'โหมดนี้เป็นหน้าหลักเริ่มต้น (Default) อยู่แล้ว'
                    : 'คลิกเพื่อตั้งโหมดที่เปิดอยู่นี้เป็นหน้าหลักเริ่มต้นเมื่อเปิดแอป'
                }
              >
                <Star size={14} className={viewMode === defaultViewMode ? 'fill-amber-400' : ''} />
                <span className="text-[10px] font-bold hidden xl:inline">
                  {viewMode === defaultViewMode ? 'หน้าหลัก' : 'ตั้งเป็นหน้าหลัก'}
                </span>
              </button>
            </div>

            {/* Backup Button */}
            <button
              onClick={() => setIsBackupModalOpen(true)}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ml-1"
              title="สำรองและกู้คืนข้อมูลโน้ต (Backup & Restore)"
            >
              <Database size={15} className="text-indigo-600 dark:text-indigo-400" />
              <span className="hidden sm:inline">สำรองข้อมูล</span>
            </button>

            {/* Quick New Note - Available in all modes */}
            <button
              onClick={() => {
                const url = activeBoardId ? `/notes/new?boardId=${activeBoardId}` : '/notes/new';
                router.push(url);
              }}
              className="px-3.5 py-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-full text-xs font-bold shadow-md shadow-indigo-500/25 flex items-center gap-1.5 transition-all duration-200 active:scale-95 ml-1 shrink-0"
              title="สร้างโน้ตใหม่"
              aria-label="สร้างโน้ตใหม่"
            >
              <Plus size={16} className="stroke-[2.5]" />
              <span>โน้ตใหม่</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main
          className={`flex-1 ${
            viewMode === 'board' || router.pathname === '/board'
              ? 'overflow-hidden flex flex-col p-2 sm:p-3'
              : router.pathname.startsWith('/notes/')
              ? 'flex flex-col min-h-0 overflow-hidden p-0 lg:p-8 lg:overflow-y-auto'
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
