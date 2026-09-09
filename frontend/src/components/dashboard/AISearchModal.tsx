import React, { useState } from 'react';
import {
  X,
  Search,
  Sparkles,
  Bot,
  FileText,
  Calendar,
  Tag,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/utils/api';
import { Note } from '@/types';
import { stripHtmlTags } from '@/utils/editorHelper';

interface AISearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectNote: (note: Note) => void;
}

export default function AISearchModal({
  isOpen,
  onClose,
  onSelectNote,
}: AISearchModalProps) {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<Array<Note & { matchScore: number; snippet: string }>>([]);
  const [hasSearched, setHasSearched] = useState(false);

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    try {
      setIsLoading(true);
      setHasSearched(true);
      const res = await api.get('/ai/search', {
        params: { query: query.trim() },
      });
      setResults(res.data.results || []);
    } catch (e: any) {
      console.error('AI Search Error:', e);
      toast.error('การค้นหาล้มเหลว กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <form onSubmit={handleSearch} className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <input
            type="text"
            autoFocus
            placeholder="ค้นหาตามความหมาย เช่น 'โน้ตที่คุยเรื่องแผนการตลาด' หรือ 'บันทึกสูตรอาหาร'..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 text-sm bg-transparent border-none text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
          />
          {isLoading ? (
            <Loader2 className="w-5 h-5 text-indigo-500 animate-spin shrink-0" />
          ) : (
            <button
              type="submit"
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all shrink-0"
            >
              ค้นหา AI
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </form>

        {/* Results Body */}
        <div className="p-6 overflow-y-auto space-y-3">
          {hasSearched && results.length === 0 && !isLoading && (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <Bot className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="text-xs font-medium">ไม่พบบันทึกที่ตรงกับความหมายนี้</p>
              <p className="text-[11px]">ลองพิมพ์คำอธิบายหรือคำสำคัญอื่นดูนะครับ</p>
            </div>
          )}

          {!hasSearched && (
            <div className="text-center py-8 text-slate-400 space-y-2">
              <Sparkles className="w-7 h-7 mx-auto text-indigo-400" />
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                ระบบค้นหาอัจฉริยะ (Semantic AI Search)
              </p>
              <p className="text-[11px]">
                พิมพ์ภาษาธรรมชาติได้เลย ไม่จำเป็นต้องจำชื่อเรื่องที่ตรงเป๊ะ ระบบจะจับคู่ความหมายให้ทันที ฟรี 100%
              </p>
            </div>
          )}

          {results.map((note) => (
            <div
              key={note.id}
              onClick={() => {
                onSelectNote(note);
                onClose();
              }}
              className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 transition-all cursor-pointer group space-y-2 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                  {note.title || 'ไม่มีชื่อบันทึก'}
                </h4>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                    คะแนนตรง {note.matchScore}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                {note.snippet || stripHtmlTags(note.content).substring(0, 140)}
              </p>

              {note.labels && note.labels.length > 0 && (
                <div className="flex items-center gap-1.5 pt-1">
                  {note.labels.map((lbl) => (
                    <span
                      key={lbl.id}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                    >
                      #{lbl.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
