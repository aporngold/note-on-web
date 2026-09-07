import React, { useState } from 'react';
import { Board } from '@/types';
import { useNoteStore } from '@/store/noteStore';
import {
  Share2,
  Copy,
  Check,
  Globe,
  Lock,
  Edit3,
  Eye,
  X,
  ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface BoardShareModalProps {
  board: Board;
  isOpen: boolean;
  onClose: () => void;
}

export default function BoardShareModal({
  board,
  isOpen,
  onClose,
}: BoardShareModalProps) {
  const { shareBoard } = useNoteStore();
  const [isPublic, setIsPublic] = useState(board.isPublic ?? false);
  const [permission, setPermission] = useState<'read' | 'edit'>(
    (board.sharePermission as 'read' | 'edit') || 'read'
  );
  const [isCopied, setIsCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const shareUrl = board.shareCode ? `${origin}/share/${board.shareCode}` : '';

  const handleToggleShare = async () => {
    try {
      setIsSaving(true);
      await shareBoard(board.id, {
        isPublic: !isPublic,
        sharePermission: permission,
      });
      setIsPublic(!isPublic);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePermission = async (newPerm: 'read' | 'edit') => {
    try {
      setPermission(newPerm);
      if (isPublic) {
        await shareBoard(board.id, {
          isPublic: true,
          sharePermission: newPerm,
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyLink = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setIsCopied(true);
    toast.success('คัดลอกลิงก์แชร์แล้ว');
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Share2 size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                แชร์กระดาน &quot;{board.name}&quot;
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                สร้างลิงก์สำหรับเปิดดู หรือทำงานร่วมกันแบบเรียลไทม์
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Public Sharing Toggle */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${isPublic ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
              {isPublic ? <Globe size={18} /> : <Lock size={18} />}
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                {isPublic ? 'เปิดการแชร์สาธารณะแล้ว' : 'ปิดการแชร์ (เฉพาะคุณ)'}
              </h4>
              <p className="text-[11px] text-slate-500">
                {isPublic ? 'ทุกคนที่มีลิงก์สามารถเข้าถึงบอร์ดนี้ได้' : 'เฉพาะเจ้าของบัญชีเท่านั้นที่มองเห็น'}
              </p>
            </div>
          </div>

          <button
            onClick={handleToggleShare}
            disabled={isSaving}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
              isPublic ? 'bg-indigo-600 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-white shadow-md transform transition" />
          </button>
        </div>

        {/* Permission Selector */}
        {isPublic && (
          <div className="space-y-2 animate-fade-in">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              สิทธิ์ของผู้ที่มีลิงก์ (Access Permission):
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleChangePermission('read')}
                className={`p-3 rounded-xl border text-left transition flex flex-col gap-1 ${
                  permission === 'read'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Eye size={14} />
                  <span>ดูอย่างเดียว (View Only)</span>
                </div>
                <span className="text-[10px] text-slate-500">
                  ผู้รับลิงก์สามารถอ่านและดาวน์โหลดไฟล์ แต่ไม่สามารถแก้ไขได้
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleChangePermission('edit')}
                className={`p-3 rounded-xl border text-left transition flex flex-col gap-1 ${
                  permission === 'edit'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Edit3 size={14} />
                  <span>แก้ไขได้ (Editable)</span>
                </div>
                <span className="text-[10px] text-slate-500">
                  แก้ไข ขยับโน้ต และทำงานร่วมกันแบบเรียลไทม์ได้ทันที
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Share Link Field */}
        {isPublic && shareUrl && (
          <div className="space-y-2 animate-fade-in">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              ลิงก์แชร์สำหรับส่งให้ผู้อื่น:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 select-all"
              />
              <button
                onClick={handleCopyLink}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition active:scale-95 shrink-0"
              >
                {isCopied ? <Check size={14} /> : <Copy size={14} />}
                <span>{isCopied ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
              </button>
            </div>

            <div className="pt-1 flex justify-end">
              <a
                href={shareUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <span>ทดสอบเปิดหน้าแชร์</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl transition"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}
