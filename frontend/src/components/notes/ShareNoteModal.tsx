import React, { useState, useEffect } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  Globe,
  Lock,
  Eye,
  Edit3,
  ExternalLink,
  ShieldCheck,
  KeyRound,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/utils/api';

interface ShareNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  noteId?: string;
  noteTitle?: string;
}

export default function ShareNoteModal({
  isOpen,
  onClose,
  noteId,
  noteTitle,
}: ShareNoteModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isShared, setIsShared] = useState(false);
  const [shareCode, setShareCode] = useState<string | null>(null);
  const [permission, setPermission] = useState<'read' | 'edit'>('read');
  const [hasPassword, setHasPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (!isOpen || !noteId) return;

    async function loadShareSettings() {
      try {
        setIsLoading(true);
        const res = await api.get(`/share/${noteId}/settings`);
        setIsShared(res.data.isShared);
        setShareCode(res.data.shareCode);
        setPermission(res.data.sharePermission || 'read');
        setHasPassword(res.data.hasPassword);
        setPassword('');
      } catch (e: any) {
        console.error('Error fetching share settings:', e);
      } finally {
        setIsLoading(false);
      }
    }

    loadShareSettings();
  }, [isOpen, noteId]);

  if (!isOpen || !noteId) return null;

  const publicUrl = shareCode
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/share/${shareCode}`
    : '';

  const handleToggleShare = async () => {
    try {
      setIsSaving(true);
      const nextSharedState = !isShared;
      const res = await api.post(`/share/${noteId}`, {
        isShared: nextSharedState,
        permission,
        password: password.trim() || undefined,
      });

      setIsShared(res.data.isShared);
      setShareCode(res.data.shareCode);
      setHasPassword(res.data.hasPassword);
      toast.success(nextSharedState ? 'เปิดใช้งานลิงก์แชร์สาธารณะแล้ว' : 'ปิดการแชร์สาธารณะแล้ว');
    } catch (e: any) {
      toast.error('ไม่สามารถอัปเดตการแชร์ได้');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      const res = await api.post(`/share/${noteId}`, {
        isShared: true,
        permission,
        password: password.trim() || (hasPassword ? undefined : ''),
      });

      setIsShared(res.data.isShared);
      setShareCode(res.data.shareCode);
      setHasPassword(res.data.hasPassword);
      setPassword('');
      toast.success('บันทึกการตั้งค่าการแชร์เรียบร้อย');
    } catch (e: any) {
      toast.error('บันทึกการตั้งค่าไม่สำเร็จ');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyLink = () => {
    if (!publicUrl) return;
    navigator.clipboard.writeText(publicUrl);
    setIsCopied(true);
    toast.success('คัดลอกลิงก์แชร์แล้ว! ส่งให้เพื่อนเปิดได้ทันที');
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">แชร์โน้ต (Share Note)</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[280px]">
                {noteTitle || 'ไม่มีชื่อบันทึก'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8 text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              <p className="text-xs">กำลังโหลดการตั้งค่า...</p>
            </div>
          ) : (
            <>
              {/* Toggle Public Sharing */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isShared ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                      {isShared ? 'เปิดการแชร์สาธารณะ (เปิดอยู่)' : 'ปิดการแชร์สาธารณะ (ส่วนตัว)'}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {isShared ? 'ใครก็ตามที่มีลิงก์สามารถเข้าดูโน้ตนี้ได้' : 'เฉพาะคุณเท่านั้นที่เข้าถึงโน้ตนี้ได้'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleToggleShare}
                  disabled={isSaving}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                    isShared ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isShared ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Public Link Box */}
              {isShared && shareCode && (
                <div className="space-y-4 animate-fade-in">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      ลิงก์สำหรับแชร์:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={publicUrl}
                        className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 select-all font-mono"
                      />
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="flex items-center gap-1 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md transition-all whitespace-nowrap"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{isCopied ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
                      </button>
                      <a
                        href={publicUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                        title="เปิดดูตัวอย่างหน้าแชร์"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>

                  {/* Permissions Selection */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      สิทธิ์ของผู้มีลิงก์:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPermission('read')}
                        className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                          permission === 'read'
                            ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 ring-2 ring-blue-400/20'
                            : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <Eye className="w-4 h-4" />
                        <span>อ่านอย่างเดียว (View Only)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPermission('edit')}
                        className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                          permission === 'edit'
                            ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 ring-2 ring-blue-400/20'
                            : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <Edit3 className="w-4 h-4" />
                        <span>แก้ไขร่วมกันได้ (Collaborative)</span>
                      </button>
                    </div>
                  </div>

                  {/* Password Protection */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                        <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                        <span>ป้องกันด้วยรหัสผ่าน (Password Protection):</span>
                      </div>
                      {hasPassword && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 font-medium">
                          ล็อกรหัสอยู่
                        </span>
                      )}
                    </div>
                    <input
                      type="password"
                      placeholder={hasPassword ? 'พิมพ์รหัสผ่านใหม่หากต้องการเปลี่ยน (หรือเว้นว่างไว้)' : 'กำหนดรหัสผ่านเข้าดู (ไม่บังคับ)'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handleSaveSettings}
                      disabled={isSaving}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-semibold shadow transition-all"
                    >
                      {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>บันทึกการเปลี่ยนแปลงสิทธิ์</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
