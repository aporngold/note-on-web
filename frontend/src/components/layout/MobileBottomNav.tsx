import React, { useState } from 'react';
import { useRouter } from 'next/router';
import {
  FileText,
  Book,
  Search,
  Tag,
  MoreHorizontal,
  Plus,
  Grid,
  List,
  Columns,
  Sparkles,
  Lock,
  Trash2,
  Database,
  Moon,
  Sun,
  LogOut,
  X,
  Check,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useNoteStore } from '@/store/noteStore';
import { useAuthStore } from '@/store/authStore';
import BottomSheet from '../ui/BottomSheet';
import NotebookModal from '../modals/NotebookModal';
import LabelModal from '../modals/LabelModal';
import BackupModal from '../modals/BackupModal';
import MasterPasswordModal from '../notes/MasterPasswordModal';
import toast from 'react-hot-toast';

export default function MobileBottomNav() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { user, logout, isVaultUnlocked, lockVault } = useAuthStore();
  const {
    notebooks,
    labels,
    selectedNotebook,
    selectedLabel,
    setSelectedNotebook,
    setSelectedLabel,
    searchQuery,
    setSearchQuery,
    viewMode,
    setViewMode,
    activeBoardId,
  } = useNoteStore();

  const [activeSheet, setActiveSheet] = useState<'notebooks' | 'labels' | 'search' | 'more' | null>(null);
  const [isNotebookModalOpen, setIsNotebookModalOpen] = useState(false);
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);

  // Do not show bottom nav on note editing pages so it doesn't obstruct typing
  const isEditingNote = router.pathname.startsWith('/notes/');
  if (isEditingNote) {
    return null;
  }

  const currentPath = router.pathname;

  const handleNotebookClick = (id: string | null) => {
    setSelectedNotebook(selectedNotebook === id ? null : id);
    if (currentPath !== '/dashboard') router.push('/dashboard');
    setActiveSheet(null);
  };

  const handleLabelClick = (id: string | null) => {
    setSelectedLabel(selectedLabel === id ? null : id);
    if (currentPath !== '/dashboard') router.push('/dashboard');
    setActiveSheet(null);
  };

  return (
    <>
      {/* Floating Action Button (FAB) for New Note on Mobile */}
      <div className="fixed right-4 bottom-20 z-40 lg:hidden">
        <button
          onClick={() => {
            const url = activeBoardId ? `/notes/new?boardId=${activeBoardId}` : '/notes/new';
            router.push(url);
          }}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-xl shadow-indigo-500/30 flex items-center justify-center transition-transform active:scale-95"
          title="สร้างโน้ตใหม่"
          aria-label="สร้างโน้ตใหม่"
        >
          <Plus size={26} />
        </button>
      </div>

      {/* Bottom Navigation Bar */}
      <nav
        aria-label="เมนูหลักสำหรับมือถือ"
        className="fixed bottom-0 left-0 right-0 z-30 lg:hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 px-2 py-1.5 flex items-center justify-around pb-safe shadow-lg"
      >
        {/* 1. All Notes */}
        <button
          type="button"
          onClick={() => {
            setSelectedNotebook(null);
            setSelectedLabel(null);
            if (currentPath !== '/dashboard') router.push('/dashboard');
          }}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition min-w-[56px] ${
            currentPath === '/dashboard' && !selectedNotebook && !selectedLabel
              ? 'text-indigo-600 dark:text-indigo-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileText size={20} />
          <span className="text-[10px] mt-0.5">โน้ต</span>
        </button>

        {/* 2. Notebooks */}
        <button
          type="button"
          onClick={() => setActiveSheet('notebooks')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition min-w-[56px] relative ${
            selectedNotebook
              ? 'text-indigo-600 dark:text-indigo-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Book size={20} />
          <span className="text-[10px] mt-0.5">สมุด</span>
          {selectedNotebook && (
            <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-indigo-600" />
          )}
        </button>

        {/* 3. Search */}
        <button
          type="button"
          onClick={() => setActiveSheet('search')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition min-w-[56px] ${
            searchQuery
              ? 'text-indigo-600 dark:text-indigo-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Search size={20} />
          <span className="text-[10px] mt-0.5">ค้นหา</span>
        </button>

        {/* 4. Labels */}
        <button
          type="button"
          onClick={() => setActiveSheet('labels')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition min-w-[56px] relative ${
            selectedLabel
              ? 'text-indigo-600 dark:text-indigo-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Tag size={20} />
          <span className="text-[10px] mt-0.5">ป้าย</span>
          {selectedLabel && (
            <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-purple-600" />
          )}
        </button>

        {/* 5. More */}
        <button
          type="button"
          onClick={() => setActiveSheet('more')}
          className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition min-w-[56px] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
        >
          <MoreHorizontal size={20} />
          <span className="text-[10px] mt-0.5">เพิ่มเติม</span>
        </button>
      </nav>

      {/* ────────────── BOTTOM SHEETS ────────────── */}

      {/* Notebooks Bottom Sheet */}
      <BottomSheet
        isOpen={activeSheet === 'notebooks'}
        onClose={() => setActiveSheet(null)}
        title="สมุดโน้ต (Notebooks)"
      >
        <div className="space-y-2">
          <button
            onClick={() => handleNotebookClick(null)}
            className={`w-full flex items-center justify-between p-3 rounded-2xl transition text-sm font-medium ${
              !selectedNotebook
                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 font-bold'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <Book size={18} className="text-slate-400" />
              <span>โน้ตทั้งหมด (ไม่แยกสมุด)</span>
            </div>
            {!selectedNotebook && <Check size={18} className="text-indigo-600 dark:text-indigo-400" />}
          </button>

          {notebooks.map((nb) => (
            <button
              key={nb.id}
              onClick={() => handleNotebookClick(nb.id)}
              className={`w-full flex items-center justify-between p-3 rounded-2xl transition text-sm font-medium ${
                selectedNotebook === nb.id
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 font-bold'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <Book size={18} className="text-indigo-500" />
                <span className="truncate">{nb.name}</span>
              </div>
              {selectedNotebook === nb.id && <Check size={18} className="text-indigo-600 dark:text-indigo-400" />}
            </button>
          ))}

          <button
            onClick={() => {
              setActiveSheet(null);
              setIsNotebookModalOpen(true);
            }}
            className="w-full flex items-center justify-center gap-2 p-3.5 mt-2 rounded-2xl border border-dashed border-indigo-300 dark:border-indigo-800/80 text-indigo-600 dark:text-indigo-400 text-sm font-bold hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition"
          >
            <Plus size={18} />
            <span>สร้างสมุดโน้ตใหม่</span>
          </button>
        </div>
      </BottomSheet>

      {/* Labels Bottom Sheet */}
      <BottomSheet
        isOpen={activeSheet === 'labels'}
        onClose={() => setActiveSheet(null)}
        title="ป้ายกำกับ (Labels)"
      >
        <div className="space-y-2">
          <button
            onClick={() => handleLabelClick(null)}
            className={`w-full flex items-center justify-between p-3 rounded-2xl transition text-sm font-medium ${
              !selectedLabel
                ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 font-bold'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <Tag size={18} className="text-slate-400" />
              <span>ป้ายกำกับทั้งหมด</span>
            </div>
            {!selectedLabel && <Check size={18} className="text-purple-600 dark:text-purple-400" />}
          </button>

          {labels.map((lbl) => (
            <button
              key={lbl.id}
              onClick={() => handleLabelClick(lbl.id)}
              className={`w-full flex items-center justify-between p-3 rounded-2xl transition text-sm font-medium ${
                selectedLabel === lbl.id
                  ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 font-bold'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className="w-3.5 h-3.5 rounded-full ring-2 ring-white dark:ring-slate-900"
                  style={{ backgroundColor: lbl.color || '#8B5CF6' }}
                />
                <span className="truncate">#{lbl.name}</span>
              </div>
              {selectedLabel === lbl.id && <Check size={18} className="text-purple-600 dark:text-purple-400" />}
            </button>
          ))}

          <button
            onClick={() => {
              setActiveSheet(null);
              setIsLabelModalOpen(true);
            }}
            className="w-full flex items-center justify-center gap-2 p-3.5 mt-2 rounded-2xl border border-dashed border-purple-300 dark:border-purple-800/80 text-purple-600 dark:text-purple-400 text-sm font-bold hover:bg-purple-50/50 dark:hover:bg-purple-950/30 transition"
          >
            <Plus size={18} />
            <span>สร้างป้ายกำกับใหม่</span>
          </button>
        </div>
      </BottomSheet>

      {/* Search Bottom Sheet */}
      <BottomSheet
        isOpen={activeSheet === 'search'}
        onClose={() => setActiveSheet(null)}
        title="ค้นหาโน้ต (Search)"
      >
        <div className="space-y-4">
          <div className="relative">
            <input
              type="text"
              autoFocus
              placeholder="ค้นหาตามชื่อหรือเนื้อหา..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
            />
            <Search size={18} className="absolute left-3.5 top-3.5 text-slate-400" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                if (currentPath !== '/dashboard') router.push('/dashboard');
                setActiveSheet(null);
              }}
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-bold transition shadow-md shadow-indigo-500/20"
            >
              ดูผลการค้นหา
            </button>
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveSheet(null);
                }}
                className="px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                ล้าง
              </button>
            )}
          </div>
        </div>
      </BottomSheet>

      {/* More Options Bottom Sheet */}
      <BottomSheet
        isOpen={activeSheet === 'more'}
        onClose={() => setActiveSheet(null)}
        title="เมนูและมุมมองเพิ่มเติม"
      >
        <div className="space-y-4">
          {/* View Mode Switching */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              มุมมอง (View Mode)
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setViewMode('grid');
                  if (currentPath !== '/dashboard') router.push('/dashboard');
                  setActiveSheet(null);
                }}
                className={`p-3 rounded-2xl border text-xs font-bold flex items-center gap-2.5 transition ${
                  viewMode === 'grid' && currentPath === '/dashboard'
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Grid size={17} />
                <span>การ์ด (Grid)</span>
              </button>

              <button
                onClick={() => {
                  setViewMode('list');
                  if (currentPath !== '/dashboard') router.push('/dashboard');
                  setActiveSheet(null);
                }}
                className={`p-3 rounded-2xl border text-xs font-bold flex items-center gap-2.5 transition ${
                  viewMode === 'list' && currentPath === '/dashboard'
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <List size={17} />
                <span>รายการ (List)</span>
              </button>

              <button
                onClick={() => {
                  setViewMode('kanban');
                  if (currentPath !== '/dashboard') router.push('/dashboard');
                  setActiveSheet(null);
                }}
                className={`p-3 rounded-2xl border text-xs font-bold flex items-center gap-2.5 transition ${
                  viewMode === 'kanban' && currentPath === '/dashboard'
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Columns size={17} />
                <span>คัมบัง (Kanban)</span>
              </button>

              <button
                onClick={() => {
                  setViewMode('board');
                  if (currentPath !== '/board') router.push('/board');
                  setActiveSheet(null);
                }}
                className={`p-3 rounded-2xl border text-xs font-bold flex items-center gap-2.5 transition ${
                  currentPath === '/board'
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span>📌</span>
                <span>กระดานโพสต์อิท</span>
              </button>
            </div>
          </div>

          <div className="h-px bg-slate-100 dark:bg-slate-800" />

          {/* Quick Links */}
          <div className="space-y-1">
            <button
              onClick={() => {
                setActiveSheet(null);
                router.push('/vault');
              }}
              className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold transition"
            >
              <Lock size={18} className="text-amber-500" />
              <span>ตู้นิรภัยเข้ารหัส (Vault)</span>
            </button>

            <button
              onClick={() => {
                setActiveSheet(null);
                router.push('/trash');
              }}
              className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold transition"
            >
              <Trash2 size={18} className="text-rose-500" />
              <span>ถังขยะ (Trash)</span>
            </button>

            <button
              onClick={() => {
                setActiveSheet(null);
                setIsBackupModalOpen(true);
              }}
              className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold transition"
            >
              <Database size={18} className="text-indigo-500" />
              <span>สำรองและกู้คืนข้อมูล (Backup)</span>
            </button>

            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold transition"
            >
              <div className="flex items-center gap-3">
                {theme === 'dark' ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-indigo-500" />}
                <span>{theme === 'dark' ? 'เปลี่ยนเป็นธีมสว่าง' : 'เปลี่ยนเป็นธีมมืด'}</span>
              </div>
              <span className="text-xs text-slate-400">{theme === 'dark' ? 'Dark' : 'Light'}</span>
            </button>
          </div>

          <div className="h-px bg-slate-100 dark:bg-slate-800" />

          {/* User Info and Logout */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                {user?.username?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{user?.username}</p>
                <p className="text-xs text-slate-400">{user?.email}</p>
              </div>
            </div>

            <button
              onClick={() => {
                logout();
                router.push('/login');
              }}
              className="p-2.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition"
              title="ออกจากระบบ"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* Auxiliary Modals */}
      <NotebookModal
        isOpen={isNotebookModalOpen}
        onClose={() => setIsNotebookModalOpen(false)}
      />
      <LabelModal
        isOpen={isLabelModalOpen}
        onClose={() => setIsLabelModalOpen(false)}
      />
      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
      />
      <MasterPasswordModal
        isOpen={isVaultModalOpen}
        onClose={() => setIsVaultModalOpen(false)}
      />
    </>
  );
}
