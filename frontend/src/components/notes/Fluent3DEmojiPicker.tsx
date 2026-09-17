import React, { useState, useMemo } from 'react';
import { Search, Sparkles, Smile, ThumbsUp, Heart, Briefcase, Trophy, X } from 'lucide-react';

export interface FluentEmojiItem {
  id: string;
  name: string;
  thName: string;
  keywords: string[];
  category: 'smileys' | 'people' | 'hearts' | 'work' | 'symbols';
  path: string;
  unicodeChar?: string;
}

const CDN_BASE = 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/';

export const FLUENT_3D_EMOJIS: FluentEmojiItem[] = [
  // ── 1. รอยยิ้ม & อารมณ์ (Smileys) ──
  {
    id: 'grinning_face',
    name: 'Grinning Face',
    thName: 'หน้ายิ้มกว้าง',
    keywords: ['smile', 'happy', 'ยิ้ม', 'หัวเราะ', 'สุข'],
    category: 'smileys',
    path: 'Grinning%20face/3D/grinning_face_3d.png',
    unicodeChar: '😀',
  },
  {
    id: 'smiling_heart_eyes',
    name: 'Heart Eyes',
    thName: 'ตาเป็นหัวใจ',
    keywords: ['love', 'heart', 'รัก', 'ชอบ', 'หลง'],
    category: 'smileys',
    path: 'Smiling%20face%20with%20heart-eyes/3D/smiling_face_with_heart-eyes_3d.png',
    unicodeChar: '😍',
  },
  {
    id: 'rolling_laughing',
    name: 'Rolling Laughing',
    thName: 'ขำกลิ้ง',
    keywords: ['rofl', 'lol', 'ขำ', 'ตลก', 'ฮา'],
    category: 'smileys',
    path: 'Rolling%20on%20the%20floor%20laughing/3D/rolling_on_the_floor_laughing_3d.png',
    unicodeChar: '🤣',
  },
  {
    id: 'tears_of_joy',
    name: 'Tears of Joy',
    thName: 'หัวเราะน้ำตาไหล',
    keywords: ['laugh', 'happy', 'หัวเราะ', 'ซึ้ง'],
    category: 'smileys',
    path: 'Face%20with%20tears%20of%20joy/3D/face_with_tears_of_joy_3d.png',
    unicodeChar: '😂',
  },
  {
    id: 'sunglasses',
    name: 'Cool Sunglasses',
    thName: 'หน้าใส่แว่นเท่',
    keywords: ['cool', 'chill', 'เท่', 'เจ๋ง', 'ชิล'],
    category: 'smileys',
    path: 'Smiling%20face%20with%20sunglasses/3D/smiling_face_with_sunglasses_3d.png',
    unicodeChar: '😎',
  },
  {
    id: 'thinking',
    name: 'Thinking Face',
    thName: 'ครุ่นคิด สงสัย',
    keywords: ['think', 'wonder', 'คิด', 'สงสัย'],
    category: 'smileys',
    path: 'Thinking%20face/3D/thinking_face_3d.png',
    unicodeChar: '🤔',
  },
  {
    id: 'partying_face',
    name: 'Partying Face',
    thName: 'ปาร์ตี้ ฉลอง',
    keywords: ['party', 'celebrate', 'ฉลอง', 'ยินดี'],
    category: 'smileys',
    path: 'Partying%20face/3D/partying_face_3d.png',
    unicodeChar: '🥳',
  },
  {
    id: 'star_struck',
    name: 'Star Struck',
    thName: 'ตาเป็นประกายดาว',
    keywords: ['star', 'wow', 'ว้าว', 'ตื่นเต้น', 'ดารา'],
    category: 'smileys',
    path: 'Star-struck/3D/star-struck_3d.png',
    unicodeChar: '🤩',
  },
  {
    id: 'winking',
    name: 'Winking Face',
    thName: 'ขยิบตา ส่งซิก',
    keywords: ['wink', 'playful', 'หยอก', 'ขยิบตา'],
    category: 'smileys',
    path: 'Winking%20face/3D/winking_face_3d.png',
    unicodeChar: '😉',
  },
  {
    id: 'hugging',
    name: 'Hugging Face',
    thName: 'กอด อบอุ่น',
    keywords: ['hug', 'warm', 'กอด', 'รัก', 'กำลังใจ'],
    category: 'smileys',
    path: 'Hugging%20face/3D/hugging_face_3d.png',
    unicodeChar: '🤗',
  },

  // ── 2. ท่าทาง & ผู้คน (People / Gestures) ──
  {
    id: 'thumbs_up',
    name: 'Thumbs Up',
    thName: 'ยกนิ้วโป้ง เยี่ยม',
    keywords: ['good', 'ok', 'like', 'เยี่ยม', 'ดี', 'ตกลง'],
    category: 'people',
    path: 'Thumbs%20up/Default/3D/thumbs_up_3d_default.png',
    unicodeChar: '👍',
  },
  {
    id: 'thumbs_down',
    name: 'Thumbs Down',
    thName: 'คว่ำนิ้วโป้ง ไม่โอเค',
    keywords: ['dislike', 'bad', 'ไม่ชอบ', 'แย่'],
    category: 'people',
    path: 'Thumbs%20down/Default/3D/thumbs_down_3d_default.png',
    unicodeChar: '👎',
  },
  {
    id: 'clapping_hands',
    name: 'Clapping Hands',
    thName: 'ปรบมือ ปรบมือรัว',
    keywords: ['clap', 'bravo', 'ปรบมือ', 'เยี่ยม'],
    category: 'people',
    path: 'Clapping%20hands/Default/3D/clapping_hands_3d_default.png',
    unicodeChar: '👏',
  },
  {
    id: 'victory_hand',
    name: 'Victory Hand',
    thName: 'ชูสองนิ้ว สู้ๆ',
    keywords: ['peace', 'victory', 'สองนิ้ว', 'สู้'],
    category: 'people',
    path: 'Victory%20hand/Default/3D/victory_hand_3d_default.png',
    unicodeChar: '✌️',
  },
  {
    id: 'folded_hands',
    name: 'Folded Hands',
    thName: 'ไหว้ ขอบคุณ ภาวนา',
    keywords: ['pray', 'thank', 'ไหว้', 'ขอบคุณ', 'สาธุ'],
    category: 'people',
    path: 'Folded%20hands/Default/3D/folded_hands_3d_default.png',
    unicodeChar: '🙏',
  },
  {
    id: 'waving_hand',
    name: 'Waving Hand',
    thName: 'โบกมือ ทักทาย บ๊ายบาย',
    keywords: ['hello', 'bye', 'หวัดดี', 'โบกมือ'],
    category: 'people',
    path: 'Waving%20hand/Default/3D/waving_hand_3d_default.png',
    unicodeChar: '👋',
  },
  {
    id: 'handshake',
    name: 'Handshake',
    thName: 'จับมือ ข้อตกลง มิตรภาพ',
    keywords: ['deal', 'partner', 'จับมือ', 'ตกลง', 'พันธมิตร'],
    category: 'people',
    path: 'Handshake/3D/handshake_3d.png',
    unicodeChar: '🤝',
  },

  // ── 3. หัวใจ & ความรู้สึก (Hearts & Feelings) ──
  {
    id: 'red_heart',
    name: 'Red Heart',
    thName: 'หัวใจสีแดง',
    keywords: ['love', 'heart', 'รัก', 'ใจ', 'ชอบ'],
    category: 'hearts',
    path: 'Red%20heart/3D/red_heart_3d.png',
    unicodeChar: '❤️',
  },
  {
    id: 'fire',
    name: 'Fire',
    thName: 'ไฟ ลุกโชน ฮิต ร้อนแรง',
    keywords: ['hot', 'lit', 'ไฟ', 'ร้อนแรง', 'เด็ด'],
    category: 'hearts',
    path: 'Fire/3D/fire_3d.png',
    unicodeChar: '🔥',
  },
  {
    id: 'sparkles',
    name: 'Sparkles',
    thName: 'ประกายดาว วิบวับ',
    keywords: ['shine', 'magic', 'ประกาย', 'ดาว', 'ใหม่', 'พิเศษ'],
    category: 'hearts',
    path: 'Sparkles/3D/sparkles_3d.png',
    unicodeChar: '✨',
  },
  {
    id: 'heart_with_ribbon',
    name: 'Heart with Ribbon',
    thName: 'กล่องของขวัญหัวใจ',
    keywords: ['gift', 'present', 'ของขวัญ', 'หัวใจ'],
    category: 'hearts',
    path: 'Heart%20with%20ribbon/3D/heart_with_ribbon_3d.png',
    unicodeChar: '💝',
  },

  // ── 4. การทำงาน & เอกสาร (Work & Productivity) ──
  {
    id: 'memo',
    name: 'Memo',
    thName: 'สมุดจด บันทึก',
    keywords: ['note', 'paper', 'โน้ต', 'บันทึก', 'จด'],
    category: 'work',
    path: 'Memo/3D/memo_3d.png',
    unicodeChar: '📝',
  },
  {
    id: 'pushpin',
    name: 'Pushpin',
    thName: 'หมุดปักโน้ต',
    keywords: ['pin', 'mark', 'ปักหมุด', 'หมุด'],
    category: 'work',
    path: 'Pushpin/3D/pushpin_3d.png',
    unicodeChar: '📌',
  },
  {
    id: 'check_mark_button',
    name: 'Check Mark',
    thName: 'เครื่องหมายถูก สำเร็จ',
    keywords: ['check', 'done', 'ถูก', 'เสร็จ', 'สำเร็จ'],
    category: 'work',
    path: 'Check%20mark%20button/3D/check_mark_button_3d.png',
    unicodeChar: '✅',
  },
  {
    id: 'light_bulb',
    name: 'Light Bulb',
    thName: 'หลอดไฟ ไอเดีย',
    keywords: ['idea', 'creative', 'ไอเดีย', 'คิดออก'],
    category: 'work',
    path: 'Light%20bulb/3D/light_bulb_3d.png',
    unicodeChar: '💡',
  },
  {
    id: 'rocket',
    name: 'Rocket',
    thName: 'จรวด เปิดตัว ไว',
    keywords: ['launch', 'fast', 'จรวด', 'เปิดตัว', 'เร็ว'],
    category: 'work',
    path: 'Rocket/3D/rocket_3d.png',
    unicodeChar: '🚀',
  },
  {
    id: 'bullseye',
    name: 'Bullseye',
    thName: 'เป้าหมาย ตรงเป้า',
    keywords: ['target', 'goal', 'เป้าหมาย', 'ตรงเป้า'],
    category: 'work',
    path: 'Bullseye/3D/bullseye_3d.png',
    unicodeChar: '🎯',
  },
  {
    id: 'warning',
    name: 'Warning',
    thName: 'ป้ายเตือน ข้อควรระวัง',
    keywords: ['alert', 'caution', 'เตือน', 'ระวัง'],
    category: 'work',
    path: 'Warning/3D/warning_3d.png',
    unicodeChar: '⚠️',
  },
  {
    id: 'hot_beverage',
    name: 'Hot Beverage',
    thName: 'กาแฟ ชา พักผ่อน',
    keywords: ['coffee', 'tea', 'กาแฟ', 'พัก'],
    category: 'work',
    path: 'Hot%20beverage/3D/hot_beverage_3d.png',
    unicodeChar: '☕',
  },

  // ── 5. สัญลักษณ์ & ของมงคล (Symbols & Awards) ──
  {
    id: 'party_popper',
    name: 'Party Popper',
    thName: 'พลุกระดาษ ยินดีด้วย',
    keywords: ['congrats', 'party', 'ยินดี', 'ฉลอง'],
    category: 'symbols',
    path: 'Party%20popper/3D/party_popper_3d.png',
    unicodeChar: '🎉',
  },
  {
    id: 'trophy',
    name: 'Trophy',
    thName: 'ถ้วยรางวัล ผู้ชนะ',
    keywords: ['win', 'award', 'รางวัล', 'ชนะ', 'ที่หนึ่ง'],
    category: 'symbols',
    path: 'Trophy/3D/trophy_3d.png',
    unicodeChar: '🏆',
  },
  {
    id: 'crown',
    name: 'Crown',
    thName: 'มงกุฎ อันดับ 1',
    keywords: ['king', 'queen', 'top', 'มงกุฎ', 'สุดยอด'],
    category: 'symbols',
    path: 'Crown/3D/crown_3d.png',
    unicodeChar: '👑',
  },
];

export type EmojiInsertMode = '3d' | 'unicode';

interface Fluent3DEmojiPickerProps {
  onSelectEmoji: (emoji: FluentEmojiItem, fullUrl: string, mode: EmojiInsertMode) => void;
  onClose?: () => void;
  initialMode?: EmojiInsertMode;
}

export default function Fluent3DEmojiPicker({ onSelectEmoji, onClose, initialMode = '3d' }: Fluent3DEmojiPickerProps) {
  const [insertMode, setInsertMode] = useState<EmojiInsertMode>(initialMode);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'smileys' | 'people' | 'hearts' | 'work' | 'symbols'>('all');

  const filteredEmojis = useMemo(() => {
    return FLUENT_3D_EMOJIS.filter((item) => {
      const matchCategory = selectedCategory === 'all' || item.category === selectedCategory;
      if (!matchCategory) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        item.name.toLowerCase().includes(q) ||
        item.thName.toLowerCase().includes(q) ||
        item.keywords.some((kw) => kw.toLowerCase().includes(q))
      );
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="w-[330px] max-w-full bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700/80 overflow-hidden flex flex-col animate-fade-in text-slate-800 dark:text-slate-100">
      {/* Header */}
      <div className="p-2.5 px-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-indigo-50/70 to-purple-50/70 dark:from-indigo-950/40 dark:to-purple-950/40">
        <div className="flex items-center gap-1.5">
          <span className="text-base">✨</span>
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">
            อีโมจิ & ไอคอน
          </h4>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* Mode Switcher: 3D vs ข้อความ */}
      <div className="flex p-1 mx-2.5 my-2 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs gap-1 border border-slate-200/60 dark:border-slate-700/60">
        <button
          type="button"
          onClick={() => setInsertMode('3d')}
          className={`flex-1 py-1.5 px-2 rounded-lg font-medium transition flex items-center justify-center gap-1.5 ${
            insertMode === '3d'
              ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm font-semibold'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
          title="แทรกเป็นรูป 3D มีมิติ (ขยายตามขนาดตัวอักษรได้)"
        >
          <Sparkles size={13} className={insertMode === '3d' ? 'text-indigo-500 dark:text-indigo-400' : 'text-slate-400'} />
          <span>3D</span>
        </button>
        <button
          type="button"
          onClick={() => setInsertMode('unicode')}
          className={`flex-1 py-1.5 px-2 rounded-lg font-medium transition flex items-center justify-center gap-1.5 ${
            insertMode === 'unicode'
              ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm font-semibold'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
          title="แทรกเป็นตัวหนังสือ (คลุมดำและไฮไลท์ได้)"
        >
          <span className="text-xs">🔤</span>
          <span>ข้อความ</span>
        </button>
      </div>

      {/* Search Box */}
      <div className="px-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
        <div className="relative flex items-center">
          <Search size={14} className="absolute left-2.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="ค้นหา Emoji (เช่น ยิ้ม, ไฟ, หัวใจ)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1 px-2 py-1.5 overflow-x-auto border-b border-slate-100 dark:border-slate-800 text-[11px] font-medium custom-scrollbar">
        <button
          type="button"
          onClick={() => setSelectedCategory('all')}
          className={`px-2 py-0.5 rounded-lg shrink-0 transition ${
            selectedCategory === 'all'
              ? 'bg-indigo-600 text-white font-bold'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500'
          }`}
        >
          ทั้งหมด
        </button>
        <button
          type="button"
          onClick={() => setSelectedCategory('smileys')}
          className={`px-2 py-0.5 rounded-lg shrink-0 flex items-center gap-1 transition ${
            selectedCategory === 'smileys'
              ? 'bg-indigo-600 text-white font-bold'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500'
          }`}
        >
          <Smile size={12} />
          <span>รอยยิ้ม</span>
        </button>
        <button
          type="button"
          onClick={() => setSelectedCategory('people')}
          className={`px-2 py-0.5 rounded-lg shrink-0 flex items-center gap-1 transition ${
            selectedCategory === 'people'
              ? 'bg-indigo-600 text-white font-bold'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500'
          }`}
        >
          <ThumbsUp size={12} />
          <span>ท่าทาง</span>
        </button>
        <button
          type="button"
          onClick={() => setSelectedCategory('hearts')}
          className={`px-2 py-0.5 rounded-lg shrink-0 flex items-center gap-1 transition ${
            selectedCategory === 'hearts'
              ? 'bg-indigo-600 text-white font-bold'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500'
          }`}
        >
          <Heart size={12} />
          <span>ความรู้สึก</span>
        </button>
        <button
          type="button"
          onClick={() => setSelectedCategory('work')}
          className={`px-2 py-0.5 rounded-lg shrink-0 flex items-center gap-1 transition ${
            selectedCategory === 'work'
              ? 'bg-indigo-600 text-white font-bold'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500'
          }`}
        >
          <Briefcase size={12} />
          <span>การทำงาน</span>
        </button>
        <button
          type="button"
          onClick={() => setSelectedCategory('symbols')}
          className={`px-2 py-0.5 rounded-lg shrink-0 flex items-center gap-1 transition ${
            selectedCategory === 'symbols'
              ? 'bg-indigo-600 text-white font-bold'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500'
          }`}
        >
          <Trophy size={12} />
          <span>รางวัล</span>
        </button>
      </div>

      {/* Grid of Emojis */}
      <div className="p-2.5 max-h-56 overflow-y-auto grid grid-cols-6 gap-2 custom-scrollbar">
        {filteredEmojis.length === 0 ? (
          <div className="col-span-6 py-6 text-center text-xs text-slate-400">
            ไม่พบ Emoji ที่ตรงกับคำค้นหา
          </div>
        ) : (
          filteredEmojis.map((emoji) => {
            const fullUrl = CDN_BASE + emoji.path;
            return (
              <button
                key={emoji.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onSelectEmoji(emoji, fullUrl, insertMode)}
                className="w-10 h-10 p-1 rounded-xl flex items-center justify-center hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:scale-115 active:scale-95 transition-transform duration-150 border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800/60 group"
                title={`${emoji.thName} (${emoji.name})`}
              >
                {insertMode === '3d' ? (
                  <img
                    src={fullUrl}
                    alt={emoji.name}
                    loading="lazy"
                    className="w-7 h-7 object-contain drop-shadow-sm pointer-events-none group-hover:drop-shadow-md transition-transform"
                  />
                ) : (
                  <span className="text-2xl leading-none select-none drop-shadow-sm group-hover:scale-110 transition-transform">
                    {emoji.unicodeChar || '😀'}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>

      {/* Footer hint */}
      <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
        <span>
          {insertMode === '3d'
            ? 'โหมด 3D: ขยายตามขนาดตัวอักษรได้ (1.25em)'
            : 'โหมดตัวหนังสือ: เลือก & คลุมดำเหมือน Win 11'}
        </span>
        <span className="font-mono font-semibold text-indigo-500">
          {insertMode === '3d' ? 'Fluent 3D' : 'Unicode'}
        </span>
      </div>
    </div>
  );
}
