import React, { useState, useEffect } from 'react';
import {
  History,
  X,
  RotateCcw,
  Plus,
  Clock,
  CheckCircle2,
  FileText,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDistanceToNow, format } from 'date-fns';
import { th } from 'date-fns/locale';
import api from '@/utils/api';
import { NoteVersion, Note } from '@/types';
import { stripHtmlTags } from '@/utils/editorHelper';

interface VersionHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  noteId?: string;
  currentTitle: string;
  currentContent: string;
  onRestore: (restoredNote: Note) => void;
}

export default function VersionHistoryDrawer({
  isOpen,
  onClose,
  noteId,
  currentTitle,
  currentContent,
  onRestore,
}: VersionHistoryDrawerProps) {
  const [versions, setVersions] = useState<NoteVersion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<NoteVersion | null>(null);

  const fetchVersions = async () => {
    if (!noteId) return;
    try {
      setIsLoading(true);
      const res = await api.get(`/notes/${noteId}/versions`);
      setVersions(res.data);
      if (res.data.length > 0 && !selectedVersion) {
        setSelectedVersion(res.data[0]);
      }
    } catch (e: any) {
      console.error('Error fetching versions:', e);
      toast.error('ไม่สามารถดึงประวัติเวอร์ชันได้');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && noteId) {
      fetchVersions();
    }
  }, [isOpen, noteId]);

  if (!isOpen || !noteId) return null;

  const handleCreateSnapshot = async () => {
    try {
      await api.post(`/notes/${noteId}/versions`, {
        title: currentTitle,
        content: currentContent,
      });
      toast.success('บันทึกจุดสแนปช็อตเวอร์ชันสำเร็จ');
      fetchVersions();
    } catch (e: any) {
      toast.error('บันทึกเวอร์ชันไม่สำเร็จ');
    }
  };

  const handleRestore = async (version: NoteVersion) => {
    if (!confirm(`คุณต้องการกู้คืนเนื้อหากลับไปยังเวอร์ชัน ${format(new Date(version.createdAt), 'dd/MM/yyyy HH:mm')} ใช่หรือไม่?`)) {
      return;
    }

    try {
      setIsRestoring(true);
      const res = await api.post(`/notes/${noteId}/versions/${version.id}/restore`);
      toast.success('กู้คืนเวอร์ชันเรียบร้อยแล้ว!');
      if (onRestore) {
        onRestore(res.data.note);
      }
      onClose();
    } catch (e: any) {
      toast.error('กู้คืนเวอร์ชันไม่สำเร็จ');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-sm animate-fade-in flex justify-end">
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">ประวัติเวอร์ชัน (Version History)</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">ดูย้อนหลังและกู้คืนเนื้อหาก่อนหน้าได้ตลอดเวลา</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action bar */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            บันทึกไว้ทั้งหมด {versions.length} เวอร์ชัน
          </span>
          <button
            type="button"
            onClick={handleCreateSnapshot}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>สร้างจุดบันทึกสแนปช็อตเดี๋ยวนี้</span>
          </button>
        </div>

        {/* Content Body: Split view (Version List & Preview) */}
        <div className="flex-1 flex overflow-hidden">
          {/* Version List Sidebar */}
          <div className="w-56 border-r border-slate-100 dark:border-slate-800 overflow-y-auto p-3 space-y-2">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
                <p className="text-[11px]">กำลังโหลด...</p>
              </div>
            ) : versions.length === 0 ? (
              <div className="text-center py-12 px-2 text-slate-400 space-y-2">
                <Clock className="w-6 h-6 mx-auto text-slate-300 dark:text-slate-600" />
                <p className="text-xs">ยังไม่มีประวัติเวอร์ชัน</p>
                <p className="text-[10px]">กดปุ่ม "สร้างจุดบันทึก" เพื่อเริ่มบันทึกประวัติ</p>
              </div>
            ) : (
              versions.map((ver, idx) => {
                const isSelected = selectedVersion?.id === ver.id;
                return (
                  <div
                    key={ver.id}
                    onClick={() => setSelectedVersion(ver)}
                    className={`p-3 rounded-xl cursor-pointer transition-all border text-left ${
                      isSelected
                        ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 shadow-sm'
                        : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold truncate">
                        {idx === 0 ? 'เวอร์ชันล่าสุด' : `เวอร์ชัน #${versions.length - idx}`}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {format(new Date(ver.createdAt), 'dd MMM yyyy, HH:mm', { locale: th })}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate mt-1">
                      {ver.title || 'ไม่มีชื่อ'}
                    </p>
                  </div>
                );
              })
            )}
          </div>

          {/* Selected Version Preview */}
          <div className="flex-1 flex flex-col overflow-y-auto p-6 bg-slate-50/30 dark:bg-slate-900/30">
            {selectedVersion ? (
              <div className="space-y-4 flex-1 flex flex-col">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                      {selectedVersion.title || 'ไม่มีชื่อบันทึก'}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      บันทึกเมื่อ: {format(new Date(selectedVersion.createdAt), 'dd/MM/yyyy HH:mm:ss')}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRestore(selectedVersion)}
                    disabled={isRestoring}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-md transition-all disabled:opacity-50"
                  >
                    {isRestoring ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                    <span>กู้คืนเวอร์ชันนี้</span>
                  </button>
                </div>

                {/* Preview Box */}
                <div className="flex-1 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-y-auto">
                  <div
                    className="prose dark:prose-invert max-w-none text-xs leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: selectedVersion.content }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
                เลือกเวอร์ชันจากแถบด้านซ้ายเพื่อดูพรีวิว
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
