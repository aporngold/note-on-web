import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import {
  Lock,
  Share2,
  Calendar,
  User,
  Copy,
  Check,
  Download,
  FileText,
  KeyRound,
  Loader2,
  ArrowLeft,
  Paperclip,
  Layout,
  X,
  Tag,
  Book,
  ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';
import { FileAttachment } from '@/types';
import { stripHtmlTags } from '@/utils/editorHelper';

interface SharedBoardNote {
  id: string;
  title: string;
  content: string;
  color: string;
  textColor?: string;
  attachments?: FileAttachment[];
  updatedAt: string;
  labels?: Array<{ label: { id: string; name: string; color: string } }>;
}

interface SharedBoardData {
  id: string;
  name: string;
  description?: string;
  color?: string;
  theme?: string;
  bgImage?: string | null;
  isPublic: boolean;
  sharePermission?: string;
  user: { id: string; username: string };
  notes: SharedBoardNote[];
}

export default function SharedNotePage() {
  const router = useRouter();
  const { code } = router.query;

  const [isLoading, setIsLoading] = useState(true);
  const [isPasswordRequired, setIsPasswordRequired] = useState(false);
  const [password, setPassword] = useState('');
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  // Shared Note Data
  const [noteData, setNoteData] = useState<{
    id: string;
    title: string;
    content: string;
    color: string;
    textColor: string;
    permission: string;
    updatedAt: string;
    author: string;
    attachments: FileAttachment[];
  } | null>(null);

  // Shared Board Data
  const [boardData, setBoardData] = useState<SharedBoardData | null>(null);
  const [selectedBoardNote, setSelectedBoardNote] = useState<SharedBoardNote | null>(null);

  const fetchPublicItem = async (pwd?: string) => {
    if (!code) return;
    try {
      setIsLoading(true);
      let apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      if (typeof window !== 'undefined') {
        const host = window.location.hostname;
        if (host && host !== 'localhost' && host !== '127.0.0.1') {
          apiUrl = `${window.location.protocol}//${host}:5000/api`;
        }
      }
      const headers: Record<string, string> = {};
      if (pwd) {
        headers['x-share-password'] = pwd;
      }

      // 1. Try fetching as a shared note
      try {
        const res = await axios.get(`${apiUrl}/share/public/${code}`, { headers });
        setNoteData(res.data);
        setBoardData(null);
        setIsPasswordRequired(false);
        return;
      } catch (noteErr: any) {
        if (noteErr.response?.status === 401 && noteErr.response?.data?.isPasswordRequired) {
          setIsPasswordRequired(true);
          if (pwd) {
            setErrorMsg(noteErr.response?.data?.error || 'รหัสผ่านไม่ถูกต้อง');
          }
          return;
        }
      }

      // 2. If not a note, try fetching as a shared board
      try {
        const boardRes = await axios.get(`${apiUrl}/boards/shared/${code}`);
        if (boardRes.data && boardRes.data.id) {
          setBoardData(boardRes.data);
          setNoteData(null);
          setIsPasswordRequired(false);
          return;
        }
      } catch (boardErr: any) {
        // Neither note nor board was found
      }

      setErrorMsg('ไม่พบบันทึกหรือกระดานนี้ หรือลิงก์การแชร์ถูกปิดการใช้งานแล้ว');
    } catch (err: any) {
      setErrorMsg('เกิดข้อผิดพลาดในการเปิดลิงก์ที่แชร์');
    } finally {
      setIsLoading(false);
      setIsSubmittingPassword(false);
    }
  };

  useEffect(() => {
    if (code) {
      fetchPublicItem();
    }
  }, [code]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    setIsSubmittingPassword(true);
    fetchPublicItem(password.trim());
  };

  const handleCopyContent = () => {
    if (!noteData) return;
    const plain = stripHtmlTags(noteData.content);
    navigator.clipboard.writeText(`${noteData.title}\n\n${plain}`);
    setIsCopied(true);
    toast.success('คัดลอกเนื้อหาเรียบร้อยแล้ว');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleShareNative = () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      const title = noteData?.title || boardData?.name || 'SecureNote Share';
      const text = noteData ? stripHtmlTags(noteData.content) : `ดูกระดาน "${boardData?.name}" บน SecureNote`;
      navigator.share({ title, text, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('คัดลอกลิงก์เรียบร้อยแล้ว');
    }
  };

  const pageTitle = noteData
    ? `${noteData.title || 'ไม่มีชื่อบันทึก'} - SecureNote Share`
    : boardData
    ? `กระดาน ${boardData.name} - SecureNote Share`
    : 'Shared - SecureNote';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col items-center py-6 sm:py-8 px-4 transition-colors">
      <Head>
        <title>{pageTitle}</title>
      </Head>

      {/* Brand Header */}
      <header className="w-full max-w-4xl flex items-center justify-between mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center font-bold text-base shadow-md">
            🔒
          </div>
          <div>
            <h1 className="font-extrabold text-sm tracking-tight text-slate-800 dark:text-slate-100">SecureNote</h1>
            <p className="text-[10px] text-slate-400">
              {boardData ? 'Shared Board Viewer' : 'Shared Note Reader'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Native Share button */}
          {(noteData || boardData) && (
            <button
              onClick={handleShareNative}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-xl transition shadow-xs"
              title="แชร์ลิงก์นี้ต่อ"
            >
              <Share2 size={13} />
              <span className="hidden sm:inline">แชร์ต่อ</span>
            </button>
          )}

          <a
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">เข้าสู่ระบบ SecureNote</span>
            <span className="sm:hidden">เข้าสู่ระบบ</span>
          </a>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-4xl">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            <p className="text-xs text-slate-400">กำลังเปิดข้อมูลที่แชร์...</p>
          </div>
        )}

        {/* Password Prompt */}
        {!isLoading && isPasswordRequired && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl border border-slate-200 dark:border-slate-800 max-w-md mx-auto text-center space-y-6 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-inner">
              <Lock className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">บันทึกนี้ได้รับการป้องกันด้วยรหัสผ่าน</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                เจ้าของบันทึกได้ตั้งรหัสผ่านไว้ กรุณาใส่รหัสผ่านเพื่อเข้าอ่าน
              </p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  placeholder="กรอกรหัสผ่านเพื่อปลดล็อก..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
                />
              </div>

              {errorMsg && (
                <p className="text-xs text-rose-500 font-medium">{errorMsg}</p>
              )}

              <button
                type="submit"
                disabled={isSubmittingPassword}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-md flex items-center justify-center gap-2"
              >
                {isSubmittingPassword && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>ปลดล็อกเพื่ออ่านบันทึก</span>
              </button>
            </form>
          </div>
        )}

        {/* Error State */}
        {!isLoading && !isPasswordRequired && !noteData && !boardData && errorMsg && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center max-w-md mx-auto border border-slate-200 dark:border-slate-800 shadow space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-500 flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base">ไม่สามารถเปิดข้อมูลได้</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{errorMsg}</p>
          </div>
        )}

        {/* ────────────── 1. SHARED NOTE VIEWER ────────────── */}
        {!isLoading && noteData && (
          <article className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-200 dark:border-slate-800 space-y-6 animate-fade-in">
            {/* Meta bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm shadow">
                  {noteData.author?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                    <User className="w-3.5 h-3.5 text-indigo-500" />
                    <span>เขียนโดย: {noteData.author}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                    <Calendar className="w-3 h-3" />
                    <span>
                      อัปเดตเมื่อ:{' '}
                      {formatDistanceToNow(new Date(noteData.updatedAt), {
                        addSuffix: true,
                        locale: th,
                      })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyContent}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium transition-all shadow-xs"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? 'คัดลอกแล้ว' : 'คัดลอกข้อความ'}</span>
                </button>
              </div>
            </div>

            {/* Note Title */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight leading-snug">
              {noteData.title || 'ไม่มีชื่อบันทึก'}
            </h1>

            {/* Note Content */}
            <div
              className="prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 leading-relaxed font-sans pt-2 border-t border-slate-50 dark:border-slate-800/50"
              dangerouslySetInnerHTML={{ __html: noteData.content }}
            />

            {/* Attachments Section if any */}
            {noteData.attachments && noteData.attachments.length > 0 && (
              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5" />
                  <span>ไฟล์แนบ ({noteData.attachments.length})</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {noteData.attachments.map((att) => {
                    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
                    const backendOrigin = apiUrl.replace(/\/api$/, '');
                    const downloadUrl = att.url.startsWith('http') ? att.url : `${backendOrigin}${att.url}`;

                    return (
                      <div
                        key={att.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <FileText className="w-5 h-5 text-indigo-500 shrink-0" />
                          <div className="truncate">
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                              {att.originalName}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {(att.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        <a
                          href={downloadUrl}
                          download={att.originalName}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-200 hover:text-indigo-600 shadow-xs border border-slate-200 dark:border-slate-600 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </article>
        )}

        {/* ────────────── 2. SHARED BOARD VIEWER ────────────── */}
        {!isLoading && boardData && (
          <div className="space-y-6 animate-fade-in">
            {/* Board Header Banner */}
            <div
              className="p-6 sm:p-8 rounded-3xl shadow-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 relative overflow-hidden"
              style={{ borderTop: `6px solid ${boardData.color || '#4F46E5'}` }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                      {boardData.name}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                      {boardData.notes?.length || 0} โน้ต
                    </span>
                  </div>
                  {boardData.description && (
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                      {boardData.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-2">
                    <User size={13} className="text-indigo-500" />
                    <span>สร้างโดย: <strong className="text-slate-700 dark:text-slate-300">{boardData.user?.username}</strong></span>
                    <span>•</span>
                    <span>กระดานสาธารณะ</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      toast.success('คัดลอกลิงก์กระดานแล้ว');
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 transition"
                  >
                    <Copy size={13} />
                    <span>คัดลอกลิงก์กระดาน</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Notes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {boardData.notes && boardData.notes.length > 0 ? (
                boardData.notes.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => setSelectedBoardNote(n)}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between group"
                    style={{ borderTop: `4px solid ${n.color || '#FDE047'}` }}
                  >
                    <div className="space-y-2">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-2">
                        {n.title || 'ไม่มีชื่อบันทึก'}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-4 leading-relaxed font-sans">
                        {stripHtmlTags(n.content) || '(ไม่มีเนื้อหา)'}
                      </p>
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                      <span>{formatDistanceToNow(new Date(n.updatedAt), { addSuffix: true })}</span>
                      {n.attachments && n.attachments.length > 0 && (
                        <span className="flex items-center gap-1 text-indigo-500 font-semibold">
                          <Paperclip size={11} />
                          {n.attachments.length}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-12 text-center text-slate-400 text-xs">
                  ยังไม่มีโน้ตบนกระดานนี้
                </div>
              )}
            </div>

            {/* Note Reader Modal inside Shared Board */}
            {selectedBoardNote && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
                onClick={() => setSelectedBoardNote(null)}
              >
                <div
                  className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[85vh] overflow-y-auto space-y-4"
                  onClick={(e) => e.stopPropagation()}
                  style={{ borderTop: `6px solid ${selectedBoardNote.color || '#FDE047'}` }}
                >
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                      {selectedBoardNote.title || 'ไม่มีชื่อบันทึก'}
                    </h3>
                    <button
                      onClick={() => setSelectedBoardNote(null)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div
                    className="prose dark:prose-invert max-w-none text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-sans"
                    dangerouslySetInnerHTML={{ __html: selectedBoardNote.content }}
                  />

                  {selectedBoardNote.attachments && selectedBoardNote.attachments.length > 0 && (
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                      <p className="text-xs font-bold text-slate-400 uppercase">ไฟล์แนบ</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {selectedBoardNote.attachments.map((att) => {
                          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
                          const backendOrigin = apiUrl.replace(/\/api$/, '');
                          const downloadUrl = att.url.startsWith('http') ? att.url : `${backendOrigin}${att.url}`;

                          return (
                            <a
                              key={att.id}
                              href={downloadUrl}
                              download={att.originalName}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:text-indigo-600 transition"
                            >
                              <span className="truncate pr-2">{att.originalName}</span>
                              <Download size={14} className="shrink-0" />
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 text-center text-[11px] text-slate-400">
        สร้างและแบ่งปันอย่างปลอดภัยด้วย SecureNote • End-to-End Encrypted Web Notes
      </footer>
    </div>
  );
}
