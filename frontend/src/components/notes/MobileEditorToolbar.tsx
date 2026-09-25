import React, { useState, useEffect, useRef } from 'react';
import type { Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Palette,
  Highlighter,
  List,
  CheckSquare,
  Plus,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  Image as ImageIcon,
  Mic,
  AudioLines,
  Table as TableIcon,
  Paperclip,
  RotateCcw,
  RotateCw,
  Sparkles,
  ScanText,
  History,
  X,
  Check,
  Type,
  ZoomIn,
  ZoomOut,
  Smile,
  Bell,
} from 'lucide-react';
import BottomSheet from '../ui/BottomSheet';
import toast from 'react-hot-toast';
import SpeechToTextButton from './SpeechToTextButton';
import { FONT_PRESETS, FontPreset, FONT_SIZE_PRESETS, FontSizePreset } from './editorExtensions';
import Fluent3DEmojiPicker, { FluentEmojiItem } from './Fluent3DEmojiPicker';

export const MOBILE_TEXT_COLORS = [
  { name: 'ดำเข้ม', color: '#0F172A' },
  { name: 'เทา', color: '#475569' },
  { name: 'น้ำเงิน', color: '#2563EB' },
  { name: 'แดง', color: '#DC2626' },
  { name: 'เขียว', color: '#16A34A' },
  { name: 'ม่วง', color: '#9333EA' },
  { name: 'ส้ม', color: '#EA580C' },
];

export const MOBILE_HIGHLIGHT_COLORS = [
  { name: 'เหลืองนีออน', color: '#FEF08A' },
  { name: 'เขียวมิ้นต์', color: '#86EFAC' },
  { name: 'ชมพูหวาน', color: '#F472B6' },
  { name: 'ฟ้าสดใส', color: '#93C5FD' },
  { name: 'ส้มพีช', color: '#FDBA74' },
];

interface MobileEditorToolbarProps {
  editor: Editor | null;
  zoomLevel?: number;
  onZoomChange?: (zoom: number) => void;
  onAttachFile?: () => void;
  onRecordAudio?: () => void;
  onOpenOcr?: () => void;
  onOpenAiAssistant?: () => void;
  onOpenVersionHistory?: () => void;
  fontFamily?: string;
  onFontFamilyChange?: (fontId: string) => void;
  fontSize?: string;
  onFontSizeChange?: (size: string) => void;
  onOpenReminder?: () => void;
  hasReminder?: boolean;
}

export default function MobileEditorToolbar({
  editor,
  zoomLevel = 100,
  onZoomChange,
  onAttachFile,
  onRecordAudio,
  onOpenOcr,
  onOpenAiAssistant,
  onOpenVersionHistory,
  fontFamily = 'sans',
  onFontFamilyChange,
  fontSize = '16px',
  onFontSizeChange,
  onOpenReminder,
  hasReminder = false,
}: MobileEditorToolbarProps) {
  const [activeSheet, setActiveSheet] = useState<'add' | 'textColor' | 'highlight' | 'font' | 'fontSize' | 'emoji' | null>(null);
  const [customSizeInput, setCustomSizeInput] = useState(fontSize ? fontSize.replace('px', '') : '16');
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const savedSelectionRef = useRef<{ from: number; to: number } | null>(null);

  useEffect(() => {
    if (fontSize) {
      setCustomSizeInput(fontSize.replace('px', ''));
    }
  }, [fontSize]);

  const openColorSheet = (sheet: 'textColor' | 'highlight') => {
    if (editor) {
      const { from, to } = editor.state.selection;
      savedSelectionRef.current = { from, to };
    }
    setActiveSheet(sheet);
  };

  const applyTextColor = (colorHex: string) => {
    if (!editor) return;
    if (savedSelectionRef.current && savedSelectionRef.current.from !== savedSelectionRef.current.to) {
      editor.chain().setTextSelection(savedSelectionRef.current).setColor(colorHex).run();
    } else {
      editor.chain().focus().setColor(colorHex).run();
    }
    setActiveSheet(null);
  };

  const clearTextColor = () => {
    if (!editor) return;
    if (savedSelectionRef.current && savedSelectionRef.current.from !== savedSelectionRef.current.to) {
      editor.chain().setTextSelection(savedSelectionRef.current).unsetColor().run();
    } else {
      editor.chain().focus().unsetColor().run();
    }
    setActiveSheet(null);
  };

  const applyHighlight = (colorHex: string) => {
    if (!editor) return;
    if (savedSelectionRef.current && savedSelectionRef.current.from !== savedSelectionRef.current.to) {
      editor.chain().setTextSelection(savedSelectionRef.current).toggleHighlight({ color: colorHex }).run();
    } else {
      editor.chain().focus().toggleHighlight({ color: colorHex }).run();
    }
    setActiveSheet(null);
  };

  const clearHighlight = () => {
    if (!editor) return;
    if (savedSelectionRef.current && savedSelectionRef.current.from !== savedSelectionRef.current.to) {
      editor.chain().setTextSelection(savedSelectionRef.current).unsetHighlight().run();
    } else {
      editor.chain().focus().unsetHighlight().run();
    }
    setActiveSheet(null);
  };

  // Monitor software keyboard via VisualViewport API on mobile devices
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;

    const handleViewportChange = () => {
      const vv = window.visualViewport;
      if (!vv) return;
      const offset = window.innerHeight - vv.height - vv.offsetTop;
      setKeyboardOffset(Math.max(0, Math.round(offset)));
    };

    window.visualViewport.addEventListener('resize', handleViewportChange);
    window.visualViewport.addEventListener('scroll', handleViewportChange);

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportChange);
        window.visualViewport.removeEventListener('scroll', handleViewportChange);
      }
    };
  }, []);

  if (!editor) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('ขนาดรูปภาพต้องไม่เกิน 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      if (src) {
        editor.chain().focus().setImage({ src }).run();
        toast.success('แทรกรูปภาพเรียบร้อย');
      }
    };
    reader.readAsDataURL(file);
    setActiveSheet(null);
  };

  const handleInsertLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('ระบุ URL สำหรับลิงก์:', previousUrl || 'https://');
    if (url === null) return;
    if (url.trim() === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
    setActiveSheet(null);
  };

  return (
    <>
      {/* Docked Mobile Toolbar (Adapts dynamically to soft keyboard) */}
      <div
        style={{ bottom: `${keyboardOffset}px` }}
        className={`fixed left-0 right-0 z-30 lg:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800 px-2 pt-1.5 shadow-2xl transition-all duration-100 ease-out ${
          keyboardOffset === 0 ? 'pb-[max(8px,env(safe-area-inset-bottom))]' : 'pb-1.5'
        }`}
      >
        <div className="flex items-center justify-between gap-1 overflow-x-auto no-scrollbar py-0.5 max-w-full">
          {/* 1. Bold */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`min-w-[40px] h-10 rounded-xl flex items-center justify-center transition ${
              editor.isActive('bold')
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="ตัวหนา"
            aria-label="ตัวหนา"
          >
            <Bold size={18} />
          </button>

          {/* 2. Italic */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`min-w-[40px] h-10 rounded-xl flex items-center justify-center transition ${
              editor.isActive('italic')
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="ตัวเอียง"
            aria-label="ตัวเอียง"
          >
            <Italic size={18} />
          </button>

          {/* 3. Underline */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`min-w-[40px] h-10 rounded-xl flex items-center justify-center transition ${
              editor.isActive('underline')
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="ขีดเส้นใต้"
            aria-label="ขีดเส้นใต้"
          >
            <UnderlineIcon size={18} />
          </button>

          {/* 4. Text Color */}
          <button
            type="button"
            onClick={() => openColorSheet('textColor')}
            className="min-w-[40px] h-10 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="สีตัวอักษร"
            aria-label="สีตัวอักษร"
          >
            <Palette size={18} />
          </button>

          {/* 5. Highlight */}
          <button
            type="button"
            onClick={() => openColorSheet('highlight')}
            className={`min-w-[40px] h-10 rounded-xl flex items-center justify-center transition ${
              editor.isActive('highlight')
                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="ไฮไลต์ข้อความ"
            aria-label="ไฮไลต์ข้อความ"
          >
            <Highlighter size={18} />
          </button>

          {/* Font Family (ฟอนต์) */}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              if (editor && !editor.state.selection.empty) {
                savedSelectionRef.current = {
                  from: editor.state.selection.from,
                  to: editor.state.selection.to,
                };
              }
            }}
            onTouchStart={() => {
              if (editor && !editor.state.selection.empty) {
                savedSelectionRef.current = {
                  from: editor.state.selection.from,
                  to: editor.state.selection.to,
                };
              }
            }}
            onClick={() => {
              if (editor && !editor.state.selection.empty) {
                savedSelectionRef.current = {
                  from: editor.state.selection.from,
                  to: editor.state.selection.to,
                };
              }
              setActiveSheet('font');
            }}
            className="min-w-[40px] h-10 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="เปลี่ยนฟอนต์"
            aria-label="เปลี่ยนฟอนต์"
          >
            <Type size={18} />
          </button>

          {/* 5.1 Font Size */}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              if (editor && !editor.state.selection.empty) {
                savedSelectionRef.current = {
                  from: editor.state.selection.from,
                  to: editor.state.selection.to,
                };
              }
            }}
            onTouchStart={() => {
              if (editor && !editor.state.selection.empty) {
                savedSelectionRef.current = {
                  from: editor.state.selection.from,
                  to: editor.state.selection.to,
                };
              }
            }}
            onClick={() => {
              if (editor && !editor.state.selection.empty) {
                savedSelectionRef.current = {
                  from: editor.state.selection.from,
                  to: editor.state.selection.to,
                };
              }
              setActiveSheet('fontSize');
            }}
            className="min-w-[42px] h-10 px-1 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="ขนาดตัวอักษร"
            aria-label="ขนาดตัวอักษร"
          >
            <span className="text-[11px] font-bold bg-slate-100 dark:bg-slate-800/80 px-1.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
              {fontSize}
            </span>
          </button>

          {/* 5.2 3D Emoji */}
          <button
            type="button"
            onClick={() => setActiveSheet('emoji')}
            className="min-w-[40px] h-10 rounded-xl flex items-center justify-center text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Emoji 3D"
            aria-label="Emoji 3D"
          >
            <Smile size={18} />
          </button>

          {/* 6. Bullet List */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`min-w-[40px] h-10 rounded-xl flex items-center justify-center transition ${
              editor.isActive('bulletList')
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="รายการหัวข้อย่อย"
            aria-label="รายการหัวข้อย่อย"
          >
            <List size={18} />
          </button>

          {/* 7. Checklist (Task List) */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            className={`min-w-[40px] h-10 rounded-xl flex items-center justify-center transition ${
              editor.isActive('taskList')
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="เช็คลิสต์รายการ"
            aria-label="เช็คลิสต์รายการ"
          >
            <CheckSquare size={18} />
          </button>

          {/* 8. Speech to text (พูดเพื่อพิมพ์) */}
          <SpeechToTextButton editor={editor} variant="compact" />

          {/* 9. Add (+) Button for More Tools */}
          <button
            type="button"
            onClick={() => setActiveSheet('add')}
            className="min-w-[40px] h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold transition active:scale-95 shadow-xs"
            title="เครื่องมือเพิ่มเติม"
            aria-label="เครื่องมือเพิ่มเติม"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      {/* ────────────── BOTTOM SHEETS FOR MOBILE TOOLS ────────────── */}

      {/* 1. Add / More Tools Sheet */}
      <BottomSheet
        isOpen={activeSheet === 'add'}
        onClose={() => setActiveSheet(null)}
        title="แทรกและจัดรูปแบบเพิ่มเติม"
      >
        <div className="space-y-4">
          {/* Headings */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">หัวข้อ (Headings)</p>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().setParagraph().run();
                  setActiveSheet(null);
                }}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition ${
                  editor.isActive('paragraph')
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                ปกติ
              </button>
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().toggleHeading({ level: 1 }).run();
                  setActiveSheet(null);
                }}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition ${
                  editor.isActive('heading', { level: 1 })
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                H1 ใหญ่
              </button>
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().toggleHeading({ level: 2 }).run();
                  setActiveSheet(null);
                }}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition ${
                  editor.isActive('heading', { level: 2 })
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                H2 กลาง
              </button>
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().toggleHeading({ level: 3 }).run();
                  setActiveSheet(null);
                }}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition ${
                  editor.isActive('heading', { level: 3 })
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                H3 เล็ก
              </button>
            </div>
          </div>

          {/* Alignment */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">จัดชิด (Alignment)</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().setTextAlign('left').run();
                  setActiveSheet(null);
                }}
                className="py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                <AlignLeft size={16} /> ชิดซ้าย
              </button>
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().setTextAlign('center').run();
                  setActiveSheet(null);
                }}
                className="py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                <AlignCenter size={16} /> กึ่งกลาง
              </button>
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().setTextAlign('right').run();
                  setActiveSheet(null);
                }}
                className="py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                <AlignRight size={16} /> ชิดขวา
              </button>
            </div>
          </div>

          {/* Insert Media & Tools */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">แทรกเนื้อหา (Insert)</p>
            <div className="grid grid-cols-2 gap-2">
              {/* Insert Image */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <ImageIcon size={18} className="text-indigo-500" />
                <span>แทรกรูปภาพ</span>
              </button>

              {/* Change Font */}
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  if (editor && !editor.state.selection.empty) {
                    savedSelectionRef.current = {
                      from: editor.state.selection.from,
                      to: editor.state.selection.to,
                    };
                  }
                }}
                onTouchStart={() => {
                  if (editor && !editor.state.selection.empty) {
                    savedSelectionRef.current = {
                      from: editor.state.selection.from,
                      to: editor.state.selection.to,
                    };
                  }
                }}
                onClick={() => {
                  if (editor && !editor.state.selection.empty) {
                    savedSelectionRef.current = {
                      from: editor.state.selection.from,
                      to: editor.state.selection.to,
                    };
                  }
                  setActiveSheet('font');
                }}
                className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <Type size={18} className="text-purple-500" />
                <span>เปลี่ยนฟอนต์ (Font)</span>
              </button>

              {/* Change Font Size */}
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  if (editor && !editor.state.selection.empty) {
                    savedSelectionRef.current = {
                      from: editor.state.selection.from,
                      to: editor.state.selection.to,
                    };
                  }
                }}
                onTouchStart={() => {
                  if (editor && !editor.state.selection.empty) {
                    savedSelectionRef.current = {
                      from: editor.state.selection.from,
                      to: editor.state.selection.to,
                    };
                  }
                }}
                onClick={() => {
                  if (editor && !editor.state.selection.empty) {
                    savedSelectionRef.current = {
                      from: editor.state.selection.from,
                      to: editor.state.selection.to,
                    };
                  }
                  setActiveSheet('fontSize');
                }}
                className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <span className="w-5 h-5 rounded flex items-center justify-center bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 font-extrabold text-[11px]">
                  Aa
                </span>
                <span>ขนาดฟอนต์ ({fontSize})</span>
              </button>

              {/* Insert 3D Emoji */}
              <button
                type="button"
                onClick={() => setActiveSheet('emoji')}
                className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <Smile size={18} className="text-amber-500" />
                <span>Emoji 3D (Fluent)</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />

              {/* Insert Link */}
              <button
                type="button"
                onClick={handleInsertLink}
                className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <LinkIcon size={18} className="text-blue-500" />
                <span>แทรกลิงก์ (Link)</span>
              </button>

              {/* Insert Table */}
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
                  setActiveSheet(null);
                  toast.success('แทรกตาราง 3x3 เรียบร้อย');
                }}
                className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <TableIcon size={18} className="text-emerald-500" />
                <span>แทรกตาราง 3x3</span>
              </button>

              {/* Number List */}
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().toggleOrderedList().run();
                  setActiveSheet(null);
                }}
                className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <ListOrdered size={18} className="text-amber-500" />
                <span>รายการลำดับเลข</span>
              </button>

              {/* Blockquote */}
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().toggleBlockquote().run();
                  setActiveSheet(null);
                }}
                className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <Quote size={18} className="text-purple-500" />
                <span>กล่องคำพูด (Quote)</span>
              </button>

              {/* Code Block */}
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().toggleCodeBlock().run();
                  setActiveSheet(null);
                }}
                className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <Code size={18} className="text-rose-500" />
                <span>บล็อกโค้ด (Code)</span>
              </button>

              {/* Voice Memo */}
              {onRecordAudio && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveSheet(null);
                    onRecordAudio();
                  }}
                  className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <AudioLines size={18} className="text-indigo-500" />
                  <span>อัดเสียงบันทึก (Voice Memo)</span>
                </button>
              )}

              {/* Attach File */}
              {onAttachFile && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveSheet(null);
                    onAttachFile();
                  }}
                  className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <Paperclip size={18} className="text-slate-500" />
                  <span>แนบไฟล์เอกสาร</span>
                </button>
              )}

              {/* Note Reminder Button */}
              {onOpenReminder && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveSheet(null);
                    onOpenReminder();
                  }}
                  className={`p-3 rounded-2xl border flex items-center gap-2.5 text-xs font-bold transition ${
                    hasReminder
                      ? 'border-amber-400 bg-amber-50/70 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Bell size={18} className={hasReminder ? 'fill-current text-amber-500 animate-pulse' : 'text-amber-500'} />
                  <span>{hasReminder ? 'แก้ไขเตือนความจำ' : 'ตั้งเวลาแจ้งเตือน (Reminder)'}</span>
                </button>
              )}
            </div>

            {/* Note Zoom Controls for Mobile & Tablet */}
            {onZoomChange && (
              <div className="mt-2.5 flex items-center justify-between p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/50">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <ZoomIn size={16} className="text-indigo-500" />
                  <span>ขนาดข้อความโน้ต</span>
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (zoomLevel > 60) {
                        const next = Math.max(60, zoomLevel - 10);
                        onZoomChange(next);
                        toast(`ย่อขนาดโน้ต (${next}%)`, { icon: '🔍', id: 'note-zoom-toast' });
                      }
                    }}
                    className="p-1.5 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 active:scale-95 shadow-2xs"
                    title="ย่อขนาด (-10%)"
                  >
                    <ZoomOut size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onZoomChange(100);
                      toast('รีเซ็ตขนาดโน้ตเป็น 100%', { icon: '🔍', id: 'note-zoom-toast' });
                    }}
                    className="px-2 py-1 rounded-lg bg-white dark:bg-slate-700 text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-600 active:scale-95 shadow-2xs"
                    title="รีเซ็ตเป็น 100%"
                  >
                    {zoomLevel}%
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (zoomLevel < 200) {
                        const next = Math.min(200, zoomLevel + 10);
                        onZoomChange(next);
                        toast(`ขยายขนาดโน้ต (${next}%)`, { icon: '🔍', id: 'note-zoom-toast' });
                      }
                    }}
                    className="p-1.5 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 active:scale-95 shadow-2xs"
                    title="ขยายขนาด (+10%)"
                  >
                    <ZoomIn size={15} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Undo / Redo */}
          <div className="flex gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              disabled={!editor.can().undo()}
              onClick={() => editor.chain().focus().undo().run()}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 disabled:opacity-40"
            >
              <RotateCcw size={16} /> ย้อนกลับ (Undo)
            </button>
            <button
              type="button"
              disabled={!editor.can().redo()}
              onClick={() => editor.chain().focus().redo().run()}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 disabled:opacity-40"
            >
              <RotateCw size={16} /> ทำซ้ำ (Redo)
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* 2. Text Color Sheet */}
      <BottomSheet
        isOpen={activeSheet === 'textColor'}
        onClose={() => setActiveSheet(null)}
        title="เลือกสีตัวอักษร"
      >
        <div className="space-y-2">
          {MOBILE_TEXT_COLORS.map((c) => (
            <button
              key={c.color}
              type="button"
              onClick={() => applyTextColor(c.color)}
              className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <div className="flex items-center gap-3">
                <span
                  className="w-6 h-6 rounded-full border border-black/10 shadow-xs"
                  style={{ backgroundColor: c.color }}
                />
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{c.name}</span>
              </div>
              {editor.isActive('textStyle', { color: c.color }) && (
                <Check size={18} className="text-indigo-600" />
              )}
            </button>
          ))}
          <button
            type="button"
            onClick={clearTextColor}
            className="w-full py-3 mt-2 text-center text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-2xl transition"
          >
            ล้างสีตัวอักษร (รีเซ็ตเป็นค่าเริ่มต้น)
          </button>
        </div>
      </BottomSheet>

      {/* 3. Highlight Sheet */}
      <BottomSheet
        isOpen={activeSheet === 'highlight'}
        onClose={() => setActiveSheet(null)}
        title="เลือกสีไฮไลต์ข้อความ"
      >
        <div className="space-y-2">
          {MOBILE_HIGHLIGHT_COLORS.map((c) => (
            <button
              key={c.color}
              type="button"
              onClick={() => applyHighlight(c.color)}
              className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <div className="flex items-center gap-3">
                <span
                  className="w-6 h-6 rounded-full border border-black/10 shadow-xs"
                  style={{ backgroundColor: c.color }}
                />
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{c.name}</span>
              </div>
              {editor.isActive('highlight', { color: c.color }) && (
                <Check size={18} className="text-amber-600" />
              )}
            </button>
          ))}
          <button
            type="button"
            onClick={clearHighlight}
            className="w-full py-3 mt-2 text-center text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-2xl transition"
          >
            ล้างสีไฮไลต์ทั้งหมด
          </button>
        </div>
      </BottomSheet>

      {/* 4. Font Selection Sheet */}
      <BottomSheet
        isOpen={activeSheet === 'font'}
        onClose={() => setActiveSheet(null)}
        title="เลือกรูปแบบฟอนต์ (Font Family)"
      >
        <div className="space-y-3 pb-6">
          <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between">
            {savedSelectionRef.current && savedSelectionRef.current.from !== savedSelectionRef.current.to ? (
              <span className="font-bold text-indigo-600 dark:text-indigo-400">✏️ มีข้อความที่เลือก: เปลี่ยนเฉพาะข้อความนั้น</span>
            ) : (
              <span className="font-bold text-slate-700 dark:text-slate-200">📄 จะเปลี่ยนเป็นฟอนต์หลักของทั้งโน้ต</span>
            )}
          </div>

          <div className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-0.5">
            {FONT_PRESETS.map((fp, idx) => {
              const isCurrent = fontFamily === fp.id;
              const prevCategory = idx > 0 ? FONT_PRESETS[idx - 1].category : null;
              const isNewCategory = fp.category !== prevCategory;
              const categoryNames: Record<string, string> = {
                sans: 'โมเดิร์น & มินิมอล',
                formal: 'ทางการ & วรรณกรรม',
                handwriting: 'ลายมือ & สร้างสรรค์',
                code: 'โค้ด & พิมพ์ดีด',
              };
              return (
                <React.Fragment key={fp.id}>
                  {isNewCategory && (
                    <div className="pt-2 pb-1 px-1 text-xs font-bold text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800 first:border-t-0 first:pt-0">
                      {categoryNames[fp.category] || fp.category}
                    </div>
                  )}
                  <button
                    key={fp.id}
                    type="button"
                    onClick={() => {
                      const hasSelection = Boolean(
                        savedSelectionRef.current && savedSelectionRef.current.from !== savedSelectionRef.current.to
                      );
                      if (editor && hasSelection) {
                        try {
                          if (typeof (editor.chain().focus().setTextSelection(savedSelectionRef.current!) as any).setFontFamily === 'function') {
                            (editor.chain().focus().setTextSelection(savedSelectionRef.current!) as any).setFontFamily(fp.family).run();
                          } else {
                            editor.chain().focus().setTextSelection(savedSelectionRef.current!).setMark('textStyle', { fontFamily: fp.family }).run();
                          }
                        } catch {
                          editor.chain().focus().setTextSelection(savedSelectionRef.current!).setMark('textStyle', { fontFamily: fp.family }).run();
                        }
                        if (onFontFamilyChange) onFontFamilyChange(fp.id);
                        toast.success(`เปลี่ยนฟอนต์ข้อความที่เลือกเป็น "${fp.name}"`);
                      } else {
                        if (onFontFamilyChange) onFontFamilyChange(fp.id);
                        toast.success(`เปลี่ยนฟอนต์ทั้งโน้ตเป็น "${fp.name}"`);
                      }
                      setActiveSheet(null);
                    }}
                    className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                      isCurrent
                        ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <span className="text-base" style={{ fontFamily: fp.family }}>
                      {fp.name}
                    </span>
                    {isCurrent && <Check size={18} className="text-indigo-600 dark:text-indigo-400" />}
                  </button>
                </React.Fragment>
              );
            })}
          </div>

          {savedSelectionRef.current && savedSelectionRef.current.from !== savedSelectionRef.current.to && (
            <button
              type="button"
              onClick={() => {
                if (editor) {
                  try {
                    if (typeof (editor.chain().focus().setTextSelection(savedSelectionRef.current!) as any).unsetFontFamily === 'function') {
                      (editor.chain().focus().setTextSelection(savedSelectionRef.current!) as any).unsetFontFamily().run();
                    } else {
                      editor.chain().focus().setTextSelection(savedSelectionRef.current!).setMark('textStyle', { fontFamily: null }).removeEmptyTextStyle().run();
                    }
                  } catch {
                    editor.chain().focus().setTextSelection(savedSelectionRef.current!).setMark('textStyle', { fontFamily: null }).run();
                  }
                  toast.success('คืนค่าฟอนต์ตามค่าเริ่มต้นของโน้ต');
                }
                setActiveSheet(null);
              }}
              className="w-full py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/60 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <RotateCcw size={14} />
              <span>ล้างฟอนต์เฉพาะคำนี้ (ใช้ตามฟอนต์โน้ต)</span>
            </button>
          )}
        </div>
      </BottomSheet>

      {/* 5. Font Size Picker BottomSheet */}
      <BottomSheet
        isOpen={activeSheet === 'fontSize'}
        onClose={() => setActiveSheet(null)}
        title={
          savedSelectionRef.current && savedSelectionRef.current.from !== savedSelectionRef.current.to
            ? 'ขนาดฟอนต์ (ข้อความที่ไฮไลต์)'
            : 'ขนาดฟอนต์เริ่มต้นของโน้ต'
        }
      >
        <div className="space-y-3 pb-4">
          <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl">
            {savedSelectionRef.current && savedSelectionRef.current.from !== savedSelectionRef.current.to ? (
              <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                ✍️ กำลังปรับขนาดเฉพาะข้อความที่เลือก
              </span>
            ) : (
              <span>📝 ปรับขนาดเริ่มต้นสำหรับโน้ตนี้ทั้งหมด (หรือเลือกข้อความเพื่อปรับเฉพาะจุด)</span>
            )}
          </div>

          {/* Custom Font Size Row */}
          <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 shrink-0">กำหนดขนาดเอง:</span>
            <div className="flex items-center gap-1.5 flex-1 justify-end">
              <button
                type="button"
                onClick={() => {
                  const currentNum = parseInt(customSizeInput || fontSize || '16', 10);
                  const newNum = Math.max(8, currentNum - 1);
                  setCustomSizeInput(`${newNum}`);
                }}
                className="w-8 h-8 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center font-bold text-base text-slate-700 dark:text-slate-200 active:scale-95"
              >
                -
              </button>
              <div className="relative w-20">
                <input
                  type="number"
                  min={8}
                  max={96}
                  value={customSizeInput}
                  onChange={(e) => setCustomSizeInput(e.target.value)}
                  className="w-full text-center py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-sm text-slate-800 dark:text-slate-100"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none">px</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const currentNum = parseInt(customSizeInput || fontSize || '16', 10);
                  const newNum = Math.min(96, currentNum + 1);
                  setCustomSizeInput(`${newNum}`);
                }}
                className="w-8 h-8 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center font-bold text-base text-slate-700 dark:text-slate-200 active:scale-95"
              >
                +
              </button>
              <button
                type="button"
                onClick={() => {
                  const num = parseInt(customSizeInput, 10);
                  if (!isNaN(num) && num >= 8 && num <= 96) {
                    const customSize = `${num}px`;
                    const hasSelection =
                      savedSelectionRef.current && savedSelectionRef.current.from !== savedSelectionRef.current.to;

                    if (hasSelection && editor) {
                      editor
                        .chain()
                        .focus()
                        .setTextSelection(savedSelectionRef.current!)
                        .setMark('textStyle', { fontSize: customSize })
                        .run();
                      toast.success(`เปลี่ยนขนาดข้อความที่เลือกเป็น ${customSize}`);
                    } else {
                      if (onFontSizeChange) onFontSizeChange(customSize);
                      toast.success(`เปลี่ยนขนาดฟอนต์ทั้งโน้ตเป็น ${customSize}`);
                    }
                    setActiveSheet(null);
                  } else {
                    toast.error('กรุณาระบุขนาดระหว่าง 8 - 96 px');
                  }
                }}
                className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl font-bold text-xs shadow-sm hover:bg-indigo-700 active:scale-95 transition"
              >
                ใช้
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 max-h-[50vh] overflow-y-auto pr-1">
            {FONT_SIZE_PRESETS.map((sz) => {
              const isCurrent = fontSize === sz.size;
              return (
                <button
                  key={sz.size}
                  type="button"
                  onClick={() => {
                    const hasSelection =
                      savedSelectionRef.current && savedSelectionRef.current.from !== savedSelectionRef.current.to;

                    if (hasSelection && editor) {
                      editor
                        .chain()
                        .focus()
                        .setTextSelection(savedSelectionRef.current!)
                        .setMark('textStyle', { fontSize: sz.size })
                        .run();
                      toast.success(`เปลี่ยนขนาดข้อความที่เลือกเป็น ${sz.size}`);
                    } else {
                      if (onFontSizeChange) onFontSizeChange(sz.size);
                      toast.success(`เปลี่ยนขนาดฟอนต์ทั้งโน้ตเป็น ${sz.size}`);
                    }
                    setActiveSheet(null);
                  }}
                  className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                    isCurrent
                      ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-sm">{sz.name}</div>
                    <div className="text-xs text-slate-400">{sz.desc}</div>
                  </div>
                  {isCurrent && <Check size={18} className="text-indigo-600 dark:text-indigo-400" />}
                </button>
              );
            })}
          </div>

          {savedSelectionRef.current && savedSelectionRef.current.from !== savedSelectionRef.current.to && (
            <button
              type="button"
              onClick={() => {
                if (editor) {
                  editor
                    .chain()
                    .focus()
                    .setTextSelection(savedSelectionRef.current!)
                    .setMark('textStyle', { fontSize: null })
                    .removeEmptyTextStyle()
                    .run();
                  toast.success('คืนค่าขนาดฟอนต์ตามค่าเริ่มต้นของโน้ต');
                }
                setActiveSheet(null);
              }}
              className="w-full py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/60 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <RotateCcw size={14} />
              <span>ล้างขนาดฟอนต์เฉพาะคำนี้ (ใช้ตามขนาดโน้ต)</span>
            </button>
          )}
        </div>
      </BottomSheet>

      {/* 6. 3D Fluent Emoji Picker BottomSheet */}
      <BottomSheet
        isOpen={activeSheet === 'emoji'}
        onClose={() => setActiveSheet(null)}
        title="อีโมจิ & ไอคอน (Emoji 3D)"
      >
        <div className="pb-4 flex justify-center">
          <Fluent3DEmojiPicker
            onSelectEmoji={(emoji, fullUrl, mode) => {
              if (editor) {
                if (mode === 'unicode') {
                  const char = emoji.unicodeChar || '😀';
                  editor.chain().focus().insertContent(char).run();
                  toast.success(`แทรก ${emoji.thName} (ตัวอักษร)`);
                } else {
                  try {
                    if (typeof (editor.chain().focus() as any).insert3DEmoji === 'function') {
                      (editor.chain().focus() as any).insert3DEmoji({ src: fullUrl, alt: emoji.name, title: emoji.thName }).run();
                    } else {
                      editor.chain().focus().insertContent({
                        type: 'inlineEmoji',
                        attrs: { src: fullUrl, alt: emoji.name, title: emoji.thName },
                      }).run();
                    }
                  } catch {
                    editor.chain().focus().insertContent(`<img src="${fullUrl}" alt="${emoji.name}" title="${emoji.thName}" data-emoji="3d" class="fluent-emoji-3d" style="width: 1.25em; height: 1.25em; vertical-align: -0.22em; display: inline-block; margin: 0 0.15em;" />`).run();
                  }
                  toast.success(`แทรก ${emoji.thName} (3D)`);
                }
              }
              setActiveSheet(null);
            }}
            onClose={() => setActiveSheet(null)}
          />
        </div>
      </BottomSheet>
    </>
  );
}
