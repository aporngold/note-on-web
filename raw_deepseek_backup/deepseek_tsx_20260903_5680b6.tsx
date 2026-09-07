import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { Save, Lock, Unlock, Share2, MoreHorizontal, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNoteStore } from '@/store/noteStore';
import { EncryptionService } from '@/utils/encryption';

// Dynamic import for React Quill (avoid SSR issues)
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';

interface NoteEditorProps {
  noteId?: string;
}

export default function NoteEditor({ noteId }: NoteEditorProps) {
  const router = useRouter();
  const { notes, addNote, updateNote } = useNoteStore();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const note = noteId ? notes.find((n) => n.id === noteId) : null;

  useEffect(() => {
    if (note) {
      setTitle(note.title || '');
      setContent(note.content || '');
      setIsLocked(note.isLocked || false);
    }
  }, [note]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Encrypt content if locked
      let finalContent = content;
      if (isLocked) {
        const encryption = EncryptionService.getInstance();
        const encrypted = encryption.encrypt(content);
        finalContent = JSON.stringify(encrypted);
      }

      if (noteId) {
        updateNote(noteId, {
          title,
          content: finalContent,
          isLocked,
          updatedAt: new Date(),
        });
        toast.success('บันทึกโน้ตสำเร็จ');
      } else {
        addNote({
          title,
          content: finalContent,
          isLocked,
          labels: [],
          color: '#6366F1',
          isArchived: false,
        });
        toast.success('สร้างโน้ตใหม่สำเร็จ');
        router.push('/dashboard');
      }
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setIsSaving(false);
    }
  };

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link', 'image', 'code-block'],
      ['clean'],
    ],
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <ArrowLeft size={20} />
          </button>
          <input
            type="text"
            placeholder="ชื่อโน้ต..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-xl font-semibold bg-transparent border-none focus:outline-none focus:ring-0 dark:text-white"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsLocked(!isLocked)}
            className={`p-2 rounded-lg ${
              isLocked
                ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {isLocked ? <Lock size={18} /> : <Unlock size={18} />}
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 flex items-center gap-2 disabled:opacity-50"
          >
            <Save size={18} />
            {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 p-4">
        <ReactQuill
          theme="snow"
          value={content}
          onChange={setContent}
          modules={modules}
          className="h-full"
          placeholder="เริ่มเขียนโน้ตของคุณ..."
        />
      </div>
    </div>
  );
}