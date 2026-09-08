import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import {
  Share2,
  Lock,
  Eye,
  Edit3,
  LayoutGrid,
  Columns,
  Download,
  FileText,
  File,
  X,
  ExternalLink,
  Maximize2,
} from 'lucide-react';
import NoteConnectionCanvas from '@/components/board/NoteConnectionCanvas';
import FullscreenNoteModal from '@/components/notes/FullscreenNoteModal';
import { Note, Board, NoteConnection } from '@/types';
import toast from 'react-hot-toast';
import { stripHtmlTags } from '@/utils/editorHelper';

export default function SharedBoardPage() {
  const router = useRouter();
  const { code } = router.query;

  const [board, setBoard] = useState<Board | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [connections, setConnections] = useState<NoteConnection[]>([]);
  const [viewMode, setViewMode] = useState<'freeform' | 'kanban'>('freeform');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [fullscreenNote, setFullscreenNote] = useState<Note | null>(null);

  const apiHost = typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}:5000`
    : 'http://localhost:5000';

  useEffect(() => {
    if (!code) return;

    const fetchSharedBoard = async () => {
      try {
        setIsLoading(true);
        const res = await axios.get(`${apiHost}/api/boards/shared/${code}`);
        setBoard(res.data);
        setNotes(res.data.notes || []);
        setConnections(res.data.connections || []);
        setIsLoading(false);
      } catch (err: any) {
        setError(err.response?.data?.error || 'ไม่พบกระดานที่แชร์ หรือกระดานนี้ไม่ได้เปิดสาธารณะ');
        setIsLoading(false);
      }
    };

    fetchSharedBoard();
  }, [code, apiHost]);

  // Socket.io for real-time collaboration if board is editable
  useEffect(() => {
    if (!board || board.sharePermission !== 'edit') return;

    const socket: Socket = io(apiHost);
    socket.emit('join-board', board.id);

    socket.on('remote-note-moved', (data: { noteId: string; posX: number; posY: number }) => {
      setNotes((prev) =>
        prev.map((n) => (n.id === data.noteId ? { ...n, posX: data.posX, posY: data.posY } : n))
      );
    });

    socket.on('remote-note-updated', (data: { note: Note }) => {
      setNotes((prev) =>
        prev.map((n) => (n.id === data.note.id ? { ...n, ...data.note } : n))
      );
    });

    return () => {
      socket.emit('leave-board', board.id);
      socket.disconnect();
    };
  }, [board, apiHost]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-400">กำลังโหลดกระดานโน้ต...</p>
        </div>
      </div>
    );
  }

  if (error || !board) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
        <div className="max-w-md w-full p-8 bg-slate-800 rounded-3xl border border-slate-700 text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 bg-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center mx-auto">
            <Lock size={24} />
          </div>
          <h2 className="text-lg font-bold text-white">ไม่สามารถเปิดกระดานนี้ได้</h2>
          <p className="text-xs text-slate-400 leading-relaxed">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow transition"
          >
            กลับสู่หน้าหลัก
          </button>
        </div>
      </div>
    );
  }

  const isEditable = board.sharePermission === 'edit';

  return (
    <>
      <Head>
        <title>{board.name} - แชร์จาก NoteOnWeb</title>
      </Head>

      <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100 select-none overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 px-6 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between gap-4 z-40">
          <div className="flex items-center gap-3">
            <div
              className="w-3.5 h-3.5 rounded-full shadow-sm"
              style={{ backgroundColor: board.color || '#F59E0B' }}
            />
            <div>
              <h1 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                <span>{board.name}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                    isEditable
                      ? 'bg-indigo-950 text-indigo-300 border border-indigo-700'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                  }`}
                >
                  {isEditable ? <Edit3 size={10} /> : <Eye size={10} />}
                  <span>{isEditable ? 'แก้ไขร่วมกันได้ (Editable)' : 'ดูอย่างเดียว (Public View)'}</span>
                </span>
              </h1>
              {board.description && (
                <p className="text-[11px] text-slate-400 truncate max-w-sm">{board.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Switcher */}
            <div className="flex bg-slate-800 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setViewMode('freeform')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                  viewMode === 'freeform'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutGrid size={14} />
                <span className="hidden sm:inline">กระดานอิสระ</span>
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                  viewMode === 'kanban'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Columns size={14} />
                <span className="hidden sm:inline">กระดานคัมบัง</span>
              </button>
            </div>

            <button
              onClick={() => router.push('/dashboard')}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition flex items-center gap-1"
            >
              <span>เปิดในแอป</span>
              <ExternalLink size={13} />
            </button>
          </div>
        </header>

        {/* Board Surface Area */}
        <main className="flex-1 overflow-auto relative p-6 bg-[#18181b]">
          {viewMode === 'freeform' ? (
            <div className="min-w-[2000px] min-h-[1400px] relative">
              {/* SVG Connections Canvas */}
              <NoteConnectionCanvas connections={connections} notes={notes} />

              {/* Sticky Notes */}
              {notes.map((note, idx) => {
                const attachments = note.attachments || [];
                const paperColor = note.color || '#FEF08A';
                const textColor = note.textColor || '#0F172A';

                return (
                  <div
                    key={note.id}
                    style={{
                      left: `${note.posX ?? 80 + (idx % 5) * 280}px`,
                      top: `${note.posY ?? 80 + Math.floor(idx / 5) * 320}px`,
                      width: `${note.width ?? 260}px`,
                      minHeight: `${note.height ?? 220}px`,
                      backgroundColor: paperColor,
                      color: textColor,
                    }}
                    className="absolute rounded-sm p-4 shadow-xl border-t-2 border-black/10 select-none z-20 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <h3 className="font-bold text-sm line-clamp-2">
                          {note.title || 'ไม่มีชื่อ'}
                        </h3>
                        <button
                          onClick={() => setFullscreenNote(note)}
                          className="p-1 rounded hover:bg-black/10 transition shrink-0"
                          title="ดูและแก้ไขโน้ตนี้แบบเต็มจอ"
                        >
                          <Maximize2 size={13} />
                        </button>
                      </div>
                      {note.content && (
                        <p className="text-xs whitespace-pre-wrap leading-relaxed opacity-85 mb-2">
                          {stripHtmlTags(note.content)}
                        </p>
                      )}

                      {/* Attachments */}
                      {attachments.length > 0 && (
                        <div className="space-y-1.5 pt-1 border-t border-black/10">
                          {attachments.map((att) => {
                            const isImg = att.mimeType.startsWith('image/');
                            const isPdf = att.mimeType.includes('pdf');
                            const fileUrl = `${apiHost}${att.url}`;

                            return (
                              <div
                                key={att.id}
                                className="flex items-center justify-between gap-2 p-1.5 bg-black/5 rounded-lg text-xs"
                              >
                                <div className="flex items-center gap-1.5 overflow-hidden">
                                  {isImg ? (
                                    <img
                                      src={fileUrl}
                                      alt={att.originalName}
                                      onClick={() => setPreviewImage(fileUrl)}
                                      className="w-6 h-6 object-cover rounded cursor-pointer"
                                    />
                                  ) : isPdf ? (
                                    <FileText size={14} className="text-rose-600" />
                                  ) : (
                                    <File size={14} className="text-indigo-600" />
                                  )}
                                  <span className="truncate text-[11px] font-medium">{att.originalName}</span>
                                </div>
                                <a
                                  href={fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  download={att.originalName}
                                  className="p-1 hover:bg-black/10 rounded"
                                >
                                  <Download size={12} />
                                </a>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="pt-2 mt-2 border-t border-black/10 text-[10px] opacity-60 flex justify-between">
                      <span>{note.kanbanStatus ? note.kanbanStatus.toUpperCase() : 'NOTE'}</span>
                      <span>NoteOnWeb</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Kanban View Mode in Public Board */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto h-full">
              {['todo', 'doing', 'done'].map((status) => {
                const colNotes = notes.filter((n) => (n.kanbanStatus || 'todo') === status);
                const colTitle = status === 'todo' ? 'To Do (ต้องทำ)' : status === 'doing' ? 'Doing (กำลังทำ)' : 'Done (เสร็จแล้ว)';

                return (
                  <div
                    key={status}
                    className="bg-slate-800/60 rounded-2xl border border-slate-700 p-4 flex flex-col space-y-3"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-700">
                      <h3 className="font-bold text-sm text-white">{colTitle}</h3>
                      <span className="px-2 py-0.5 rounded-full text-xs bg-slate-700 font-bold">
                        {colNotes.length}
                      </span>
                    </div>

                    <div className="space-y-3 overflow-y-auto flex-1">
                      {colNotes.map((note) => (
                        <div
                          key={note.id}
                          style={{
                            backgroundColor: note.color || '#FEF08A',
                            color: note.textColor || '#0F172A',
                          }}
                          className="p-3.5 rounded-xl shadow-md space-y-1.5"
                        >
                          <div className="flex items-start justify-between gap-1">
                            <h4 className="font-bold text-xs">{note.title}</h4>
                            <button
                              onClick={() => setFullscreenNote(note)}
                              className="p-1 rounded hover:bg-black/10 transition shrink-0"
                              title="ดูและแก้ไขโน้ตนี้แบบเต็มจอ"
                            >
                              <Maximize2 size={12} />
                            </button>
                          </div>
                          {note.content && (
                            <p className="text-[11px] opacity-80 line-clamp-3 leading-relaxed">
                              {stripHtmlTags(note.content)}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Full Image Preview Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div className="relative max-w-4xl max-h-[90vh]">
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

      {/* Fullscreen Note Modal */}
      {fullscreenNote && (
        <FullscreenNoteModal
          note={fullscreenNote}
          isOpen={!!fullscreenNote}
          onClose={() => setFullscreenNote(null)}
        />
      )}
    </>
  );
}
