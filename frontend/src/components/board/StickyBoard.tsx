import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Plus,
  MoreHorizontal,
  Edit2,
  Trash2,
  Check,
  X,
  Palette,
  Layout,
  FolderPlus,
  Share2,
  Columns,
  Link2,
  Compass,
  Image as ImageIcon,
  Sparkles,
} from 'lucide-react';
import StickyNoteItem from './StickyNoteItem';
import NoteConnectionCanvas from './NoteConnectionCanvas';
import KanbanView from './KanbanView';
import BoardShareModal from '../modals/BoardShareModal';
import WebStickyModal from '../modals/WebStickyModal';
import BoardBackgroundModal, { BOARD_PATTERNS } from './BoardBackgroundModal';
import FullscreenNoteModal from '../notes/FullscreenNoteModal';
import { Note, Board, BoardViewMode } from '@/types';
import { useNoteStore } from '@/store/noteStore';
import MasterPasswordModal from '../notes/MasterPasswordModal';
import toast from 'react-hot-toast';

interface StickyBoardProps {
  notes: Note[];
}

type BoardTheme = 'cork' | 'grid' | 'dark' | 'clean' | 'custom';

const TAB_COLORS = [
  '#4F46E5', // Indigo
  '#2563EB', // Blue
  '#059669', // Emerald
  '#D97706', // Amber
  '#DC2626', // Red
  '#DB2777', // Pink
  '#7C3AED', // Purple
  '#475569', // Slate
  '#0D9488', // Teal
];

export default function StickyBoard({ notes }: StickyBoardProps) {
  const router = useRouter();
  const {
    boards,
    activeBoardId,
    setActiveBoardId,
    createBoard,
    updateBoard,
    deleteBoard,
    createNote,
    updateNote,
    fetchNotes,
    connections,
    createConnection,
    boardViewMode,
    setBoardViewMode,
  } = useNoteStore();

  const [boardTheme, setBoardTheme] = useState<BoardTheme>('cork');
  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);
  const [fullscreenNote, setFullscreenNote] = useState<Note | null>(null);
  const [isArranging, setIsArranging] = useState(false);

  // Modals for Sharing, Web Sticky, and Backgrounds
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isWebStickyModalOpen, setIsWebStickyModalOpen] = useState(false);
  const [isBackgroundModalOpen, setIsBackgroundModalOpen] = useState(false);

  // Modals / Dropdowns for Board Management
  const [isAddBoardModalOpen, setIsAddBoardModalOpen] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [newBoardColor, setNewBoardColor] = useState(TAB_COLORS[0]);

  const [editingBoard, setEditingBoard] = useState<Board | null>(null);
  const [editBoardName, setEditBoardName] = useState('');
  const [editBoardColor, setEditBoardColor] = useState('');

  // Interactive Note Connection Mode state
  const [connectingSourceId, setConnectingSourceId] = useState<string | null>(null);

  // Canvas scroll container ref
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Z-index management so clicked or interacted notes always sit on top
  const [noteZIndices, setNoteZIndices] = useState<Record<string, number>>({});
  const highestZRef = useRef<number>(50);
  const [focusedNoteId, setFocusedNoteId] = useState<string | null>(null);

  // Reservation of slots to prevent overlapping when creating notes rapidly
  const pendingSlotsRef = useRef<Array<{ x: number; y: number }>>([]);
  const hasAutoRepositionedRef = useRef<Record<string, boolean>>({});

  const bringToFront = (noteId: string) => {
    highestZRef.current += 1;
    const newZ = highestZRef.current;
    setNoteZIndices((prev) => ({ ...prev, [noteId]: newZ }));
  };

  // Automatically scroll to top-left when board changes
  useEffect(() => {
    if (canvasContainerRef.current) {
      canvasContainerRef.current.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }
  }, [activeBoardId]);

  // Handle drag and drop coordinates saving with canvas boundary clamping
  const handleDragEnd = async (id: string, x: number, y: number) => {
    const canvas = document.getElementById('sticky-board-canvas');
    const maxW = canvas ? canvas.clientWidth : 2000;
    const maxH = canvas ? canvas.clientHeight : 1500;

    const clampedX = Math.max(16, Math.min(maxW - 270, Math.round(x)));
    const clampedY = Math.max(16, Math.min(maxH - 270, Math.round(y)));
    try {
      await updateNote(id, { posX: clampedX, posY: clampedY });
    } catch (e) {
      console.error('Failed to save note position:', e);
    }
  };

  // Auto-arrange any existing notes that were created on top of each other (overlapping)
  useEffect(() => {
    const boardKey = activeBoardId || '__default__';
    if (!notes || notes.length <= 1 || hasAutoRepositionedRef.current[boardKey]) return;

    const occupied: Array<{ id: string; x: number; y: number }> = [];
    const needReposition: Array<{ id: string; x: number; y: number }> = [];

    const spacingX = 320;
    const spacingY = 320;
    const startX = 24;
    const startY = 24;
    const cols = 4;

    notes.forEach((n, idx) => {
      const x = n.posX ?? (startX + (idx % cols) * spacingX);
      const y = n.posY ?? (startY + Math.floor(idx / cols) * spacingY);

      const collides = occupied.some(
        (o) => Math.abs(o.x - x) < 200 && Math.abs(o.y - y) < 200
      );

      if (collides) {
        for (let s = 0; s < 100; s++) {
          const c = s % cols;
          const r = Math.floor(s / cols);
          const candX = startX + c * spacingX;
          const candY = startY + r * spacingY;
          const isTaken = occupied.some(
            (o) => Math.abs(o.x - candX) < 260 && Math.abs(o.y - candY) < 260
          );
          if (!isTaken) {
            needReposition.push({ id: n.id, x: candX, y: candY });
            occupied.push({ id: n.id, x: candX, y: candY });
            break;
          }
        }
      } else {
        occupied.push({ id: n.id, x, y });
      }
    });

    if (needReposition.length > 0) {
      hasAutoRepositionedRef.current[boardKey] = true;
      needReposition.forEach((item, index) => {
        setTimeout(() => {
          updateNote(item.id, { posX: item.x, posY: item.y });
        }, index * 120);
      });
    }
  }, [activeBoardId, notes]);

  // Start connecting mode from a source note
  const handleStartConnect = (sourceId: string) => {
    if (connectingSourceId === sourceId) {
      setConnectingSourceId(null);
    } else {
      setConnectingSourceId(sourceId);
      toast('คลิกที่โน้ตปลายทางที่ต้องการโยงลูกศร', { icon: '🔗' });
    }
  };

  // Complete connection to target note
  const handleTargetConnect = async (targetId: string) => {
    if (!connectingSourceId) return;

    if (connectingSourceId === targetId) {
      setConnectingSourceId(null);
      return;
    }

    if (!activeBoardId) {
      toast.error('กรุณาเลือกบอร์ดก่อนเชื่อมต่อ');
      setConnectingSourceId(null);
      return;
    }

    await createConnection({
      sourceId: connectingSourceId,
      targetId,
      boardId: activeBoardId,
      label: 'เชื่อมโยง',
      color: '#6366F1',
    });

    setConnectingSourceId(null);
  };

  // Smart slot finder: finds nearest empty grid slot that doesn't overlap any existing note with proper spacing
  const findNextAvailableSlot = () => {
    const spacingX = 320;
    const spacingY = 320;
    const startX = 24;
    const startY = 24;
    const containerWidth = canvasContainerRef.current?.clientWidth || (typeof window !== 'undefined' ? window.innerWidth : 1050);
    const cols = Math.max(2, Math.floor((containerWidth - 48) / spacingX));

    const isSlotOccupied = (candX: number, candY: number, candW = 260, candH = 260) => {
      const margin = 16;
      // 1. Check against all existing notes on the board
      const noteCollision = notes.some((n) => {
        const nx = n.posX ?? startX;
        const ny = n.posY ?? startY;
        const nw = n.width ?? 260;
        const nh = n.height ?? 260;
        return (
          candX < nx + nw + margin &&
          candX + candW + margin > nx &&
          candY < ny + nh + margin &&
          candY + candH + margin > ny
        );
      });
      if (noteCollision) return true;

      // 2. Check against pending reservations to prevent race conditions during rapid clicks
      const pendingCollision = pendingSlotsRef.current.some((p) => {
        return (
          candX < p.x + 260 + margin &&
          candX + candW + margin > p.x &&
          candY < p.y + 260 + margin &&
          candY + candH + margin > p.y
        );
      });
      return pendingCollision;
    };

    // Scan slots row by row
    for (let slot = 0; slot < notes.length + 100; slot++) {
      const col = slot % cols;
      const row = Math.floor(slot / cols);
      const candX = startX + col * spacingX;
      const candY = startY + row * spacingY;

      if (!isSlotOccupied(candX, candY)) {
        pendingSlotsRef.current.push({ x: candX, y: candY });
        setTimeout(() => {
          pendingSlotsRef.current = pendingSlotsRef.current.filter((p) => p.x !== candX || p.y !== candY);
        }, 5000);
        return { x: candX, y: candY };
      }
    }

    return { x: startX, y: startY };
  };

  // Quick add sticky note directly onto the active board with proper spacing, bring to front, and auto-focus
  const handleQuickAdd = async (color: string = '#FEF08A') => {
    const { x, y } = findNextAvailableSlot();
    const targetBoardId = activeBoardId || boards.find((b) => b.isDefault)?.id || boards[0]?.id || undefined;

    const newNote = await createNote({
      title: 'โน้ตใหม่',
      content: '',
      color,
      textColor: '#0F172A',
      fontSize: 'normal',
      fontFamily: 'sans',
      kanbanStatus: 'todo',
      rotation: 0,
      posX: x,
      posY: y,
      isPinned: false,
      boardId: targetBoardId,
    });

    if (newNote?.id) {
      bringToFront(newNote.id);
      setFocusedNoteId(newNote.id);

      setTimeout(() => {
        const el = document.getElementById(`note-card-${newNote.id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
          const input = el.querySelector('input, textarea') as HTMLInputElement | HTMLTextAreaElement | null;
          if (input) {
            input.focus();
          }
        }
      }, 100);

      setTimeout(() => {
        setFocusedNoteId((curr) => (curr === newNote.id ? null : curr));
      }, 2500);
    }
  };

  // Auto-arrange all notes in a neat grid
  const handleAutoArrange = async () => {
    if (notes.length === 0) {
      toast('ไม่มีโน้ตบนกระดานให้จัดเรียง', { icon: 'ℹ️' });
      return;
    }

    setIsArranging(true);
    const spacingX = 290;
    const spacingY = 320;
    const startX = 60;
    const startY = 40;
    const containerWidth = canvasContainerRef.current?.clientWidth || (typeof window !== 'undefined' ? window.innerWidth : 1200);
    const cols = Math.max(2, Math.floor((containerWidth - 120) / spacingX));

    // Sort pinned notes first, then maintain natural order
    const sortedNotes = [...notes].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return 0;
    });

    const updates = sortedNotes.map((n, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const newX = startX + col * spacingX;
      const newY = startY + row * spacingY;
      return { id: n.id, posX: newX, posY: newY };
    });

    // Optimistic local state update for instant, smooth animation
    useNoteStore.setState((state) => ({
      notes: state.notes.map((n) => {
        const match = updates.find((u) => u.id === n.id);
        return match ? { ...n, posX: match.posX, posY: match.posY } : n;
      }),
    }));

    try {
      await Promise.all(
        updates.map((u) => updateNote(u.id, { posX: u.posX, posY: u.posY }))
      );
      toast.success('จัดเรียงโน้ตทั้งหมดเรียบร้อยแล้ว');
      if (canvasContainerRef.current) {
        canvasContainerRef.current.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      }
    } catch (err) {
      console.error('Failed to auto-arrange notes:', err);
      toast.error('จัดเรียงโน้ตไม่สำเร็จ');
    } finally {
      setIsArranging(false);
    }
  };

  // Create new board
  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoardName.trim()) return;

    try {
      await createBoard({
        name: newBoardName.trim(),
        color: newBoardColor,
        theme: boardTheme,
      });
      setNewBoardName('');
      setIsAddBoardModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('สร้างบอร์ดไม่สำเร็จ');
    }
  };

  // Save board edit
  const handleSaveBoardEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBoard || !editBoardName.trim()) return;

    try {
      await updateBoard(editingBoard.id, {
        name: editBoardName.trim(),
        color: editBoardColor,
      });
      setEditingBoard(null);
    } catch (err) {
      console.error(err);
      toast.error('อัปเดตบอร์ดไม่สำเร็จ');
    }
  };

  // Delete board confirmation
  const handleDeleteBoard = async (board: Board) => {
    if (board.isDefault) {
      toast.error('ไม่สามารถลบบอร์ดหลักเริ่มต้นได้');
      return;
    }
    if (confirm(`คุณต้องการลบบอร์ด "${board.name}" ใช่หรือไม่? (โน้ตในบอร์ดนี้จะยังคงอยู่ในระบบแต่ไม่สังกัดบอร์ดนี้)`)) {
      await deleteBoard(board.id);
      setEditingBoard(null);
    }
  };

  const openEditBoardModal = (b: Board, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingBoard(b);
    setEditBoardName(b.name);
    setEditBoardColor(b.color || TAB_COLORS[0]);
  };

  const activeBoard = boards.find((b) => b.id === activeBoardId);

  // Background styling based on board theme or custom image
  const getBoardStyle = () => {
    if (activeBoard?.bgImage) {
      return {
        backgroundImage: `url('${activeBoard.bgImage}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      };
    }

    const currentThemeId = activeBoard?.theme || boardTheme || 'cork';
    const pattern = BOARD_PATTERNS.find((p) => p.id === currentThemeId);
    if (pattern) {
      return pattern.style;
    }

    // Default fallback to cork
    return BOARD_PATTERNS[0].style;
  };

  return (
    <div className="flex-1 w-full h-full min-h-0 flex flex-col rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl overflow-hidden animate-fade-in relative select-none">
      {/* ── TOP SECTION 1: Multi-Board Tabs Bar (Note Board style) ── */}
      <div className="bg-slate-100/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 px-4 pt-2.5 flex items-center justify-between gap-3 overflow-x-auto select-none z-30">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
          {boards.map((b) => {
            const isActive = b.id === activeBoardId;
            return (
              <div
                key={b.id}
                onClick={() => setActiveBoardId(b.id)}
                onDoubleClick={(e) => openEditBoardModal(b, e)}
                className={`group relative flex items-center gap-2 px-3.5 py-1.5 rounded-t-xl text-xs font-bold cursor-pointer transition-all shrink-0 border-t-2 ${
                  isActive
                    ? 'bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-white'
                    : 'bg-slate-200/60 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
                style={{
                  borderTopColor: b.color || '#4F46E5',
                }}
                title="คลิกเพื่อเลือกบอร์ด / ดับเบิ้ลคลิกเพื่อเปลี่ยนชื่อ"
              >
                {/* Dot color indicator */}
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: b.color || '#4F46E5' }}
                />
                <span
                  className="max-w-[120px] truncate cursor-pointer select-none"
                  onDoubleClick={(e) => openEditBoardModal(b, e)}
                >
                  {b.name}
                </span>
                {typeof b.noteCount === 'number' && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                    {b.noteCount}
                  </span>
                )}

                {/* Edit board button */}
                <button
                  onClick={(e) => openEditBoardModal(b, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
                  title="ตั้งค่าบอร์ด (เปลี่ยนชื่อ/สี)"
                >
                  <Edit2 size={12} />
                </button>
              </div>
            );
          })}

          {/* Add Board Tab Button */}
          <button
            onClick={() => setIsAddBoardModalOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-t-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition shrink-0 border-t-2 border-transparent"
          >
            <Plus size={14} />
            <span>+ บอร์ดใหม่</span>
          </button>
        </div>

        {/* Right side controls in Header (Active Board Info) */}
        <div className="flex items-center gap-2 shrink-0 pb-2">
          {/* Active Board Toolbar Info & Edit / Delete */}
          {activeBoard && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 bg-slate-200/50 dark:bg-slate-800/50 px-2.5 py-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
              <span
                onDoubleClick={(e) => openEditBoardModal(activeBoard, e)}
                className="cursor-pointer select-none truncate max-w-[120px]"
                title="ดับเบิ้ลคลิกเพื่อเปลี่ยนชื่อบอร์ด"
              >
                กำลังดู: <b className="text-slate-800 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline">{activeBoard.name}</b>
              </span>
              <button
                onClick={(e) => openEditBoardModal(activeBoard, e)}
                className="p-0.5 hover:bg-slate-300/50 dark:hover:bg-slate-700 rounded text-slate-500 hover:text-indigo-600 transition"
                title="แก้ไขชื่อและสีบอร์ดปัจจุบัน (หรือดับเบิ้ลคลิกที่ชื่อ)"
              >
                <Edit2 size={12} />
              </button>
              {!activeBoard.isDefault && (
                <button
                  onClick={() => handleDeleteBoard(activeBoard)}
                  className="p-0.5 hover:bg-rose-100 dark:hover:bg-rose-950/60 rounded text-slate-400 hover:text-rose-600 transition"
                  title={`ลบบอร์ด "${activeBoard.name}"`}
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── TOP SECTION 2: Control Toolbar (Freeform Canvas Only) ── */}
      {boardViewMode === 'freeform' && (
        <div className="absolute top-14 left-4 right-4 z-20 flex items-center justify-between gap-3 p-2 sm:p-2.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-md">
          {/* Quick Add Sticky Note Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => handleQuickAdd('#FEF08A')}
              className="px-3 py-1.5 bg-amber-300 hover:bg-amber-400 text-amber-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95 shrink-0"
            >
              <Plus size={15} />
              <span>แปะโน้ตเหลือง</span>
            </button>
            <button
              onClick={() => handleQuickAdd('#FBCFE8')}
              className="hidden sm:flex px-3 py-1.5 bg-pink-300 hover:bg-pink-400 text-pink-950 font-bold rounded-xl text-xs items-center gap-1.5 shadow-sm transition active:scale-95 shrink-0"
            >
              <Plus size={15} />
              <span>ชมพู</span>
            </button>
            <button
              onClick={() => handleQuickAdd('#BBF7D0')}
              className="hidden sm:flex px-3 py-1.5 bg-emerald-300 hover:bg-emerald-400 text-emerald-950 font-bold rounded-xl text-xs items-center gap-1.5 shadow-sm transition active:scale-95 shrink-0"
            >
              <Plus size={15} />
              <span>เขียว</span>
            </button>
            <button
              onClick={() => handleQuickAdd('#BAE6FD')}
              className="hidden sm:flex px-3 py-1.5 bg-sky-300 hover:bg-sky-400 text-sky-950 font-bold rounded-xl text-xs items-center gap-1.5 shadow-sm transition active:scale-95 shrink-0"
            >
              <Plus size={15} />
              <span>ฟ้า</span>
            </button>

            {/* + โน้ตใหม่ - Navigate to /notes/new editor matching all other pages */}
            <button
              onClick={() => {
                const url = activeBoardId ? `/notes/new?boardId=${activeBoardId}` : '/notes/new';
                router.push(url);
              }}
              className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95 shrink-0"
              title="สร้างโน้ตใหม่"
            >
              <Plus size={15} />
              <span>โน้ตใหม่</span>
            </button>

            {/* Web Sticky Simulator Button */}
            <button
              onClick={() => setIsWebStickyModalOpen(true)}
              className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-300 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition shrink-0"
              title="จำลองการแทรกโน้ตบนหน้าเว็บไซต์ใดก็ได้ (Chrome Extension style)"
            >
              <Compass size={14} />
              <span className="hidden md:inline">แทรกโน้ตบนหน้าเว็บ</span>
            </button>
          </div>

          {/* Right Tools: Share Board, Freeform mode, Change Background */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Share Board Button */}
            {activeBoard && (
              <button
                onClick={() => setIsShareModalOpen(true)}
                className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition active:scale-95"
                title="แชร์กระดานนี้ให้ผู้อื่น (แก้ไขเรียลไทม์ หรือ ดูอย่างเดียว)"
              >
                <Share2 size={13} />
                <span className="hidden sm:inline">แชร์บอร์ด</span>
              </button>
            )}

            {/* Auto Arrange Notes Button */}
            <button
              onClick={handleAutoArrange}
              disabled={isArranging || notes.length === 0}
              className="px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs border border-slate-200 dark:border-slate-700 transition active:scale-95"
              title="จัดเรียงโน้ตทั้งหมดบนกระดานให้เป็นระเบียบอัตโนมัติ"
            >
              <Sparkles size={14} className={`text-amber-500 ${isArranging ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isArranging ? 'กำลังจัดเรียง...' : 'จัดเรียงอัตโนมัติ'}</span>
            </button>

            {/* Change Background Button */}
            <button
              onClick={() => setIsBackgroundModalOpen(true)}
              className="px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs border border-slate-200 dark:border-slate-700 transition active:scale-95"
              title="เปลี่ยนพื้นหลังและลวดลายกระดาน"
            >
              <Palette size={14} className="text-indigo-600 dark:text-indigo-400" />
              <span className="hidden sm:inline">เปลี่ยนพื้นหลัง</span>
            </button>
          </div>
        </div>
      )}

      {/* ── CONNECTION IN PROGRESS BANNER ── */}
      {connectingSourceId && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 z-40 bg-indigo-600 text-white px-4 py-2 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-bold animate-bounce">
          <Link2 size={16} />
          <span>🔗 โหมดเชื่อมต่อโน้ต: คลิกที่โน้ตปลายทางเพื่อเชื่อมโยงเส้นลูกศร</span>
          <button
            onClick={() => setConnectingSourceId(null)}
            className="px-2 py-0.5 bg-white/20 hover:bg-white/30 rounded-lg text-white"
          >
            ยกเลิก
          </button>
        </div>
      )}

      {/* ── MAIN SURFACE: Freeform Canvas OR Kanban View ── */}
      {boardViewMode === 'kanban' ? (
        <div className="flex-1 w-full h-full overflow-hidden">
          <KanbanView notes={notes} />
        </div>
      ) : (
        <div
          ref={canvasContainerRef}
          style={getBoardStyle()}
          className="flex-1 w-full h-full min-h-0 overflow-auto relative p-6 sm:p-8 cursor-default pt-28 board-canvas-container"
        >
          <div
            id="sticky-board-canvas"
            className="min-w-[2000px] min-h-[1500px] relative border-2 border-dashed border-slate-300/60 dark:border-slate-700/60 rounded-3xl"
          >
            {/* SVG Visual Connection Lines Canvas */}
            <NoteConnectionCanvas
              connections={connections.filter((c) => !activeBoardId || c.boardId === activeBoardId)}
              notes={notes}
            />

            {/* Sticky Notes */}
            {notes.map((note, idx) => (
                <StickyNoteItem
                  key={note.id}
                  note={note}
                  index={idx}
                  onDragEnd={handleDragEnd}
                  onUnlockRequest={() => setIsVaultModalOpen(true)}
                  onStartConnect={handleStartConnect}
                  onTargetConnect={handleTargetConnect}
                  onOpenFullscreen={(n) => setFullscreenNote(n)}
                  isConnectingSource={connectingSourceId === note.id}
                  isConnectingMode={!!connectingSourceId}
                  onBringToFront={() => bringToFront(note.id)}
                  customZIndex={noteZIndices[note.id]}
                  isFocused={focusedNoteId === note.id}
                />
              ))}
          </div>
        </div>
      )}

      {/* ── MODAL: Create New Board ── */}
      {isAddBoardModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderPlus className="text-indigo-600" size={20} />
                <h3 className="font-bold text-slate-900 dark:text-white">เพิ่มกระดานโน้ตใหม่</h3>
              </div>
              <button
                onClick={() => setIsAddBoardModalOpen(false)}
                className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateBoard} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                  ชื่อกระดาน (Board Name)
                </label>
                <input
                  type="text"
                  value={newBoardName}
                  onChange={(e) => setNewBoardName(e.target.value)}
                  placeholder="เช่น หุ้นและพอร์ตลงทุน, แผนงานด่วน..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                  สีของแท็บกระดาน
                </label>
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  {TAB_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewBoardColor(color)}
                      style={{ backgroundColor: color }}
                      className="w-6 h-6 rounded-full shadow-sm flex items-center justify-center transition hover:scale-110"
                    >
                      {newBoardColor === color && <Check size={12} className="text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddBoardModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition"
                >
                  สร้างกระดาน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Edit Board Name/Color ── */}
      {editingBoard && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit2 className="text-indigo-600" size={18} />
                <h3 className="font-bold text-slate-900 dark:text-white">ตั้งค่ากระดาน</h3>
              </div>
              <button
                onClick={() => setEditingBoard(null)}
                className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveBoardEdit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                  ชื่อกระดาน
                </label>
                <input
                  type="text"
                  value={editBoardName}
                  onChange={(e) => setEditBoardName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                  สีของแท็บกระดาน
                </label>
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  {TAB_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setEditBoardColor(color)}
                      style={{ backgroundColor: color }}
                      className="w-6 h-6 rounded-full shadow-sm flex items-center justify-center transition hover:scale-110"
                    >
                      {editBoardColor === color && <Check size={12} className="text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                {!editingBoard.isDefault ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteBoard(editingBoard)}
                    className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition flex items-center gap-1"
                  >
                    <Trash2 size={13} />
                    <span>ลบบอร์ด</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingBoard(null)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition"
                  >
                    บันทึก
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Board Background & Patterns ── */}
      <BoardBackgroundModal
        isOpen={isBackgroundModalOpen}
        onClose={() => setIsBackgroundModalOpen(false)}
        currentTheme={activeBoard?.theme || boardTheme}
        currentBgImage={activeBoard?.bgImage || null}
        onSelectTheme={async (themeId) => {
          setBoardTheme(themeId as any);
          if (activeBoardId) {
            await updateBoard(activeBoardId, { theme: themeId, bgImage: null });
          }
        }}
        onSelectWallpaper={async (url) => {
          if (activeBoardId) {
            await updateBoard(activeBoardId, { bgImage: url });
          }
        }}
      />

      {/* ── MODAL: Board Sharing ── */}
      {activeBoard && isShareModalOpen && (
        <BoardShareModal
          board={activeBoard}
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
        />
      )}

      {/* ── MODAL: Web Sticky Simulator ── */}
      <WebStickyModal
        isOpen={isWebStickyModalOpen}
        onClose={() => setIsWebStickyModalOpen(false)}
      />

      {/* Master Password Modal for unlocking encrypted notes */}
      <MasterPasswordModal
        isOpen={isVaultModalOpen}
        onClose={() => setIsVaultModalOpen(false)}
      />

      {/* Fullscreen Note Focus Modal (เหมือนหน้าคัมบัง) */}
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
    </div>
  );
}
