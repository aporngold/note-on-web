import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTheme } from 'next-themes';
import {
  FileText,
  Lock,
  Trash2,
  Book,
  Tag,
  Plus,
  Moon,
  Sun,
  LogOut,
  ChevronDown,
  ShieldCheck,
  KeyRound,
  X,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useNoteStore } from '@/store/noteStore';
import NotebookModal from '../modals/NotebookModal';
import LabelModal from '../modals/LabelModal';
import MasterPasswordModal from '../notes/MasterPasswordModal';

interface SidebarProps {
  onCloseMobile?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const COLOR_FILTERS = [
  '#6366F1',
  '#8B5CF6',
  '#EC4899',
  '#EF4444',
  '#F59E0B',
  '#10B981',
  '#06B6D4',
];

export default function Sidebar({
  onCloseMobile,
  isCollapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { user, logout, isVaultUnlocked, lockVault } = useAuthStore();
  const {
    notebooks,
    labels,
    trashNotes,
    fetchTrashNotes,
    selectedNotebook,
    selectedLabel,
    selectedColor,
    setSelectedNotebook,
    setSelectedLabel,
    setSelectedColor,
    deleteNotebook,
    deleteLabel,
  } = useNoteStore();

  const [isNotebookModalOpen, setIsNotebookModalOpen] = useState(false);
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchTrashNotes();
    }
  }, [user, fetchTrashNotes]);

  const currentPath = router.pathname;

  const handleNavClick = (path: string) => {
    if (path === '/board') {
      useNoteStore.getState().setViewMode('board');
      useNoteStore.getState().setBoardViewMode('freeform');
    }
    router.push(path);
    if (onCloseMobile) onCloseMobile();
  };

  const handleNotebookSelect = (id: string | null) => {
    setSelectedNotebook(selectedNotebook === id ? null : id);
    if (currentPath !== '/dashboard') router.push('/dashboard');
    if (onCloseMobile) onCloseMobile();
  };

  const handleLabelSelect = (id: string | null) => {
    setSelectedLabel(selectedLabel === id ? null : id);
    if (currentPath !== '/dashboard') router.push('/dashboard');
    if (onCloseMobile) onCloseMobile();
  };

  const handleColorSelect = (color: string) => {
    setSelectedColor(selectedColor === color ? null : color);
    if (currentPath !== '/dashboard') router.push('/dashboard');
    if (onCloseMobile) onCloseMobile();
  };

  // ────────────── COLLAPSED MINI SIDEBAR (ยุบเมนูซ้าย) ──────────────
  if (isCollapsed) {
    return (
      <aside className="w-16 h-screen flex flex-col justify-between items-center bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 py-4 select-none z-30 transition-all duration-300">
        <div className="flex flex-col items-center gap-4 w-full">
          {/* App Icon / Logo */}
          <Link href="/dashboard" className="p-1 group" title="SecureNote Dashboard">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 group-hover:scale-105 transition">
              <ShieldCheck size={20} />
            </div>
          </Link>

          {/* Expand Toggle Button */}
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-2 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="ขยายเมนูด้านซ้าย"
            >
              <PanelLeft size={18} />
            </button>
          )}

          <hr className="w-8 border-slate-200 dark:border-slate-800 my-1" />

          {/* Navigation Icons */}
          <nav className="flex flex-col items-center gap-2 w-full px-2">
            <button
              onClick={() => {
                setSelectedNotebook(null);
                setSelectedLabel(null);
                setSelectedColor(null);
                handleNavClick('/dashboard');
              }}
              className={`p-2.5 rounded-xl transition ${
                currentPath === '/dashboard' && !selectedNotebook && !selectedLabel && !selectedColor
                  ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title="โน้ตทั้งหมด"
            >
              <FileText size={18} />
            </button>

            <button
              onClick={() => handleNavClick('/vault')}
              className={`p-2.5 rounded-xl transition ${
                currentPath === '/vault'
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title="ห้องนิรภัยส่วนตัว (Vault)"
            >
              <Lock size={18} />
            </button>

            <button
              onClick={() => {
                setSelectedNotebook(null);
                setSelectedLabel(null);
                setSelectedColor(null);
                handleNavClick('/trash');
              }}
              className={`p-2.5 rounded-xl transition relative ${
                currentPath === '/trash'
                  ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 font-semibold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title={`ถังขยะ (${trashNotes.length} รายการ)`}
            >
              <Trash2 size={18} />
              {trashNotes.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
              )}
            </button>
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col items-center gap-3 w-full pb-2">
          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="สลับโหมดมืด/สว่าง"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* User Avatar */}
          <div
            className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center shadow-sm"
            title={user?.email || 'User'}
          >
            {user?.username?.charAt(0)?.toUpperCase() || 'U'}
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            className="p-2 text-slate-400 hover:text-rose-500 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
            title="ออกจากระบบ"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>
    );
  }

  // ────────────── FULL EXPANDED SIDEBAR (ขยายเต็ม 72) ──────────────
  return (
    <aside className="w-72 h-screen flex flex-col justify-between bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 p-4 select-none overflow-y-auto transition-all duration-300">
      <div className="space-y-6">
        {/* Logo, Collapse Button & Close on mobile */}
        <div className="flex items-center justify-between pt-1">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h1 className="font-extrabold text-lg text-slate-900 dark:text-white tracking-tight leading-none">
                SecureNote
              </h1>
              <span className="text-[11px] text-slate-400 font-medium">End-to-End Vault</span>
            </div>
          </Link>

          <div className="flex items-center gap-1">
            {/* Collapse sidebar button (desktop) */}
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="hidden lg:flex p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                title="ยุบเมนูด้านซ้าย เพื่อดูเต็มจอ"
              >
                <PanelLeftClose size={18} />
              </button>
            )}

            {/* Mobile close button */}
            {onCloseMobile && (
              <button
                onClick={onCloseMobile}
                className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="space-y-1">
          <button
            onClick={() => {
              setSelectedNotebook(null);
              setSelectedLabel(null);
              setSelectedColor(null);
              handleNavClick('/dashboard');
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
              currentPath === '/dashboard' && !selectedNotebook && !selectedLabel && !selectedColor
                ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText size={18} />
            <span>โน้ตทั้งหมด</span>
          </button>

          <button
            onClick={() => handleNavClick('/vault')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
              currentPath === '/vault'
                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-3">
              <Lock size={18} />
              <span>ห้องนิรภัยส่วนตัว</span>
            </div>
            <span
              className={`w-2 h-2 rounded-full ${
                isVaultUnlocked ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
          </button>

          <button
            onClick={() => {
              setSelectedNotebook(null);
              setSelectedLabel(null);
              setSelectedColor(null);
              handleNavClick('/trash');
            }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
              currentPath === '/trash'
                ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Trash2 size={18} />
              <span>ถังขยะ</span>
            </div>
            {trashNotes.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                {trashNotes.length}
              </span>
            )}
          </button>
        </nav>

        {/* Notebooks Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-3.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              สมุดบันทึก
            </span>
            <button
              onClick={() => setIsNotebookModalOpen(true)}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
              title="สร้างสมุดบันทึกใหม่"
            >
              <Plus size={16} />
            </button>
          </div>

          <div className="space-y-1">
            {notebooks.map((nb) => (
              <div
                key={nb.id}
                onClick={() => handleNotebookSelect(nb.id)}
                className={`group flex items-center justify-between px-3.5 py-2 rounded-xl text-sm font-medium cursor-pointer transition ${
                  selectedNotebook === nb.id
                    ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: nb.color }}
                  />
                  <span className="truncate">{nb.name}</span>
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-xs text-slate-400 group-hover:hidden">
                    {nb.noteCount ?? 0}
                  </span>
                  {!nb.isDefault && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotebook(nb.id);
                      }}
                      className="hidden group-hover:block p-1 text-slate-400 hover:text-rose-500 rounded"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Labels Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-3.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              ป้ายกำกับ
            </span>
            <button
              onClick={() => setIsLabelModalOpen(true)}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
              title="สร้างป้ายกำกับใหม่"
            >
              <Plus size={16} />
            </button>
          </div>

          <div className="space-y-1">
            {labels.map((lbl) => (
              <div
                key={lbl.id}
                onClick={() => handleLabelSelect(lbl.id)}
                className={`group flex items-center justify-between px-3.5 py-1.5 rounded-xl text-sm font-medium cursor-pointer transition ${
                  selectedLabel === lbl.id
                    ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Tag size={15} style={{ color: lbl.color }} />
                  <span className="truncate">#{lbl.name}</span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteLabel(lbl.id);
                  }}
                  className="hidden group-hover:block p-1 text-slate-400 hover:text-rose-500 rounded"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Color Filters */}
        <div className="px-3.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
            กรองตามสี
          </span>
          <div className="flex gap-2 flex-wrap items-center">
            {COLOR_FILTERS.map((c) => (
              <button
                key={c}
                onClick={() => handleColorSelect(c)}
                className={`w-5 h-5 rounded-full transition-transform ${
                  selectedColor === c ? 'scale-125 ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900' : 'hover:scale-110'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
            {selectedColor && (
              <button
                onClick={() => setSelectedColor(null)}
                className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline ml-1"
              >
                ล้าง
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bottom User Profile, Vault State & Theme */}
      <div className="pt-4 mt-6 border-t border-slate-200/80 dark:border-slate-800 space-y-3">
        {/* Vault Lock Quick Toggle */}
        <div className="flex items-center justify-between px-2 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-xs">
          <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
            <KeyRound size={14} className="text-indigo-500" />
            E2EE Vault:
          </span>
          {isVaultUnlocked ? (
            <button
              onClick={lockVault}
              className="text-[11px] font-semibold text-rose-500 hover:text-rose-600 px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/50"
            >
              ล็อกทันที
            </button>
          ) : (
            <button
              onClick={() => setIsVaultModalOpen(true)}
              className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/50"
            >
              ปลดล็อก
            </button>
          )}
        </div>

        {/* User bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
              {user?.username?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800 dark:text-white truncate">
                {user?.username || 'ผู้ใช้งาน'}
              </p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="สลับโหมดมืด/สว่าง"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Logout */}
            <button
              onClick={logout}
              className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
              title="ออกจากระบบ"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <NotebookModal
        isOpen={isNotebookModalOpen}
        onClose={() => setIsNotebookModalOpen(false)}
      />
      <LabelModal
        isOpen={isLabelModalOpen}
        onClose={() => setIsLabelModalOpen(false)}
      />
      <MasterPasswordModal
        isOpen={isVaultModalOpen}
        onClose={() => setIsVaultModalOpen(false)}
      />
    </aside>
  );
}
