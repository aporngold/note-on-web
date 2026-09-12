import React, { useState } from 'react';
import { Palette, Image as ImageIcon, X, Check, Sparkles, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import ViewportPortal from '@/components/ui/ViewportPortal';

export interface BoardPattern {
  id: string;
  name: string;
  category: 'texture' | 'grid' | 'pattern';
  style: React.CSSProperties;
}

export const BOARD_PATTERNS: BoardPattern[] = [
  {
    id: 'cork',
    name: 'ไม้ก๊อกคลาสสิก',
    category: 'texture',
    style: {
      backgroundColor: '#d7a15c',
      backgroundImage: `
        radial-gradient(#b87b32 15%, transparent 16%),
        radial-gradient(#c28941 15%, transparent 16%),
        radial-gradient(#965e1b 15%, transparent 16%)
      `,
      backgroundSize: '60px 60px',
      backgroundPosition: '0 0, 30px 30px, 15px 45px',
    },
  },
  {
    id: 'cork-dark',
    name: 'ไม้ก๊อกวอลนัทเข้ม',
    category: 'texture',
    style: {
      backgroundColor: '#543317',
      backgroundImage: `
        radial-gradient(#3d230e 15%, transparent 16%),
        radial-gradient(#6b4322 15%, transparent 16%),
        radial-gradient(#261405 15%, transparent 16%)
      `,
      backgroundSize: '60px 60px',
      backgroundPosition: '0 0, 30px 30px, 15px 45px',
    },
  },
  {
    id: 'chalkboard',
    name: 'กระดานดำชอล์ก',
    category: 'texture',
    style: {
      backgroundColor: '#18181b',
      backgroundImage: `
        radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
        linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)
      `,
      backgroundSize: '20px 20px, 40px 40px, 40px 40px',
    },
  },
  {
    id: 'greenboard',
    name: 'กระดานเขียวคลาสสิก',
    category: 'texture',
    style: {
      backgroundColor: '#113c2b',
      backgroundImage: `
        radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px),
        linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)
      `,
      backgroundSize: '20px 20px, 40px 40px, 40px 40px',
    },
  },
  {
    id: 'wood',
    name: 'ไม้กระดานธรรมชาติ',
    category: 'texture',
    style: {
      backgroundColor: '#78350f',
      backgroundImage: `
        repeating-linear-gradient(90deg, transparent, transparent 48px, rgba(0,0,0,0.15) 49px, rgba(0,0,0,0.2) 50px),
        linear-gradient(to bottom, #713f12, #92400e)
      `,
      backgroundSize: '50px 100%, 100% 100%',
    },
  },
  {
    id: 'canvas',
    name: 'ผ้าลินินแคนวาส',
    category: 'texture',
    style: {
      backgroundColor: '#f1f5f9',
      backgroundImage: `
        linear-gradient(45deg, rgba(0,0,0,0.03) 25%, transparent 25%),
        linear-gradient(-45deg, rgba(0,0,0,0.03) 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, rgba(0,0,0,0.03) 75%),
        linear-gradient(-45deg, transparent 75%, rgba(0,0,0,0.03) 75%)
      `,
      backgroundSize: '16px 16px',
      backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
    },
  },
  {
    id: 'grid',
    name: 'ตารางจุดดาร์ก',
    category: 'grid',
    style: {
      backgroundColor: '#0f172a',
      backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.2) 1.2px, transparent 1.2px)`,
      backgroundSize: '24px 24px',
    },
  },
  {
    id: 'dots-light',
    name: 'ตารางจุดกระดาษขาว',
    category: 'grid',
    style: {
      backgroundColor: '#f8fafc',
      backgroundImage: `radial-gradient(#94a3b8 1.2px, transparent 1.2px)`,
      backgroundSize: '24px 24px',
    },
  },
  {
    id: 'lined',
    name: 'กระดาษสมุดมีเส้น',
    category: 'grid',
    style: {
      backgroundColor: '#fefce8',
      backgroundImage: `
        linear-gradient(to bottom, transparent 29px, #cbd5e1 30px),
        linear-gradient(to right, transparent 49px, #fca5a5 50px, transparent 51px)
      `,
      backgroundSize: '100% 30px, 100% 100%',
    },
  },
  {
    id: 'blueprint',
    name: 'ตารางบลูปริ้นท์',
    category: 'grid',
    style: {
      backgroundColor: '#0369a1',
      backgroundImage: `
        linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px),
        linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)
      `,
      backgroundSize: '100px 100px, 100px 100px, 20px 20px, 20px 20px',
    },
  },
  {
    id: 'graph',
    name: 'ตารางกราฟคณิต',
    category: 'grid',
    style: {
      backgroundColor: '#ffffff',
      backgroundImage: `
        linear-gradient(to right, #e2e8f0 1px, transparent 1px),
        linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)
      `,
      backgroundSize: '20px 20px',
    },
  },
  {
    id: 'gingham',
    name: 'ตารางกิงแฮมพาสเทล',
    category: 'grid',
    style: {
      backgroundColor: '#fef3c7',
      backgroundImage: `
        linear-gradient(45deg, rgba(245, 158, 11, 0.15) 25%, transparent 25%, transparent 75%, rgba(245, 158, 11, 0.15) 75%),
        linear-gradient(45deg, rgba(245, 158, 11, 0.15) 25%, transparent 25%, transparent 75%, rgba(245, 158, 11, 0.15) 75%)
      `,
      backgroundSize: '30px 30px',
      backgroundPosition: '0 0, 15px 15px',
    },
  },
  {
    id: 'galaxy',
    name: 'กาแล็กซีจักรวาล',
    category: 'pattern',
    style: {
      backgroundColor: '#090a1a',
      backgroundImage: `
        radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.25), transparent 60%),
        radial-gradient(circle at 80% 20%, rgba(236, 72, 153, 0.2), transparent 50%),
        radial-gradient(white 1px, transparent 1px),
        radial-gradient(rgba(255,255,255,0.7) 1.5px, transparent 1.5px)
      `,
      backgroundSize: '100% 100%, 100% 100%, 60px 60px, 130px 130px',
      backgroundPosition: '0 0, 0 0, 10px 10px, 40px 50px',
    },
  },
  {
    id: 'aurora',
    name: 'แสงเหนือออโรร่า',
    category: 'pattern',
    style: {
      backgroundColor: '#022c22',
      backgroundImage: `
        linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(6, 182, 212, 0.25) 50%, rgba(99, 102, 241, 0.25) 100%),
        radial-gradient(rgba(255,255,255,0.12) 1px, transparent 1px)
      `,
      backgroundSize: '100% 100%, 28px 28px',
    },
  },
  {
    id: 'hexagon',
    name: 'ไซเบอร์เฮกซากอน',
    category: 'pattern',
    style: {
      backgroundColor: '#0f172a',
      backgroundImage: `
        radial-gradient(circle at center, transparent 9px, #1e293b 10px, #1e293b 11px, transparent 12px),
        radial-gradient(circle at center, transparent 9px, #1e293b 10px, #1e293b 11px, transparent 12px)
      `,
      backgroundSize: '36px 36px',
      backgroundPosition: '0 0, 18px 18px',
    },
  },
  {
    id: 'clean',
    name: 'ขาวคลีนสตูดิโอ',
    category: 'pattern',
    style: {
      backgroundColor: '#f8fafc',
      backgroundImage: `radial-gradient(#cbd5e1 1.2px, transparent 1.2px)`,
      backgroundSize: '24px 24px',
    },
  },
];

export const CURATED_WALLPAPERS = [
  // ── กลุ่มที่ 1: วัสดุและพื้นผิวธรรมชาติ (Textures & Wood) ──
  {
    name: 'ไม้ก๊อกธรรมชาติ (Real Cork)',
    url: 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?q=80&w=1600&auto=format&fit=crop',
  },
  {
    name: 'ไม้โอ๊คอบอุ่น (Warm Oak Wood)',
    url: 'https://images.unsplash.com/photo-1546484396-fb3fc6f95f98?q=80&w=1600&auto=format&fit=crop',
  },
  {
    name: 'ไม้กระดานวินเทจ (Rustic Wood)',
    url: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?q=80&w=1600&auto=format&fit=crop',
  },
  {
    name: 'กระดาษคราฟท์ (Kraft Paper)',
    url: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?q=80&w=1600&auto=format&fit=crop',
  },
  {
    name: 'ปูนเปลือยลอฟท์ (Dark Concrete)',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1600&auto=format&fit=crop',
  },
  {
    name: 'หินอ่อนขาวคลีน (White Marble)',
    url: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?q=80&w=1600&auto=format&fit=crop',
  },
  {
    name: 'กำแพงอิฐขาวมินิมอล (White Brick)',
    url: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=1600&auto=format&fit=crop',
  },
  {
    name: 'ผนังปูนขัดมันสีเทา (Grey Cement)',
    url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1600&auto=format&fit=crop',
  },

  // ── กลุ่มที่ 2: โต๊ะทำงานและสตูดิโอ (Workspace & Desk) ──
  {
    name: 'โต๊ะทำงานมินิมอล (Warm Desk)',
    url: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?q=80&w=1600&auto=format&fit=crop',
  },
  {
    name: 'กาแฟยามเช้า (Morning Coffee)',
    url: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?q=80&w=1600&auto=format&fit=crop',
  },
  {
    name: 'มุมอ่านหนังสือสงบ (Cozy Reading)',
    url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=1600&auto=format&fit=crop',
  },
  {
    name: 'สมุดบันทึกและปากกา (Notebook & Pen)',
    url: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=1600&auto=format&fit=crop',
  },
  {
    name: 'โต๊ะไม้และแล็ปท็อป (Modern Desk)',
    url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1600&auto=format&fit=crop',
  },
  {
    name: 'สตูดิโอนักออกแบบ (Creative Studio)',
    url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?q=80&w=1600&auto=format&fit=crop',
  },

  // ── กลุ่มที่ 3: ธรรมชาติและทิวทัศน์ (Nature & Landscape) ──
  {
    name: 'ป่าไม้หมอก (Misty Forest)',
    url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=1600&auto=format&fit=crop',
  },
  {
    name: 'ทะเลสาบและภูเขา (Alpine Lake)',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1600&auto=format&fit=crop',
  },
  {
    name: 'พระอาทิตย์ตก (Sunset Glow)',
    url: 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?q=80&w=1600&auto=format&fit=crop',
  },
  {
    name: 'คลื่นทะเลสงบนิ่ง (Calm Ocean Waves)',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1600&auto=format&fit=crop',
  },
  {
    name: 'ทะเลทรายสีทอง (Golden Dunes)',
    url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?q=80&w=1600&auto=format&fit=crop',
  },
  {
    name: 'ภูเขาหิมะตระหง่าน (Snow Peak Mount)',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1600&auto=format&fit=crop',
  },
  {
    name: 'ใบไม้เขียวชอุ่ม (Lush Green Leaves)',
    url: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=1600&auto=format&fit=crop',
  },
  {
    name: 'แสงแดดยามเช้าลอดกิ่งไม้ (Morning Sunshine)',
    url: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?q=80&w=1600&auto=format&fit=crop',
  },

  // ── กลุ่มที่ 4: สถาปัตยกรรมและเมือง (Architecture & Cities) ──
  {
    name: 'สถาปัตยกรรมโมเดิร์น (Architecture)',
    url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1600&auto=format&fit=crop',
  },
  {
    name: 'แสงไฟเมืองกลางคืน (City Lights Night)',
    url: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?q=80&w=1600&auto=format&fit=crop',
  },
  {
    name: 'ตึกกระจกเรขาคณิต (Geometric Glass)',
    url: 'https://images.unsplash.com/photo-1486718448742-163732cd1544?q=80&w=1600&auto=format&fit=crop',
  },
  {
    name: 'บันไดวนมินิมอล (Spiral Geometry)',
    url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=1600&auto=format&fit=crop',
  },

  // ── กลุ่มที่ 5: มืด ลึกลับ กราเดียนท์ & อวกาศ (Dark, Gradient & Space) ──
  {
    name: 'ทางช้างเผือกราตรี (Milky Way Galaxy)',
    url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1600&auto=format&fit=crop',
  },
  {
    name: 'คลื่นสีน้ำเงินเข้ม (Deep Blue Silk)',
    url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=1600&auto=format&fit=crop',
  },
  {
    name: 'ไล่เฉดสีนีออนม่วงส้ม (Neon Gradient)',
    url: 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=1600&auto=format&fit=crop',
  },
  {
    name: 'หมอกควันสีม่วงมิดไนท์ (Midnight Smoke)',
    url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1600&auto=format&fit=crop',
  },
  {
    name: 'แสงไฟนีออนไซเบอร์พังก์ (Cyber Glow)',
    url: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?q=80&w=1600&auto=format&fit=crop',
  },
  {
    name: 'หยดน้ำบนกระจก (Raindrops on Glass)',
    url: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?q=80&w=1600&auto=format&fit=crop',
  },
  {
    name: 'ท้องฟ้ายามเย็นสีพาสเทล (Pastel Twilight)',
    url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1600&auto=format&fit=crop',
  },
  {
    name: 'แสงเหนือสีเขียวมรกต (Aurora Borealis)',
    url: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?q=80&w=1600&auto=format&fit=crop',
  },
  {
    name: 'คลื่นทะเลหมอกยามเช้า (Ocean Mist)',
    url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1600&auto=format&fit=crop',
  },
  {
    name: 'ผืนทรายระลอกคลื่น (Rippled Dunes)',
    url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?q=80&w=1600&auto=format&fit=crop',
  },
];

interface BoardBackgroundModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: string;
  currentBgImage: string | null;
  onSelectTheme: (themeId: string) => Promise<void>;
  onSelectWallpaper: (url: string | null) => Promise<void>;
}

export default function BoardBackgroundModal({
  isOpen,
  onClose,
  currentTheme,
  currentBgImage,
  onSelectTheme,
  onSelectWallpaper,
}: BoardBackgroundModalProps) {
  const [activeTab, setActiveTab] = useState<'patterns' | 'wallpapers'>('patterns');
  const [customUrlInput, setCustomUrlInput] = useState(currentBgImage || '');

  if (!isOpen) return null;

  const handleApplyCustomUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrlInput.trim()) {
      await onSelectWallpaper(null);
      toast.success('ล้างภาพพื้นหลังเรียบร้อยแล้ว');
      onClose();
      return;
    }
    await onSelectWallpaper(customUrlInput.trim());
    toast.success('เปลี่ยนภาพพื้นหลังเรียบร้อยแล้ว');
    onClose();
  };

  return (
    <ViewportPortal>
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in select-none"
        onClick={onClose}
      >
        <div
          className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
        {/* Header */}
        <div className="p-5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
              <Palette size={19} />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white tracking-tight">
                เปลี่ยนพื้นหลังกระดาน
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                เลือกลวดลายพื้นผิวธรรมชาติ หรือรูปภาพวอลเปเปอร์ที่ต้องการ
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

        {/* Tab Switcher */}
        <div className="px-5 pt-3 border-b border-slate-200/80 dark:border-slate-800 flex gap-4 text-xs font-bold">
          <button
            onClick={() => setActiveTab('patterns')}
            className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition ${
              activeTab === 'patterns'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Sparkles size={14} />
            <span>ลวดลายและพื้นผิว ({BOARD_PATTERNS.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('wallpapers')}
            className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition ${
              activeTab === 'wallpapers'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <ImageIcon size={14} />
            <span>ภาพวอลเปเปอร์ & URL</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5 scrollbar-thin">
          {activeTab === 'patterns' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {BOARD_PATTERNS.map((p) => {
                  const isSelected = !currentBgImage && currentTheme === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={async () => {
                        await onSelectTheme(p.id);
                        toast.success(`เปลี่ยนพื้นหลังเป็น "${p.name}"`);
                        onClose();
                      }}
                      className={`group relative rounded-2xl p-2.5 text-left border-2 transition-all hover:scale-[1.03] active:scale-95 flex flex-col gap-2 ${
                        isSelected
                          ? 'border-indigo-600 ring-2 ring-indigo-500/30 shadow-md'
                          : 'border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                      }`}
                    >
                      {/* Pattern Preview Box */}
                      <div
                        style={p.style}
                        className="w-full h-20 rounded-xl shadow-inner border border-black/10 relative overflow-hidden flex items-center justify-center"
                      >
                        {isSelected && (
                          <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md">
                            <Check size={14} />
                          </div>
                        )}
                      </div>

                      {/* Pattern Title */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                          {p.name}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Preset Wallpapers */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2.5 flex items-center gap-1.5">
                  <ImageIcon size={14} className="text-indigo-600" />
                  <span>ภาพวอลเปเปอร์แนะนำ (คลิกเพื่อใช้งานทันที):</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {CURATED_WALLPAPERS.map((wp) => {
                    const isSelected = currentBgImage === wp.url;
                    return (
                      <button
                        key={wp.url}
                        onClick={async () => {
                          await onSelectWallpaper(wp.url);
                          toast.success(`เปลี่ยนวอลเปเปอร์เป็น "${wp.name}"`);
                          onClose();
                        }}
                        className={`group relative rounded-2xl p-2 text-left border-2 transition-all hover:scale-[1.02] active:scale-95 flex flex-col gap-1.5 ${
                          isSelected
                            ? 'border-indigo-600 ring-2 ring-indigo-500/30 shadow-md'
                            : 'border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                        }`}
                      >
                        <div className="w-full h-24 rounded-xl overflow-hidden relative shadow-inner">
                          <img
                            src={wp.url}
                            alt={wp.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                          {isSelected && (
                            <div className="absolute inset-0 bg-indigo-900/40 flex items-center justify-center">
                              <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md">
                                <Check size={15} />
                              </div>
                            </div>
                          )}
                        </div>
                        <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate px-1">
                          {wp.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Image URL Form */}
              <form onSubmit={handleApplyCustomUrl} className="pt-2 border-t border-slate-200/80 dark:border-slate-800 space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                    หรือใส่ลิงก์รูปภาพของตัวเอง (Image URL):
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={customUrlInput}
                      onChange={(e) => setCustomUrlInput(e.target.value)}
                      placeholder="https://images.unsplash.com/... หรือ ลิงก์รูปภาพตรง"
                      className="flex-1 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition"
                    >
                      นำไปใช้
                    </button>
                  </div>
                </div>

                {customUrlInput && (
                  <div className="h-28 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 relative shadow-sm">
                    <img
                      src={customUrlInput}
                      alt="Custom Preview"
                      className="w-full h-full object-cover"
                      onError={() => toast.error('ไม่สามารถโหลดภาพจาก URL นี้ได้')}
                    />
                  </div>
                )}
              </form>

              {/* Reset Background button */}
              {currentBgImage && (
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={async () => {
                      await onSelectWallpaper(null);
                      toast.success('ล้างรูปภาพพื้นหลังกลับสู่โหมดลวดลายแล้ว');
                      onClose();
                    }}
                    className="text-xs text-rose-600 hover:text-rose-700 font-bold hover:underline flex items-center gap-1"
                  >
                    <RefreshCw size={12} />
                    <span>ล้างรูปพื้นหลัง (กลับสู่ลวดลายปกติ)</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  </ViewportPortal>
  );
}
