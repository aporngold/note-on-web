import React, { useState } from 'react';
import {
  Plus,
  LayoutGrid,
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
} from 'lucide-react';
import StickyNoteItem from './StickyNoteItem';
import NoteConnectionCanvas from './NoteConnectionCanvas';
import KanbanView from './KanbanView';
import BoardShareModal from '../modals/BoardShareModal';
import WebStickyModal from '../modals/WebStickyModal';
import BoardBackgroundModal, { BOARD_PATTERNS } from './BoardBackgroundModal';
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

  // Handle drag and drop coordinates saving
  const handleDragEnd = async (id: string, x: number, y: number) => {
    try {
      await updateNote(id, { posX: Math.round(x), posY: Math.round(y) });
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

  // Quick add sticky note directly onto the active board
  const handleQuickAdd = async (color: string = '#FEF08A') => {
    const x = 140 + ((notes.length * 60) % 650);
    const y = 140 + (Math.floor(notes.length / 4) * 80) % 320;

    await createNote({
      title: 'โน้ตด่วน',
      content: '',
      color,
      textColor: '#0F172A',
      fontSize: 'normal',
      fontFamily: 'sans',
      kanbanStatus: 'todo',
      posX: x,
      posY: y,
      isPinned: false,
      boardId: activeBoardId || undefined,
    });
  };

  // Auto-arrange all notes in a neat grid
  const handleAutoArrange = async () => {
    const spacingX = 290;
    const spacingY = 320;
    const startX = 60;
    const startY = 100;
    const cols = Math.max(3, Math.floor((window.innerWidth - 350) / spacingX));

    notes.forEach((n, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const newX = startX + col * spacingX;
      const newY = startY + row * spacingY;
      updateNote(n.id, { posX: newX, posY: newY });
    });
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
    <div className="flex flex-col h-[calc(100vh-100px)] rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl overflow-hidden animate-fade-in relative select-none">
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

            {/* Switch to Freeform Canvas Icon Button */}
            <button
              onClick={() => setBoardViewMode('freeform')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border shadow-xs ${
                boardViewMode === 'freeform'
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
              title="กระดานอิสระ (Freeform Board)"
            >
              <LayoutGrid size={14} />
              <span className="hidden sm:inline">กระดานอิสระ</span>
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
          style={getBoardStyle()}
          className="flex-1 w-full h-full overflow-auto relative p-8 cursor-default pt-28"
        >
          <div className="min-w-[2200px] min-h-[1600px] relative">
            {/* SVG Visual Connection Lines Canvas */}
            <NoteConnectionCanvas
              connections={connections.filter((c) => !activeBoardId || c.boardId === activeBoardId)}
              notes={notes}
            />

            {/* Sticky Notes */}
            {notes.length === 0 ? (
              <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 text-center p-8 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-3xl shadow-xl max-w-sm border border-slate-200 dark:border-slate-800 space-y-3">
                <span className="text-4xl">📌</span>
                <h3 className="font-bold text-slate-800 dark:text-white">
                  บอร์ด {activeBoard ? `"${activeBoard.name}"` : ''} ยังว่างเปล่า
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  กดปุ่ม &quot;+ แปะโน้ต&quot; ด้านบน เพื่อสร้างโน้ตใหม่ ลากวางตำแหน่ง เชื่อมต่อโน้ต หรือแนบไฟล์รูปภาพ/PDF ได้อย่างอิสระ!
                </p>
                <button
                  onClick={() => handleQuickAdd('#FEF08A')}
                  className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-amber-950 font-bold text-xs rounded-xl shadow transition"
                >
                  + แปะโน้ตแรกในบอร์ดนี้
                </button>
              </div>
            ) : (
              notes.map((note, idx) => (
                <StickyNoteItem
                  key={note.id}
                  note={note}
                  index={idx}
                  onDragEnd={handleDragEnd}
                  onUnlockRequest={() => setIsVaultModalOpen(true)}
                  onStartConnect={handleStartConnect}
                  onTargetConnect={handleTargetConnect}
                  isConnectingSource={connectingSourceId === note.id}
                  isConnectingMode={!!connectingSourceId}
                />
              ))
            )}
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
    </div>
  );
}
