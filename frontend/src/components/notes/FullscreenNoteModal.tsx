import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Minimize2,
  Maximize2,
  Pin,
  Palette,
  Type,
  Paperclip,
  Download,
  Copy,
  Check,
  FileText,
  File,
  Trash2,
  Image as ImageIcon,
  Bold,
  Italic,
  List,
  CheckSquare,
  Heading2,
  Code,
  Save,
  Share2,
  Upload,
} from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Image from '@tiptap/extension-image';

import { Note, FileAttachment } from '@/types';
import { useNoteStore } from '@/store/noteStore';
import toast from 'react-hot-toast';
import NoteRichToolbar from './NoteRichToolbar';
import AudioRecorderModal from './AudioRecorderModal';
import ShareNoteModal from './ShareNoteModal';
import VersionHistoryDrawer from './VersionHistoryDrawer';
import ImageOcrModal from './ImageOcrModal';
import AIAssistantModal from './AIAssistantModal';
import ActiveCollaboratorsBar from './ActiveCollaboratorsBar';
import { convertLegacyContentToHtml, stripHtmlTags } from '@/utils/editorHelper';

interface FullscreenNoteModalProps {
  note: Note | null;
  isOpen: boolean;
  onClose: () => void;
}

const PAPER_COLORS = [
  { name: 'Yellow', bg: '#FEF08A', border: '#FDE047' },
  { name: 'Pink', bg: '#FBCFE8', border: '#F472B6' },
  { name: 'Green', bg: '#BBF7D0', border: '#86EFAC' },
  { name: 'Blue', bg: '#BAE6FD', border: '#7DD3FC' },
  { name: 'Orange', bg: '#FED7AA', border: '#FDBA74' },
  { name: 'Purple', bg: '#E9D5FF', border: '#D8B4FE' },
  { name: 'White', bg: '#FFFFFF', border: '#E2E8F0' },
  { name: 'Dark', bg: '#1E293B', border: '#334155' },
];

const TEXT_COLORS = [
  { name: 'Slate', color: '#0F172A' },
  { name: 'Blue Ink', color: '#1E3A8A' },
  { name: 'Red Ink', color: '#991B1B' },
  { name: 'Emerald', color: '#065F46' },
  { name: 'Deep Purple', color: '#5B21B6' },
  { name: 'Amber', color: '#B45309' },
  { name: 'Pink', color: '#BE185D' },
  { name: 'White', color: '#F8FAFC' },
];

const FONT_FAMILIES = [
  { label: 'ปกติ (Sans)', value: 'sans', className: 'font-sans-note' },
  { label: 'ลายมือ (Handwriting)', value: 'handwriting', className: 'font-handwriting' },
  { label: 'ซีรีฟ (Serif)', value: 'serif', className: 'font-serif-note' },
  { label: 'โค้ด (Mono)', value: 'mono', className: 'font-mono-note' },
];

export default function FullscreenNoteModal({
  note,
  isOpen,
  onClose,
}: FullscreenNoteModalProps) {
  const { updateNote, uploadAttachment, deleteAttachment, togglePin, deleteNote } = useNoteStore();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [color, setColor] = useState('#FEF08A');
  const [textColor, setTextColor] = useState('#0F172A');
  const [fontFamily, setFontFamily] = useState('sans');
  const [fontSize, setFontSize] = useState('normal');
  const [isTrulyFullscreen, setIsTrulyFullscreen] = useState(false);
  const [isBorderless, setIsBorderless] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isCopied, setIsCopied] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isVersionDrawerOpen, setIsVersionDrawerOpen] = useState(false);
  const [isOcrModalOpen, setIsOcrModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // TipTap Instance for Fullscreen focus modal
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      Placeholder.configure({
        placeholder: 'เขียนรายละเอียดเนื้อหาโน้ตของคุณที่นี่ได้อย่างเต็มที่...',
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
    ],
    content: '',
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setContent(html);
      if (note) {
        handleAutoSave({ content: html });
      }
    },
  });

  // Sync state when active note changes
  useEffect(() => {
    if (note) {
      setTitle(note.title || '');
      setColor(note.color || '#FEF08A');
      setTextColor(note.textColor || '#0F172A');
      setFontFamily(note.fontFamily || 'sans');
      setFontSize(note.fontSize || 'normal');

      const initialHtml = convertLegacyContentToHtml(note.content || '');
      setContent(initialHtml);
      if (editor) {
        editor.commands.setContent(initialHtml, { emitUpdate: false });
      }
    }
  }, [note, editor]);

  // Handle Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (previewImage) {
          setPreviewImage(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, previewImage, onClose]);

  if (!isOpen || !note) return null;

  const handleAutoSave = async (updatedFields: Partial<Note>) => {
    try {
      await updateNote(note.id, updatedFields);
    } catch (err) {
      console.error('Auto save error:', err);
    }
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    handleAutoSave({ title: val });
  };

  const handleColorSelect = (c: string) => {
    setColor(c);
    handleAutoSave({ color: c });
  };

  const handleTextColorSelect = (tc: string) => {
    setTextColor(tc);
    handleAutoSave({ textColor: tc });
  };

  const handleCopyNote = () => {
    const textContent = editor ? editor.getText() : stripHtmlTags(content);
    const fullText = `${title}\n\n${textContent}`;
    navigator.clipboard.writeText(fullText);
    setIsCopied(true);
    toast.success('คัดลอกข้อความโน้ตแล้ว');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    const textContent = editor ? editor.getText() : stripHtmlTags(content);
    const fullText = `${title}\n\n${textContent}`;
    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'note'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('ดาวน์โหลดไฟล์ข้อความแล้ว');
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      await uploadAttachment(file, note.id);
      toast.success('อัปโหลดไฟล์แนบแล้ว');
    } catch (error) {
      toast.error('อัปโหลดไฟล์ล้มเหลว');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result as string;
          if (editor) {
            editor.chain().focus().setImage({ src: base64, alt: file.name }).run();
          }
        };
        reader.readAsDataURL(file);
      } else {
        await uploadAttachment(file, note.id);
      }
    }
  };

  const getFontFamilyClass = () => {
    switch (fontFamily) {
      case 'handwriting':
        return 'font-handwriting text-lg';
      case 'serif':
        return 'font-serif-note';
      case 'mono':
        return 'font-mono-note';
      default:
        return 'font-sans-note';
    }
  };

  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'small':
        return 'text-xs sm:text-sm';
      case 'large':
        return 'text-base sm:text-lg';
      default:
        return 'text-sm sm:text-base';
    }
  };

  const apiHost =
    typeof window !== 'undefined'
      ? `${window.location.protocol}//${window.location.hostname}:5000`
      : 'http://localhost:5000';

  const attachments = note.attachments || [];
  const wordCount = editor
    ? editor.getText().trim().split(/\s+/).filter(Boolean).length
    : content.trim() ? content.trim().split(/\s+/).filter(Boolean).length : 0;
  const charCount = editor ? editor.getText().length : content.length;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-fade-in">
      <div
        style={{
          backgroundColor: color,
          color: textColor,
        }}
        className={`flex flex-col transition-all duration-200 relative overflow-hidden ${
          isBorderless
            ? 'shadow-none border-0'
            : 'shadow-2xl border-t-4 border-black/20'
        } ${
          isTrulyFullscreen
            ? 'w-full h-full rounded-none'
            : 'w-full max-w-5xl h-[92vh] rounded-3xl'
        }`}
      >
        {/* ── RICH NOTE TOOLBAR ── */}
        <NoteRichToolbar
          content={content}
          onContentChange={(val) => {
            setContent(val);
            if (editor && editor.getHTML() !== val) {
              editor.commands.setContent(val, { emitUpdate: false });
            }
            handleAutoSave({ content: val });
          }}
          editor={editor}
          color={color}
          onColorChange={(newColor) => handleColorSelect(newColor)}
          textColor={textColor}
          onTextColorChange={(tc) => handleTextColorSelect(tc)}
          isPinned={note.isPinned || false}
          onTogglePin={async () => {
            await togglePin(note.id);
          }}
          isBorderless={isBorderless}
          onToggleBorderless={() => setIsBorderless(!isBorderless)}
          zoomLevel={zoomLevel}
          onZoomChange={(z) => setZoomLevel(z)}
          onRecordAudio={() => setIsAudioModalOpen(true)}
          onAttachFile={() => fileInputRef.current?.click()}
          attachmentsCount={attachments.length}
          onCopyNote={handleCopyNote}
          onDownloadTxt={handleDownloadTxt}
          onDownloadMd={() => {
            const filename = `${(title || 'note').replace(/[^a-zA-Z0-9ก-๙_-]/g, '_')}.md`;
            const textContent = editor ? editor.getText() : stripHtmlTags(content);
            const blob = new Blob([`# ${title || 'ไม่มีชื่อบันทึก'}\n\n${textContent}`], {
              type: 'text/markdown;charset=utf-8',
            });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.click();
            URL.revokeObjectURL(url);
            toast.success('ดาวน์โหลดไฟล์ Markdown แล้ว');
          }}
          onPrint={() => window.print()}
          onShare={() => setIsShareModalOpen(true)}
          onOpenVersionHistory={() => setIsVersionDrawerOpen(true)}
          onOpenOcr={() => setIsOcrModalOpen(true)}
          onOpenAiAssistant={() => setIsAiModalOpen(true)}
          onDelete={() => {
            if (confirm('ต้องการย้ายโน้ตนี้ไปที่ถังขยะหรือไม่?')) {
              deleteNote(note.id);
              onClose();
            }
          }}
          isTrulyFullscreen={isTrulyFullscreen}
          onToggleTrulyFullscreen={() => setIsTrulyFullscreen(!isTrulyFullscreen)}
          onCancel={onClose}
          onAccept={async () => {
            await handleAutoSave({ title, content, color, textColor });
            toast.success('บันทึกเรียบร้อย');
            onClose();
          }}
        />

        {/* ── MAIN READING & EDITING BODY WITH DRAG & DROP ── */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative flex-1 overflow-y-auto p-4 sm:p-8 space-y-4 transition-all ${
            isDraggingOver ? 'dropzone-active ring-4 ring-indigo-500/30' : ''
          }`}
        >
          {isDraggingOver && (
            <div className="absolute inset-0 z-40 bg-indigo-50/90 dark:bg-slate-900/90 backdrop-blur-xs border-2 border-dashed border-indigo-500 rounded-2xl flex flex-col items-center justify-center text-indigo-600 dark:text-indigo-400 pointer-events-none animate-fade-in">
              <Upload size={44} className="animate-bounce mb-2" />
              <p className="font-bold text-base">ปล่อยไฟล์ที่นี่เพื่อแนบหรือแทรกลงในโน้ต</p>
            </div>
          )}
          {/* Note Title Input */}
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="หัวข้อโน้ต..."
              className={`w-full font-bold text-xl sm:text-2xl lg:text-3xl bg-transparent border-b border-black/15 focus:border-black/40 focus:outline-none pb-2 placeholder-black/30 ${getFontFamilyClass()}`}
              style={{ color: textColor }}
            />
          </div>

          {/* Attachments Showcase */}
          {attachments.length > 0 && (
            <div className="p-3 bg-black/5 rounded-2xl border border-black/10 space-y-2">
              <span className="text-xs font-bold opacity-75 flex items-center gap-1.5">
                <Paperclip size={14} />
                <span>ไฟล์แนบ ({attachments.length} ไฟล์):</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {attachments.map((att) => {
                  const isImg = att.mimeType.startsWith('image/');
                  const isPdf = att.mimeType.includes('pdf');
                  const fileUrl = `${apiHost}${att.url}`;

                  return (
                    <div
                      key={att.id}
                      className="p-2 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm rounded-xl border border-black/10 flex items-center justify-between gap-2 shadow-xs"
                    >
                      <div className="flex items-center gap-2 overflow-hidden flex-1">
                        {isImg ? (
                          <img
                            src={fileUrl}
                            alt={att.originalName}
                            onClick={() => setPreviewImage(fileUrl)}
                            className="w-10 h-10 object-cover rounded-lg cursor-pointer border border-black/10 shadow-xs hover:scale-105 transition"
                          />
                        ) : isPdf ? (
                          <span className="p-2 bg-rose-500/20 text-rose-700 rounded-lg shrink-0">
                            <FileText size={16} />
                          </span>
                        ) : (
                          <span className="p-2 bg-indigo-500/20 text-indigo-700 rounded-lg shrink-0">
                            <File size={16} />
                          </span>
                        )}

                        <div className="overflow-hidden flex-1">
                          <p className="text-xs font-bold truncate leading-tight">{att.originalName}</p>
                          <span className="text-[10px] opacity-60">
                            {(att.size / 1024).toFixed(1)} KB {isPdf ? '• PDF' : isImg ? '• รูปภาพ' : ''}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          download={att.originalName}
                          className="p-1 rounded hover:bg-black/10 text-slate-700 dark:text-slate-200 transition"
                          title="ดาวน์โหลดไฟล์"
                        >
                          <Download size={14} />
                        </a>
                        <button
                          onClick={() => deleteAttachment(att.id, note.id)}
                          className="p-1 rounded hover:bg-rose-500/20 text-rose-600 transition"
                          title="ลบไฟล์แนบ"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Large Note Content TipTap Editor */}
          <div
            className="flex-1 min-h-[350px] cursor-text"
            onClick={() => {
              if (editor && !editor.isFocused) {
                editor.commands.focus();
              }
            }}
            style={{
              fontSize: zoomLevel !== 100 ? `${Math.max(12, Math.round(16 * (zoomLevel / 100)))}px` : undefined,
            }}
          >
            <EditorContent editor={editor} />
          </div>
        </div>

        {/* ── FOOTER STATUS & ACTION BAR ── */}
        <div className="p-3 px-6 border-t border-black/10 flex items-center justify-between text-xs opacity-90 bg-black/5 shrink-0 flex-wrap gap-2">
          <div className="flex items-center gap-3 opacity-75">
            <span>
              จำนวนคำ: <b>{wordCount}</b> คำ
            </span>
            <span>
              ความยาว: <b>{charCount}</b> ตัวอักษร
            </span>
            <span>
              ซูม: <b>{zoomLevel}%</b>
            </span>
            {note.notebook && <span>📁 {note.notebook.name}</span>}
          </div>

          <ActiveCollaboratorsBar noteId={note.id} />

          <div className="flex items-center gap-2">
            <span className="text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-1 mr-2 hidden sm:flex">
              <Check size={14} />
              <span>บันทึกอัตโนมัติแล้ว</span>
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-black/10 hover:bg-black/20 text-slate-800 dark:text-white font-bold transition text-xs shadow-xs"
            >
              CANCEL
            </button>
            <button
              type="button"
              onClick={async () => {
                await handleAutoSave({ title, content, color, textColor });
                toast.success('บันทึกเรียบร้อย');
                onClose();
              }}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold transition text-xs shadow-md shadow-emerald-600/20"
            >
              ACCEPT
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox for Image Preview */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div className="relative max-w-5xl max-h-[90vh]">
            <img
              src={previewImage}
              alt="Preview"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-3 -right-3 p-2 bg-white text-slate-900 rounded-full shadow-lg"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
      {/* Audio Recorder Modal */}
      <AudioRecorderModal
        isOpen={isAudioModalOpen}
        onClose={() => setIsAudioModalOpen(false)}
        noteId={note.id}
        onAudioSaved={(audioUrl, originalName) => {
          if (editor) {
            editor.chain().focus().insertContent(`<p><audio controls src="${audioUrl}"></audio></p>`).run();
          }
        }}
      />

      {/* Share Note Modal */}
      <ShareNoteModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        noteId={note.id}
        noteTitle={title}
      />

      {/* Version History Drawer */}
      <VersionHistoryDrawer
        isOpen={isVersionDrawerOpen}
        onClose={() => setIsVersionDrawerOpen(false)}
        noteId={note.id}
        currentTitle={title}
        currentContent={content}
        onRestore={(restored) => {
          setTitle(restored.title || '');
          setContent(restored.content || '');
          if (editor) {
            editor.commands.setContent(restored.content || '', { emitUpdate: false });
          }
        }}
      />

      {/* Image OCR Modal */}
      <ImageOcrModal
        isOpen={isOcrModalOpen}
        onClose={() => setIsOcrModalOpen(false)}
        onInsertText={(text) => {
          if (editor) {
            editor.chain().focus().insertContent(`<p>${text.replace(/\n/g, '<br/>')}</p>`).run();
          }
        }}
      />

      {/* AI Assistant Modal */}
      <AIAssistantModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        noteTitle={title}
        noteContent={editor ? editor.getHTML() : content}
        onInsertContent={(html) => {
          if (editor) {
            editor.chain().focus().insertContent(html).run();
          }
        }}
      />
    </div>
  );
}
