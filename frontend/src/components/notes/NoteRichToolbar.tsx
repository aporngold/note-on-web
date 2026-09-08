import React, { useState, useRef, useEffect } from 'react';
import type { Editor } from '@tiptap/react';
import {
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Paperclip,
  Pipette,
  Copy,
  Maximize2,
  Minimize2,
  Download,
  Share2,
  Calendar,
  ArrowLeftRight,
  Trash2,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Link as LinkIcon,
  List,
  ListOrdered,
  MoreHorizontal,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Indent,
  Outdent,
  Minus,
  CheckSquare,
  Code,
  Check,
  ChevronDown,
  Printer,
  Table as TableIcon,
  FileText,
  HelpCircle,
  X,
  Type,
  Highlighter,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const PASTEL_PALETTE = [
  { name: 'สีขาว', bg: '#FFFFFF', border: '#E2E8F0', text: '#0F172A' },
  { name: 'สีเหลืองอ่อน', bg: '#FEF08A', border: '#FDE047', text: '#0F172A' },
  { name: 'สีเขียวมิ้นต์', bg: '#DCFCE7', border: '#86EFAC', text: '#0F172A' },
  { name: 'สีชมพูไลแลค', bg: '#FCE7F3', border: '#F472B6', text: '#0F172A' },
  { name: 'สีเหลืองสด', bg: '#FDE047', border: '#EAB308', text: '#0F172A' },
  { name: 'สีพีช/เบจ', bg: '#FED7AA', border: '#FB923C', text: '#0F172A' },
  { name: 'สีแดงคอรัล', bg: '#FECDD3', border: '#F43F5E', text: '#0F172A' },
  { name: 'สีฟ้าลาเวนเดอร์', bg: '#E0E7FF', border: '#818CF8', text: '#0F172A' },
  { name: 'สีเทาสะอาด', bg: '#F1F5F9', border: '#CBD5E1', text: '#0F172A' },
];

export const INK_COLORS = [
  { name: 'สีดำเข้ม', color: '#0F172A' },
  { name: 'สีเทาเข้ม', color: '#475569' },
  { name: 'สีน้ำเงิน', color: '#2563EB' },
  { name: 'สีแดง', color: '#DC2626' },
  { name: 'สีเขียวเข้ม', color: '#16A34A' },
  { name: 'สีม่วง', color: '#9333EA' },
  { name: 'สีส้มอิฐ', color: '#EA580C' },
  { name: 'สีขาว', color: '#FFFFFF' },
];

export const HIGHLIGHT_COLORS = [
  { name: 'เหลืองเรืองแสง', color: '#FEF08A' },
  { name: 'เขียวมิ้นต์', color: '#86EFAC' },
  { name: 'ชมพูหวาน', color: '#F472B6' },
  { name: 'ฟ้าสดใส', color: '#93C5FD' },
  { name: 'ส้มพีช', color: '#FDBA74' },
];

interface NoteRichToolbarProps {
  content: string;
  onContentChange: (val: string) => void;
  editor?: Editor | null;
  color: string;
  onColorChange: (color: string) => void;
  textColor?: string;
  onTextColorChange?: (color: string) => void;
  isPinned: boolean;
  onTogglePin: () => void;
  isBorderless: boolean;
  onToggleBorderless: () => void;
  textareaRef?: React.RefObject<HTMLTextAreaElement | null> | React.RefObject<HTMLTextAreaElement>;
  zoomLevel: number;
  onZoomChange: (zoom: number) => void;
  onAttachFile?: () => void;
  attachmentsCount?: number;
  onCopyNote?: () => void;
  onDownloadTxt?: () => void;
  onDownloadMd?: () => void;
  onPrint?: () => void;
  onShare?: () => void;
  onMoveBoard?: () => void;
  onDelete?: () => void;
  isTrulyFullscreen?: boolean;
  onToggleTrulyFullscreen?: () => void;
  onCancel: () => void;
  onAccept: () => void;
  isSaving?: boolean;
}

export default function NoteRichToolbar({
  content,
  onContentChange,
  editor,
  color,
  onColorChange,
  textColor = '#0F172A',
  onTextColorChange,
  isPinned,
  onTogglePin,
  isBorderless,
  onToggleBorderless,
  textareaRef,
  zoomLevel,
  onZoomChange,
  onAttachFile,
  attachmentsCount = 0,
  onCopyNote,
  onDownloadTxt,
  onDownloadMd,
  onPrint,
  onShare,
  onMoveBoard,
  onDelete,
  isTrulyFullscreen,
  onToggleTrulyFullscreen,
  onCancel,
  onAccept,
  isSaving = false,
}: NoteRichToolbarProps) {
  // Dropdown states
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isParagraphMenuOpen, setIsParagraphMenuOpen] = useState(false);
  const [isTextColorMenuOpen, setIsTextColorMenuOpen] = useState(false);
  const [isHighlightMenuOpen, setIsHighlightMenuOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [historyStack, setHistoryStack] = useState<string[]>([content]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const customColorInputRef = useRef<HTMLInputElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.toolbar-dropdown-container')) {
        setActiveMenu(null);
        setIsParagraphMenuOpen(false);
        setIsTextColorMenuOpen(false);
        setIsHighlightMenuOpen(false);
        setIsMoreMenuOpen(false);
      }
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // Update history for legacy textarea undo
  const pushHistory = (newContent: string) => {
    setHistoryStack((prev) => [...prev.slice(0, historyIndex + 1), newContent]);
    setHistoryIndex((prev) => prev + 1);
    onContentChange(newContent);
  };

  // ────────────── INSERTION HELPERS (TEXTAREA FALLBACK) ──────────────
  const insertFormatting = (prefix: string, suffix: string = '', defaultPlaceholder: string = 'ข้อความ') => {
    const ta = textareaRef?.current;
    if (!ta) return;

    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const text = ta.value;
    const selected = text.substring(start, end);

    const replacement = `${prefix}${selected || defaultPlaceholder}${suffix}`;
    const newContent = text.substring(0, start) + replacement + text.substring(end);
    pushHistory(newContent);

    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 30);
  };

  const insertLinePrefix = (prefix: string) => {
    const ta = textareaRef?.current;
    if (!ta) return;

    const start = ta.selectionStart;
    const text = ta.value;
    const lineStart = text.lastIndexOf('\n', start - 1) + 1;

    const newContent = text.substring(0, lineStart) + prefix + text.substring(lineStart);
    pushHistory(newContent);

    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + prefix.length, start + prefix.length);
    }, 30);
  };

  // ────────────── UNIFIED EDITOR ACTIONS ──────────────
  const handleUndo = () => {
    if (editor) {
      editor.chain().focus().undo().run();
      return;
    }
    if (historyIndex > 0) {
      const prevIdx = historyIndex - 1;
      setHistoryIndex(prevIdx);
      onContentChange(historyStack[prevIdx]);
      toast('ย้อนกลับการแก้ไข (Undo)', { icon: '↩️' });
    } else {
      toast('ไม่มีประวัติการแก้ไขก่อนหน้า', { icon: 'ℹ️' });
    }
  };

  const handleRedo = () => {
    if (editor) {
      editor.chain().focus().redo().run();
      return;
    }
    if (historyIndex < historyStack.length - 1) {
      const nextIdx = historyIndex + 1;
      setHistoryIndex(nextIdx);
      onContentChange(historyStack[nextIdx]);
      toast('ทำซ้ำการแก้ไข (Redo)', { icon: '↪️' });
    }
  };

  const handleBold = () => {
    if (editor) {
      editor.chain().focus().toggleBold().run();
      return;
    }
    insertFormatting('**', '**');
  };

  const handleItalic = () => {
    if (editor) {
      editor.chain().focus().toggleItalic().run();
      return;
    }
    insertFormatting('*', '*');
  };

  const handleUnderline = () => {
    if (editor) {
      editor.chain().focus().toggleUnderline().run();
      return;
    }
    insertFormatting('<u>', '</u>');
  };

  const handleStrike = () => {
    if (editor) {
      editor.chain().focus().toggleStrike().run();
      return;
    }
    insertFormatting('~~', '~~');
  };

  const handleSetHeading = (level: 1 | 2 | 3 | 0) => {
    if (editor) {
      if (level === 0) {
        editor.chain().focus().setParagraph().run();
      } else {
        editor.chain().focus().toggleHeading({ level }).run();
      }
      setIsParagraphMenuOpen(false);
      return;
    }
    insertLinePrefix(level === 0 ? '' : level === 1 ? '# ' : level === 2 ? '## ' : '### ');
    setIsParagraphMenuOpen(false);
  };

  const handleQuote = () => {
    if (editor) {
      editor.chain().focus().toggleBlockquote().run();
      setIsParagraphMenuOpen(false);
      return;
    }
    insertLinePrefix('> ');
    setIsParagraphMenuOpen(false);
  };

  const handleBulletList = () => {
    if (editor) {
      editor.chain().focus().toggleBulletList().run();
      return;
    }
    insertLinePrefix('- ');
  };

  const handleOrderedList = () => {
    if (editor) {
      editor.chain().focus().toggleOrderedList().run();
      return;
    }
    insertLinePrefix('1. ');
  };

  const handleAlign = (alignment: 'left' | 'center' | 'right' | 'justify') => {
    if (editor) {
      editor.chain().focus().setTextAlign(alignment).run();
      return;
    }
    insertFormatting(`<div align="${alignment}">\n`, '\n</div>');
  };

  const handleLink = () => {
    if (editor) {
      const previousUrl = editor.getAttributes('link').href;
      const url = window.prompt('ใส่ URL ของลิงก์ (เช่น https://example.com):', previousUrl || 'https://');
      if (url === null) return;
      if (url.trim() === '') {
        editor.chain().focus().extendMarkRange('link').unsetLink().run();
        toast('ลบลิงก์ออกแล้ว', { icon: '🔗' });
        return;
      }
      editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
      toast.success('ใส่ลิงก์เชื่อมโยงแล้ว');
      return;
    }
    insertFormatting('[', '](https://)', 'ชื่อลิงก์');
  };

  const handleClearFormatting = () => {
    if (editor) {
      editor.chain().focus().unsetAllMarks().clearNodes().run();
      toast.success('ล้างการจัดรูปแบบแล้ว');
      return;
    }
    const ta = textareaRef?.current;
    if (!ta) return;

    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const text = ta.value;
    const selected = text.substring(start, end);

    if (!selected) {
      toast('กรุณาลากคลุมข้อความที่ต้องการล้างรูปแบบ', { icon: 'ℹ️' });
      return;
    }

    const cleaned = selected
      .replace(/[*_~`#>]|\<span[^\>]*\>|\<\/span\>|\<div[^\>]*\>|\<\/div\>|\<mark[^\>]*\>|\<\/mark\>/g, '')
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');

    const newContent = text.substring(0, start) + cleaned + text.substring(end);
    pushHistory(newContent);
    toast.success('ล้างการจัดรูปแบบแล้ว');
  };

  const handleInsertTable = (rows: number = 2, cols: number = 2) => {
    if (editor) {
      editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
      setActiveMenu(null);
      toast.success(`แทรกตาราง ${rows}x${cols} เรียบร้อย`);
      return;
    }
    let tableMd = '\n\n';
    tableMd += '| ' + Array.from({ length: cols }, (_, i) => `หัวข้อ ${i + 1}`).join(' | ') + ' |\n';
    tableMd += '| ' + Array.from({ length: cols }, () => '---').join(' | ') + ' |\n';
    for (let r = 0; r < rows; r++) {
      tableMd += '| ' + Array.from({ length: cols }, (_, c) => `ข้อมูล ${r + 1}-${c + 1}`).join(' | ') + ' |\n';
    }
    tableMd += '\n';

    insertFormatting(tableMd);
    setActiveMenu(null);
    toast.success(`แทรกตาราง ${rows}x${cols} เรียบร้อย`);
  };

  const handleInsertDate = () => {
    const now = new Date();
    const d = now.getDate();
    const m = now.getMonth() + 1;
    const y = now.getFullYear() + 543;
    const dateStr = `วันที่ ${d}/${m}/${y}`;
    if (editor) {
      editor.chain().focus().insertContent(` ${dateStr} `).run();
      toast.success(`แทรก ${dateStr} แล้ว`);
      return;
    }
    insertFormatting(` ${dateStr} `);
    toast.success(`แทรก ${dateStr} แล้ว`);
  };

  const handleSetTextColor = (colorHex: string, colorName: string) => {
    if (editor) {
      editor.chain().focus().setColor(colorHex).run();
      if (onTextColorChange) onTextColorChange(colorHex);
      setIsTextColorMenuOpen(false);
      toast.success(`เปลี่ยนสีตัวอักษรเป็น ${colorName}`);
      return;
    }
    insertFormatting(`<span style="color: ${colorHex}">`, '</span>');
    if (onTextColorChange) onTextColorChange(colorHex);
    setIsTextColorMenuOpen(false);
    toast.success(`เปลี่ยนสีหมึกเป็น ${colorName}`);
  };

  const handleSetHighlight = (colorHex: string, colorName: string) => {
    if (editor) {
      editor.chain().focus().toggleHighlight({ color: colorHex }).run();
      setIsHighlightMenuOpen(false);
      toast.success(`ไฮไลต์ ${colorName}`);
      return;
    }
    insertFormatting(`<mark style="background-color: ${colorHex}; padding: 1px 4px; border-radius: 4px;">`, '</mark>');
    setIsHighlightMenuOpen(false);
  };

  const handleHorizontalRule = () => {
    if (editor) {
      editor.chain().focus().setHorizontalRule().run();
      return;
    }
    insertFormatting('\n\n---\n\n');
  };

  const handleCodeBlock = () => {
    if (editor) {
      editor.chain().focus().toggleCodeBlock().run();
      return;
    }
    insertFormatting('```\n', '\n```', '// เขียนโค้ดที่นี่');
  };

  // Zoom helpers
  const handleZoomIn = () => {
    if (zoomLevel < 32) {
      const next = zoomLevel + 2;
      onZoomChange(next);
      toast(`ขยายขนาดตัวอักษร (${next}px)`, { icon: '🔍' });
    }
  };

  const handleZoomOut = () => {
    if (zoomLevel > 12) {
      const next = zoomLevel - 2;
      onZoomChange(next);
      toast(`ย่อขนาดตัวอักษร (${next}px)`, { icon: '🔍' });
    }
  };

  // Active States for Toolbar Buttons
  const isBoldActive = editor?.isActive('bold') ?? false;
  const isItalicActive = editor?.isActive('italic') ?? false;
  const isUnderlineActive = editor?.isActive('underline') ?? false;
  const isStrikeActive = editor?.isActive('strike') ?? false;
  const isBulletListActive = editor?.isActive('bulletList') ?? false;
  const isOrderedListActive = editor?.isActive('orderedList') ?? false;
  const isCodeBlockActive = editor?.isActive('codeBlock') ?? false;
  const isLinkActive = editor?.isActive('link') ?? false;
  const isAlignLeftActive = editor?.isActive({ textAlign: 'left' }) ?? false;
  const isAlignCenterActive = editor?.isActive({ textAlign: 'center' }) ?? false;
  const isAlignRightActive = editor?.isActive({ textAlign: 'right' }) ?? false;
  const isAlignJustifyActive = editor?.isActive({ textAlign: 'justify' }) ?? false;

  const currentBlockLabel = editor
    ? editor.isActive('heading', { level: 1 })
      ? 'Heading 1'
      : editor.isActive('heading', { level: 2 })
      ? 'Heading 2'
      : editor.isActive('heading', { level: 3 })
      ? 'Heading 3'
      : editor.isActive('blockquote')
      ? 'Quote'
      : 'Paragraph'
    : 'Paragraph';

  const getToolBtnClass = (isActive: boolean, customPadding: string = 'p-1.5') => {
    return `${customPadding} rounded-lg transition-all duration-150 ${
      isActive
        ? 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 font-bold ring-1 ring-indigo-400/50 shadow-xs'
        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
    }`;
  };

  return (
    <div className="toolbar-dropdown-container w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 select-none text-slate-700 dark:text-slate-200">
      {/* ══════════════════════════════════════════════════════
          แถวที่ 1: แถบบนสุด (Top Action Utility Bar)
         ══════════════════════════════════════════════════════ */}
      <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap text-slate-600 dark:text-slate-300">
        {/* Left: Undo, Redo, Zoom In, Zoom Out */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleUndo}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
            title="เลิกทำ / ย้อนกลับ (Ctrl+Z)"
          >
            <RotateCcw size={16} />
          </button>
          <button
            type="button"
            onClick={handleRedo}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
            title="ทำซ้ำ (Ctrl+Y หรือ Ctrl+Shift+Z)"
          >
            <RotateCw size={16} />
          </button>
          <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-700 mx-0.5" />
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
            title="ขยายขนาดตัวอักษร (Zoom In)"
          >
            <ZoomIn size={16} />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
            title="ย่อขนาดตัวอักษร (Zoom Out)"
          >
            <ZoomOut size={16} />
          </button>
        </div>

        {/* Right: Attachment, Pipette, Copy, Fullscreen, Export, Share, Calendar, Transfer, Delete */}
        <div className="flex items-center gap-1">
          {onAttachFile && (
            <button
              type="button"
              onClick={onAttachFile}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition relative"
              title={`แนบไฟล์ (ปัจจุบันมี ${attachmentsCount} ไฟล์)`}
            >
              <Paperclip size={16} />
              {attachmentsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-indigo-600 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                  {attachmentsCount}
                </span>
              )}
            </button>
          )}

          {onTextColorChange && (
            <button
              type="button"
              onClick={() => setIsTextColorMenuOpen(!isTextColorMenuOpen)}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
              title="สีหมึกตัวอักษร"
            >
              <Pipette size={16} />
            </button>
          )}

          {onCopyNote && (
            <button
              type="button"
              onClick={onCopyNote}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
              title="คัดลอกข้อความทั้งหมด (Copy)"
            >
              <Copy size={16} />
            </button>
          )}

          {onToggleTrulyFullscreen && (
            <button
              type="button"
              onClick={onToggleTrulyFullscreen}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
              title={isTrulyFullscreen ? 'ย่อเป็นกรอบปกติ' : 'ขยายเต็มจอ (Fullscreen)'}
            >
              {isTrulyFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          )}

          {onDownloadTxt && (
            <button
              type="button"
              onClick={onDownloadTxt}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
              title="ดาวน์โหลดเป็นไฟล์ข้อความ (.txt)"
            >
              <Download size={16} />
            </button>
          )}

          {onShare && (
            <button
              type="button"
              onClick={onShare}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
              title="แชร์โน้ตนี้"
            >
              <Share2 size={16} />
            </button>
          )}

          <button
            type="button"
            onClick={handleInsertDate}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition text-indigo-600 dark:text-indigo-400 font-bold"
            title="แทรกวันที่ปัจจุบัน (เช่น วันที่ 27/2/2569)"
          >
            <Calendar size={16} />
          </button>

          {onMoveBoard && (
            <button
              type="button"
              onClick={onMoveBoard}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
              title="ย้ายโน้ตนี้ไปกระดานอื่น (Move to Board)"
            >
              <ArrowLeftRight size={16} />
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="p-1.5 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 rounded-lg transition text-slate-500"
              title="ย้ายลงถังขยะ"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          แถวที่ 2: แถบจานสีพาสเทล, หมุดแดง, Borderless Checkbox
         ══════════════════════════════════════════════════════ */}
      <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap bg-slate-50/50 dark:bg-slate-800/30">
        {/* Pastel Swatches & Color Picker */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {PASTEL_PALETTE.map((p) => {
            const isSelected = color?.toLowerCase() === p.bg.toLowerCase();
            return (
              <button
                key={p.bg}
                type="button"
                onClick={() => onColorChange(p.bg)}
                style={{ backgroundColor: p.bg }}
                className={`w-6 h-6 rounded-sm border transition-all duration-150 flex items-center justify-center ${
                  isSelected
                    ? 'border-indigo-600 ring-2 ring-indigo-400 scale-110 z-10 shadow-sm'
                    : 'border-slate-300 dark:border-slate-600 hover:scale-105'
                }`}
                title={p.name}
              >
                {isSelected && <Check size={12} className="text-slate-900" />}
              </button>
            );
          })}

          {/* Color Wheel / Custom Picker */}
          <div className="relative ml-1">
            <button
              type="button"
              onClick={() => customColorInputRef.current?.click()}
              className="w-6 h-6 rounded-full bg-gradient-to-tr from-rose-400 via-amber-300 to-indigo-400 border border-slate-300 shadow-xs hover:scale-110 transition flex items-center justify-center"
              title="เลือกสีอื่นตามใจชอบ..."
            >
              <span className="text-[10px] font-bold text-white drop-shadow-xs">🎨</span>
            </button>
            <input
              ref={customColorInputRef}
              type="color"
              value={color || '#FEF08A'}
              onChange={(e) => onColorChange(e.target.value)}
              className="sr-only"
            />
          </div>
        </div>

        {/* Right: Push Pin & Borderless Checkbox */}
        <div className="flex items-center gap-4">
          {/* Red Push Pin */}
          <button
            type="button"
            onClick={onTogglePin}
            className="flex items-center gap-1 text-xs font-semibold cursor-pointer group"
            title={isPinned ? 'ยกเลิกการปักหมุด' : 'ปักหมุดโน้ตนี้ไว้ด้านบน'}
          >
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                isPinned
                  ? 'bg-red-600 text-white shadow-md scale-110 ring-2 ring-red-300'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-400 group-hover:bg-red-400 group-hover:text-white'
              }`}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-white/90" />
            </div>
          </button>

          {/* Borderless Checkbox */}
          <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-medium cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isBorderless}
              onChange={onToggleBorderless}
              className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <span>Borderless</span>
          </label>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          แถวที่ 3: แถบเมนูบาร์ (Menu Bar)
         ══════════════════════════════════════════════════════ */}
      <div className="px-2 py-1 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-300 overflow-x-auto scrollbar-none">
        {/* File Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setActiveMenu(activeMenu === 'file' ? null : 'file')}
            className={`px-2.5 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition ${
              activeMenu === 'file' ? 'bg-slate-200 dark:bg-slate-700' : ''
            }`}
          >
            File
          </button>
          {activeMenu === 'file' && (
            <div className="absolute left-0 top-full mt-1 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-1 z-50 animate-fade-in divide-y divide-slate-100 dark:divide-slate-700 text-xs">
              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    onAccept();
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-between"
                >
                  <span>บันทึก (Save)</span>
                  <span className="text-[10px] text-slate-400">Ctrl+S</span>
                </button>
                {onDownloadTxt && (
                  <button
                    type="button"
                    onClick={() => {
                      onDownloadTxt();
                      setActiveMenu(null);
                    }}
                    className="w-full text-left px-3 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-between"
                  >
                    <span>ดาวน์โหลด .txt</span>
                  </button>
                )}
                {onDownloadMd && (
                  <button
                    type="button"
                    onClick={() => {
                      onDownloadMd();
                      setActiveMenu(null);
                    }}
                    className="w-full text-left px-3 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-between"
                  >
                    <span>ดาวน์โหลด .md</span>
                  </button>
                )}
                {onPrint && (
                  <button
                    type="button"
                    onClick={() => {
                      onPrint();
                      setActiveMenu(null);
                    }}
                    className="w-full text-left px-3 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-between"
                  >
                    <span>พิมพ์ (Print)</span>
                    <span className="text-[10px] text-slate-400">Ctrl+P</span>
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveMenu(null);
                      onDelete();
                    }}
                    className="w-full text-left px-3 py-1.5 rounded hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 flex items-center justify-between text-rose-600 dark:text-rose-400 font-medium"
                  >
                    <span>ย้ายไปถังขยะ (Delete to Trash)</span>
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    onCancel();
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  ปิดหน้าต่าง (Close)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Edit Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setActiveMenu(activeMenu === 'edit' ? null : 'edit')}
            className={`px-2.5 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition ${
              activeMenu === 'edit' ? 'bg-slate-200 dark:bg-slate-700' : ''
            }`}
          >
            Edit
          </button>
          {activeMenu === 'edit' && (
            <div className="absolute left-0 top-full mt-1 w-44 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-1 z-50 animate-fade-in text-xs">
              <button
                type="button"
                onClick={() => {
                  handleUndo();
                  setActiveMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-between"
              >
                <span>เลิกทำ (Undo)</span>
                <span className="text-[10px] text-slate-400">Ctrl+Z</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  handleRedo();
                  setActiveMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-between"
              >
                <span>ทำซ้ำ (Redo)</span>
                <span className="text-[10px] text-slate-400">Ctrl+Y</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onCopyNote) onCopyNote();
                  setActiveMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-between"
              >
                <span>คัดลอก (Copy)</span>
                <span className="text-[10px] text-slate-400">Ctrl+C</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  handleClearFormatting();
                  setActiveMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                ล้างการจัดรูปแบบ
              </button>
            </div>
          )}
        </div>

        {/* View Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setActiveMenu(activeMenu === 'view' ? null : 'view')}
            className={`px-2.5 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition ${
              activeMenu === 'view' ? 'bg-slate-200 dark:bg-slate-700' : ''
            }`}
          >
            View
          </button>
          {activeMenu === 'view' && (
            <div className="absolute left-0 top-full mt-1 w-44 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-1 z-50 animate-fade-in text-xs">
              {onToggleTrulyFullscreen && (
                <button
                  type="button"
                  onClick={() => {
                    onToggleTrulyFullscreen();
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  {isTrulyFullscreen ? 'ย่อกรอบปกติ' : 'เต็มหน้าจอ 100%'}
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  handleZoomIn();
                  setActiveMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                ขยายขนาดอักษร (+2px)
              </button>
              <button
                type="button"
                onClick={() => {
                  handleZoomOut();
                  setActiveMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                ย่อขนาดอักษร (-2px)
              </button>
            </div>
          )}
        </div>

        {/* Insert Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setActiveMenu(activeMenu === 'insert' ? null : 'insert')}
            className={`px-2.5 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition font-bold text-indigo-600 dark:text-indigo-400 ${
              activeMenu === 'insert' ? 'bg-slate-200 dark:bg-slate-700' : ''
            }`}
          >
            Insert
          </button>
          {activeMenu === 'insert' && (
            <div className="absolute left-0 top-full mt-1 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-1 z-50 animate-fade-in text-xs">
              <button
                type="button"
                onClick={() => {
                  handleInsertDate();
                  setActiveMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
              >
                <Calendar size={14} />
                <span>วันที่และเวลาปัจจุบัน</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  handleLink();
                  setActiveMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
              >
                <LinkIcon size={14} />
                <span>ลิงก์เชื่อมโยง (Link)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  handleHorizontalRule();
                  setActiveMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
              >
                <Minus size={14} />
                <span>เส้นแบ่งบรรทัด (Divider)</span>
              </button>
              <button
                type="button"
                onClick={() => handleInsertTable(2, 2)}
                className="w-full text-left px-3 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
              >
                <TableIcon size={14} />
                <span>ตาราง 2x2</span>
              </button>
            </div>
          )}
        </div>

        {/* Format Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setActiveMenu(activeMenu === 'format' ? null : 'format')}
            className={`px-2.5 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition ${
              activeMenu === 'format' ? 'bg-slate-200 dark:bg-slate-700' : ''
            }`}
          >
            Format
          </button>
          {activeMenu === 'format' && (
            <div className="absolute left-0 top-full mt-1 w-44 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-1 z-50 animate-fade-in text-xs">
              <button
                type="button"
                onClick={() => {
                  handleBold();
                  setActiveMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 font-bold"
              >
                ตัวหนา (Bold)
              </button>
              <button
                type="button"
                onClick={() => {
                  handleItalic();
                  setActiveMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 italic"
              >
                ตัวเอียง (Italic)
              </button>
              <button
                type="button"
                onClick={() => {
                  handleUnderline();
                  setActiveMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 underline"
              >
                ขีดเส้นใต้ (Underline)
              </button>
              <button
                type="button"
                onClick={() => {
                  handleStrike();
                  setActiveMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 line-through"
              >
                ขีดฆ่า (Strikethrough)
              </button>
              <button
                type="button"
                onClick={() => {
                  handleClearFormatting();
                  setActiveMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-rose-600"
              >
                ล้างการจัดรูปแบบ
              </button>
            </div>
          )}
        </div>

        {/* Table Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setActiveMenu(activeMenu === 'table' ? null : 'table')}
            className={`px-2.5 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition ${
              activeMenu === 'table' ? 'bg-slate-200 dark:bg-slate-700' : ''
            }`}
          >
            Table
          </button>
          {activeMenu === 'table' && (
            <div className="absolute left-0 top-full mt-1 w-44 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-1 z-50 animate-fade-in text-xs">
              <button
                type="button"
                onClick={() => handleInsertTable(2, 2)}
                className="w-full text-left px-3 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                แทรกตาราง 2x2
              </button>
              <button
                type="button"
                onClick={() => handleInsertTable(3, 3)}
                className="w-full text-left px-3 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                แทรกตาราง 3x3
              </button>
              <button
                type="button"
                onClick={() => handleInsertTable(4, 3)}
                className="w-full text-left px-3 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                แทรกตาราง 4x3
              </button>
            </div>
          )}
        </div>

        {/* Tools Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setActiveMenu(activeMenu === 'tools' ? null : 'tools')}
            className={`px-2.5 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition ${
              activeMenu === 'tools' ? 'bg-slate-200 dark:bg-slate-700' : ''
            }`}
          >
            Tools
          </button>
          {activeMenu === 'tools' && (
            <div className="absolute left-0 top-full mt-1 w-52 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-2 z-50 animate-fade-in text-xs space-y-1">
              <p className="text-[11px] text-slate-500 font-bold">สถิติเนื้อหาในโน้ต:</p>
              <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded-lg text-xs space-y-0.5">
                <p>
                  จำนวนคำ:{' '}
                  <b>
                    {editor
                      ? editor.getText().trim() ? editor.getText().trim().split(/\s+/).length : 0
                      : content.trim() ? content.trim().split(/\s+/).length : 0}
                  </b>{' '}
                  คำ
                </p>
                <p>
                  จำนวนตัวอักษร: <b>{editor ? editor.getText().length : content.length}</b> ตัว
                </p>
                <p>
                  จำนวนบรรทัด: <b>{editor ? editor.getText().split('\n').length : content.split('\n').length}</b> บรรทัด
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Help Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setActiveMenu(activeMenu === 'help' ? null : 'help')}
            className={`px-2.5 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition ${
              activeMenu === 'help' ? 'bg-slate-200 dark:bg-slate-700' : ''
            }`}
          >
            Help
          </button>
          {activeMenu === 'help' && (
            <div className="absolute left-0 top-full mt-1 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-3 z-50 animate-fade-in text-xs space-y-1.5">
              <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <HelpCircle size={14} className="text-indigo-600" />
                <span>คีย์ลัดที่รองรับ</span>
              </p>
              <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
                <p className="flex justify-between">
                  <span>ตัวหนา (Bold):</span> <kbd className="font-mono bg-slate-100 dark:bg-slate-700 px-1 rounded">Ctrl+B</kbd>
                </p>
                <p className="flex justify-between">
                  <span>ตัวเอียง (Italic):</span> <kbd className="font-mono bg-slate-100 dark:bg-slate-700 px-1 rounded">Ctrl+I</kbd>
                </p>
                <p className="flex justify-between">
                  <span>ขีดเส้นใต้ (Underline):</span> <kbd className="font-mono bg-slate-100 dark:bg-slate-700 px-1 rounded">Ctrl+U</kbd>
                </p>
                <p className="flex justify-between">
                  <span>เลิกทำ (Undo):</span> <kbd className="font-mono bg-slate-100 dark:bg-slate-700 px-1 rounded">Ctrl+Z</kbd>
                </p>
                <p className="flex justify-between">
                  <span>ทำซ้ำ (Redo):</span> <kbd className="font-mono bg-slate-100 dark:bg-slate-700 px-1 rounded">Ctrl+Y</kbd>
                </p>
                <p className="flex justify-between">
                  <span>บันทึก (Save):</span> <kbd className="font-mono bg-slate-100 dark:bg-slate-700 px-1 rounded">Ctrl+S</kbd>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          แถวที่ 4: แถบจัดแต่งข้อความแถวที่ 1 (Paragraph, B, I, U, S, Color, Highlight, Link, Lists)
         ══════════════════════════════════════════════════════ */}
      <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5 flex-wrap text-slate-700 dark:text-slate-200">
        {/* Paragraph Style Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsParagraphMenuOpen(!isParagraphMenuOpen)}
            className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <span>{currentBlockLabel}</span>
            <ChevronDown size={12} className="opacity-60" />
          </button>
          {isParagraphMenuOpen && (
            <div className="absolute left-0 top-full mt-1 w-44 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-1 z-50 animate-fade-in text-xs space-y-0.5">
              <button
                type="button"
                onClick={() => handleSetHeading(0)}
                className={`w-full text-left px-3 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 ${
                  currentBlockLabel === 'Paragraph' ? 'text-indigo-600 font-bold bg-indigo-50 dark:bg-indigo-950/40' : ''
                }`}
              >
                Paragraph (ปกติ)
              </button>
              <button
                type="button"
                onClick={() => handleSetHeading(1)}
                className={`w-full text-left px-3 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 font-bold text-base ${
                  currentBlockLabel === 'Heading 1' ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40' : ''
                }`}
              >
                Heading 1 (หัวข้อใหญ่)
              </button>
              <button
                type="button"
                onClick={() => handleSetHeading(2)}
                className={`w-full text-left px-3 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 font-bold text-sm ${
                  currentBlockLabel === 'Heading 2' ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40' : ''
                }`}
              >
                Heading 2 (หัวข้อย่อย)
              </button>
              <button
                type="button"
                onClick={() => handleSetHeading(3)}
                className={`w-full text-left px-3 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold ${
                  currentBlockLabel === 'Heading 3' ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40' : ''
                }`}
              >
                Heading 3 (หัวข้อรอง)
              </button>
              <button
                type="button"
                onClick={handleQuote}
                className={`w-full text-left px-3 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 italic ${
                  currentBlockLabel === 'Quote' ? 'text-indigo-600 font-bold bg-indigo-50 dark:bg-indigo-950/40' : ''
                }`}
              >
                Quote (กล่องอ้างอิง)
              </button>
            </div>
          )}
        </div>

        {/* Separator */}
        <div className="w-[1px] h-5 bg-slate-200 dark:bg-slate-700 mx-0.5" />

        {/* Bold */}
        <button
          type="button"
          onClick={handleBold}
          className={getToolBtnClass(isBoldActive)}
          title="ตัวหนา (Ctrl+B)"
        >
          <Bold size={16} />
        </button>

        {/* Italic */}
        <button
          type="button"
          onClick={handleItalic}
          className={getToolBtnClass(isItalicActive)}
          title="ตัวเอียง (Ctrl+I)"
        >
          <Italic size={16} />
        </button>

        {/* Underline */}
        <button
          type="button"
          onClick={handleUnderline}
          className={getToolBtnClass(isUnderlineActive)}
          title="ขีดเส้นใต้ (Ctrl+U)"
        >
          <UnderlineIcon size={16} />
        </button>

        {/* Strikethrough */}
        <button
          type="button"
          onClick={handleStrike}
          className={getToolBtnClass(isStrikeActive)}
          title="ขีดฆ่า (Strikethrough)"
        >
          <Strikethrough size={16} />
        </button>

        {/* Text Color Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsTextColorMenuOpen(!isTextColorMenuOpen)}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition flex items-center gap-0.5"
            title="สีตัวอักษร"
          >
            <span className="font-bold underline decoration-indigo-500 text-sm leading-none px-0.5">A</span>
            <ChevronDown size={10} className="opacity-60" />
          </button>
          {isTextColorMenuOpen && (
            <div className="absolute left-0 top-full mt-1 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-2 z-50 animate-fade-in w-40">
              <p className="text-[10px] font-bold text-slate-400 mb-1.5">เลือกสีตัวอักษร:</p>
              <div className="grid grid-cols-4 gap-1.5">
                {INK_COLORS.map((tc) => (
                  <button
                    key={tc.color}
                    type="button"
                    onClick={() => handleSetTextColor(tc.color, tc.name)}
                    className="w-6 h-6 rounded-full border border-slate-300 shadow-xs hover:scale-110 transition flex items-center justify-center"
                    style={{ backgroundColor: tc.color }}
                    title={tc.name}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Highlighter Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsHighlightMenuOpen(!isHighlightMenuOpen)}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition flex items-center gap-0.5"
            title="ปากกาไฮไลต์ข้อความ"
          >
            <Highlighter size={15} className="text-amber-500" />
            <ChevronDown size={10} className="opacity-60" />
          </button>
          {isHighlightMenuOpen && (
            <div className="absolute left-0 top-full mt-1 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-2 z-50 animate-fade-in w-36">
              <p className="text-[10px] font-bold text-slate-400 mb-1.5">สีไฮไลต์:</p>
              <div className="flex gap-1.5 flex-wrap">
                {HIGHLIGHT_COLORS.map((hc) => (
                  <button
                    key={hc.color}
                    type="button"
                    onClick={() => handleSetHighlight(hc.color, hc.name)}
                    className="w-5 h-5 rounded-md border border-slate-300 shadow-xs hover:scale-110 transition"
                    style={{ backgroundColor: hc.color }}
                    title={hc.name}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Separator */}
        <div className="w-[1px] h-5 bg-slate-200 dark:bg-slate-700 mx-0.5" />

        {/* Link */}
        <button
          type="button"
          onClick={handleLink}
          className={getToolBtnClass(isLinkActive)}
          title="แทรกลิงก์ (Link)"
        >
          <LinkIcon size={16} />
        </button>

        {/* Numbered List */}
        <button
          type="button"
          onClick={handleOrderedList}
          className={getToolBtnClass(isOrderedListActive)}
          title="รายการลำดับตัวเลข"
        >
          <ListOrdered size={16} />
        </button>

        {/* Bullet List */}
        <button
          type="button"
          onClick={handleBulletList}
          className={getToolBtnClass(isBulletListActive)}
          title="รายการหัวข้อย่อย"
        >
          <List size={16} />
        </button>

        {/* More Options (...) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
            title="ตัวเลือกเพิ่มเติม"
          >
            <MoreHorizontal size={16} />
          </button>
          {isMoreMenuOpen && (
            <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-1 z-50 animate-fade-in text-xs">
              <button
                type="button"
                onClick={() => {
                  handleInsertDate();
                  setIsMoreMenuOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
              >
                <Calendar size={13} />
                <span>ใส่วันที่ปัจจุบัน</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  handleInsertTable(2, 2);
                  setIsMoreMenuOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
              >
                <TableIcon size={13} />
                <span>แทรกตาราง 2x2</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  handleClearFormatting();
                  setIsMoreMenuOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                ล้างการจัดรูปแบบ
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          แถวที่ 5: แถบจัดแต่งข้อความแถวที่ 2 (Clear Format, Alignments, Indent, HR, Code)
         ══════════════════════════════════════════════════════ */}
      <div className="px-3 py-1.5 flex items-center gap-1.5 flex-wrap text-slate-700 dark:text-slate-200">
        {/* Clear Format Tx */}
        <button
          type="button"
          onClick={handleClearFormatting}
          className="px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition font-mono font-bold text-xs flex items-center text-slate-600 dark:text-slate-300"
          title="ล้างรูปแบบตัวอักษรทั้งหมด (Clear Formatting)"
        >
          <span>T</span>
          <span className="text-[10px] text-rose-500">x</span>
        </button>

        {/* Separator */}
        <div className="w-[1px] h-5 bg-slate-200 dark:bg-slate-700 mx-0.5" />

        {/* Align Left */}
        <button
          type="button"
          onClick={() => handleAlign('left')}
          className={getToolBtnClass(isAlignLeftActive)}
          title="จัดชิดซ้าย"
        >
          <AlignLeft size={16} />
        </button>

        {/* Align Center */}
        <button
          type="button"
          onClick={() => handleAlign('center')}
          className={getToolBtnClass(isAlignCenterActive)}
          title="จัดกึ่งกลาง"
        >
          <AlignCenter size={16} />
        </button>

        {/* Align Right */}
        <button
          type="button"
          onClick={() => handleAlign('right')}
          className={getToolBtnClass(isAlignRightActive)}
          title="จัดชิดขวา"
        >
          <AlignRight size={16} />
        </button>

        {/* Align Justify */}
        <button
          type="button"
          onClick={() => handleAlign('justify')}
          className={getToolBtnClass(isAlignJustifyActive)}
          title="จัดเต็มบรรทัด (Justify)"
        >
          <AlignJustify size={16} />
        </button>

        {/* Separator */}
        <div className="w-[1px] h-5 bg-slate-200 dark:bg-slate-700 mx-0.5" />

        {/* Horizontal Rule — */}
        <button
          type="button"
          onClick={handleHorizontalRule}
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition font-bold"
          title="เส้นแบ่งบรรทัด (Horizontal Rule)"
        >
          <Minus size={16} />
        </button>

        {/* Source Code Block <> */}
        <button
          type="button"
          onClick={handleCodeBlock}
          className={getToolBtnClass(isCodeBlockActive)}
          title="บล็อกโค้ด (Code Block)"
        >
          <Code size={16} />
        </button>
      </div>
    </div>
  );
}
