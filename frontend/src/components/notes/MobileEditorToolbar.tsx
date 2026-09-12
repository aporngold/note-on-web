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
} from 'lucide-react';
import BottomSheet from '../ui/BottomSheet';
import toast from 'react-hot-toast';
import SpeechToTextButton from './SpeechToTextButton';

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
  onAttachFile?: () => void;
  onRecordAudio?: () => void;
  onOpenOcr?: () => void;
  onOpenAiAssistant?: () => void;
  onOpenVersionHistory?: () => void;
}

export default function MobileEditorToolbar({
  editor,
  onAttachFile,
  onRecordAudio,
  onOpenOcr,
  onOpenAiAssistant,
  onOpenVersionHistory,
}: MobileEditorToolbarProps) {
  const [activeSheet, setActiveSheet] = useState<'add' | 'textColor' | 'highlight' | null>(null);
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
            onClick={() => setActiveSheet('textColor')}
            className="min-w-[40px] h-10 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="สีตัวอักษร"
            aria-label="สีตัวอักษร"
          >
            <Palette size={18} />
          </button>

          {/* 5. Highlight */}
          <button
            type="button"
            onClick={() => setActiveSheet('highlight')}
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
            </div>

            {/* Speech to Text Dictation Item */}
            <div className="mt-2.5">
              <SpeechToTextButton
                editor={editor}
                variant="menu-item"
                onActionComplete={() => setActiveSheet(null)}
              />
            </div>
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
              onClick={() => {
                editor.chain().focus().setColor(c.color).run();
                setActiveSheet(null);
              }}
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
            onClick={() => {
              editor.chain().focus().unsetColor().run();
              setActiveSheet(null);
            }}
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
              onClick={() => {
                editor.chain().focus().setHighlight({ color: c.color }).run();
                setActiveSheet(null);
              }}
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
            onClick={() => {
              editor.chain().focus().unsetHighlight().run();
              setActiveSheet(null);
            }}
            className="w-full py-3 mt-2 text-center text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-2xl transition"
          >
            ล้างสีไฮไลต์ทั้งหมด
          </button>
        </div>
      </BottomSheet>
    </>
  );
}
