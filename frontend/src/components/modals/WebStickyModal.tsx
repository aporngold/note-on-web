import React, { useState } from 'react';
import {
  Compass,
  X,
  Plus,
  Pin,
  ExternalLink,
  Sparkles,
  Code2,
  Copy,
  Check,
} from 'lucide-react';
import { useNoteStore } from '@/store/noteStore';
import toast from 'react-hot-toast';

interface WebStickyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface WebMiniSticky {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
}

const PRESET_PAGES = [
  { name: 'Wikipedia (AI Overview)', url: 'https://en.wikipedia.org/wiki/Artificial_intelligence' },
  { name: 'Tech Blog / Docs', url: 'https://developer.mozilla.org/en-US/' },
  { name: 'Financial News Sample', url: 'https://finance.yahoo.com' },
];

export default function WebStickyModal({ isOpen, onClose }: WebStickyModalProps) {
  const { createNote, activeBoardId } = useNoteStore();
  const [targetUrl, setTargetUrl] = useState('https://en.wikipedia.org/wiki/Artificial_intelligence');
  const [stickies, setStickies] = useState<WebMiniSticky[]>([
    {
      id: 'ws-1',
      text: '💡 ไอเดีย: เก็บสถิติตรงหัวข้อนี้ไว้ทำรายงานวันศุกร์!',
      x: 120,
      y: 160,
      color: '#FEF08A',
    },
    {
      id: 'ws-2',
      text: '📌 จุดสำคัญ: ตรวจสอบความถูกต้องของข้อมูลอ้างอิง',
      x: 480,
      y: 220,
      color: '#BAE6FD',
    },
  ]);

  const [activeTab, setActiveTab] = useState<'simulator' | 'extension-code'>('simulator');
  const [isCopiedBookmarklet, setIsCopiedBookmarklet] = useState(false);

  if (!isOpen) return null;

  const handleAddWebSticky = (color: string = '#FEF08A') => {
    const newSticky: WebMiniSticky = {
      id: `ws-${Date.now()}`,
      text: 'โน้ตใหม่บนหน้าเว็บ...',
      x: 180 + (stickies.length * 30) % 300,
      y: 180 + (stickies.length * 40) % 250,
      color,
    };
    setStickies([...stickies, newSticky]);
  };

  const handleSaveToBoard = async (s: WebMiniSticky) => {
    await createNote({
      title: `โน้ตจากเว็บ (${new URL(targetUrl).hostname})`,
      content: `${s.text}\n\nที่มา: ${targetUrl}`,
      color: s.color,
      boardId: activeBoardId || undefined,
    });
    toast.success('บันทึกโน้ตลงในกระดานหลักแล้ว');
  };

  const handleRemoveSticky = (id: string) => {
    setStickies(stickies.filter((s) => s.id !== id));
  };

  const bookmarkletCode = `javascript:(function(){const d=document.createElement('div');d.style.cssText='position:fixed;bottom:20px;right:20px;width:240px;background:#FEF08A;color:#0F172A;padding:12px;border-radius:8px;box-shadow:0 10px 25px rgba(0,0,0,0.3);z-index:999999;font-family:sans-serif;font-size:13px;border-top:3px solid #FDE047;';d.innerHTML='<div style="display:flex;justify-content:space-between;font-weight:bold;margin-bottom:6px;"><span>📌 Note Board Sticky</span><span style="cursor:pointer;" onclick="this.parentElement.parentElement.remove()">✕</span></div><textarea style="width:100%;height:80px;background:transparent;border:none;outline:none;resize:none;font-size:12px;" placeholder="จดโน้ตบนหน้านี้..."></textarea>';document.body.appendChild(d);})();`;

  const copyBookmarklet = () => {
    navigator.clipboard.writeText(bookmarkletCode);
    setIsCopiedBookmarklet(true);
    toast.success('คัดลอกโค้ด Bookmarklet แล้ว');
    setTimeout(() => setIsCopiedBookmarklet(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 rounded-xl">
              <Compass size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>Web Sticky Note (จำลองส่วนขยาย Chrome)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-bold">
                  Chrome Style
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                แทรกและแปะโพสต์อิทลอยบนหน้าเว็บไซต์ใดก็ได้ พร้อมบันทึกกลับเข้ามาใน Note Board
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setActiveTab('simulator')}
                className={`px-3 py-1 rounded-lg transition ${
                  activeTab === 'simulator'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                จำลองหน้าเว็บ (Live Preview)
              </button>
              <button
                onClick={() => setActiveTab('extension-code')}
                className={`px-3 py-1 rounded-lg transition ${
                  activeTab === 'extension-code'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                วิธีติดตั้งบนเบราว์เซอร์จริง
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {activeTab === 'simulator' ? (
          <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden">
            {/* Browser Address Bar */}
            <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/60 flex items-center justify-between gap-3 text-xs shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-400 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" />
              </div>

              <div className="flex-1 max-w-xl flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                <span className="text-slate-400">🔒 https://</span>
                <input
                  type="text"
                  value={targetUrl.replace(/^https?:\/\//, '')}
                  onChange={(e) => setTargetUrl(`https://${e.target.value}`)}
                  className="flex-1 bg-transparent focus:outline-none"
                  placeholder="domain.com/page..."
                />
              </div>

              {/* Add Web Sticky Button */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleAddWebSticky('#FEF08A')}
                  className="px-2.5 py-1 bg-amber-300 hover:bg-amber-400 text-amber-950 font-bold rounded-lg text-xs flex items-center gap-1 shadow-xs transition"
                  title="แปะโน้ตบนหน้านี้"
                >
                  <Plus size={14} />
                  <span>+ แปะโน้ตบนเว็บ</span>
                </button>
                <button
                  onClick={() => handleAddWebSticky('#FBCFE8')}
                  className="px-2 py-1 bg-pink-300 hover:bg-pink-400 text-pink-950 font-bold rounded-lg text-xs shadow-xs transition"
                >
                  + ชมพู
                </button>
              </div>
            </div>

            {/* Simulated Web Page Content Area with Overlay Stickies */}
            <div className="flex-1 relative overflow-hidden bg-slate-200 dark:bg-slate-950">
              {/* Simulated Website Frame */}
              <div className="w-full h-full p-8 overflow-y-auto bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 select-text">
                <div className="max-w-3xl mx-auto space-y-6">
                  <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                      Web View Simulation
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-bold mt-1 text-slate-900 dark:text-white">
                      Artificial Intelligence &amp; Modern Agentic Applications
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">
                      From Wikipedia, the free encyclopedia • Last edited recently
                    </p>
                  </div>

                  <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    Artificial intelligence (AI) is intelligence demonstrated by machines, as opposed to human or animal intelligence. AI applications include advanced web search engines, recommendation systems, understanding human speech, autonomous vehicles, generative or creative tools, and interactive sticky note organizers.
                  </p>

                  <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-2">
                    <h2 className="font-bold text-sm text-slate-900 dark:text-white">
                      1. History &amp; Foundations of Interactive Canvas Systems
                    </h2>
                    <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                      Early personal organizers relied on static databases. Modern web-based canvas architectures allow freeform 2D positioning, SVG bezier vector linkages, and real-time synchronization over bidirectional WebSocket streams.
                    </p>
                  </div>

                  <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    Sticky note overlays allow users to highlight paragraphs, annotate research sources, and link ideas without modifying the underlying webpage.
                  </p>
                </div>
              </div>

              {/* Floating Web Sticky Notes */}
              {stickies.map((s) => (
                <div
                  key={s.id}
                  style={{
                    left: `${s.x}px`,
                    top: `${s.y}px`,
                    backgroundColor: s.color,
                  }}
                  className="absolute w-56 p-3 rounded-lg shadow-2xl border-t-4 border-black/20 text-slate-900 animate-fade-in z-30"
                >
                  <div className="flex items-center justify-between pb-1 mb-1 border-b border-black/10 text-[10px] font-bold">
                    <span className="flex items-center gap-1">
                      <Pin size={11} className="fill-current text-rose-600" />
                      <span>NoteOnWeb Pin</span>
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleSaveToBoard(s)}
                        className="px-1.5 py-0.5 rounded bg-black/10 hover:bg-black/20 text-[9px] transition"
                        title="บันทึกเข้ากระดาน Note Board"
                      >
                        บันทึกเข้าบอร์ด
                      </button>
                      <button
                        onClick={() => handleRemoveSticky(s.id)}
                        className="p-0.5 rounded hover:bg-rose-500/20 text-rose-700"
                        title="ลบโน้ตนี้"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>

                  <textarea
                    value={s.text}
                    onChange={(e) => {
                      const val = e.target.value;
                      setStickies((prev) =>
                        prev.map((item) => (item.id === s.id ? { ...item, text: val } : item))
                      );
                    }}
                    className="w-full h-20 bg-transparent resize-none text-xs focus:outline-none leading-relaxed placeholder-black/40 font-medium"
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Extension / Bookmarklet Guide Tab */
          <div className="flex-1 p-6 sm:p-8 overflow-y-auto space-y-6">
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="space-y-2">
                <h4 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="text-amber-500" size={20} />
                  <span>วิธีแทรก Note Board Sticky บนหน้าเว็บไซต์จริง</span>
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  คุณสามารถใช้ <b>Bookmarklet</b> (ที่คั่นหน้าเว็บอัจฉริยะ) เพื่อคลิกแล้วแทรกแผ่นโพสต์อิทลงบนเว็บใดก็ได้ใน Google Chrome, Microsoft Edge หรือ Safari ทันที!
                </p>
              </div>

              {/* Bookmarklet Box */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    โค้ด Bookmarklet สำเร็จรูป:
                  </span>
                  <button
                    onClick={copyBookmarklet}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition"
                  >
                    {isCopiedBookmarklet ? <Check size={14} /> : <Copy size={14} />}
                    <span>{isCopiedBookmarklet ? 'คัดลอกแล้ว' : 'คัดลอกโค้ด Bookmarklet'}</span>
                  </button>
                </div>

                <div className="p-3 bg-slate-900 rounded-xl text-emerald-400 font-mono text-[11px] overflow-x-auto select-all">
                  {bookmarkletCode}
                </div>
              </div>

              {/* Instructions Steps */}
              <div className="space-y-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  ขั้นตอนง่ายๆ 3 ขั้นตอน:
                </h5>
                <ol className="space-y-2 text-xs text-slate-600 dark:text-slate-300 list-decimal list-inside leading-relaxed">
                  <li>
                    สร้าง Bookmark ใหม่บนเบราว์เซอร์ของคุณ (กด <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-[10px]">Ctrl + D</kbd> หรือ <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-[10px]">Cmd + D</kbd>)
                  </li>
                  <li>
                    ตั้งชื่อว่า <b>&quot;📌 แปะ Note Board&quot;</b> แล้วนำโค้ดที่คัดลอกด้านบนไปใส่ในช่อง <b>URL</b>
                  </li>
                  <li>
                    เมื่อเปิดเว็บไซต์ใดก็ตาม เพียงคลิกปุ่ม Bookmark นี้ แผ่นโน้ตโพสต์อิทสีเหลืองจะปรากฏขึ้นมาบนหน้าเว็บนั้นทันที!
                  </li>
                </ol>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
