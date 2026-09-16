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
  CopyPlus,
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
  Pipette,
  Mic,
  AudioLines,
  Upload,
  Plus,
  X,
  Check,
  Maximize2,
  Share2,
  History,
  ScanText,
  Sparkles,
  LayoutGrid,
  MoreHorizontal,
  Search,
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
import { ResizableImageExtension, AudioExtension } from './editorExtensions';

import { Note, Notebook, Label, FileAttachment } from '@/types';
import { useNoteStore } from '@/store/noteStore';
import { useAuthStore } from '@/store/authStore';
import { EncryptionService } from '@/utils/encryption';
import MasterPasswordModal from './MasterPasswordModal';
import api from '@/utils/api';
import NoteRichToolbar from './NoteRichToolbar';
import MobileEditorToolbar from './MobileEditorToolbar';
import BottomSheet from '../ui/BottomSheet';
import AudioRecorderModal from './AudioRecorderModal';
import NoteAttachmentDrawer from './NoteAttachmentDrawer';
import FullscreenNoteModal from './FullscreenNoteModal';
import ShareNoteModal from './ShareNoteModal';
import VersionHistoryDrawer from './VersionHistoryDrawer';
import ImageOcrModal from './ImageOcrModal';
import AIAssistantModal from './AIAssistantModal';
import ActiveCollaboratorsBar from './ActiveCollaboratorsBar';
import SpeechToTextButton, { stopGlobalSpeechToText } from './SpeechToTextButton';
import { convertLegacyContentToHtml, stripHtmlTags } from '@/utils/editorHelper';

export const PASTEL_NOTE_COLORS = [
  '#FEF08A', // Yellow (Classic)
  '#FBCFE8', // Soft Pink
  '#BBF7D0', // Mint Green
  '#BAE6FD', // Soft Sky Blue
  '#FED7AA', // Peach / Soft Orange
  '#E9D5FF', // Soft Lavender
  '#FEF3C7', // Warm Vanilla
  '#CFFAFE', // Ice Blue
];

export const getRandomNoteColor = (): string => {
  return PASTEL_NOTE_COLORS[Math.floor(Math.random() * PASTEL_NOTE_COLORS.length)];
};

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
  const { notes, fetchNotes, notebooks, labels, boards, activeBoardId, createNote, updateNote, deleteNote, duplicateNote, createLabel } = useNoteStore();
  const { isVaultUnlocked } = useAuthStore();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [boardId, setBoardId] = useState<string | null>(null);
  const [color, setColor] = useState(() => getRandomNoteColor());
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
  const [pendingLockAction, setPendingLockAction] = useState<'lock' | 'unlock' | null>(null);
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [mobileSearchQuery, setMobileSearchQuery] = useState('');
  const [isTagMenuOpen, setIsTagMenuOpen] = useState(false);
  const tagDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(e.target as Node)) {
        setIsTagMenuOpen(false);
      }
    };
    if (isTagMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isTagMenuOpen]);

  const [isPreview, setIsPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(!initialNoteId);

  const noteIdRef = useRef(initialNoteId);
  useEffect(() => {
    if (initialNoteId) {
      noteIdRef.current = initialNoteId;
    }
  }, [initialNoteId]);
  const hasUnsavedChangesRef = useRef(false);
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
      ResizableImageExtension.configure({
        inline: false,
        allowBase64: true,
      }),
      AudioExtension,
    ],
    content: '',
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      setContent(editor.getHTML());
      hasUnsavedChangesRef.current = true;
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
                const dec = EncryptionService.getInstance().decrypt(parsed.encrypted, parsed.iv, n.salt || undefined);
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
        hasUnsavedChangesRef.current = false;
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

  // Ensure notes are fetched so slot calculation accurately avoids any collision
  useEffect(() => {
    fetchNotes({ isArchived: false });
  }, [fetchNotes]);

  // Clean up any active speech recognition when leaving or unmounting the note editor
  useEffect(() => {
    return () => {
      stopGlobalSpeechToText(false);
    };
  }, []);

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

  // Helper to find next neat grid slot on the board to avoid overlapping (Matches StickyBoard.tsx 100%)
  const calculateInitialSlot = useCallback((boardIdToUse?: string | null) => {
    const targetBoardId = boardIdToUse || boards.find((b) => b.isDefault)?.id || boards[0]?.id || undefined;
    const relevantNotes = notes.filter((n) => (!targetBoardId || n.boardId === targetBoardId) && !n.isArchived);
    const cols = 7;
    const spacingX = 285;
    const spacingY = 295;
    const startX = 16;
    const startY = 16;

    for (let slot = 0; slot < relevantNotes.length + 100; slot++) {
      const c = slot % cols;
      const r = Math.floor(slot / cols);
      const candX = startX + c * spacingX;
      const candY = startY + r * spacingY;
      const isTaken = relevantNotes.some((n) => {
        const nx = n.posX ?? startX;
        const ny = n.posY ?? startY;
        const nw = n.width ?? 260;
        const nh = n.height ?? 260;
        return (
          candX < nx + nw + 16 &&
          candX + 260 + 16 > nx &&
          candY < ny + nh + 16 &&
          candY + 260 + 16 > ny
        );
      });
      if (!isTaken) {
        return { x: candX, y: candY, boardId: targetBoardId };
      }
    }
    return { x: startX, y: startY, boardId: targetBoardId };
  }, [notes, boards]);

  // Handle Vault lock toggle
  const handleLockToggle = () => {
    const isReady = isVaultUnlocked && EncryptionService.getInstance().isUnlocked();
    if (!isReady) {
      setPendingLockAction(isLocked ? 'unlock' : 'lock');
      setIsVaultModalOpen(true);
      return;
    }

    if (isLocked) {
      setIsLocked(false);
      toast('ปลดล็อกโน้ตแล้ว (ยกเลิกการเข้ารหัส E2EE)', { icon: '🔓' });
    } else {
      setIsLocked(true);
      toast.success('เปิดระบบป้องกัน E2EE สำหรับโน้ตนี้แล้ว');
    }
  };

  // Explicit Save (Ctrl+S or Save Button)
  const handleSave = useCallback(async (isClosing = false) => {
    stopGlobalSpeechToText(false);
    setIsSaving(true);
    try {
      const htmlContent = editor ? editor.getHTML() : content;
      let finalContent = htmlContent;
      let iv: string | null = null;
      let salt: string | null = null;

      if (isLocked) {
        if (!isVaultUnlocked || !EncryptionService.getInstance().isUnlocked()) {
          setPendingLockAction('lock');
          setIsVaultModalOpen(true);
          setIsSaving(false);
          return false;
        }
        const encResult = EncryptionService.getInstance().encrypt(htmlContent);
        finalContent = JSON.stringify(encResult);
        iv = encResult.iv;
        salt = encResult.salt;
      }

      const trimmedTitle = title.trim();
      const saveTitle = trimmedTitle || '';

      if (noteIdRef.current) {
        await updateNote(noteIdRef.current, {
          title: saveTitle,
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
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('secure_note_focus_note_id', noteIdRef.current);
        }
        hasUnsavedChangesRef.current = false;
        toast.success('บันทึกการเปลี่ยนแปลงแล้ว');
      } else {
        const slot = calculateInitialSlot(boardId || activeBoardId);

        const created = await createNote({
          title: saveTitle,
          content: finalContent,
          color,
          textColor,
          isLocked,
          isPinned,
          isFavorite,
          notebookId,
          boardId: slot.boardId,
          labelIds: selectedLabelIds,
          posX: slot.x,
          posY: slot.y,
          iv,
          salt,
        });
        noteIdRef.current = created.id;
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('secure_note_focus_note_id', created.id);
        }
        hasUnsavedChangesRef.current = false;
        toast.success('สร้างโน้ตใหม่สำเร็จ');
        if (!isClosing) {
          router.replace(`/notes/${created.id}`);
        }
      }
      setLastSaved(new Date().toLocaleTimeString('th-TH'));
      return true;
    } catch (error: any) {
      toast.error(error.message || 'บันทึกไม่สำเร็จ');
      return false;
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
    calculateInitialSlot,
  ]);

  // Safe Close handler that ensures auto-save before navigating back
  const handleClose = useCallback(async () => {
    stopGlobalSpeechToText(false);
    const currentHtml = editor ? editor.getHTML() : content;
    const cleanText = stripHtmlTags(currentHtml).trim();
    const hasMedia = (currentHtml && (currentHtml.includes('<img') || currentHtml.includes('<audio'))) || attachments.length > 0;
    const hasContent = Boolean(title.trim() || cleanText || hasMedia);

    // If completely empty and this is an unsaved new note, don't create an empty note
    if (!hasContent && !noteIdRef.current) {
      router.push('/dashboard');
      return;
    }

    // Only save if there are actual unsaved changes and not already saving
    if (hasContent && hasUnsavedChangesRef.current && !isSaving) {
      try {
        await handleSave(true);
      } catch (e) {
        console.error('Save on close error:', e);
      }
    }
    router.push('/dashboard');
  }, [editor, content, title, attachments.length, isSaving, handleSave, router]);

  // Debounced Auto-Save
  const triggerAutoSave = useCallback(async () => {
    if (!isLoaded || isSaving || isAutoSaving) return;
    if (isLocked && !isVaultUnlocked) return;
    // Don't auto-save if totally empty
    const currentHtml = editor ? editor.getHTML() : content;
    const cleanText = stripHtmlTags(currentHtml).trim();
    const hasMedia = (currentHtml && (currentHtml.includes('<img') || currentHtml.includes('<audio'))) || attachments.length > 0;
    if (!title.trim() && !cleanText && !hasMedia) return;

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
        salt = encResult.salt;
      }

      const trimmedTitle = title.trim();
      const saveTitle = trimmedTitle || '';

      if (noteIdRef.current) {
        await updateNote(noteIdRef.current, {
          title: saveTitle,
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
        hasUnsavedChangesRef.current = false;
      } else {
        const slot = calculateInitialSlot(boardId || activeBoardId);
        const created = await createNote({
          title: saveTitle,
          content: finalContent,
          color,
          textColor,
          isLocked,
          isPinned,
          isFavorite,
          notebookId,
          boardId: slot.boardId,
          labelIds: selectedLabelIds,
          posX: slot.x,
          posY: slot.y,
          iv,
          salt,
        });
        noteIdRef.current = created.id;
        hasUnsavedChangesRef.current = false;
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
          title: title.trim() || '',
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
      await deleteNote(initialNoteId, {
        id: initialNoteId,
        title,
        content: editor ? editor.getHTML() : content,
        color,
        textColor,
        notebookId,
        boardId,
        isPinned,
        isLocked,
        isArchived: true,
      });
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

  const handleOpenFullscreen = async () => {
    if (typeof document !== 'undefined' && !document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => { });
    }

    const currentHtml = editor ? editor.getHTML() : content;
    const currentNoteId = noteIdRef.current || initialNoteId;

    if (currentNoteId) {
      setActiveNoteForModal({
        id: currentNoteId,
        title,
        content: currentHtml,
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
          content: currentHtml,
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
          noteIdRef.current = newNote.id;
          if (typeof window !== 'undefined') {
            window.history.replaceState(null, '', `/notes/${newNote.id}`);
          }
          setActiveNoteForModal(newNote);
          setIsFullscreenModalOpen(true);
        }
      } catch (err) {
        toast.error('ไม่สามารถเปิดโหมดเต็มจอได้');
      }
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
    <div className="w-full max-w-6xl xl:max-w-7xl 2xl:max-w-[1440px] mx-auto h-full flex flex-col lg:space-y-1.5 lg:pb-3 animate-fade-in transition-all duration-300">
      {/* Mobile Compact Top Bar (GEMINI.md STEP 3) */}
      <div className="flex lg:hidden items-center justify-between gap-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-3 py-2 z-10 shrink-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 -ml-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-100 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0"
            title="กลับไปหน้าหลัก"
            aria-label="กลับ"
          >
            <ArrowLeft size={20} />
          </button>

          {/* Quick Notebook Selector Pill */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl px-2 py-1 gap-1 min-w-0 max-w-[140px] sm:max-w-[200px]">
            <Book size={13} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
            <select
              value={notebookId || ''}
              onChange={(e) => setNotebookId(e.target.value || null)}
              className="text-xs font-semibold text-slate-700 dark:text-slate-200 bg-transparent border-none p-0 focus:ring-0 outline-none w-full truncate cursor-pointer"
              title="เลือกสมุดบันทึก"
            >
              <option value="" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">(ไม่มีสมุด)</option>
              {notebooks.map((nb) => (
                <option key={nb.id} value={nb.id} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                  {nb.name}
                </option>
              ))}
            </select>
          </div>

          {/* Live Auto-save status indicator */}
          <div className="flex items-center shrink-0">
            {isAutoSaving ? (
              <span className="flex items-center gap-1 text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                <span className="hidden xs:inline">บันทึก...</span>
              </span>
            ) : lastSaved ? (
              <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium" title={`บันทึกแล้ว: ${lastSaved}`}>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="hidden xs:inline">บันทึกแล้ว</span>
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* In-Note Search Toggle */}
          <button
            type="button"
            onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
            className={`p-2 rounded-xl transition ${isMobileSearchOpen
                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            title="ค้นหาข้อความในโน้ต"
            aria-label="ค้นหา"
          >
            <Search size={18} />
          </button>

          {/* Quick Save (Icon-only) */}
          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={isSaving}
            className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center shadow-sm transition active:scale-95 disabled:opacity-50"
            title={isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
            aria-label="บันทึก"
          >
            <Save size={16} />
          </button>

          {/* More Options Sheet Trigger */}
          <button
            type="button"
            onClick={() => setIsMobileMoreOpen(true)}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            title="เครื่องมือและการตั้งค่าเพิ่มเติม"
            aria-label="เครื่องมือเพิ่มเติม"
          >
            <MoreHorizontal size={20} />
          </button>

          {/* Close / Cancel Button */}
          <button
            type="button"
            onClick={handleClose}
            className="p-2 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            title="ปิด / ยกเลิก (Close)"
            aria-label="ปิดโน้ต"
          >
            <X size={19} />
          </button>
        </div>
      </div>

      {/* Mobile Search Bar (Collapsible) */}
      {isMobileSearchOpen && (
        <div className="flex lg:hidden items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 shrink-0">
          <Search size={16} className="text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="ค้นหาข้อความในโน้ต..."
            value={mobileSearchQuery}
            onChange={(e) => setMobileSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-xs text-slate-900 dark:text-white outline-none"
            autoFocus
          />
          {mobileSearchQuery && (
            <button
              onClick={() => setMobileSearchQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              ✕
            </button>
          )}
          <button
            onClick={() => setIsMobileSearchOpen(false)}
            className="text-xs text-indigo-600 font-semibold px-1"
          >
            ปิด
          </button>
        </div>
      )}



      {/* Editor Body with Drag & Drop */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-x-0 border-b-0 lg:border border-slate-200/80 dark:border-slate-800 rounded-none lg:rounded-3xl shadow-none lg:shadow-sm overflow-hidden flex flex-col flex-1 min-h-0 lg:min-h-[550px] transition-colors duration-200 ${isDraggingOver ? 'dropzone-active ring-4 ring-indigo-500/30' : ''
          }`}
        style={{
          backgroundColor: color || '#FFFFFF',
          borderTop: isBorderless ? 'none' : `6px solid ${color || '#FEF08A'}`,
        }}
      >
        {isDraggingOver && (
          <div className="absolute inset-0 z-40 bg-indigo-50/90 dark:bg-slate-900/90 backdrop-blur-xs border-2 border-dashed border-indigo-500 rounded-3xl flex flex-col items-center justify-center text-indigo-600 dark:text-indigo-400 pointer-events-none animate-fade-in">
            <Upload size={44} className="animate-bounce mb-2" />
            <p className="font-bold text-base">ปล่อยไฟล์ที่นี่เพื่อแนบหรือแทรกลงในโน้ต</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">รองรับรูปภาพ, เสียง, เอกสาร PDF, ZIP ฯลฯ</p>
          </div>
        )}

        {/* Title & Metadata Row (Desktop combines Title + Metadata in one unified row; Mobile keeps clean full-width Title) */}
        <div className="px-4 py-2.5 sm:px-6 sm:py-2.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shrink-0 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
          <input
            type="text"
            placeholder="ชื่อเรื่องโน้ต..."
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              hasUnsavedChangesRef.current = true;
            }}
            className="w-full lg:flex-1 text-lg sm:text-xl font-bold bg-transparent text-slate-900 dark:text-white placeholder-slate-400/80 dark:placeholder-slate-500 focus:outline-none tracking-tight min-w-0"
          />

          {/* Desktop-Only Compact Metadata Pills (Embedded in Title Row) */}
          <div className="hidden lg:flex items-center gap-2 shrink-0">
            {/* Notebook Pill Dropdown */}
            <div className="flex items-center bg-slate-100/90 dark:bg-slate-800/90 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 rounded-xl px-2.5 py-1 gap-1.5 transition border border-slate-200/60 dark:border-slate-700/60 max-w-[170px]" title="สมุดบันทึก">
              <Book size={13} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
              <select
                value={notebookId || ''}
                onChange={(e) => setNotebookId(e.target.value || null)}
                className="text-xs font-semibold text-slate-700 dark:text-slate-200 bg-transparent border-none p-0 focus:ring-0 outline-none w-full truncate cursor-pointer"
                title="เลือกสมุดบันทึก"
              >
                <option value="" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">(ไม่มีสมุดบันทึก)</option>
                {notebooks.map((nb) => (
                  <option key={nb.id} value={nb.id} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                    {nb.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Board Pill Dropdown */}
            <div className="flex items-center bg-slate-100/90 dark:bg-slate-800/90 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 rounded-xl px-2.5 py-1 gap-1.5 transition border border-slate-200/60 dark:border-slate-700/60 max-w-[180px]" title="กระดาน (Board)">
              <LayoutGrid size={13} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
              <select
                value={boardId || ''}
                onChange={(e) => setBoardId(e.target.value || null)}
                className="text-xs font-semibold text-slate-700 dark:text-slate-200 bg-transparent border-none p-0 focus:ring-0 outline-none w-full truncate cursor-pointer"
                title="เลือกกระดาน (Board)"
              >
                <option value="" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">(ไม่ระบุบอร์ด / ทั่วไป)</option>
                {boards.map((b) => (
                  <option key={b.id} value={b.id} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                    {b.name} {b.isDefault ? '(เริ่มต้น)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Tags Dropdown Popover */}
            <div className="relative" ref={tagDropdownRef}>
              <button
                type="button"
                onClick={() => setIsTagMenuOpen(!isTagMenuOpen)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold transition border ${selectedLabelIds.length > 0
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 shadow-2xs'
                    : 'bg-slate-100/90 dark:bg-slate-800/90 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 border-slate-200/60 dark:border-slate-700/60'
                  }`}
                title="จัดการป้ายกำกับ (Tags)"
              >
                <Tag size={13} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>{selectedLabelIds.length > 0 ? `ป้าย (${selectedLabelIds.length})` : 'ป้ายกำกับ'}</span>
              </button>

              {/* Tags Popover Panel */}
              {isTagMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-3 z-50 animate-fade-in space-y-2.5">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                      <Tag size={13} className="text-indigo-600 dark:text-indigo-400" />
                      เลือกป้ายกำกับ
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsTagMenuOpen(false)}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition"
                    >
                      <X size={13} />
                    </button>
                  </div>

                  {/* Label items list */}
                  <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                    {labels.length === 0 ? (
                      <p className="text-xs text-slate-400 py-1">ยังไม่มีป้ายกำกับ</p>
                    ) : (
                      labels.map((lbl) => {
                        const isSelected = selectedLabelIds.includes(lbl.id);
                        return (
                          <button
                            key={lbl.id}
                            type="button"
                            onClick={() => toggleLabel(lbl.id)}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition ${isSelected
                                ? 'bg-slate-100 dark:bg-slate-800 font-semibold'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                              }`}
                          >
                            <span className="flex items-center gap-2 truncate mr-2">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: lbl.color }}
                              />
                              <span className="text-slate-800 dark:text-slate-200 truncate">#{lbl.name}</span>
                            </span>
                            {isSelected && <Check size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0" />}
                          </button>
                        );
                      })
                    )}
                  </div>

                  {/* Add new tag form */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    {isAddingTag ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          placeholder="ชื่อป้ายใหม่..."
                          value={newTagName}
                          onChange={(e) => setNewTagName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleCreateTag();
                            }
                          }}
                          className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={handleCreateTag}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition shrink-0"
                        >
                          เพิ่ม
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingTag(false);
                            setNewTagName('');
                          }}
                          className="p-1 text-slate-400 hover:text-slate-600 shrink-0"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsAddingTag(true)}
                        className="w-full text-xs font-semibold py-1.5 px-2 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-400 text-slate-500 hover:text-indigo-600 transition flex items-center justify-center gap-1.5"
                      >
                        <Plus size={13} />
                        <span>สร้างป้ายใหม่</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Desktop Full Toolbar (Unified with Top Action Bar) */}
        <div className="hidden lg:block">
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
            isLocked={isLocked}
            onToggleLock={handleLockToggle}
            isFavorite={isFavorite}
            onToggleFavorite={() => setIsFavorite(!isFavorite)}
            isBorderless={isBorderless}
            onToggleBorderless={() => setIsBorderless(!isBorderless)}
            zoomLevel={zoomLevel}
            onZoomChange={(z) => setZoomLevel(z)}
            onBack={handleClose}
            onCancel={handleClose}
            onAccept={() => handleSave(false)}
            isSaving={isSaving}
            attachmentsCount={attachments.length}
            onAttachFile={() => setIsAttachmentDrawerOpen(true)}
            onRecordAudio={() => setIsAudioModalOpen(true)}
            showSpeechToText={true}
            onOpenOcr={() => setIsOcrModalOpen(true)}
            onOpenAiAssistant={() => setIsAiModalOpen(true)}
            onOpenVersionHistory={initialNoteId ? () => setIsVersionDrawerOpen(true) : undefined}
            onDuplicate={initialNoteId ? handleDuplicate : undefined}
            isPreview={isPreview}
            onTogglePreview={() => setIsPreview(!isPreview)}
            onShare={initialNoteId ? () => setIsShareModalOpen(true) : undefined}
            onDelete={initialNoteId ? handleDelete : undefined}
            onOpenFullscreen={handleOpenFullscreen}
            extraRightActions={(() => {
              const activeId = initialNoteId || noteIdRef.current || (typeof router.query.id === 'string' ? router.query.id : undefined);
              return activeId ? <ActiveCollaboratorsBar noteId={activeId} /> : null;
            })()}
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
          />
        </div>

        {/* Mobile Docked Toolbar (Sticky above virtual keyboard) */}
        <MobileEditorToolbar
          editor={editor}
          zoomLevel={zoomLevel}
          onZoomChange={(z) => setZoomLevel(z)}
          onAttachFile={() => setIsAttachmentDrawerOpen(true)}
          onRecordAudio={() => setIsAudioModalOpen(true)}
          onOpenOcr={() => setIsOcrModalOpen(true)}
          onOpenAiAssistant={() => setIsAiModalOpen(true)}
          onOpenVersionHistory={() => setIsVersionDrawerOpen(true)}
        />

        {/* Content Area (TipTap Editor / Preview) */}
        <div className="flex-1 px-4 py-3.5 sm:p-6 pb-20 lg:pb-6 flex flex-col min-h-0 overflow-y-auto">
          {isPreview ? (
            <div
              className="prose dark:prose-invert max-w-none flex-1 text-slate-800 dark:text-slate-200 text-sm leading-relaxed transition-all duration-150"
              style={{
                fontSize: zoomLevel !== 100 ? `${Math.max(12, Math.round(16 * (zoomLevel / 100)))}px` : undefined,
                zoom: zoomLevel !== 100 ? `${zoomLevel}%` : undefined,
              }}
              dangerouslySetInnerHTML={{
                __html: content || '<p class="text-slate-400 italic">ไม่มีเนื้อหา...</p>',
              }}
            />
          ) : (
            <div
              className="flex-1 min-h-[160px] lg:min-h-[420px] cursor-text text-sm sm:text-base leading-relaxed font-sans transition-all duration-150"
              onClick={() => {
                if (editor && !editor.isFocused) {
                  editor.commands.focus();
                }
              }}
              style={{
                color: textColor,
                fontSize: zoomLevel !== 100 ? `${Math.max(12, Math.round(16 * (zoomLevel / 100)))}px` : undefined,
                zoom: zoomLevel !== 100 ? `${zoomLevel}%` : undefined,
              }}
            >
              <EditorContent editor={editor} />
            </div>
          )}
        </div>
      </div>

      <MasterPasswordModal
        isOpen={isVaultModalOpen}
        onClose={() => {
          setIsVaultModalOpen(false);
          setPendingLockAction(null);
        }}
        onSuccess={() => {
          if (pendingLockAction === 'lock') {
            setIsLocked(true);
            toast.success('เปิดระบบป้องกัน E2EE สำหรับโน้ตนี้แล้ว');
          } else if (pendingLockAction === 'unlock') {
            setIsLocked(false);
            toast('ปลดล็อกโน้ตแล้ว (ยกเลิกการเข้ารหัส E2EE)', { icon: '🔓' });
          }
          setPendingLockAction(null);

          // Decrypt if locked
          if (content) {
            try {
              const parsed = JSON.parse(content);
              if (parsed.encrypted && parsed.iv) {
                const currentNote = notes.find((n) => n.id === noteIdRef.current);
                const dec = EncryptionService.getInstance().decrypt(parsed.encrypted, parsed.iv, currentNote?.salt || undefined);
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
            const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
            const fullUrl = audioUrl.startsWith('http') ? audioUrl : `${apiUrl}${audioUrl}`;
            editor.chain().focus().insertContent(`<p><audio controls src="${fullUrl}"></audio></p>`).run();
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
            if (typeof document !== 'undefined' && document.fullscreenElement) {
              document.exitFullscreen?.().catch(() => { });
            }
            const targetId = noteIdRef.current || initialNoteId || activeNoteForModal?.id;
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
              if (router.pathname === '/notes/new') {
                router.replace(`/notes/${targetId}`);
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
          isLocked={isLocked}
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

      {/* Mobile More Options Bottom Sheet (GEMINI.md STEP 3) */}
      <BottomSheet
        isOpen={isMobileMoreOpen}
        onClose={() => setIsMobileMoreOpen(false)}
        title="เมนูและการตั้งค่าโน้ต"
      >
        <div className="space-y-4 max-h-[75vh] overflow-y-auto no-scrollbar pb-6">
          {/* Note Color Swatches Section */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
              <Palette size={15} className="text-indigo-600 dark:text-indigo-400" />
              <span>สีขอบและธีมโน้ต:</span>
            </div>
            <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full shrink-0 transition-transform ${color === c ? 'scale-125 ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900' : 'hover:scale-110'
                    }`}
                  style={{ backgroundColor: c }}
                  aria-label={`เลือกสี ${c}`}
                />
              ))}
              {/* Custom Color with Pipette for Mobile (Circular Rainbow Swatch) */}
              <label
                className="w-7 h-7 rounded-full cursor-pointer relative hover:scale-110 active:scale-95 transition-all shadow-xs shrink-0 flex items-center justify-center ring-1 ring-slate-300 dark:ring-slate-600 hover:ring-indigo-400 overflow-hidden"
                style={{
                  background: 'conic-gradient(from 180deg at 50% 50%, #FF0000 0deg, #FFFF00 60deg, #00FF00 120deg, #00FFFF 180deg, #0000FF 240deg, #FF00FF 300deg, #FF0000 360deg)',
                }}
                title="กำหนดสีกระดาษโน้ตเอง (Custom Color)"
              >
                <input
                  type="color"
                  value={color || '#FEF08A'}
                  onChange={(e) => setColor(e.target.value)}
                  className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Board & Notebook Selectors Section */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl space-y-3">
            {/* Board Selector */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 shrink-0">
                <LayoutGrid size={15} className="text-indigo-600 dark:text-indigo-400" />
                <span>กระดาน (Board):</span>
              </div>
              <select
                value={boardId || ''}
                onChange={(e) => setBoardId(e.target.value || null)}
                className="text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-2.5 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none max-w-[160px] truncate"
              >
                <option value="" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">(ทั่วไป / ไม่ระบุ)</option>
                {boards.map((b) => (
                  <option key={b.id} value={b.id} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                    {b.name} {b.isDefault ? '⭐' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Notebook Selector */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 shrink-0">
                <Book size={15} className="text-indigo-600 dark:text-indigo-400" />
                <span>สมุดบันทึก:</span>
              </div>
              <select
                value={notebookId || ''}
                onChange={(e) => setNotebookId(e.target.value || null)}
                className="text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-2.5 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none max-w-[160px] truncate"
              >
                <option value="" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">(ไม่มีสมุดบันทึก)</option>
                {notebooks.map((nb) => (
                  <option key={nb.id} value={nb.id} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                    {nb.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Labels / Tags Section */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                <Tag size={15} className="text-indigo-600 dark:text-indigo-400" />
                <span>ป้ายกำกับ (Tags):</span>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingTag(true)}
                className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-0.5"
              >
                <Plus size={12} />
                <span>เพิ่มป้าย</span>
              </button>
            </div>

            {isAddingTag && (
              <div className="flex items-center gap-1.5 pt-1">
                <input
                  type="text"
                  placeholder="ชื่อป้ายใหม่..."
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCreateTag();
                    }
                  }}
                  className="flex-1 px-2.5 py-1 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 outline-none focus:ring-1 focus:ring-indigo-500"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleCreateTag}
                  className="px-2.5 py-1 rounded-xl bg-indigo-600 text-white text-xs font-bold"
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
                  <X size={14} />
                </button>
              </div>
            )}

            <div className="flex gap-1.5 flex-wrap items-center pt-1">
              {labels.map((lbl) => {
                const isSelected = selectedLabelIds.includes(lbl.id);
                return (
                  <button
                    key={lbl.id}
                    type="button"
                    onClick={() => toggleLabel(lbl.id)}
                    className={`text-xs font-medium px-2.5 py-1 rounded-xl transition ${isSelected ? 'ring-1 font-bold shadow-xs' : 'opacity-60 hover:opacity-100'
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
              {labels.length === 0 && !isAddingTag && (
                <p className="text-xs text-slate-400 italic">ยังไม่มีป้ายกำกับ</p>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1">
            {/* Lock E2EE */}
            <button
              type="button"
              onClick={() => {
                setIsMobileMoreOpen(false);
                handleLockToggle();
              }}
              className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-semibold transition"
            >
              <div className="flex items-center gap-3">
                {isLocked ? <Lock size={18} className="text-amber-500" /> : <Unlock size={18} className="text-slate-400" />}
                <span>{isLocked ? 'ปลดล็อก / การเข้ารหัสลับ (E2EE)' : 'เปิดการเข้ารหัสลับ (E2EE)'}</span>
              </div>
              <span className="text-xs text-slate-400">{isLocked ? 'เปิดใช้งานอยู่' : 'ปิดอยู่'}</span>
            </button>

            {/* Pin */}
            <button
              type="button"
              onClick={() => {
                setIsPinned(!isPinned);
                toast.success(isPinned ? 'ยกเลิกการปักหมุด' : 'ปักหมุดโน้ตแล้ว');
                setIsMobileMoreOpen(false);
              }}
              className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-semibold transition"
            >
              <div className="flex items-center gap-3">
                <Pin size={18} className={isPinned ? 'text-indigo-600 fill-indigo-600' : 'text-slate-400'} />
                <span>ปักหมุดไว้บนสุด (Pin)</span>
              </div>
              {isPinned && <Check size={18} className="text-indigo-600" />}
            </button>

            {/* Favorite */}
            <button
              type="button"
              onClick={() => {
                setIsFavorite(!isFavorite);
                toast.success(isFavorite ? 'นำออกจากรายการโปรด' : 'เพิ่มในรายการโปรดแล้ว');
                setIsMobileMoreOpen(false);
              }}
              className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-semibold transition"
            >
              <div className="flex items-center gap-3">
                <Star size={18} className={isFavorite ? 'text-amber-500 fill-amber-500' : 'text-slate-400'} />
                <span>รายการโปรด (Favorite)</span>
              </div>
              {isFavorite && <Check size={18} className="text-amber-500" />}
            </button>

            {/* File Attachments */}
            <button
              type="button"
              onClick={() => {
                setIsMobileMoreOpen(false);
                setIsAttachmentDrawerOpen(true);
              }}
              className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-semibold transition"
            >
              <div className="flex items-center gap-3">
                <Paperclip size={18} className="text-slate-400" />
                <span>ไฟล์แนบ ({attachments.length})</span>
              </div>
            </button>

            {/* Voice Memo */}
            <button
              type="button"
              onClick={() => {
                setIsMobileMoreOpen(false);
                setIsAudioModalOpen(true);
              }}
              className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-semibold transition"
            >
              <AudioLines size={18} className="text-indigo-500" />
              <span>อัดเสียงบันทึก (Voice Memo)</span>
            </button>

            {/* Speech-to-Text Live Dictation */}
            <SpeechToTextButton
              editor={editor || null}
              variant="menu-item"
              onActionComplete={() => setIsMobileMoreOpen(false)}
            />

            {/* OCR Image */}
            <button
              type="button"
              onClick={() => {
                setIsMobileMoreOpen(false);
                setIsOcrModalOpen(true);
              }}
              className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-semibold transition"
            >
              <ScanText size={18} className="text-blue-500" />
              <span>สแกนข้อความจากรูปภาพ (OCR)</span>
            </button>

            {/* AI Assistant */}
            <button
              type="button"
              onClick={() => {
                setIsMobileMoreOpen(false);
                setIsAiModalOpen(true);
              }}
              className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-semibold transition"
            >
              <Sparkles size={18} className="text-purple-500" />
              <span>ผู้ช่วย AI สรุปและเรียบเรียง (ฟรี)</span>
            </button>

            {/* Version History */}
            {initialNoteId && (
              <button
                type="button"
                onClick={() => {
                  setIsMobileMoreOpen(false);
                  setIsVersionDrawerOpen(true);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-semibold transition"
              >
                <History size={18} className="text-slate-400" />
                <span>ประวัติเวอร์ชัน (Version History)</span>
              </button>
            )}

            {/* Share */}
            {initialNoteId && (
              <button
                type="button"
                onClick={() => {
                  setIsMobileMoreOpen(false);
                  setIsShareModalOpen(true);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-semibold transition"
              >
                <Share2 size={18} className="text-indigo-500" />
                <span>แชร์โน้ตนี้</span>
              </button>
            )}

            {/* Duplicate */}
            {initialNoteId && (
              <button
                type="button"
                onClick={() => {
                  setIsMobileMoreOpen(false);
                  handleDuplicate();
                }}
                className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-semibold transition"
              >
                <Copy size={18} className="text-slate-400" />
                <span>ทำสำเนาโน้ต (Duplicate)</span>
              </button>
            )}

            {/* Fullscreen Mode */}
            <button
              type="button"
              onClick={() => {
                setIsMobileMoreOpen(false);
                handleOpenFullscreen();
              }}
              className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-semibold transition text-indigo-600 dark:text-indigo-400"
            >
              <Maximize2 size={18} />
              <span className="font-bold">เปิดโหมดเต็มจอ (Fullscreen)</span>
            </button>

            {/* Export Markdown */}
            <button
              type="button"
              onClick={() => {
                setIsMobileMoreOpen(false);
                handleExportMarkdown();
              }}
              className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-semibold transition"
            >
              <Download size={18} className="text-emerald-500" />
              <span>ดาวน์โหลดเป็นไฟล์ Markdown (.md)</span>
            </button>

            {/* Delete */}
            {initialNoteId && (
              <button
                type="button"
                onClick={() => {
                  setIsMobileMoreOpen(false);
                  handleDelete();
                }}
                className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-sm font-bold transition mt-2"
              >
                <Trash2 size={18} />
                <span>ลบโน้ตนี้</span>
              </button>
            )}
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
