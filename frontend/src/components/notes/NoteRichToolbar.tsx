import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  ChevronUp,
  Printer,
  Table as TableIcon,
  FileText,
  HelpCircle,
  X,
  Type,
  Highlighter,
  Mic,
  AudioLines,
  Quote as QuoteIcon,
  Sparkles,
  ScanText,
  History,
  Lock,
  Unlock,
  ArrowLeft,
  Pin,
  Star,
  CopyPlus,
  Edit3,
  Eye,
  Save,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
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
  { name: 'สีดำเข้ม (ค่าเริ่มต้น)', color: '#0F172A' },
  { name: 'สีเทาเข้ม', color: '#475569' },
  { name: 'สีน้ำเงินสด', color: '#2563EB' },
  { name: 'สีน้ำเงินเข้ม', color: '#1E3A8A' },
  { name: 'สีแดงเพลิง', color: '#DC2626' },
  { name: 'สีแดงเลือดหมู', color: '#991B1B' },
  { name: 'สีเขียวสด', color: '#16A34A' },
  { name: 'สีเขียวมรกต', color: '#065F46' },
  { name: 'สีส้มอิฐ', color: '#EA580C' },
  { name: 'สีทองอำพัน', color: '#D97706' },
  { name: 'สีม่วงสด', color: '#9333EA' },
  { name: 'สีชมพู', color: '#DB2777' },
];

export const HIGHLIGHT_COLORS = [
  { name: 'เหลืองเรืองแสง', color: '#FEF08A' },
  { name: 'เขียวมิ้นต์', color: '#86EFAC' },
  { name: 'ฟ้าพาสเทล', color: '#BAE6FD' },
  { name: 'ชมพูพาสเทล', color: '#FBCFE8' },
  { name: 'ส้มพีช', color: '#FED7AA' },
  { name: 'ม่วงลาเวนเดอร์', color: '#E9D5FF' },
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
  isLocked?: boolean;
  onToggleLock?: () => void;
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
  onCancel?: () => void;
  onAccept: () => void;
  showSpeechToText?: boolean;
  isSaving?: boolean;
  onBack?: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onDuplicate?: () => void;
  isPreview?: boolean;
  onTogglePreview?: () => void;
  onOpenFullscreen?: () => void;
  extraRightActions?: React.ReactNode;
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
  isLocked,
  onToggleLock,
  isBorderless,
  onToggleBorderless,
  textareaRef,
  zoomLevel,
  onZoomChange,
  onAttachFile,
  onRecordAudio,
  showSpeechToText = true,
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
  onBack,
  isFavorite,
  onToggleFavorite,
  onDuplicate,
  isPreview,
  onTogglePreview,
  onOpenFullscreen,
  extraRightActions,
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
  const isVaultUnlocked = useAuthStore((state) => state.isVaultUnlocked);

  // Collapsible toolbar states (Remembered with localStorage, default collapsed on mobile < 1024px)
  const [isTopPaletteCollapsed, setIsTopPaletteCollapsed] = useState(false);
  const [isFormattingCollapsed, setIsFormattingCollapsed] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedTop = localStorage.getItem('note_top_palette_collapsed');
        const savedFormat = localStorage.getItem('note_formatting_collapsed');
        if (savedTop !== null) {
          setIsTopPaletteCollapsed(savedTop === 'true');
        } else if (window.innerWidth < 1024) {
          setIsTopPaletteCollapsed(true);
        }

        if (savedFormat !== null) {
          setIsFormattingCollapsed(savedFormat === 'true');
        } else if (window.innerWidth < 1024) {
          setIsFormattingCollapsed(true);
        }
      } catch (e) {
        // ignore localStorage error
      }
    }
  }, []);

  const handleToggleTopPalette = useCallback(() => {
    setIsTopPaletteCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('note_top_palette_collapsed', String(next));
      } catch (e) {}
      return next;
    });
  }, []);

  const handleToggleFormatting = useCallback(() => {
    setIsFormattingCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('note_formatting_collapsed', String(next));
      } catch (e) {}
      return next;
    });
  }, []);

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
      editor.chain().focus().updateAttributes('image', { class: sizeClass, width: label }).run();
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

  const handleSetTextColor = (colorHex: string, colorName?: string, shouldClose = false) => {
    if (editor) {
      editor.chain().focus().setColor(colorHex).run();
      if (shouldClose) setIsTextColorMenuOpen(false);
      return;
    }
    insertFormatting(`<span style="color: ${colorHex}">`, '</span>');
    if (shouldClose) setIsTextColorMenuOpen(false);
  };

  const handleSetHighlight = (colorHex: string, colorName?: string, shouldClose = false) => {
    if (editor) {
      editor.chain().focus().toggleHighlight({ color: colorHex }).run();
      if (shouldClose) setIsHighlightMenuOpen(false);
      return;
    }
    insertFormatting(`<mark style="background-color: ${colorHex}; padding: 1px 4px; border-radius: 4px;">`, '</mark>');
    if (shouldClose) setIsHighlightMenuOpen(false);
  };

  const handleRemoveHighlight = () => {
    if (editor) {
      editor.chain().focus().unsetHighlight().run();
      return;
    }
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
    if (zoomLevel < 200) {
      const next = Math.min(200, zoomLevel + 10);
      onZoomChange(next);
      toast(`ขยายขนาดโน้ต (${next}%)`, { icon: '🔍', id: 'note-zoom-toast' });
    }
  };

  const handleZoomOut = () => {
    if (zoomLevel > 60) {
      const next = Math.max(60, zoomLevel - 10);
      onZoomChange(next);
      toast(`ย่อขนาดโน้ต (${next}%)`, { icon: '🔍', id: 'note-zoom-toast' });
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
        {/* Left: Back Arrow, Undo, Redo, Zoom In, Zoom Out */}
        <div className="flex items-center gap-1 flex-wrap">
          {onBack && (
            <>
              <button
                type="button"
                onClick={onBack}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white font-bold"
                title="กลับไปหน้าหลัก"
                aria-label="กลับ"
              >
                <ArrowLeft size={18} />
              </button>
              <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-700 mx-0.5" />
            </>
          )}

          <button
            type="button"
            onClick={handleUndo}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
            title="เลิกทำ / ย้อนกลับ (Ctrl+Z)"
            aria-label="เลิกทำ"
          >
            <RotateCcw size={16} />
          </button>
          <button
            type="button"
            onClick={handleRedo}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
            title="ทำซ้ำ (Ctrl+Y หรือ Ctrl+Shift+Z)"
            aria-label="ทำซ้ำ"
          >
            <RotateCw size={16} />
          </button>
          <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-700 mx-0.5" />
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition active:scale-95 text-slate-700 dark:text-slate-200"
            title={`ขยายขนาดโน้ต (+10%) ปัจจุบัน: ${zoomLevel}%`}
            aria-label="ขยายขนาดโน้ต"
          >
            <ZoomIn size={16} />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition active:scale-95 text-slate-700 dark:text-slate-200"
            title={`ย่อขนาดโน้ต (-10%) ปัจจุบัน: ${zoomLevel}%`}
            aria-label="ย่อขนาดโน้ต"
          >
            <ZoomOut size={16} />
          </button>
          {zoomLevel !== 100 && (
            <button
              type="button"
              onClick={() => {
                onZoomChange(100);
                toast('รีเซ็ตขนาดโน้ตเป็น 100%', { icon: '🔍', id: 'note-zoom-toast' });
              }}
              className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition active:scale-95"
              title="คลิกเพื่อรีเซ็ตขนาดกลับเป็น 100%"
            >
              {zoomLevel}%
            </button>
          )}
        </div>

        {/* Right: Actions from the Top Action Bar */}
        <div className="flex items-center gap-1 flex-wrap">
          {/* E2EE Lock / Unlock */}
          {onToggleLock && (
            <button
              type="button"
              onClick={onToggleLock}
              className={`p-1.5 rounded-lg transition ${
                isLocked
                  ? isVaultUnlocked
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-400/50'
                    : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 ring-1 ring-amber-400/50'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500'
              }`}
              title={
                isLocked
                  ? isVaultUnlocked
                    ? 'โน้ตนี้ปลดล็อกแล้ว (คลิกเพื่อยกเลิกการเข้ารหัส/ล็อก)'
                    : 'โน้ตเข้ารหัส E2EE (คลิกเพื่อปลดล็อกด้วยรหัสผ่าน)'
                  : 'เปิดการเข้ารหัสลับแบบ E2EE'
              }
              aria-label={isLocked ? (isVaultUnlocked ? 'ปลดล็อกแล้ว' : 'ล็อกอยู่') : 'ไม่ได้ล็อก'}
            >
              {isLocked ? (
                isVaultUnlocked ? (
                  <Unlock size={16} className="text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Lock size={16} className="text-amber-600 dark:text-amber-400" />
                )
              ) : (
                <Unlock size={16} className="opacity-50" />
              )}
            </button>
          )}

          {/* Pin */}
          {onTogglePin && (
            <button
              type="button"
              onClick={onTogglePin}
              className={`p-1.5 rounded-lg transition ${
                isPinned
                  ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 ring-1 ring-indigo-500/20'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title={isPinned ? 'ยกเลิกการปักหมุด' : 'ปักหมุดโน้ตนี้'}
              aria-label="ปักหมุด"
            >
              <Pin size={16} className={isPinned ? 'fill-current' : ''} />
            </button>
          )}

          {/* Favorite */}
          {onToggleFavorite && (
            <button
              type="button"
              onClick={onToggleFavorite}
              className={`p-1.5 rounded-lg transition ${
                isFavorite
                  ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/50 ring-1 ring-amber-500/20'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title={isFavorite ? 'ยกเลิกรายการโปรด' : 'เพิ่มในรายการโปรด (Favorite)'}
              aria-label="รายการโปรด"
            >
              <Star size={16} className={isFavorite ? 'fill-current' : ''} />
            </button>
          )}

          {/* Attachment */}
          {onAttachFile && (
            <button
              type="button"
              onClick={onAttachFile}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition relative text-slate-500"
              title={`แนบไฟล์ (ปัจจุบันมี ${attachmentsCount} ไฟล์)`}
              aria-label="ไฟล์แนบ"
            >
              <Paperclip size={16} />
              {attachmentsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-indigo-600 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                  {attachmentsCount}
                </span>
              )}
            </button>
          )}

          {/* Voice Memo */}
          {onRecordAudio && (
            <button
              type="button"
              onClick={onRecordAudio}
              className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition"
              title="อัดเสียงบันทึก (Voice Memo)"
              aria-label="อัดเสียง"
            >
              <AudioLines size={16} />
            </button>
          )}

          {/* Speech-to-Text Live Dictation */}
          {showSpeechToText && <SpeechToTextButton editor={editor || null} />}

          {/* OCR Image */}
          {onOpenOcr && (
            <button
              type="button"
              onClick={onOpenOcr}
              className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition"
              title="สแกนข้อความจากรูปภาพ (OCR)"
              aria-label="OCR"
            >
              <ScanText size={16} />
            </button>
          )}

          {/* AI Assistant */}
          {onOpenAiAssistant && (
            <button
              type="button"
              onClick={onOpenAiAssistant}
              className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition"
              title="ผู้ช่วย AI สรุปและเรียบเรียง"
              aria-label="ผู้ช่วย AI"
            >
              <Sparkles size={16} />
            </button>
          )}

          {/* Version History */}
          {onOpenVersionHistory && (
            <button
              type="button"
              onClick={onOpenVersionHistory}
              className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
              title="ประวัติเวอร์ชัน (Version History)"
              aria-label="ประวัติเวอร์ชัน"
            >
              <History size={16} />
            </button>
          )}

          {/* Duplicate Note */}
          {onDuplicate && (
            <button
              type="button"
              onClick={onDuplicate}
              className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
              title="ทำสำเนาโน้ตนี้ (Duplicate Note)"
              aria-label="ทำสำเนา"
            >
              <CopyPlus size={16} />
            </button>
          )}

          {/* Collaborators presence */}
          {extraRightActions}

          {/* Preview Toggle */}
          {onTogglePreview && (
            <button
              type="button"
              onClick={onTogglePreview}
              className={`p-1.5 rounded-lg transition ${
                isPreview
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200 dark:shadow-none'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title={isPreview ? 'แก้ไขเนื้อหา' : 'ดูตัวอย่าง'}
              aria-label={isPreview ? 'แก้ไข' : 'ดูตัวอย่าง'}
            >
              {isPreview ? <Edit3 size={16} /> : <Eye size={16} />}
            </button>
          )}

          {/* Copy Note */}
          {onCopyNote && (
            <button
              type="button"
              onClick={onCopyNote}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
              title="คัดลอกข้อความทั้งหมด (Copy)"
              aria-label="คัดลอก"
            >
              <Copy size={16} />
            </button>
          )}

          {/* Download TXT */}
          {onDownloadTxt && (
            <button
              type="button"
              onClick={onDownloadTxt}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
              title="ดาวน์โหลดเป็นไฟล์ข้อความ (.txt)"
              aria-label="ดาวน์โหลด txt"
            >
              <Download size={16} />
            </button>
          )}

          {/* Share */}
          {onShare && (
            <button
              type="button"
              onClick={onShare}
              className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
              title="แชร์โน้ตนี้"
              aria-label="แชร์"
            >
              <Share2 size={16} />
            </button>
          )}

          {/* Move Board */}
          {onMoveBoard && (
            <button
              type="button"
              onClick={onMoveBoard}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
              title="ย้ายโน้ตนี้ไปกระดานอื่น (Move to Board)"
              aria-label="ย้ายกระดาน"
            >
              <ArrowLeftRight size={16} />
            </button>
          )}

          {/* Delete */}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition"
              title="ลบโน้ตนี้"
              aria-label="ลบโน้ต"
            >
              <Trash2 size={16} />
            </button>
          )}

          {/* Fullscreen Mode */}
          {onOpenFullscreen && (
            <button
              type="button"
              onClick={onOpenFullscreen}
              className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
              title="เปิดแก้ไขแบบเต็มจอ (Fullscreen)"
              aria-label="เต็มจอ"
            >
              <Maximize2 size={16} />
            </button>
          )}

          {/* Truly Fullscreen exit (for Fullscreen modal) */}
          {onToggleTrulyFullscreen && (
            <button
              type="button"
              onClick={onToggleTrulyFullscreen}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition text-slate-700 dark:text-slate-200"
              title="ยกเลิกโหมดเต็มจอ (Esc)"
              aria-label="ยกเลิกเต็มจอ"
            >
              <Minimize2 size={16} />
            </button>
          )}

          {/* Vertical divider before Save / Close */}
          <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 my-auto mx-0.5" />

          {/* Save Button */}
          {onAccept && (
            <button
              type="button"
              onClick={onAccept}
              disabled={isSaving}
              className="p-1.5 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center justify-center transition active:scale-95 disabled:opacity-50"
              title={isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
              aria-label="บันทึก"
            >
              <Save size={16} />
            </button>
          )}

          {/* Close / Cancel Button */}
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
              title="ปิด / ยกเลิก (Close)"
              aria-label="ปิดโน้ต"
            >
              <X size={17} />
            </button>
          )}

          {/* Toggle Top Palette Collapse Button */}
          <button
            type="button"
            onClick={handleToggleTopPalette}
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 bg-slate-100 dark:bg-slate-800 rounded-lg transition text-slate-600 dark:text-slate-300 ml-1 flex items-center justify-center shrink-0"
            title={isTopPaletteCollapsed ? 'ขยายแถบสีและหมุด (Expand palette)' : 'ย่อ/พับเก็บแถบสีและหมุด (Collapse palette)'}
            aria-label={isTopPaletteCollapsed ? 'ขยายแถบสี' : 'พับเก็บแถบสี'}
          >
            {isTopPaletteCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          แถวที่ 2: แถบจานสีพาสเทล, หมุดแดง, Borderless Checkbox (พับเก็บได้)
         ══════════════════════════════════════════════════════ */}
      {!isTopPaletteCollapsed && (
        <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap bg-slate-50/50 dark:bg-slate-800/30 transition-all">
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

            {/* Custom Color Picker for Note Color (Circular Rainbow Swatch) */}
            <div className="flex items-center pl-2 ml-1 border-l border-slate-200 dark:border-slate-700">
              <label
                className="w-5 h-5 rounded-full cursor-pointer relative hover:scale-110 active:scale-95 transition-all shadow-xs flex items-center justify-center ring-1 ring-slate-300 dark:ring-slate-600 hover:ring-indigo-400 overflow-hidden"
                style={{
                  background: 'conic-gradient(from 180deg at 50% 50%, #FF0000 0deg, #FFFF00 60deg, #00FF00 120deg, #00FFFF 180deg, #0000FF 240deg, #FF00FF 300deg, #FF0000 360deg)',
                }}
                title="กำหนดสีกระดาษโน้ตเอง (Custom Note Color)"
              >
                <input
                  ref={customColorInputRef}
                  type="color"
                  value={color || '#FEF08A'}
                  onChange={(e) => onColorChange(e.target.value)}
                  className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Right: Lock, Push Pin & Borderless Checkbox */}
          <div className="flex items-center gap-3">
            {/* Lock / E2EE Button */}
            {onToggleLock && (
              <button
                type="button"
                onClick={onToggleLock}
                className={`p-1.5 rounded-lg transition cursor-pointer flex items-center justify-center ${
                  isLocked
                    ? isVaultUnlocked
                      ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 ring-1 ring-emerald-500/30 font-bold'
                      : 'text-amber-700 dark:text-amber-300 bg-amber-500/15 ring-1 ring-amber-500/30 font-bold animate-pulse'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
                title={
                  isLocked
                    ? isVaultUnlocked
                      ? 'โน้ตนี้ปลดล็อกแล้ว (คลิกเพื่อยกเลิกการเข้ารหัส/ล็อก)'
                      : 'โน้ตถูกล็อกและเข้ารหัสลับ E2EE (คลิกเพื่อปลดล็อกด้วยรหัสผ่าน)'
                    : 'คลิกเพื่อเข้ารหัสและล็อกโน้ตนี้ (E2EE)'
                }
              >
                {isLocked ? (
                  isVaultUnlocked ? <Unlock size={14} /> : <Lock size={14} />
                ) : (
                  <Unlock size={14} className="opacity-40 hover:opacity-100 hover:text-amber-500" />
                )}
              </button>
            )}

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
      )}

      {/* ══════════════════════════════════════════════════════
          แถวที่ 3: แถบเมนูบาร์ (Menu Bar)
         ══════════════════════════════════════════════════════ */}
      <div className="px-2 py-1 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1 text-xs font-medium text-slate-600 dark:text-slate-300">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none flex-1">
          {/* File Menu */}
        <div className="relative">
          <button
            ref={fileBtnRef}
            type="button"
            onClick={() => setActiveMenu((prev) => (prev === 'file' ? null : 'file'))}
            className={`px-2.5 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition ${
              activeMenu === 'file' ? 'bg-slate-200 dark:bg-slate-700' : ''
            }`}
            title="เมนูไฟล์ (File)"
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
            {onCancel && (
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
            )}
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
            title="เมนูแก้ไข (Edit)"
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
            title="เมนูมุมมอง (View)"
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
                className="w-full text-left px-3 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-between text-indigo-600 dark:text-indigo-400 font-medium"
              >
                <span>ปิดโหมดขยาย</span>
                <Minimize2 size={13} />
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
              ขยายขนาดโน้ต (+10%)
            </button>
            <button
              type="button"
              onClick={() => {
                handleZoomOut();
                setActiveMenu(null);
              }}
              className="w-full text-left px-3 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              ย่อขนาดโน้ต (-10%)
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
            title="เมนูแทรก (Insert)"
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
              className="w-full text-left px-3 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-between"
            >
              <span>ใส่วันที่และเวลา</span>
              <Calendar size={13} className="text-slate-400" />
            </button>
            <button
              type="button"
              onClick={() => {
                handleLink();
                setActiveMenu(null);
              }}
              className="w-full text-left px-3 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-between"
            >
              <span>แทรกลิงก์ (Link)</span>
              <LinkIcon size={13} className="text-slate-400" />
            </button>
            <button
              type="button"
              onClick={() => {
                handleChecklist();
                setActiveMenu(null);
              }}
              className="w-full text-left px-3 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-between"
            >
              <span>กล่องเช็คลิสต์ (Task list)</span>
              <CheckSquare size={13} className="text-slate-400" />
            </button>
            <button
              type="button"
              onClick={() => {
                handleInsertImageClick();
                setActiveMenu(null);
              }}
              className="w-full text-left px-3 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-between"
            >
              <span>แทรกรูปภาพ (จากไฟล์ในเครื่อง)</span>
              <ImageIcon size={13} className="text-slate-400" />
            </button>
            <button
              type="button"
              onClick={() => {
                handleInsertImageUrl();
                setActiveMenu(null);
              }}
              className="w-full text-left px-3 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-between"
            >
              <span>แทรกรูปภาพ (จากลิงก์ URL)</span>
              <LinkIcon size={13} className="text-slate-400" />
            </button>
            <button
              type="button"
              onClick={() => {
                handleHorizontalRule();
                setActiveMenu(null);
              }}
              className="w-full text-left px-3 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-between"
            >
              <span>เส้นคั่นบรรทัด (Divider)</span>
              <Minus size={13} className="text-slate-400" />
            </button>
            <button
              type="button"
              onClick={() => {
                handleInsertTable(2, 2);
                setActiveMenu(null);
              }}
              className="w-full text-left px-3 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-between"
            >
              <span>แทรกตาราง 2x2</span>
              <TableIcon size={13} className="text-slate-400" />
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
            title="เมนูจัดรูปแบบ (Format)"
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
            title="เมนูตาราง (Table)"
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
            title="เครื่องมือสถิติและจำนวนคำ (Tools)"
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
            title="ช่วยเหลือและคีย์ลัด (Help)"
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
        {/* Toggle Formatting Toolbar Collapse Button */}
        <button
          type="button"
          onClick={handleToggleFormatting}
          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 bg-slate-100 dark:bg-slate-800 rounded-lg transition text-slate-600 dark:text-slate-300 ml-1 flex items-center justify-center shrink-0"
          title={isFormattingCollapsed ? 'ขยายแถบเครื่องมือจัดข้อความ (Expand formatting tools)' : 'ย่อ/พับเก็บแถบเครื่องมือจัดข้อความ (Collapse formatting tools)'}
          aria-label={isFormattingCollapsed ? 'ขยายแถบเครื่องมือ' : 'พับเก็บแถบเครื่องมือ'}
        >
          {isFormattingCollapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
        </button>
      </div>

      {!isFormattingCollapsed && (
        <>
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
            title="รูปแบบข้อความ (Paragraph / หัวข้อ / กล่องอ้างอิง)"
            aria-label="รูปแบบข้อความ"
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

        {/* Text Color Dropdown (International Standard Style with Color Indicator Bar) */}
        <div className="relative">
          <button
            ref={textColorBtnRef}
            type="button"
            onClick={() => {
              setActiveColorTrigger('toolbar');
              setIsTextColorMenuOpen((prev) => !prev);
            }}
            className={`px-1.5 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition flex items-center gap-1 ${
              isTextColorMenuOpen ? 'bg-slate-100 dark:bg-slate-800' : ''
            }`}
            title="สีตัวอักษร (Text Color)"
          >
            <div className="flex flex-col items-center justify-center leading-none">
              <span className="font-bold text-[13px] leading-tight">A</span>
              <span
                className="w-3.5 h-[3px] rounded-full transition-colors shadow-2xs"
                style={{ backgroundColor: (editor?.getAttributes('textStyle')?.color as string) || textColor || '#0F172A' }}
              />
            </div>
            <ChevronDown size={10} className="opacity-50" />
          </button>
          <ViewportPopover
            triggerRef={activeColorTrigger === 'pipette' ? pipetteBtnRef : textColorBtnRef}
            isOpen={isTextColorMenuOpen}
            onClose={() => setIsTextColorMenuOpen(false)}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-3 w-52 animate-fade-in"
          >
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-700/80 mb-2">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">สีตัวอักษร</span>
              <button
                type="button"
                onClick={() => handleSetTextColor('#0F172A', 'สีเริ่มต้น')}
                className="text-[10px] font-semibold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
              >
                ค่าเริ่มต้น
              </button>
            </div>
            <div className="grid grid-cols-6 gap-1.5 mb-2">
              {INK_COLORS.map((tc) => {
                const activeColor = (editor?.getAttributes('textStyle')?.color as string) || textColor || '#0F172A';
                const isSelected = activeColor?.toLowerCase() === tc.color.toLowerCase();
                return (
                  <button
                    key={tc.color}
                    type="button"
                    onClick={() => handleSetTextColor(tc.color, tc.name, false)}
                    className={`w-6 h-6 rounded-full border transition-transform flex items-center justify-center ${
                      isSelected
                        ? 'ring-2 ring-indigo-500 scale-110 shadow-sm border-white dark:border-slate-800'
                        : 'border-slate-300/80 dark:border-slate-600 hover:scale-110 shadow-2xs'
                    }`}
                    style={{ backgroundColor: tc.color }}
                    title={tc.name}
                  >
                    {isSelected && <Check size={10} className={tc.color === '#FFFFFF' ? 'text-black' : 'text-white'} />}
                  </button>
                );
              })}
            </div>
            {/* Custom Free Color Picker */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-700/80 flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <Pipette size={13} className="text-indigo-500" />
                <span>กำหนดสีเอง</span>
              </span>
              <div className="relative flex items-center">
                <label
                  className="w-6 h-6 rounded-full cursor-pointer shadow-xs border-2 border-white dark:border-slate-700 transition-transform hover:scale-110 flex items-center justify-center overflow-hidden"
                  style={{
                    background: 'conic-gradient(from 180deg at 50% 50%, #FF0000 0deg, #FFFF00 60deg, #00FF00 120deg, #00FFFF 180deg, #0000FF 240deg, #FF00FF 300deg, #FF0000 360deg)',
                  }}
                  title="เลือกสีตัวอักษรแบบอิสระ"
                >
                  <input
                    type="color"
                    value={(editor?.getAttributes('textStyle')?.color as string) || textColor || '#0F172A'}
                    className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                    onChange={(e) => {
                      handleSetTextColor(e.target.value, e.target.value, false);
                    }}
                  />
                </label>
              </div>
            </div>
          </ViewportPopover>
        </div>

        {/* Highlighter Dropdown (International Standard Style with Color Indicator Bar) */}
        <div className="relative">
          <button
            ref={highlightBtnRef}
            type="button"
            onClick={() => setIsHighlightMenuOpen((prev) => !prev)}
            className={`px-1.5 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition flex items-center gap-1 ${
              isHighlightMenuOpen ? 'bg-slate-100 dark:bg-slate-800' : ''
            }`}
            title="ปากกาเน้นข้อความ (Highlighter)"
          >
            <div className="flex flex-col items-center justify-center leading-none">
              <Highlighter
                size={14}
                className={editor?.isActive('highlight') ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}
              />
              <span
                className="w-3.5 h-[3px] rounded-full transition-colors shadow-2xs"
                style={{
                  backgroundColor: editor?.isActive('highlight')
                    ? ((editor?.getAttributes('highlight')?.color as string) || '#FEF08A')
                    : '#FEF08A',
                }}
              />
            </div>
            <ChevronDown size={10} className="opacity-50" />
          </button>
          <ViewportPopover
            triggerRef={highlightBtnRef}
            isOpen={isHighlightMenuOpen}
            onClose={() => setIsHighlightMenuOpen(false)}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-3 w-52 animate-fade-in"
          >
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-700/80 mb-2">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">สีไฮไลต์</span>
              <button
                type="button"
                onClick={() => handleRemoveHighlight()}
                className="text-[10px] font-semibold text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 transition flex items-center gap-1"
                title="ลบไฮไลต์ข้อความ"
              >
                <X size={11} />
                <span>ลบไฮไลต์</span>
              </button>
            </div>
            <div className="grid grid-cols-6 gap-1.5 mb-2">
              {HIGHLIGHT_COLORS.map((hc) => {
                const activeColor = (editor?.getAttributes('highlight')?.color as string) || '';
                const isSelected = editor?.isActive('highlight') && activeColor?.toLowerCase() === hc.color.toLowerCase();
                return (
                  <button
                    key={hc.color}
                    type="button"
                    onClick={() => handleSetHighlight(hc.color, hc.name, false)}
                    className={`w-6 h-6 rounded-full border transition-transform flex items-center justify-center ${
                      isSelected
                        ? 'ring-2 ring-indigo-500 scale-110 shadow-sm border-white dark:border-slate-800'
                        : 'border-slate-300/80 dark:border-slate-600 hover:scale-110 shadow-2xs'
                    }`}
                    style={{ backgroundColor: hc.color }}
                    title={hc.name}
                  >
                    {isSelected && <Check size={10} className="text-slate-900" />}
                  </button>
                );
              })}
            </div>
            {/* Custom Free Color Picker for Highlight */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-700/80 flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <Pipette size={13} className="text-amber-500" />
                <span>กำหนดสีเอง</span>
              </span>
              <div className="relative flex items-center">
                <label
                  className="w-6 h-6 rounded-full cursor-pointer shadow-xs border-2 border-white dark:border-slate-700 transition-transform hover:scale-110 flex items-center justify-center overflow-hidden"
                  style={{
                    background: 'conic-gradient(from 180deg at 50% 50%, #FF0000 0deg, #FFFF00 60deg, #00FF00 120deg, #00FFFF 180deg, #0000FF 240deg, #FF00FF 300deg, #FF0000 360deg)',
                  }}
                  title="เลือกสีไฮไลต์แบบอิสระ"
                >
                  <input
                    type="color"
                    defaultValue="#FEF08A"
                    className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                    onChange={(e) => {
                      handleSetHighlight(e.target.value, e.target.value, false);
                    }}
                  />
                </label>
              </div>
            </div>
          </ViewportPopover>
        </div>

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
                  title="ปรับความกว้างรูปภาพเป็น 25%"
                >
                  25%
                </button>
                <button
                  type="button"
                  onClick={() => handleResizeImage('img-w-50', '50%')}
                  className="p-1 rounded bg-slate-100 dark:bg-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition"
                  title="ปรับความกว้างรูปภาพเป็น 50%"
                >
                  50%
                </button>
                <button
                  type="button"
                  onClick={() => handleResizeImage('img-w-75', '75%')}
                  className="p-1 rounded bg-slate-100 dark:bg-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition"
                  title="ปรับความกว้างรูปภาพเป็น 75%"
                >
                  75%
                </button>
                <button
                  type="button"
                  onClick={() => handleResizeImage('img-w-100', '100%')}
                  className="p-1 rounded bg-slate-100 dark:bg-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition"
                  title="ปรับความกว้างรูปภาพเป็น 100% (เต็มความกว้าง)"
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

        {/* Source Code Block <> */}
        <button
          type="button"
          onClick={handleCodeBlock}
          className={getToolBtnClass(isCodeBlockActive)}
          title="บล็อกโค้ด (Code Block)"
        >
          <Code size={16} />
        </button>

        {/* Separator */}
        {(onRecordAudio || showSpeechToText || onOpenOcr || onOpenAiAssistant) && (
          <div className="w-[1px] h-5 bg-slate-200 dark:bg-slate-700 mx-0.5" />
        )}

        {/* Audio / Voice Memo */}
        {onRecordAudio && (
          <button
            type="button"
            onClick={onRecordAudio}
            className="p-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg transition font-medium flex items-center gap-1"
            title="อัดเสียงบันทึก (Voice Memo)"
          >
            <AudioLines size={16} />
          </button>
        )}

        {/* Speech to Text Live Dictation (only if requested) */}
        {showSpeechToText && <SpeechToTextButton editor={editor || null} />}

        {/* Image OCR Button */}
        {onOpenOcr && (
          <button
            type="button"
            onClick={onOpenOcr}
            className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition shadow-xs"
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
            className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition shadow-xs"
            title="ผู้ช่วย AI สรุปและเรียบเรียง (ฟรี 100%)"
          >
            <Sparkles size={14} />
            <span>AI</span>
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
            {onOpenAiAssistant && (
              <button
                type="button"
                onClick={() => {
                  onOpenAiAssistant();
                  setIsMoreMenuOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 rounded hover:bg-indigo-50 dark:hover:bg-indigo-950/40 flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold md:hidden"
              >
                <Sparkles size={13} />
                <span>AI</span>
              </button>
            )}
            {onOpenOcr && (
              <button
                type="button"
                onClick={() => {
                  onOpenOcr();
                  setIsMoreMenuOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 md:hidden"
              >
                <ScanText size={13} />
                <span>สแกน OCR จากภาพ</span>
              </button>
            )}
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

        {/* Direct Collapse Chevron in Row 4 (as shown in user mockup) */}
        <button
          type="button"
          onClick={handleToggleFormatting}
          className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 bg-slate-100 dark:bg-slate-800 rounded-lg transition text-slate-600 dark:text-slate-300 ml-auto flex items-center justify-center shrink-0"
          title="ย่อ/พับเก็บแถบเครื่องมือจัดข้อความ (Collapse formatting tools)"
          aria-label="พับเก็บแถบเครื่องมือ"
        >
          <ChevronUp size={15} />
        </button>
      </div>
        </>
      )}
    </div>
  );
}
