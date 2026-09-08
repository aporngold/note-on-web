import React, { useRef, useState } from 'react';
import {
  Paperclip,
  X,
  Upload,
  Download,
  Trash2,
  FileText,
  Image as ImageIcon,
  Music,
  FileArchive,
  FileCode,
  ExternalLink,
  Plus,
} from 'lucide-react';
import { FileAttachment } from '@/types';
import toast from 'react-hot-toast';

interface NoteAttachmentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  noteId?: string;
  attachments: FileAttachment[];
  onUploadFile: (file: File) => Promise<void>;
  onDeleteAttachment: (id: string) => Promise<void>;
  onInsertIntoEditor?: (attachment: FileAttachment) => void;
}

export default function NoteAttachmentDrawer({
  isOpen,
  onClose,
  noteId,
  attachments = [],
  onUploadFile,
  onDeleteAttachment,
  onInsertIntoEditor,
}: NoteAttachmentDrawerProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const getFileIcon = (mimeType: string, filename: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon className="text-emerald-500" size={18} />;
    if (mimeType.startsWith('audio/')) return <Music className="text-indigo-500" size={18} />;
    if (mimeType.includes('zip') || mimeType.includes('tar') || mimeType.includes('rar'))
      return <FileArchive className="text-amber-500" size={18} />;
    if (filename.endsWith('.js') || filename.endsWith('.ts') || filename.endsWith('.json') || filename.endsWith('.html'))
      return <FileCode className="text-purple-500" size={18} />;
    return <FileText className="text-blue-500" size={18} />;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        await onUploadFile(files[i]);
      }
    } catch (err) {
      console.error('File upload error:', err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Paperclip size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                ไฟล์แนบ ({attachments.length})
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                จัดการเอกสาร รูปภาพ และไฟล์เสียงที่ผูกกับโน้ตนี้
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Upload Trigger */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800/80">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full py-2.5 px-4 rounded-xl border-2 border-dashed border-indigo-200 dark:border-indigo-900/60 hover:border-indigo-500 dark:hover:border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 font-semibold text-xs transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Upload size={16} />
            {isUploading ? 'กำลังอัปโหลด...' : 'คลิกเพื่อเลือกไฟล์แนบเพิ่ม'}
          </button>
        </div>

        {/* Attachment List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {attachments.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-slate-400 text-xs">
              <Paperclip size={32} className="mb-2 opacity-40 stroke-1" />
              <span>ยังไม่มีไฟล์แนบในโน้ตนี้</span>
              <span className="text-[11px] text-slate-500 mt-1">ลากไฟล์มาวางบนตัวแก้ไขเพื่อแนบได้ทันที</span>
            </div>
          ) : (
            attachments.map((att) => {
              const fullUrl = att.url.startsWith('http') ? att.url : `${apiUrl}${att.url}`;
              return (
                <div
                  key={att.id}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-2.5 hover:shadow-sm transition"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-200/60 dark:border-slate-600/60 shrink-0">
                      {getFileIcon(att.mimeType, att.originalName || att.filename)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate" title={att.originalName}>
                        {att.originalName || att.filename}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {formatFileSize(att.size)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {onInsertIntoEditor && (
                      <button
                        onClick={() => onInsertIntoEditor(att)}
                        className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg text-[11px] font-medium transition"
                        title="แทรกลงในตัวแก้ไข"
                      >
                        แทรก
                      </button>
                    )}
                    <a
                      href={fullUrl}
                      download={att.originalName || att.filename}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                      title="ดาวน์โหลด"
                    >
                      <Download size={14} />
                    </a>
                    <button
                      onClick={() => onDeleteAttachment(att.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                      title="ลบไฟล์แนบ"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
