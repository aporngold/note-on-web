import React, { useState, useEffect, useRef } from 'react';
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
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Code,
  Quote,
  CheckSquare,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Note, Notebook, Label } from '@/types';
import { useNoteStore } from '@/store/noteStore';
import { useAuthStore } from '@/store/authStore';
import { EncryptionService } from '@/utils/encryption';
import MasterPasswordModal from './MasterPasswordModal';
import api from '@/utils/api';
import NoteRichToolbar from './NoteRichToolbar';

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
  const { notebooks, labels, createNote, updateNote, deleteNote, duplicateNote } = useNoteStore();
  const { isVaultUnlocked } = useAuthStore();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [textColor, setTextColor] = useState('#0F172A');
  const [isLocked, setIsLocked] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [isBorderless, setIsBorderless] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [notebookId, setNotebookId] = useState<string | null>(null);
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);

  const [isPreview, setIsPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(!initialNoteId);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
        setNotebookId(n.notebookId || null);
        setSelectedLabelIds(n.labels?.map((l) => l.id) || []);

        // Decrypt if locked
        if (n.isLocked) {
          if (isVaultUnlocked) {
            try {
              const parsed = JSON.parse(n.content);
              if (parsed.encrypted && parsed.iv) {
                const dec = EncryptionService.getInstance().decrypt(parsed.encrypted, parsed.iv);
                setContent(dec);
              } else {
                setContent(n.content);
              }
            } catch (e) {
              setContent(n.content);
            }
          } else {
            // Vault locked, prompt user
            setIsVaultModalOpen(true);
            setContent(n.content);
          }
        } else {
          setContent(n.content);
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
  }, [initialNoteId, isVaultUnlocked, router]);

  // Handle Vault lock toggle
  const handleLockToggle = () => {
    if (!isLocked) {
      // Enabling lock requires master password
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

  // Formatting helpers for textarea
  const insertFormatting = (prefix: string, suffix: string = '') => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = content.substring(start, end);
    const replacement = `${prefix}${selected || 'ข้อความ'}${suffix}`;
    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, start + prefix.length + (selected.length || 6));
    }, 10);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let finalContent = content;
      let iv: string | null = null;
      let salt: string | null = null;

      if (isLocked) {
        if (!isVaultUnlocked) {
          setIsVaultModalOpen(true);
          setIsSaving(false);
          return;
        }
        const encryption = EncryptionService.getInstance();
        const encResult = encryption.encrypt(content);
        finalContent = JSON.stringify(encResult);
        iv = encResult.iv;
      }

      if (initialNoteId) {
        await updateNote(initialNoteId, {
          title: title.trim() || 'ไม่มีชื่อบันทึก',
          content: finalContent,
          color,
          textColor,
          isLocked,
          isPinned,
          notebookId,
          labelIds: selectedLabelIds,
          iv,
          salt,
        });
        toast.success('บันทึกการเปลี่ยนแปลงแล้ว');
      } else {
        const created = await createNote({
          title: title.trim() || 'ไม่มีชื่อบันทึก',
          content: finalContent,
          color,
          textColor,
          isLocked,
          isPinned,
          notebookId,
          labelIds: selectedLabelIds,
          iv,
          salt,
        });
        toast.success('สร้างโน้ตใหม่สำเร็จ');
        router.replace(`/notes/${created.id}`);
      }
      setLastSaved(new Date().toLocaleTimeString('th-TH'));
    } catch (error: any) {
      toast.error(error.message || 'บันทึกไม่สำเร็จ');
    } finally {
      setIsSaving(false);
    }
  };

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
    const blob = new Blob([`# ${title || 'ไม่มีชื่อบันทึก'}\n\n${content}`], {
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

          {lastSaved && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 size={13} /> บันทึกล่าสุด: {lastSaved}
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
            title={isLocked ? 'โน้ตนี้ถูกเข้ารหัสด้วย Master Password' : 'คลิกเพื่อเข้ารหัสโน้ตนี้'}
          >
            {isLocked ? <Lock size={14} /> : <Unlock size={14} />}
            <span>{isLocked ? 'E2EE ล็อกแล้ว' : 'ไม่เข้ารหัส'}</span>
          </button>

          {/* Pin Button */}
          <button
            onClick={() => setIsPinned(!isPinned)}
            className={`p-2 rounded-xl transition ${
              isPinned
                ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title={isPinned ? 'ยกเลิกการปักหมุด' : 'ปักหมุดโน้ต'}
          >
            <Pin size={17} className={isPinned ? 'fill-current' : ''} />
          </button>

          {/* Duplicate Button (if existing) */}
          {initialNoteId && (
            <button
              onClick={handleDuplicate}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
              title="คัดลอกโน้ตนี้"
            >
              <Copy size={17} />
            </button>
          )}

          {/* Export to Markdown */}
          <button
            onClick={handleExportMarkdown}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            title="ส่งออกเป็นไฟล์ Markdown (.md)"
          >
            <Download size={17} />
          </button>

          {/* Print */}
          <button
            onClick={handlePrint}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            title="พิมพ์ หรือ บันทึกเป็น PDF"
          >
            <Printer size={17} />
          </button>

          {/* Delete to trash */}
          {initialNoteId && (
            <button
              onClick={handleDelete}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition"
              title="ย้ายไปถังขยะ"
            >
              <Trash2 size={17} />
            </button>
          )}

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-500/25 flex items-center gap-1.5 transition hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 ml-1"
          >
            <Save size={15} />
            <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึก'}</span>
          </button>
        </div>
      </div>

      {/* Note Configuration Strip (Notebook, Color, Labels) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl shadow-sm space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Notebook Selector */}
          <div className="flex items-center gap-2">
            <Book size={16} className="text-slate-400" />
            <span className="text-xs font-semibold text-slate-500">สมุด:</span>
            <select
              value={notebookId || ''}
              onChange={(e) => setNotebookId(e.target.value || null)}
              className="text-xs font-medium px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">(ไม่มีสมุดบันทึก)</option>
              {notebooks.map((nb) => (
                <option key={nb.id} value={nb.id}>
                  {nb.name}
                </option>
              ))}
            </select>
          </div>

          {/* Color Palette Selector */}
          <div className="flex items-center gap-2">
            <Palette size={16} className="text-slate-400" />
            <span className="text-xs font-semibold text-slate-500">สีแถบ:</span>
            <div className="flex gap-1.5">
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

        {/* Labels multi-selector */}
        {labels.length > 0 && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex-wrap">
            <Tag size={15} className="text-slate-400" />
            <span className="text-xs font-semibold text-slate-500">ป้ายกำกับ:</span>
            <div className="flex gap-1.5 flex-wrap">
              {labels.map((lbl) => {
                const isSelected = selectedLabelIds.includes(lbl.id);
                return (
                  <button
                    key={lbl.id}
                    type="button"
                    onClick={() => toggleLabel(lbl.id)}
                    className={`text-[11px] font-medium px-2.5 py-1 rounded-lg transition ${
                      isSelected
                        ? 'ring-1 font-bold'
                        : 'opacity-50 hover:opacity-80'
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
            </div>
          </div>
        )}
      </div>

      {/* Editor Body */}
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden flex flex-col min-h-[550px]"
        style={{ borderTop: `6px solid ${color}` }}
      >
        {/* Title Input */}
        <div className="p-6 pb-2 border-b border-slate-100 dark:border-slate-800/80">
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
          onContentChange={(newContent) => setContent(newContent)}
          color={color}
          onColorChange={(newColor) => setColor(newColor)}
          textColor={textColor}
          onTextColorChange={(newTc) => setTextColor(newTc)}
          isPinned={isPinned}
          onTogglePin={() => setIsPinned(!isPinned)}
          isBorderless={isBorderless}
          onToggleBorderless={() => setIsBorderless(!isBorderless)}
          textareaRef={textareaRef}
          zoomLevel={zoomLevel}
          onZoomChange={(z) => setZoomLevel(z)}
          onCopyNote={() => {
            const fullText = `${title}\n\n${content}`;
            navigator.clipboard.writeText(fullText);
            toast.success('คัดลอกข้อความโน้ตแล้ว');
          }}
          onDownloadTxt={() => {
            const fullText = `${title}\n\n${content}`;
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
            if (typeof navigator !== 'undefined' && navigator.share) {
              navigator.share({ title, text: content }).catch(() => {});
            } else {
              const fullText = `${title}\n\n${content}`;
              navigator.clipboard.writeText(fullText);
              toast.success('คัดลอกลิงก์/ข้อความโน้ตแล้ว');
            }
          }}
          onDelete={handleDelete}
          onCancel={() => router.push('/dashboard')}
          onAccept={handleSave}
          isSaving={isSaving}
        />

        {/* Content Area (Editor / Preview) */}
        <div className="flex-1 p-6 flex flex-col">
          {isPreview ? (
            <div className="prose dark:prose-invert max-w-none flex-1 text-slate-800 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
              {content || <span className="text-slate-400 italic">ไม่มีเนื้อหา...</span>}
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="เริ่มพิมพ์บันทึกของคุณที่นี่... (รองรับ Markdown, เช็คลิสต์, รายการ, โค้ด)"
              className="w-full flex-1 min-h-[400px] bg-transparent text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none resize-none text-sm sm:text-base leading-relaxed font-sans"
              style={{
                color: textColor,
                fontSize: zoomLevel !== 100 ? `${Math.max(12, Math.round(16 * (zoomLevel / 100)))}px` : undefined,
              }}
            />
          )}
        </div>
      </div>

      <MasterPasswordModal
        isOpen={isVaultModalOpen}
        onClose={() => setIsVaultModalOpen(false)}
        onSuccess={() => {
          // If we had encrypted content, attempt to decrypt
          if (content) {
            try {
              const parsed = JSON.parse(content);
              if (parsed.encrypted && parsed.iv) {
                const dec = EncryptionService.getInstance().decrypt(parsed.encrypted, parsed.iv);
                setContent(dec);
              }
            } catch (e) {
              // ignore
            }
          }
        }}
      />
    </div>
  );
}
