import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Plus,
  Minus,
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
import BoardBackgroundModal, { BOARD_PATTERNS, CURATED_WALLPAPERS } from './BoardBackgroundModal';
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
    notes: allNotes,
  } = useNoteStore();

  // Real-time note count per board from reactive store state
  const getBoardNoteCount = (b: Board) => {
    const isActive = b.id === activeBoardId || (!activeBoardId && b.isDefault);
    if (isActive) {
      return notes.filter((n) => !n.isArchived).length;
    }
    return b.noteCount ?? 0;
  };

  const [boardTheme, setBoardTheme] = useState<BoardTheme>('cork');
  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);
  const [fullscreenNote, setFullscreenNote] = useState<Note | null>(null);
  const [isArranging, setIsArranging] = useState(false);

  const handleOpenFullscreen = (n: Note) => {
    if (typeof document !== 'undefined' && !document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    }
    setFullscreenNote(n);
  };

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
  const [highlightedNoteId, setHighlightedNoteId] = useState<string | null>(null);

  // Reservation of slots to prevent overlapping when creating notes rapidly
  const pendingSlotsRef = useRef<Array<{ x: number; y: number }>>([]);

  // Dynamic canvas dimensions: exactly 7 notes wide (2060px), height expands with rows as before
  const dynamicCanvasSize = React.useMemo(() => {
    let maxNoteY = 0;
    notes.forEach((n) => {
      const bottom = (n.posY ?? 0) + (n.height ?? 260);
      if (bottom > maxNoteY) maxNoteY = bottom;
    });
    return {
      minWidth: '2060px',
      width: '2060px',
      minHeight: `${Math.max(1300, maxNoteY + 120)}px`,
    };
  }, [notes]);

  // Zoom level state (0.3 to 3.0, default 1.0 as in zoom.mp4)
  const [zoom, setZoom] = useState<number>(1.0);
  const [isZoomOverlayVisible, setIsZoomOverlayVisible] = useState<boolean>(false);
  const zoomTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showZoomOverlay = () => {
    setIsZoomOverlayVisible(true);
    if (zoomTimerRef.current) clearTimeout(zoomTimerRef.current);
    zoomTimerRef.current = setTimeout(() => {
      setIsZoomOverlayVisible(false);
    }, 1200);
  };

  const handleZoomChange = (newZoom: number) => {
    const clamped = Math.max(0.3, Math.min(3.0, Math.round(newZoom * 100) / 100));
    setZoom(clamped);
    showZoomOverlay();
  };

  // Wheel zoom with Ctrl or Meta key
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.08 : -0.08;
        setZoom((prev) => {
          const next = Math.max(0.3, Math.min(3.0, Math.round((prev + delta) * 100) / 100));
          showZoomOverlay();
          return next;
        });
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, []);

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

  // Handle drag and drop coordinates saving without artificial boundary clamping
  const handleDragEnd = async (id: string, x: number, y: number) => {
    const freeX = Math.max(0, Math.round(x));
    const freeY = Math.max(0, Math.round(y));

    // Optimistically update store immediately so the note stays locked in place with zero bounce
    useNoteStore.setState((state) => ({
      notes: state.notes.map((n) => (n.id === id ? { ...n, posX: freeX, posY: freeY } : n)),
    }));

    try {
      await updateNote(id, { posX: freeX, posY: freeY });
    } catch (e) {
      console.error('Failed to save note position:', e);
    }
  };

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
    const spacingX = 290;
    const spacingY = 300;
    const startX = 24;
    const startY = 24;
    // Support 7 notes horizontally across the board before going down to the next row
    const cols = 7;

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
      setHighlightedNoteId(newNote.id);

      // Smoothly scroll ONLY if the note is outside current viewport (keeps exact safe position if already visible)
      const container = canvasContainerRef.current;
      if (container) {
        const noteLeft = (newNote.posX ?? 24) * zoom;
        const noteTop = (newNote.posY ?? 24) * zoom;
        const noteRight = noteLeft + 260 * zoom;
        const noteBottom = noteTop + 260 * zoom;

        const viewLeft = container.scrollLeft;
        const viewTop = container.scrollTop;
        const viewRight = viewLeft + container.clientWidth;
        const viewBottom = viewTop + container.clientHeight;

        const isFullyVisible =
          noteLeft >= viewLeft &&
          noteRight <= viewRight &&
          noteTop >= viewTop &&
          noteBottom <= viewBottom;

        if (!isFullyVisible) {
          container.scrollTo({
            left: Math.max(0, noteLeft - 24),
            top: Math.max(0, noteTop - 24),
            behavior: 'smooth',
          });
        }
      }

      setTimeout(() => {
        const el = document.getElementById(`note-card-${newNote.id}`);
        if (el) {
          const input = el.querySelector('input[type="text"]') as HTMLInputElement | null;
          if (input) {
            input.focus({ preventScroll: true });
            input.select();
          } else {
            const editable = el.querySelector('[contenteditable="true"]') as HTMLElement | null;
            editable?.focus({ preventScroll: true });
          }
        }
      }, 50);

      // Complete subtle highlight and finish all effects within 1.0 second (1000ms)
      setTimeout(() => {
        setHighlightedNoteId(null);
      }, 650);

      setTimeout(() => {
        setFocusedNoteId((curr) => (curr === newNote.id ? null : curr));
      }, 1000);
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
    const spacingY = 300;
    const startX = 24;
    const startY = 24;
    // Support 7 notes horizontally across the board
    const cols = 7;

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

  // Create new board with randomized background (from wallpapers or patterns) and vibrant tab color
  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoardName.trim()) return;

    // 60% chance to pick a curated wallpaper, 40% chance to pick a textured pattern
    const useWallpaper = Math.random() > 0.4;
    let randomTheme = 'cork';
    let randomBgImage: string | null = null;

    if (useWallpaper && CURATED_WALLPAPERS && CURATED_WALLPAPERS.length > 0) {
      const randomWp = CURATED_WALLPAPERS[Math.floor(Math.random() * CURATED_WALLPAPERS.length)];
      randomTheme = 'custom';
      randomBgImage = randomWp.url;
    } else if (BOARD_PATTERNS && BOARD_PATTERNS.length > 0) {
      const randomPattern = BOARD_PATTERNS[Math.floor(Math.random() * BOARD_PATTERNS.length)];
      randomTheme = randomPattern.id;
    }

    const randomColor = TAB_COLORS[Math.floor(Math.random() * TAB_COLORS.length)];

    try {
      await createBoard({
        name: newBoardName.trim(),
        color: newBoardColor || randomColor,
        theme: randomTheme,
        bgImage: randomBgImage,
      });
      setNewBoardName('');
      setIsAddBoardModalOpen(false);
      toast.success('สร้างบอร์ดใหม่พร้อมสุ่มพื้นหลังเรียบร้อยแล้ว!');
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

  // Delete board confirmation or clear all notes if default board
  const handleDeleteBoard = async (board: Board) => {
    if (board.isDefault) {
      if (confirm(`คุณต้องการลบโน้ตทั้งหมดบน "${board.name}" ใช่หรือไม่?\n(โน้ตทั้งหมดบนกระดานนี้จะถูกย้ายไปที่ถังขยะ แต่ตัวกระดานหลักจะยังคงอยู่)`)) {
        await deleteBoard(board.id);
        setEditingBoard(null);
      }
      return;
    }
    if (confirm(`คุณต้องการลบบอร์ด "${board.name}" ใช่หรือไม่?\n(โน้ตทั้งหมดในบอร์ดนี้จะถูกย้ายไปที่ถังขยะ)`)) {
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
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-semibold">
                  {getBoardNoteCount(b)}
                </span>

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
            onClick={() => {
              setNewBoardColor(TAB_COLORS[Math.floor(Math.random() * TAB_COLORS.length)]);
              setIsAddBoardModalOpen(true);
            }}
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
              <button
                onClick={() => handleDeleteBoard(activeBoard)}
                className="p-0.5 hover:bg-rose-100 dark:hover:bg-rose-950/60 rounded text-slate-400 hover:text-rose-600 transition"
                title={activeBoard.isDefault ? `ลบโน้ตทั้งหมดบนกระดานหลัก (ย้ายลงถังขยะ)` : `ลบบอร์ด "${activeBoard.name}" (ย้ายโน้ตลงถังขยะ)`}
              >
                <Trash2 size={12} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── TOP SECTION 2: Control Toolbar (Freeform Canvas Only - Docked cleanly beneath tabs) ── */}
      {boardViewMode === 'freeform' && (
        <div className="w-full shrink-0 z-20 flex items-center justify-between gap-3 px-4 py-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-xs">
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
              className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-full text-xs flex items-center gap-1.5 shadow-md shadow-indigo-500/25 transition-all duration-200 active:scale-95 shrink-0"
              title="สร้างโน้ตใหม่"
            >
              <Plus size={15} className="stroke-[2.5]" />
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
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 bg-indigo-600 text-white px-4 py-2 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-bold animate-bounce">
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
          className="flex-1 w-full h-full min-h-0 overflow-auto relative p-6 sm:p-8 cursor-default board-canvas-container"
        >
          {/* Zoom Wrapper to allow accurate container scrolling */}
          <div
            style={{
              width: `${Math.round((parseInt(dynamicCanvasSize.minWidth) || 2200) * zoom)}px`,
              height: `${Math.round((parseInt(dynamicCanvasSize.minHeight) || 1600) * zoom)}px`,
            }}
          >
            <div
              id="sticky-board-canvas"
              style={{
                ...dynamicCanvasSize,
                transform: `scale(${zoom})`,
                transformOrigin: 'top left',
              }}
              className="relative rounded-3xl transition-transform duration-100 ease-out"
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
                    zoom={zoom}
                    onDragEnd={handleDragEnd}
                    onUnlockRequest={() => setIsVaultModalOpen(true)}
                    onStartConnect={handleStartConnect}
                    onTargetConnect={handleTargetConnect}
                    onOpenFullscreen={handleOpenFullscreen}
                    isConnectingSource={connectingSourceId === note.id}
                    isConnectingMode={!!connectingSourceId}
                    onBringToFront={() => {
                      bringToFront(note.id);
                      setFocusedNoteId(note.id);
                    }}
                    customZIndex={noteZIndices[note.id]}
                    isFocused={focusedNoteId === note.id}
                    isHighlighted={highlightedNoteId === note.id}
                  />
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Center Zoom Indicator (Big overlay as in video zoom.mp4) ── */}
      {isZoomOverlayVisible && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none animate-fade-in select-none">
          <div className="bg-black/75 dark:bg-slate-900/90 backdrop-blur-md text-white px-8 py-3.5 rounded-2xl shadow-2xl border border-white/20 text-2xl sm:text-3xl font-mono font-black tracking-wider flex items-center justify-center">
            <span>ZOOM: {Math.round(zoom * 100)}%</span>
          </div>
        </div>
      )}

      {/* ── Floating Zoom Controller Bar (Right-side widget as in zoom.mp4, desktop/tablet only) ── */}
      {boardViewMode === 'freeform' && (
        <div className="hidden md:flex absolute right-6 bottom-6 z-30 items-center gap-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-1.5 px-2.5 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 select-none animate-fade-in">
          {/* 100% Reset Button */}
          <button
            type="button"
            onClick={() => handleZoomChange(1.0)}
            className={`px-2.5 py-1 text-xs font-mono font-bold rounded-xl transition active:scale-95 flex items-center justify-center min-w-[52px] shadow-xs ${
              Math.round(zoom * 100) === 100
                ? 'bg-indigo-600 text-white shadow-indigo-500/20'
                : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
            }`}
            title="คลิกเพื่อรีเซ็ตขนาดการซูมเป็น 100%"
          >
            {Math.round(zoom * 100)}%
          </button>

          {/* Zoom Out (-) Button */}
          <button
            type="button"
            onClick={() => handleZoomChange(zoom - 0.1)}
            disabled={zoom <= 0.3}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-slate-700 dark:text-slate-200 transition active:scale-90"
            title="ซูมออก (-10%)"
          >
            <Minus size={15} />
          </button>

          {/* Zoom Slider */}
          <input
            type="range"
            min="30"
            max="300"
            step="5"
            value={Math.round(zoom * 100)}
            onChange={(e) => handleZoomChange(Number(e.target.value) / 100)}
            className="w-24 sm:w-32 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            title={`ระดับการซูม: ${Math.round(zoom * 100)}%`}
          />

          {/* Zoom In (+) Button */}
          <button
            type="button"
            onClick={() => handleZoomChange(zoom + 0.1)}
            disabled={zoom >= 3.0}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-slate-700 dark:text-slate-200 transition active:scale-90"
            title="ซูมเข้า (+10%)"
          >
            <Plus size={15} />
          </button>
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
                  <button
                    type="button"
                    onClick={() => handleDeleteBoard(editingBoard)}
                    className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition flex items-center gap-1"
                    title="ลบโน้ตทั้งหมดบนกระดานหลักนี้ (ย้ายลงถังขยะ)"
                  >
                    <Trash2 size={13} />
                    <span>ลบโน้ตทั้งหมด</span>
                  </button>
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
            if (typeof document !== 'undefined' && document.fullscreenElement) {
              document.exitFullscreen?.().catch(() => {});
            }
            setFullscreenNote(null);
            fetchNotes({ isArchived: false });
          }}
        />
      )}
    </div>
  );
}
