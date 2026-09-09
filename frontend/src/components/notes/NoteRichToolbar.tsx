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
  Image as ImageIcon,
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
  Mic,
  Quote as QuoteIcon,
  Sparkles,
  ScanText,
  History,
} from 'lucide-react';
import toast from 'react-hot-toast';
import SpeechToTextButton from './SpeechToTextButton';
import ViewportPopover from '../ui/ViewportPopover';

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
  onRecordAudio?: () => void;
  attachmentsCount?: number;
  onCopyNote?: () => void;
  onDownloadTxt?: () => void;
  onDownloadMd?: () => void;
  onPrint?: () => void;
  onShare?: () => void;
  onOpenAiAssistant?: () => void;
  onOpenOcr?: () => void;
  onOpenVersionHistory?: () => void;
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
  onRecordAudio,
  attachmentsCount = 0,
  onCopyNote,
  onDownloadTxt,
  onDownloadMd,
  onPrint,
  onShare,
  onOpenAiAssistant,
  onOpenOcr,
  onOpenVersionHistory,
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
  const [activeColorTrigger, setActiveColorTrigger] = useState<'pipette' | 'toolbar'>('toolbar');
  const [isHighlightMenuOpen, setIsHighlightMenuOpen] = useState(false);
  const [isTableMenuOpen, setIsTableMenuOpen] = useState(false);
  const [isImageMenuOpen, setIsImageMenuOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [historyStack, setHistoryStack] = useState<string[]>([content]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const customColorInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Button refs for Viewport Collision-Aware Popovers
  const fileBtnRef = useRef<HTMLButtonElement>(null);
  const editBtnRef = useRef<HTMLButtonElement>(null);
  const viewBtnRef = useRef<HTMLButtonElement>(null);
  const insertBtnRef = useRef<HTMLButtonElement>(null);
  const formatBtnRef = useRef<HTMLButtonElement>(null);
  const tableMenuBtnRef = useRef<HTMLButtonElement>(null);
  const toolsBtnRef = useRef<HTMLButtonElement>(null);
  const helpBtnRef = useRef<HTMLButtonElement>(null);

  const paragraphBtnRef = useRef<HTMLButtonElement>(null);
  const textColorBtnRef = useRef<HTMLButtonElement>(null);
  const pipetteBtnRef = useRef<HTMLButtonElement>(null);
  const highlightBtnRef = useRef<HTMLButtonElement>(null);
  const tableToolBtnRef = useRef<HTMLButtonElement>(null);
  const imageToolBtnRef = useRef<HTMLButtonElement>(null);
  const moreOptionsBtnRef = useRef<HTMLButtonElement>(null);

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

  // Checklist (TaskList)
  const handleChecklist = () => {
    if (editor) {
      editor.chain().focus().toggleTaskList().run();
      return;
    }
    insertLinePrefix('- [ ] ');
  };

  // Inline Image Insertion
  const handleInsertImageClick = () => {
    imageInputRef.current?.click();
  };

  const handleImageFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      if (editor) {
        editor.chain().focus().setImage({ src: base64, alt: file.name }).run();
        toast.success('แทรกรูปภาพเรียบร้อย');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleInsertImageUrl = () => {
    const url = window.prompt('ใส่ URL ของรูปภาพ (เช่น https://example.com/image.png):');
    if (url && url.trim()) {
      if (editor) {
        editor.chain().focus().setImage({ src: url.trim() }).run();
        toast.success('แทรกรูปภาพเรียบร้อย');
      }
    }
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
      setIsTableMenuOpen(false);
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
    setIsTableMenuOpen(false);
    toast.success(`แทรกตาราง ${rows}x${cols} เรียบร้อย`);
  };

  const handleAddRow = () => {
    if (editor) {
      editor.chain().focus().addRowAfter().run();
      toast.success('เพิ่มแถวด้านล่างแล้ว');
    }
  };

  const handleDeleteRow = () => {
    if (editor) {
      editor.chain().focus().deleteRow().run();
      toast.success('ลบแถวแล้ว');
    }
  };

  const handleAddColumn = () => {
    if (editor) {
      editor.chain().focus().addColumnAfter().run();
      toast.success('เพิ่มคอลัมน์ด้านขวาแล้ว');
    }
  };

  const handleDeleteColumn = () => {
    if (editor) {
      editor.chain().focus().deleteColumn().run();
      toast.success('ลบคอลัมน์แล้ว');
    }
  };

  const handleDeleteTable = () => {
    if (editor) {
      editor.chain().focus().deleteTable().run();
      toast.success('ลบตารางแล้ว');
    }
  };

  const handleResizeImage = (sizeClass: string, label: string) => {
    if (!editor) return;
    const attrs = editor.getAttributes('image');
    if (attrs.src) {
      editor.chain().focus().updateAttributes('image', { class: sizeClass }).run();
      toast.success(`ปรับขนาดภาพเป็น ${label}`);
    } else {
      toast('กรุณาคลิกเลือกรูปภาพก่อนปรับขนาด', { icon: '🖼️' });
    }
  };

  const handleSetImageCaption = () => {
    if (!editor) return;
    const attrs = editor.getAttributes('image');
    if (attrs.src) {
      const caption = window.prompt('ใส่คำบรรยายใต้ภาพ (Image Caption):', attrs.title || attrs.alt || '');
      if (caption !== null) {
        editor.chain().focus().updateAttributes('image', { title: caption, alt: caption }).run();
        toast.success('บันทึกคำบรรยายภาพแล้ว');
      }
    } else {
      toast('กรุณาคลิกเลือกรูปภาพก่อนใส่คำบรรยาย', { icon: '🖼️' });
    }
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
  const isTaskListActive = editor?.isActive('taskList') ?? false;
  const isCodeBlockActive = editor?.isActive('codeBlock') ?? false;
  const isLinkActive = editor?.isActive('link') ?? false;
  const isBlockquoteActive = editor?.isActive('blockquote') ?? false;
  const isTableActive = editor?.isActive('table') ?? false;
  const isImageActive = editor?.isActive('image') ?? false;
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
      {/* Hidden File Input for Image Upload */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageFileSelected}
        className="hidden"
      />

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
              ref={pipetteBtnRef}
              type="button"
              onClick={() => {
                setActiveColorTrigger('pipette');
                setIsTextColorMenuOpen(!isTextColorMenuOpen);
              }}
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

          {onOpenVersionHistory && (
            <button
              type="button"
              onClick={onOpenVersionHistory}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
              title="ประวัติเวอร์ชัน (Version History)"
            >
              <History size={16} />
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
            ref={fileBtnRef}
            type="button"
            onClick={() => setActiveMenu((prev) => (prev === 'file' ? null : 'file'))}
            className={`px-2.5 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition ${
              activeMenu === 'file' ? 'bg-slate-200 dark:bg-slate-700' : ''
            }`}
          >
            File
          </button>
          <ViewportPopover
            triggerRef={fileBtnRef}
            isOpen={activeMenu === 'file'}
            onClose={() => setActiveMenu(null)}
            className="w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-1 divide-y divide-slate-100 dark:divide-slate-700 text-xs"
          >
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
          </ViewportPopover>
        </div>

        {/* Edit Menu */}
        <div className="relative">
          <button
            ref={editBtnRef}
            type="button"
            onClick={() => setActiveMenu((prev) => (prev === 'edit' ? null : 'edit'))}
            className={`px-2.5 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition ${
              activeMenu === 'edit' ? 'bg-slate-200 dark:bg-slate-700' : ''
            }`}
          >
            Edit
          </button>
          <ViewportPopover
            triggerRef={editBtnRef}
            isOpen={activeMenu === 'edit'}
            onClose={() => setActiveMenu(null)}
            className="w-44 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-1 text-xs"
          >
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
          </ViewportPopover>
        </div>

        {/* View Menu */}
        <div className="relative">
          <button
            ref={viewBtnRef}
            type="button"
            onClick={() => setActiveMenu((prev) => (prev === 'view' ? null : 'view'))}
            className={`px-2.5 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition ${
              activeMenu === 'view' ? 'bg-slate-200 dark:bg-slate-700' : ''
            }`}
          >
            View
          </button>
          <ViewportPopover
            triggerRef={viewBtnRef}
            isOpen={activeMenu === 'view'}
            onClose={() => setActiveMenu(null)}
            className="w-44 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-1 text-xs"
          >
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
          </ViewportPopover>
        </div>

        {/* Insert Menu */}
        <div className="relative">
          <button
            ref={insertBtnRef}
            type="button"
            onClick={() => setActiveMenu((prev) => (prev === 'insert' ? null : 'insert'))}
            className={`px-2.5 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition font-bold text-indigo-600 dark:text-indigo-400 ${
              activeMenu === 'insert' ? 'bg-slate-200 dark:bg-slate-700' : ''
            }`}
          >
            Insert
          </button>
          <ViewportPopover
            triggerRef={insertBtnRef}
            isOpen={activeMenu === 'insert'}
            onClose={() => setActiveMenu(null)}
            className="w-52 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-1 text-xs space-y-0.5"
          >
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
                handleChecklist();
                setActiveMenu(null);
              }}
              className="w-full text-left px-3 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-medium"
            >
              <CheckSquare size={14} />
              <span>กล่องเช็คลิสต์ (Checklist)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                handleInsertImageClick();
                setActiveMenu(null);
              }}
              className="w-full text-left px-3 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-medium"
            >
              <ImageIcon size={14} />
              <span>แทรกรูปภาพ (จากไฟล์ในเครื่อง)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                handleInsertImageUrl();
                setActiveMenu(null);
              }}
              className="w-full text-left px-3 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
            >
              <ImageIcon size={14} />
              <span>แทรกรูปภาพ (จาก URL ลิงก์)</span>
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
          </ViewportPopover>
        </div>

        {/* Format Menu */}
        <div className="relative">
          <button
            ref={formatBtnRef}
            type="button"
            onClick={() => setActiveMenu((prev) => (prev === 'format' ? null : 'format'))}
            className={`px-2.5 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition ${
              activeMenu === 'format' ? 'bg-slate-200 dark:bg-slate-700' : ''
            }`}
          >
            Format
          </button>
          <ViewportPopover
            triggerRef={formatBtnRef}
            isOpen={activeMenu === 'format'}
            onClose={() => setActiveMenu(null)}
            className="w-44 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-1 text-xs"
          >
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
                handleChecklist();
                setActiveMenu(null);
              }}
              className="w-full text-left px-3 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold"
            >
              กล่องเช็คลิสต์
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
          </ViewportPopover>
        </div>

        {/* Table Menu */}
        <div className="relative">
          <button
            ref={tableMenuBtnRef}
            type="button"
            onClick={() => setActiveMenu((prev) => (prev === 'table' ? null : 'table'))}
            className={`px-2.5 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition ${
              activeMenu === 'table' ? 'bg-slate-200 dark:bg-slate-700' : ''
            }`}
          >
            Table
          </button>
          <ViewportPopover
            triggerRef={tableMenuBtnRef}
            isOpen={activeMenu === 'table'}
            onClose={() => setActiveMenu(null)}
            className="w-44 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-1 text-xs"
          >
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
          </ViewportPopover>
        </div>

        {/* Tools Menu */}
        <div className="relative">
          <button
            ref={toolsBtnRef}
            type="button"
            onClick={() => setActiveMenu((prev) => (prev === 'tools' ? null : 'tools'))}
            className={`px-2.5 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition ${
              activeMenu === 'tools' ? 'bg-slate-200 dark:bg-slate-700' : ''
            }`}
          >
            Tools
          </button>
          <ViewportPopover
            triggerRef={toolsBtnRef}
            isOpen={activeMenu === 'tools'}
            onClose={() => setActiveMenu(null)}
            className="w-52 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-2 text-xs space-y-1"
          >
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
          </ViewportPopover>
        </div>

        {/* Help Menu */}
        <div className="relative">
          <button
            ref={helpBtnRef}
            type="button"
            onClick={() => setActiveMenu((prev) => (prev === 'help' ? null : 'help'))}
            className={`px-2.5 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition ${
              activeMenu === 'help' ? 'bg-slate-200 dark:bg-slate-700' : ''
            }`}
          >
            Help
          </button>
          <ViewportPopover
            triggerRef={helpBtnRef}
            isOpen={activeMenu === 'help'}
            onClose={() => setActiveMenu(null)}
            className="w-64 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-3 text-xs space-y-1.5"
          >
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
          </ViewportPopover>
        </div>

      </div>

      {/* ══════════════════════════════════════════════════════
          แถวที่ 4: แถบจัดแต่งข้อความแถวที่ 1 (Paragraph, B, I, U, S, Color, Highlight, Link, Lists, Checklist, Image)
         ══════════════════════════════════════════════════════ */}
      <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5 flex-wrap text-slate-700 dark:text-slate-200">
        {/* Paragraph Style Dropdown */}
        <div className="relative">
          <button
            ref={paragraphBtnRef}
            type="button"
            onClick={() => setIsParagraphMenuOpen((prev) => !prev)}
            className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <span>{currentBlockLabel}</span>
            <ChevronDown size={12} className="opacity-60" />
          </button>
          <ViewportPopover
            triggerRef={paragraphBtnRef}
            isOpen={isParagraphMenuOpen}
            onClose={() => setIsParagraphMenuOpen(false)}
            className="w-44 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-1 text-xs space-y-0.5"
          >
            <button
              type="button"
              onClick={() => {
                handleSetHeading(0);
                setIsParagraphMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 ${
                currentBlockLabel === 'Paragraph' ? 'text-indigo-600 font-bold bg-indigo-50 dark:bg-indigo-950/40' : ''
              }`}
            >
              Paragraph (ปกติ)
            </button>
            <button
              type="button"
              onClick={() => {
                handleSetHeading(1);
                setIsParagraphMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 font-bold text-base ${
                currentBlockLabel === 'Heading 1' ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40' : ''
              }`}
            >
              Heading 1 (หัวข้อใหญ่)
            </button>
            <button
              type="button"
              onClick={() => {
                handleSetHeading(2);
                setIsParagraphMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 font-bold text-sm ${
                currentBlockLabel === 'Heading 2' ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40' : ''
              }`}
            >
              Heading 2 (หัวข้อย่อย)
            </button>
            <button
              type="button"
              onClick={() => {
                handleSetHeading(3);
                setIsParagraphMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold ${
                currentBlockLabel === 'Heading 3' ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40' : ''
              }`}
            >
              Heading 3 (หัวข้อรอง)
            </button>
            <button
              type="button"
              onClick={() => {
                handleQuote();
                setIsParagraphMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 italic ${
                currentBlockLabel === 'Quote' ? 'text-indigo-600 font-bold bg-indigo-50 dark:bg-indigo-950/40' : ''
              }`}
            >
              Quote (กล่องอ้างอิง)
            </button>
          </ViewportPopover>
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
            ref={textColorBtnRef}
            type="button"
            onClick={() => {
              setActiveColorTrigger('toolbar');
              setIsTextColorMenuOpen((prev) => !prev);
            }}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition flex items-center gap-0.5"
            title="สีตัวอักษร"
          >
            <span className="font-bold underline decoration-indigo-500 text-sm leading-none px-0.5">A</span>
            <ChevronDown size={10} className="opacity-60" />
          </button>
          <ViewportPopover
            triggerRef={activeColorTrigger === 'pipette' ? pipetteBtnRef : textColorBtnRef}
            isOpen={isTextColorMenuOpen}
            onClose={() => setIsTextColorMenuOpen(false)}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-2 w-40"
          >
            <p className="text-[10px] font-bold text-slate-400 mb-1.5">เลือกสีตัวอักษร:</p>
            <div className="grid grid-cols-4 gap-1.5">
              {INK_COLORS.map((tc) => (
                <button
                  key={tc.color}
                  type="button"
                  onClick={() => {
                    handleSetTextColor(tc.color, tc.name);
                    setIsTextColorMenuOpen(false);
                  }}
                  className="w-6 h-6 rounded-full border border-slate-300 shadow-xs hover:scale-110 transition flex items-center justify-center"
                  style={{ backgroundColor: tc.color }}
                  title={tc.name}
                />
              ))}
            </div>
          </ViewportPopover>
        </div>

        {/* Highlighter Dropdown */}
        <div className="relative">
          <button
            ref={highlightBtnRef}
            type="button"
            onClick={() => setIsHighlightMenuOpen((prev) => !prev)}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition flex items-center gap-0.5"
            title="ปากกาไฮไลต์ข้อความ"
          >
            <Highlighter size={15} className="text-amber-500" />
            <ChevronDown size={10} className="opacity-60" />
          </button>
          <ViewportPopover
            triggerRef={highlightBtnRef}
            isOpen={isHighlightMenuOpen}
            onClose={() => setIsHighlightMenuOpen(false)}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-2 w-36"
          >
            <p className="text-[10px] font-bold text-slate-400 mb-1.5">สีไฮไลต์:</p>
            <div className="flex gap-1.5 flex-wrap">
              {HIGHLIGHT_COLORS.map((hc) => (
                <button
                  key={hc.color}
                  type="button"
                  onClick={() => {
                    handleSetHighlight(hc.color, hc.name);
                    setIsHighlightMenuOpen(false);
                  }}
                  className="w-5 h-5 rounded-md border border-slate-300 shadow-xs hover:scale-110 transition"
                  style={{ backgroundColor: hc.color }}
                  title={hc.name}
                />
              ))}
            </div>
          </ViewportPopover>
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
          title="รายการลำดับตัวเลข (Numbered List)"
        >
          <ListOrdered size={16} />
        </button>

        {/* Bullet List */}
        <button
          type="button"
          onClick={handleBulletList}
          className={getToolBtnClass(isBulletListActive)}
          title="รายการหัวข้อย่อย (Bullet List)"
        >
          <List size={16} />
        </button>

        {/* Checklist */}
        <button
          type="button"
          onClick={handleChecklist}
          className={getToolBtnClass(isTaskListActive)}
          title="กล่องเช็คลิสต์ (Checklist)"
        >
          <CheckSquare size={16} />
        </button>

        {/* Quote */}
        <button
          type="button"
          onClick={handleQuote}
          className={getToolBtnClass(isBlockquoteActive)}
          title="กล่องข้อความอ้างอิง (Quote)"
        >
          <QuoteIcon size={16} />
        </button>

        {/* Divider (Horizontal Rule) */}
        <button
          type="button"
          onClick={handleHorizontalRule}
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
          title="แทรกเส้นแบ่งบรรทัด (Divider)"
        >
          <Minus size={16} />
        </button>

        {/* Table Dropdown */}
        <div className="relative">
          <button
            ref={tableToolBtnRef}
            type="button"
            onClick={() => setIsTableMenuOpen((prev) => !prev)}
            className={getToolBtnClass(isTableActive)}
            title="จัดการตาราง (Table)"
          >
            <TableIcon size={16} />
          </button>
          <ViewportPopover
            triggerRef={tableToolBtnRef}
            isOpen={isTableMenuOpen}
            onClose={() => setIsTableMenuOpen(false)}
            className="w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-1 text-xs divide-y divide-slate-100 dark:divide-slate-700"
          >
            <div className="py-1">
              <button
                type="button"
                onClick={() => {
                  handleInsertTable(3, 3);
                  setIsTableMenuOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-between"
              >
                <span>แทรกตาราง 3x3</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  handleInsertTable(2, 2);
                  setIsTableMenuOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-between"
              >
                <span>แทรกตาราง 2x2</span>
              </button>
            </div>
            {isTableActive && (
              <div className="py-1 space-y-0.5">
                <button
                  type="button"
                  onClick={() => {
                    handleAddRow();
                    setIsTableMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  + เพิ่มแถวด้านล่าง
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleDeleteRow();
                    setIsTableMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-rose-500"
                >
                  - ลบแถวนี้
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleAddColumn();
                    setIsTableMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  + เพิ่มคอลัมน์ด้านขวา
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleDeleteColumn();
                    setIsTableMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-rose-500"
                >
                  - ลบคอลัมน์นี้
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleDeleteTable();
                    setIsTableMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 font-bold"
                >
                  ลบตารางทั้งหมด
                </button>
              </div>
            )}
          </ViewportPopover>
        </div>

        {/* Audio / Voice Memo */}
        {onRecordAudio && (
          <button
            type="button"
            onClick={onRecordAudio}
            className="p-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg transition font-medium flex items-center gap-1"
            title="อัดเสียง / บันทึกเสียงพูด (Voice Memo)"
          >
            <Mic size={16} />
          </button>
        )}

        {/* Image with Resize & Caption */}
        <div className="relative">
          <button
            ref={imageToolBtnRef}
            type="button"
            onClick={() => setIsImageMenuOpen((prev) => !prev)}
            className={getToolBtnClass(isImageActive)}
            title="จัดการรูปภาพและคำบรรยาย (Image Resize & Caption)"
          >
            <ImageIcon size={16} />
          </button>
          <ViewportPopover
            triggerRef={imageToolBtnRef}
            isOpen={isImageMenuOpen}
            onClose={() => setIsImageMenuOpen(false)}
            className="w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-2 text-xs space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700 dark:text-slate-200">แทรกรูปภาพ:</span>
              <button
                type="button"
                onClick={() => {
                  handleInsertImageClick();
                  setIsImageMenuOpen(false);
                }}
                className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 text-[11px] font-semibold"
              >
                เลือกไฟล์
              </button>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-700 pt-1.5">
              <span className="text-[11px] text-slate-400 font-semibold block mb-1">
                ปรับขนาดภาพ (คลิกเลือกภาพก่อน):
              </span>
              <div className="grid grid-cols-4 gap-1 text-[11px] font-medium text-center">
                <button
                  type="button"
                  onClick={() => handleResizeImage('img-w-25', '25%')}
                  className="p-1 rounded bg-slate-100 dark:bg-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition"
                >
                  25%
                </button>
                <button
                  type="button"
                  onClick={() => handleResizeImage('img-w-50', '50%')}
                  className="p-1 rounded bg-slate-100 dark:bg-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition"
                >
                  50%
                </button>
                <button
                  type="button"
                  onClick={() => handleResizeImage('img-w-75', '75%')}
                  className="p-1 rounded bg-slate-100 dark:bg-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition"
                >
                  75%
                </button>
                <button
                  type="button"
                  onClick={() => handleResizeImage('img-w-100', '100%')}
                  className="p-1 rounded bg-slate-100 dark:bg-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition"
                >
                  100%
                </button>
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-700 pt-1.5">
              <button
                type="button"
                onClick={() => {
                  handleSetImageCaption();
                  setIsImageMenuOpen(false);
                }}
                className="w-full py-1.5 px-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-left flex items-center justify-between text-[11px]"
              >
                <span>ใส่คำบรรยายภาพ (Caption)</span>
                <FileText size={13} className="text-slate-400" />
              </button>
            </div>
          </ViewportPopover>
        </div>

        {/* Separator */}
        <div className="w-[1px] h-5 bg-slate-200 dark:bg-slate-700 mx-0.5" />

        {/* Speech to Text Live Dictation */}
        <SpeechToTextButton editor={editor || null} />

        {/* Image OCR Button */}
        {onOpenOcr && (
          <button
            type="button"
            onClick={onOpenOcr}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition shadow-xs"
            title="สแกนข้อความจากรูปภาพ (Free OCR)"
          >
            <ScanText size={14} />
            <span className="hidden sm:inline">OCR</span>
          </button>
        )}

        {/* AI Assistant Button */}
        {onOpenAiAssistant && (
          <button
            type="button"
            onClick={onOpenAiAssistant}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white transition shadow-sm"
            title="ผู้ช่วย AI สรุปและเรียบเรียง (ฟรี 100%)"
          >
            <Sparkles size={14} />
            <span>AI ผู้ช่วย</span>
          </button>
        )}

        {/* More Options (...) */}
        <div className="relative">
          <button
            ref={moreOptionsBtnRef}
            type="button"
            onClick={() => setIsMoreMenuOpen((prev) => !prev)}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
            title="ตัวเลือกเพิ่มเติม"
          >
            <MoreHorizontal size={16} />
          </button>
          <ViewportPopover
            triggerRef={moreOptionsBtnRef}
            isOpen={isMoreMenuOpen}

            onClose={() => setIsMoreMenuOpen(false)}
            className="w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-1 text-xs space-y-0.5"
          >
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
                handleInsertImageUrl();
                setIsMoreMenuOpen(false);
              }}
              className="w-full text-left px-3 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
            >
              <ImageIcon size={13} />
              <span>แทรกรูปภาพจาก URL</span>
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
              className="w-full text-left px-3 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-rose-600"
            >
              ล้างการจัดรูปแบบ
            </button>
          </ViewportPopover>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          แถวที่ 5: แถบจัดแต่งข้อความแถวที่ 2 (Clear Format, Alignments, Indent, HR, Checklist, Image, Code)
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

        {/* Checklist shortcut */}
        <button
          type="button"
          onClick={handleChecklist}
          className={getToolBtnClass(isTaskListActive)}
          title="กล่องเช็คลิสต์ (Checklist)"
        >
          <CheckSquare size={16} />
        </button>

        {/* Image shortcut */}
        <button
          type="button"
          onClick={handleInsertImageClick}
          className={getToolBtnClass(false)}
          title="แทรกรูปภาพ"
        >
          <ImageIcon size={16} />
        </button>

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
