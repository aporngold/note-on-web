import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import {
  ArrowLeft,
  Save,
  Lock,
  Unlock,
  Pin,
  Trash2,
  Copy,
  Download,
  Printer,
  Eye,
  Edit3,
  Book,
  Tag,
  Palette,
  CheckCircle2,
  RefreshCw,
  Star,
  Paperclip,
  Mic,
  Upload,
  Plus,
  X,
  Maximize2,
  Share2,
  History,
  ScanText,
  Sparkles,
  LayoutGrid,
} from 'lucide-react';
import toast from 'react-hot-toast';
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

import { Note, Notebook, Label, FileAttachment } from '@/types';
import { useNoteStore } from '@/store/noteStore';
import { useAuthStore } from '@/store/authStore';
import { EncryptionService } from '@/utils/encryption';
import MasterPasswordModal from './MasterPasswordModal';
import api from '@/utils/api';
import NoteRichToolbar from './NoteRichToolbar';
import AudioRecorderModal from './AudioRecorderModal';
import NoteAttachmentDrawer from './NoteAttachmentDrawer';
import FullscreenNoteModal from './FullscreenNoteModal';
import ShareNoteModal from './ShareNoteModal';
import VersionHistoryDrawer from './VersionHistoryDrawer';
import ImageOcrModal from './ImageOcrModal';
import AIAssistantModal from './AIAssistantModal';
import ActiveCollaboratorsBar from './ActiveCollaboratorsBar';
import SpeechToTextButton from './SpeechToTextButton';
import { convertLegacyContentToHtml, stripHtmlTags } from '@/utils/editorHelper';

const COLORS = [
  '#6366F1', // Indigo
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#EF4444', // Red
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#06B6D4', // Cyan
  '#3B82F6', // Blue
];

interface NoteEditorProps {
  initialNoteId?: string;
}

export default function NoteEditor({ initialNoteId }: NoteEditorProps) {
  const router = useRouter();
  const { notes, notebooks, labels, boards, activeBoardId, createNote, updateNote, deleteNote, duplicateNote, createLabel } = useNoteStore();
  const { isVaultUnlocked } = useAuthStore();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [boardId, setBoardId] = useState<string | null>(null);
  const [color, setColor] = useState(COLORS[0]);
  const [textColor, setTextColor] = useState('#0F172A');
  const [isLocked, setIsLocked] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);
  const [isAttachmentDrawerOpen, setIsAttachmentDrawerOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isVersionDrawerOpen, setIsVersionDrawerOpen] = useState(false);
  const [isOcrModalOpen, setIsOcrModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isFullscreenModalOpen, setIsFullscreenModalOpen] = useState(false);
  const [activeNoteForModal, setActiveNoteForModal] = useState<Note | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [isBorderless, setIsBorderless] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [notebookId, setNotebookId] = useState<string | null>(null);
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);

  const [isPreview, setIsPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(!initialNoteId);

  const noteIdRef = useRef(initialNoteId);
  noteIdRef.current = initialNoteId;
  const isFirstRender = useRef(true);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // TipTap WYSIWYG Editor Instance
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
        placeholder: 'เริ่มพิมพ์บันทึกของคุณที่นี่... (จัดรูปแบบตัวหนา ตัวเอียง สี หรือหัวข้อได้ทันที)',
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
      setContent(editor.getHTML());
    },
  });

  // Fetch initial note data if editing
  useEffect(() => {
    if (!initialNoteId) return;

    let isMounted = true;
    async function loadNote() {
      try {
        const res = await api.get(`/notes/${initialNoteId}`);
        const n: Note = res.data;
        if (!isMounted) return;

        setTitle(n.title || '');
        setColor(n.color || COLORS[0]);
        setTextColor(n.textColor || '#0F172A');
        setIsLocked(n.isLocked);
        setIsPinned(n.isPinned);
        setIsFavorite(!!n.isFavorite);
        setAttachments(n.attachments || []);
        setNotebookId(n.notebookId || null);
        setSelectedLabelIds(n.labels?.map((l) => l.id) || []);
        if (n.boardId) setBoardId(n.boardId);

        let loadedContent = n.content || '';

        // Decrypt if locked
        if (n.isLocked) {
          if (isVaultUnlocked) {
            try {
              const parsed = JSON.parse(n.content);
              if (parsed.encrypted && parsed.iv) {
                const dec = EncryptionService.getInstance().decrypt(parsed.encrypted, parsed.iv);
                loadedContent = dec;
              }
            } catch (e) {
              // Not JSON encrypted or failed
            }
          } else {
            // Vault locked, prompt user
            setIsVaultModalOpen(true);
          }
        }

        const html = convertLegacyContentToHtml(loadedContent);
        setContent(html);
        if (editor) {
          editor.commands.setContent(html, { emitUpdate: false });
        }

        setIsLoaded(true);
      } catch (error) {
        toast.error('ไม่สามารถโหลดโน้ตได้');
        router.push('/dashboard');
      }
    }

    loadNote();
    return () => {
      isMounted = false;
    };
  }, [initialNoteId, isVaultUnlocked, router, editor]);

  // Sync editor content when loaded
  // Initialize boardId for new notes from active board or query parameter
  useEffect(() => {
    if (!initialNoteId) {
      const qBoardId = (router.query.boardId as string) || activeBoardId || null;
      if (qBoardId) {
        setBoardId(qBoardId);
      }
    }
  }, [initialNoteId, router.query.boardId, activeBoardId]);

  useEffect(() => {
    if (editor && isLoaded && content && editor.isEmpty) {
      editor.commands.setContent(convertLegacyContentToHtml(content), { emitUpdate: false });
    }
  }, [editor, isLoaded]);

  // Handle Vault lock toggle
  const handleLockToggle = () => {
    if (!isLocked) {
      if (!isVaultUnlocked) {
        setIsVaultModalOpen(true);
        return;
      }
      setIsLocked(true);
      toast.success('เปิดระบบป้องกัน E2EE สำหรับโน้ตนี้แล้ว');
    } else {
      setIsLocked(false);
      toast('ยกเลิกการล็อกโน้ตแล้ว', { icon: '🔓' });
    }
  };

  // Explicit Save (Ctrl+S or Save Button)
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const htmlContent = editor ? editor.getHTML() : content;
      let finalContent = htmlContent;
      let iv: string | null = null;
      let salt: string | null = null;

      if (isLocked) {
        if (!isVaultUnlocked) {
          setIsVaultModalOpen(true);
          setIsSaving(false);
          return;
        }
        const encryption = EncryptionService.getInstance();
        const encResult = encryption.encrypt(htmlContent);
        finalContent = JSON.stringify(encResult);
        iv = encResult.iv;
      }

      if (noteIdRef.current) {
        await updateNote(noteIdRef.current, {
          title: title.trim() || 'ไม่มีชื่อบันทึก',
          content: finalContent,
          color,
          textColor,
          isLocked,
          isPinned,
          isFavorite,
          notebookId,
          boardId: boardId || activeBoardId || undefined,
          labelIds: selectedLabelIds,
          iv,
          salt,
        });
        toast.success('บันทึกการเปลี่ยนแปลงแล้ว');
      } else {
        const targetBoardId = boardId || activeBoardId || undefined;
        let initialX: number | undefined;
        let initialY: number | undefined;
        if (targetBoardId) {
          const boardNotes = notes.filter((n) => n.boardId === targetBoardId && !n.isArchived);
          const cols = 3;
          const slot = boardNotes.length;
          const col = slot % cols;
          const row = Math.floor(slot / cols);
          initialX = 24 + col * 320;
          initialY = 24 + row * 320;
        }

        const created = await createNote({
          title: title.trim() || 'ไม่มีชื่อบันทึก',
          content: finalContent,
          color,
          textColor,
          isLocked,
          isPinned,
          isFavorite,
          notebookId,
          boardId: targetBoardId,
          labelIds: selectedLabelIds,
          posX: initialX,
          posY: initialY,
          iv,
          salt,
        });
        noteIdRef.current = created.id;
        toast.success('สร้างโน้ตใหม่สำเร็จ');
        router.replace(`/notes/${created.id}`);
      }
      setLastSaved(new Date().toLocaleTimeString('th-TH'));
    } catch (error: any) {
      toast.error(error.message || 'บันทึกไม่สำเร็จ');
    } finally {
      setIsSaving(false);
    }
  }, [
    editor,
    content,
    isLocked,
    isVaultUnlocked,
    title,
    color,
    textColor,
    isPinned,
    isFavorite,
    notebookId,
    boardId,
    activeBoardId,
    selectedLabelIds,
    updateNote,
    createNote,
    router,
  ]);

  // Debounced Auto-Save
  const triggerAutoSave = useCallback(async () => {
    if (!isLoaded || isSaving || isAutoSaving) return;
    if (isLocked && !isVaultUnlocked) return;
    // Don't auto-save if totally empty
    const currentHtml = editor ? editor.getHTML() : content;
    if (!title.trim() && (!currentHtml || currentHtml === '<p></p>')) return;

    try {
      setIsAutoSaving(true);
      let finalContent = currentHtml;
      let iv: string | null = null;
      let salt: string | null = null;

      if (isLocked) {
        if (!isVaultUnlocked) {
          setIsAutoSaving(false);
          return;
        }
        const encryption = EncryptionService.getInstance();
        const encResult = encryption.encrypt(currentHtml);
        finalContent = JSON.stringify(encResult);
        iv = encResult.iv;
      }

      if (noteIdRef.current) {
        await updateNote(noteIdRef.current, {
          title: title.trim() || 'ไม่มีชื่อบันทึก',
          content: finalContent,
          color,
          textColor,
          isLocked,
          isPinned,
          isFavorite,
          notebookId,
          boardId: boardId || activeBoardId || undefined,
          labelIds: selectedLabelIds,
          iv,
          salt,
        });
      } else {
        const targetBoardId = boardId || activeBoardId || undefined;
        let initialX: number | undefined;
        let initialY: number | undefined;
        if (targetBoardId) {
          const boardNotes = notes.filter((n) => n.boardId === targetBoardId && !n.isArchived);
          const cols = 3;
          const slot = boardNotes.length;
          const col = slot % cols;
          const row = Math.floor(slot / cols);
          initialX = 24 + col * 320;
          initialY = 24 + row * 320;
        }

        const created = await createNote({
          title: title.trim() || 'ไม่มีชื่อบันทึก',
          content: finalContent,
          color,
          textColor,
          isLocked,
          isPinned,
          isFavorite,
          notebookId,
          boardId: targetBoardId,
          labelIds: selectedLabelIds,
          posX: initialX,
          posY: initialY,
          iv,
          salt,
        });
        noteIdRef.current = created.id;
        router.replace(`/notes/${created.id}`, undefined, { shallow: true });
      }
      setLastSaved(new Date().toLocaleTimeString('th-TH'));
    } catch (err) {
      console.error('Auto save error:', err);
    } finally {
      setIsAutoSaving(false);
    }
  }, [
    isLoaded,
    isSaving,
    isAutoSaving,
    isLocked,
    isVaultUnlocked,
    title,
    content,
    editor,
    color,
    textColor,
    isPinned,
    isFavorite,
    notebookId,
    boardId,
    activeBoardId,
    selectedLabelIds,
    updateNote,
    createNote,
    router,
  ]);

  // Debounce Auto Save effect (1.5s after user stops typing)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (!isLoaded) return;

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Auto-save every 15 minutes standard (15 * 60 * 1000 ms)
    const AUTO_SAVE_INTERVAL_MS = 15 * 60 * 1000;
    autoSaveTimerRef.current = setTimeout(() => {
      triggerAutoSave();
    }, AUTO_SAVE_INTERVAL_MS);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [title, content, color, textColor, notebookId, boardId, selectedLabelIds, isPinned, isFavorite, isLoaded, triggerAutoSave]);

  const handleUploadFile = async (file: File) => {
    try {
      let targetNoteId = noteIdRef.current;
      if (!targetNoteId) {
        const currentHtml = editor ? editor.getHTML() : content;
        const created = await createNote({
          title: title.trim() || 'ไม่มีชื่อบันทึก',
          content: currentHtml,
          color,
          textColor,
          isLocked,
          isPinned,
          isFavorite,
          notebookId,
          labelIds: selectedLabelIds,
        });
        noteIdRef.current = created.id;
        targetNoteId = created.id;
        router.replace(`/notes/${created.id}`);
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('noteId', targetNoteId);

      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.attachment) {
        setAttachments((prev) => [...prev, res.data.attachment]);
      }
      toast.success(`แนบไฟล์ ${file.name} สำเร็จ`);
    } catch (err: any) {
      console.error('Upload failed:', err);
      toast.error('อัปโหลดไฟล์ไม่สำเร็จ');
    }
  };

  const handleDeleteAttachment = async (id: string) => {
    try {
      await api.delete(`/upload/attachment/${id}`);
      setAttachments((prev) => prev.filter((a) => a.id !== id));
      toast.success('ลบไฟล์แนบแล้ว');
    } catch (err) {
      toast.error('ลบไฟล์แนบไม่สำเร็จ');
    }
  };

  const handleInsertAttachmentIntoEditor = (att: FileAttachment) => {
    if (!editor) return;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
    const fullUrl = att.url.startsWith('http') ? att.url : `${apiUrl}${att.url}`;

    if (att.mimeType.startsWith('image/')) {
      editor.chain().focus().setImage({ src: fullUrl, alt: att.originalName }).run();
      toast.success('แทรกรูปภาพลงในโน้ตแล้ว');
    } else if (att.mimeType.startsWith('audio/')) {
      editor.chain().focus().insertContent(`<p><audio controls src="${fullUrl}"></audio></p>`).run();
      toast.success('แทรกไฟล์เสียงลงในโน้ตแล้ว');
    } else {
      editor.chain().focus().insertContent(`<p><a href="${fullUrl}" target="_blank" rel="noopener noreferrer">📎 ${att.originalName}</a></p>`).run();
      toast.success('แทรกลิงก์ดาวน์โหลดแล้ว');
    }
    setIsAttachmentDrawerOpen(false);
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
        await handleUploadFile(file);
      }
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    try {
      const tagColors = ['#6366F1', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'];
      const randomColor = tagColors[Math.floor(Math.random() * tagColors.length)];
      const created = await createLabel({ name: newTagName.trim(), color: randomColor });
      setSelectedLabelIds((prev) => [...prev, created.id]);
      setNewTagName('');
      setIsAddingTag(false);
      toast.success(`สร้างป้าย #${created.name} เรียบร้อย`);
    } catch (err) {
      toast.error('สร้างป้ายกำกับไม่สำเร็จ');
    }
  };

  // Keyboard shortcut Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  const handleDelete = async () => {
    if (!initialNoteId) {
      router.push('/dashboard');
      return;
    }
    if (confirm('ย้ายโน้ตนี้ไปยังถังขยะหรือไม่?')) {
      await deleteNote(initialNoteId);
      router.push('/dashboard');
    }
  };

  const handleDuplicate = async () => {
    if (initialNoteId) {
      await duplicateNote(initialNoteId);
      router.push('/dashboard');
    }
  };

  const handleExportMarkdown = () => {
    const filename = `${(title || 'untitled').replace(/[^a-zA-Z0-9ก-๙_-]/g, '_')}.md`;
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
    toast.success(`ดาวน์โหลด ${filename} สำเร็จ`);
  };

  const handlePrint = () => {
    window.print();
  };

  const toggleLabel = (id: string) => {
    if (selectedLabelIds.includes(id)) {
      setSelectedLabelIds(selectedLabelIds.filter((lid) => lid !== id));
    } else {
      setSelectedLabelIds([...selectedLabelIds, id]);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4 pb-12 animate-fade-in">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push('/dashboard')}
            className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            title="กลับไปหน้าหลัก"
          >
            <ArrowLeft size={19} />
          </button>

          {/* Auto-save live indicator */}
          {isAutoSaving ? (
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] text-indigo-600 dark:text-indigo-400 font-medium animate-pulse">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
              กำลังบันทึกอัตโนมัติ...
            </span>
          ) : lastSaved ? (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 size={13} /> บันทึกอัตโนมัติแล้ว: {lastSaved} (ทุก 15 นาที)
            </span>
          ) : (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              บันทึกอัตโนมัติทุก 15 นาที
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Lock / E2EE Button */}
          <button
            onClick={handleLockToggle}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
              isLocked
                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 ring-1 ring-amber-400/50'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title={isLocked ? 'ปลดล็อกหรือจัดการการเข้ารหัส' : 'เปิดการเข้ารหัสลับแบบ E2EE'}
          >
            {isLocked ? <Lock size={14} /> : <Unlock size={14} />}
            <span>{isLocked ? 'ล็อก E2EE' : 'ไม่ล็อก'}</span>
          </button>

          {/* Pin Button */}
          <button
            onClick={() => setIsPinned(!isPinned)}
            className={`p-2 rounded-xl transition ${
              isPinned
                ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 ring-1 ring-indigo-500/20'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title={isPinned ? 'ยกเลิกการปักหมุด' : 'ปักหมุดโน้ตนี้'}
          >
            <Pin size={17} className={isPinned ? 'fill-current' : ''} />
          </button>

          {/* Favorite Button */}
          <button
            onClick={() => setIsFavorite(!isFavorite)}
            className={`p-2 rounded-xl transition ${
              isFavorite
                ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/50 ring-1 ring-amber-500/20'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title={isFavorite ? 'ยกเลิกรายการโปรด' : 'เพิ่มในรายการโปรด (Favorite)'}
          >
            <Star size={17} className={isFavorite ? 'fill-current' : ''} />
          </button>

          {/* Attachment Drawer Toggle */}
          <button
            onClick={() => setIsAttachmentDrawerOpen(true)}
            className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition relative"
            title={`ไฟล์แนบ (${attachments.length} รายการ)`}
          >
            <Paperclip size={17} />
            {attachments.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-indigo-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                {attachments.length}
              </span>
            )}
          </button>

          {/* Voice Memo Button */}
          <button
            onClick={() => setIsAudioModalOpen(true)}
            className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-xl transition"
            title="อัดเสียงพูด (Voice Memo)"
          >
            <Mic size={17} />
          </button>

          {/* Speech-to-Text Live Dictation */}
          <SpeechToTextButton editor={editor || null} />

          {/* OCR Image Button */}
          <button
            onClick={() => setIsOcrModalOpen(true)}
            className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-xl transition flex items-center gap-1 text-xs font-semibold"
            title="สแกนข้อความจากรูปภาพ (Free OCR)"
          >
            <ScanText size={17} />
            <span className="hidden md:inline">OCR</span>
          </button>

          {/* AI Assistant Button */}
          <button
            onClick={() => setIsAiModalOpen(true)}
            className="px-2.5 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl transition flex items-center gap-1 text-xs font-bold shadow-sm"
            title="ผู้ช่วย AI สรุปและเรียบเรียง (ฟรี 100%)"
          >
            <Sparkles size={14} />
            <span className="hidden md:inline">AI ผู้ช่วย</span>
          </button>

          {/* Version History Button */}
          {initialNoteId && (
            <button
              onClick={() => setIsVersionDrawerOpen(true)}
              className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
              title="ประวัติเวอร์ชัน (Version History)"
            >
              <History size={17} />
            </button>
          )}

          {/* Share Button */}
          {initialNoteId && (
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
              title="แชร์โน้ตนี้"
            >
              <Share2 size={17} />
            </button>
          )}

          {/* Active Collaborators presence */}
          {initialNoteId && <ActiveCollaboratorsBar noteId={initialNoteId} />}

          {/* Preview Toggle */}
          <button
            onClick={() => setIsPreview(!isPreview)}
            className={`p-2 rounded-xl transition flex items-center gap-1.5 text-xs font-semibold ${
              isPreview
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200 dark:shadow-none'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title={isPreview ? 'แก้ไขเนื้อหา' : 'ดูตัวอย่าง'}
          >
            {isPreview ? <Edit3 size={15} /> : <Eye size={15} />}
            <span className="hidden sm:inline">{isPreview ? 'แก้ไข' : 'ดูตัวอย่าง'}</span>
          </button>

          {/* Duplicate Button */}
          {initialNoteId && (
            <button
              onClick={handleDuplicate}
              className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
              title="คัดลอกโน้ตนี้"
            >
              <Copy size={17} />
            </button>
          )}

          {/* Delete Button */}
          {initialNoteId && (
            <button
              onClick={handleDelete}
              className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition"
              title="ลบโน้ตนี้"
            >
              <Trash2 size={17} />
            </button>
          )}

          {/* Fullscreen Focus Modal (เหมือนหน้าคัมบัง) */}
          <button
            onClick={async () => {
              if (initialNoteId) {
                setActiveNoteForModal({
                  id: initialNoteId,
                  title,
                  content: editor ? editor.getHTML() : content,
                  color,
                  textColor,
                  fontFamily: 'sans',
                  fontSize: 'normal',
                  isPinned,
                  isFavorite,
                  isLocked,
                  isArchived: false,
                  attachments,
                  notebookId,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                });
                setIsFullscreenModalOpen(true);
              } else {
                try {
                  const newNote = await createNote({
                    title: title || 'โน้ตใหม่',
                    content: editor ? editor.getHTML() : content,
                    color,
                    textColor,
                    fontFamily: 'sans',
                    fontSize: 'normal',
                    notebookId: notebookId || undefined,
                    boardId: boardId || activeBoardId || undefined,
                    isPinned,
                    isFavorite,
                    isLocked,
                  });
                  if (newNote?.id) {
                    router.replace(`/notes/${newNote.id}`);
                    setActiveNoteForModal(newNote);
                    setIsFullscreenModalOpen(true);
                  }
                } catch (err) {
                  toast.error('ไม่สามารถเปิดโหมดเต็มจอได้');
                }
              }
            }}
            className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl transition flex items-center gap-1.5 font-bold text-xs shadow-md shadow-indigo-500/20 active:scale-95"
            title="เปิดแก้ไขแบบเต็มจอ (เหมือนหน้าคัมบัง)"
          >
            <Maximize2 size={15} />
            <span>เต็มจอ</span>
          </button>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="ml-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-md shadow-indigo-200 dark:shadow-none transition active:scale-95 disabled:opacity-50"
          >
            <Save size={16} />
            <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึก'}</span>
          </button>
        </div>
      </div>

      {/* Metadata Bar (Notebook, Board, Color, Labels) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Notebook Selector */}
            <div className="flex items-center gap-2">
              <Book size={16} className="text-slate-400" />
              <span className="text-xs font-semibold text-slate-500">สมุดบันทึก:</span>
              <select
                value={notebookId || ''}
                onChange={(e) => setNotebookId(e.target.value || null)}
                className="text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border-none rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="">(ไม่มีสมุดบันทึก)</option>
                {notebooks.map((nb) => (
                  <option key={nb.id} value={nb.id}>
                    {nb.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Board Selector */}
            <div className="flex items-center gap-2">
              <LayoutGrid size={16} className="text-slate-400" />
              <span className="text-xs font-semibold text-slate-500">กระดาน (Board):</span>
              <select
                value={boardId || ''}
                onChange={(e) => setBoardId(e.target.value || null)}
                className="text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border-none rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="">(ไม่ระบุบอร์ด / ทั่วไป)</option>
                {boards.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} {b.isDefault ? '(บอร์ดเริ่มต้น)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Color Picker Swatches */}
          <div className="flex items-center gap-2">
            <Palette size={16} className="text-slate-400" />
            <span className="text-xs font-semibold text-slate-500">สีขอบ:</span>
            <div className="flex items-center gap-1.5">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-5 h-5 rounded-full transition ${
                    color === c ? 'scale-125 ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Labels multi-selector with Add Tag button */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex-wrap">
          <Tag size={15} className="text-slate-400" />
          <span className="text-xs font-semibold text-slate-500">ป้ายกำกับ:</span>
          <div className="flex gap-1.5 flex-wrap items-center">
            {labels.map((lbl) => {
              const isSelected = selectedLabelIds.includes(lbl.id);
              return (
                <button
                  key={lbl.id}
                  type="button"
                  onClick={() => toggleLabel(lbl.id)}
                  className={`text-[11px] font-medium px-2.5 py-1 rounded-lg transition ${
                    isSelected ? 'ring-1 font-bold shadow-xs' : 'opacity-50 hover:opacity-80'
                  }`}
                  style={{
                    backgroundColor: `${lbl.color}20`,
                    color: lbl.color,
                    borderColor: isSelected ? lbl.color : 'transparent',
                  }}
                >
                  #{lbl.name}
                </button>
              );
            })}

            {isAddingTag ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  placeholder="ชื่อป้าย..."
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCreateTag();
                    }
                  }}
                  className="px-2 py-0.5 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-24"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleCreateTag}
                  className="p-1 rounded bg-indigo-600 text-white text-[10px] font-bold"
                >
                  เพิ่ม
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingTag(false);
                    setNewTagName('');
                  }}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsAddingTag(true)}
                className="text-[11px] font-semibold px-2 py-1 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-400 text-slate-500 hover:text-indigo-600 transition flex items-center gap-1"
              >
                <Plus size={12} />
                <span>สร้างป้ายใหม่</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Editor Body with Drag & Drop */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden flex flex-col min-h-[550px] transition-all ${
          isDraggingOver ? 'dropzone-active ring-4 ring-indigo-500/30' : ''
        }`}
        style={{ borderTop: `6px solid ${color}` }}
      >
        {isDraggingOver && (
          <div className="absolute inset-0 z-40 bg-indigo-50/90 dark:bg-slate-900/90 backdrop-blur-xs border-2 border-dashed border-indigo-500 rounded-3xl flex flex-col items-center justify-center text-indigo-600 dark:text-indigo-400 pointer-events-none animate-fade-in">
            <Upload size={44} className="animate-bounce mb-2" />
            <p className="font-bold text-base">ปล่อยไฟล์ที่นี่เพื่อแนบหรือแทรกลงในโน้ต</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">รองรับรูปภาพ, เสียง, เอกสาร PDF, ZIP ฯลฯ</p>
          </div>
        )}
        {/* Title Input */}
        <div className="p-6 pb-3 border-b border-slate-100 dark:border-slate-800/80">
          <input
            type="text"
            placeholder="ชื่อเรื่องโน้ต..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white bg-transparent placeholder-slate-300 dark:placeholder-slate-600 focus:outline-none tracking-tight"
          />
        </div>

        {/* Rich Note Toolbar */}
        <NoteRichToolbar
          content={content}
          onContentChange={(newContent) => {
            setContent(newContent);
            if (editor && editor.getHTML() !== newContent) {
              editor.commands.setContent(newContent, { emitUpdate: false });
            }
          }}
          editor={editor}
          color={color}
          onColorChange={(newColor) => setColor(newColor)}
          textColor={textColor}
          onTextColorChange={(newTc) => setTextColor(newTc)}
          isPinned={isPinned}
          onTogglePin={() => setIsPinned(!isPinned)}
          isBorderless={isBorderless}
          onToggleBorderless={() => setIsBorderless(!isBorderless)}
          zoomLevel={zoomLevel}
          onZoomChange={(z) => setZoomLevel(z)}
          onRecordAudio={() => setIsAudioModalOpen(true)}
          onAttachFile={() => setIsAttachmentDrawerOpen(true)}
          attachmentsCount={attachments.length}
          onCopyNote={() => {
            const fullText = `${title}\n\n${editor ? editor.getText() : stripHtmlTags(content)}`;
            navigator.clipboard.writeText(fullText);
            toast.success('คัดลอกข้อความโน้ตแล้ว');
          }}
          onDownloadTxt={() => {
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
          }}
          onDownloadMd={handleExportMarkdown}
          onPrint={handlePrint}
          onShare={() => {
            const textContent = editor ? editor.getText() : stripHtmlTags(content);
            if (typeof navigator !== 'undefined' && navigator.share) {
              navigator.share({ title, text: textContent }).catch(() => {});
            } else {
              const fullText = `${title}\n\n${textContent}`;
              navigator.clipboard.writeText(fullText);
              toast.success('คัดลอกข้อความโน้ตแล้ว');
            }
          }}
          onDelete={handleDelete}
          onCancel={() => router.push('/dashboard')}
          onAccept={handleSave}
          isSaving={isSaving}
        />

        {/* Content Area (TipTap Editor / Preview) */}
        <div className="flex-1 p-6 flex flex-col">
          {isPreview ? (
            <div
              className="prose dark:prose-invert max-w-none flex-1 text-slate-800 dark:text-slate-200 text-sm leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: content || '<p class="text-slate-400 italic">ไม่มีเนื้อหา...</p>',
              }}
            />
          ) : (
            <div
              className="flex-1 min-h-[420px] cursor-text text-sm sm:text-base leading-relaxed font-sans"
              onClick={() => {
                if (editor && !editor.isFocused) {
                  editor.commands.focus();
                }
              }}
              style={{
                color: textColor,
                fontSize: zoomLevel !== 100 ? `${Math.max(12, Math.round(16 * (zoomLevel / 100)))}px` : undefined,
              }}
            >
              <EditorContent editor={editor} />
            </div>
          )}
        </div>
      </div>

      <MasterPasswordModal
        isOpen={isVaultModalOpen}
        onClose={() => setIsVaultModalOpen(false)}
        onSuccess={() => {
          // Decrypt if locked
          if (content) {
            try {
              const parsed = JSON.parse(content);
              if (parsed.encrypted && parsed.iv) {
                const dec = EncryptionService.getInstance().decrypt(parsed.encrypted, parsed.iv);
                const html = convertLegacyContentToHtml(dec);
                setContent(html);
                if (editor) {
                  editor.commands.setContent(html, { emitUpdate: false });
                }
              }
            } catch (e) {
              // ignore
            }
          }
        }}
      />
      {/* Audio Recorder Modal */}
      <AudioRecorderModal
        isOpen={isAudioModalOpen}
        onClose={() => setIsAudioModalOpen(false)}
        noteId={noteIdRef.current}
        onAudioSaved={(audioUrl, originalName) => {
          if (editor) {
            editor.chain().focus().insertContent(`<p><audio controls src="${audioUrl}"></audio></p>`).run();
          }
          if (noteIdRef.current) {
            api.get(`/notes/${noteIdRef.current}`).then((res) => {
              if (res.data.attachments) setAttachments(res.data.attachments);
            });
          }
        }}
      />

      {/* Attachment Drawer */}
      <NoteAttachmentDrawer
        isOpen={isAttachmentDrawerOpen}
        onClose={() => setIsAttachmentDrawerOpen(false)}
        noteId={noteIdRef.current}
        attachments={attachments}
        onUploadFile={handleUploadFile}
        onDeleteAttachment={handleDeleteAttachment}
        onInsertIntoEditor={handleInsertAttachmentIntoEditor}
      />

      {/* Fullscreen Note Focus Modal (เหมือนหน้าคัมบัง) */}
      {isFullscreenModalOpen && activeNoteForModal && (
        <FullscreenNoteModal
          note={activeNoteForModal}
          isOpen={isFullscreenModalOpen}
          onClose={async () => {
            setIsFullscreenModalOpen(false);
            setActiveNoteForModal(null);
            const targetId = initialNoteId || activeNoteForModal?.id;
            if (targetId) {
              try {
                const res = await api.get(`/notes/${targetId}`);
                if (res.data) {
                  const n = res.data;
                  setTitle(n.title || '');
                  setColor(n.color || COLORS[0]);
                  setTextColor(n.textColor || '#0F172A');
                  setIsPinned(n.isPinned);
                  setIsFavorite(!!n.isFavorite);
                  setAttachments(n.attachments || []);
                  const updatedHtml = convertLegacyContentToHtml(n.content || '');
                  setContent(updatedHtml);
                  if (editor) {
                    editor.commands.setContent(updatedHtml, { emitUpdate: false });
                  }
                }
              } catch (e) {
                // ignore
              }
            }
          }}
        />
      )}

      {/* Share Note Modal */}
      {initialNoteId && (
        <ShareNoteModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          noteId={initialNoteId}
          noteTitle={title}
        />
      )}

      {/* Version History Drawer */}
      {initialNoteId && (
        <VersionHistoryDrawer
          isOpen={isVersionDrawerOpen}
          onClose={() => setIsVersionDrawerOpen(false)}
          noteId={initialNoteId}
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
      )}

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
        onInsertContent={(html, mode = 'insert') => {
          if (editor) {
            if (mode === 'replace') {
              editor.commands.setContent(html);
            } else {
              editor.chain().focus().insertContent(html).run();
            }
          }
        }}
      />
    </div>
  );
}
