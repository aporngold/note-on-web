import React, { useState, useMemo } from 'react';
import { X, Sparkles, Navigation, Lightbulb, Trophy, Bookmark, Info } from 'lucide-react';
import { BOARD_STICKERS, BoardStickerItem } from './stickerData';

interface BoardStickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSticker: (sticker: BoardStickerItem) => void;
}

export default function BoardStickerModal({
  isOpen,
  onClose,
  onSelectSticker,
}: BoardStickerModalProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [showCredits, setShowCredits] = useState(false);

  const filteredStickers = useMemo(() => {
    if (activeCategory === 'all') return BOARD_STICKERS;
    return BOARD_STICKERS.filter((s) => s.category === activeCategory);
  }, [activeCategory]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden max-h-[90vh] text-slate-800 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Modal Header ── */}
        <div className="p-4 sm:px-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-purple-500/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shadow-inner">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <span>สติกเกอร์ตกแต่งกระดาน</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 font-mono">
                  Stickers
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                แปะบนบอร์ด หมุน ย่อ-ขยาย หรือลบได้อย่างอิสระ
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
            title="ปิด"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Description Banner (as in s.mp4) ── */}
        <div className="px-4 sm:px-6 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
          <Info size={15} className="text-indigo-500 shrink-0" />
          <span>
            สติกเกอร์สำหรับตกแต่งหรือเชื่อมโยงความคิด สามารถย้าย หมุนองศา และปรับขนาดได้เหมือนโน้ต
          </span>
        </div>

        {/* ── Category Tabs ── */}
        <div className="flex items-center gap-1.5 px-4 sm:px-6 py-2.5 border-b border-slate-100 dark:border-slate-800 overflow-x-auto custom-scrollbar text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 rounded-xl shrink-0 transition ${
              activeCategory === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            ทั้งหมด ({BOARD_STICKERS.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('arrows')}
            className={`px-3 py-1.5 rounded-xl shrink-0 transition flex items-center gap-1.5 ${
              activeCategory === 'arrows'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            <Navigation size={13} className="rotate-45" />
            <span>ลูกศร & เส้นชี้ ({BOARD_STICKERS.filter((s) => s.category === 'arrows').length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('ideas')}
            className={`px-3 py-1.5 rounded-xl shrink-0 transition flex items-center gap-1.5 ${
              activeCategory === 'ideas'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            <Lightbulb size={13} />
            <span>ไอเดีย & ความคิด ({BOARD_STICKERS.filter((s) => s.category === 'ideas').length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('symbols')}
            className={`px-3 py-1.5 rounded-xl shrink-0 transition flex items-center gap-1.5 ${
              activeCategory === 'symbols'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            <Trophy size={13} />
            <span>สัญลักษณ์ & 3D ({BOARD_STICKERS.filter((s) => s.category === 'symbols').length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('stamps')}
            className={`px-3 py-1.5 rounded-xl shrink-0 transition flex items-center gap-1.5 ${
              activeCategory === 'stamps'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            <Bookmark size={13} />
            <span>แสตมป์ & ป้าย ({BOARD_STICKERS.filter((s) => s.category === 'stamps').length})</span>
          </button>
        </div>

        {/* ── Grid of Stickers ── */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[58vh] grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 sm:gap-4 custom-scrollbar">
          {filteredStickers.map((sticker) => (
            <button
              key={sticker.id}
              type="button"
              onClick={() => {
                onSelectSticker(sticker);
                onClose();
              }}
              className="group relative aspect-square p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600/60 shadow-xs hover:shadow-xl transition-all duration-200 flex flex-col items-center justify-center gap-2 cursor-pointer active:scale-95"
              title={`คลิกเพื่อแปะ ${sticker.thName} ลงบนบอร์ด`}
            >
              <div className="flex-1 w-full flex items-center justify-center overflow-hidden">
                <img
                  src={sticker.url}
                  alt={sticker.name}
                  loading="lazy"
                  className="max-w-full max-h-full object-contain drop-shadow-sm group-hover:scale-115 group-hover:drop-shadow-md transition-transform duration-200 pointer-events-none"
                />
              </div>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 truncate w-full text-center">
                {sticker.thName}
              </span>
            </button>
          ))}
        </div>

        {/* ── Modal Footer ── */}
        <div className="px-4 sm:px-6 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={() => setShowCredits(!showCredits)}
            className="text-xs font-bold text-slate-500 hover:text-indigo-600 dark:text-slate-400 transition"
          >
            {showCredits ? 'ซ่อน CREDITS' : 'CREDITS (ลิขสิทธิ์ฟรี)'}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition active:scale-95"
          >
            CANCEL (ปิด)
          </button>
        </div>

        {/* ── Credits Disclosure ── */}
        {showCredits && (
          <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/40 border-t border-indigo-100 dark:border-indigo-900/50 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
            <p className="font-bold text-indigo-700 dark:text-indigo-300">
              ℹ️ ข้อมูลลิขสิทธิ์ภาพ (100% Free & Legal):
            </p>
            <p>
              • <strong>Vectors & Arrows:</strong> สร้างขึ้นด้วย SVG ภายใต้สัญญาอนุญาต MIT License / Public Domain (CC0)
            </p>
            <p>
              • <strong>3D Graphics:</strong> Microsoft Fluent UI Assets ภายใต้ MIT License อนุญาตใช้งานและเผยแพร่เชิงพาณิชย์ได้ฟรี
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
