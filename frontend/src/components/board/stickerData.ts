export interface BoardStickerItem {
  id: string;
  name: string;
  thName: string;
  category: 'arrows' | 'ideas' | 'symbols' | 'stamps';
  url: string; // SVG data URL or CDN URL
  defaultWidth: number;
  defaultHeight: number;
}

// ── 1. Helper SVG Data URLs (High Resolution, Transparent, Vector Scalable) ──
const svgToDataUrl = (svgString: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(svgString.trim())}`;

// ══════════════════════════════════════════════════════════════════════════════
// ── SVG ARROWS (Hand-drawn, Curved, Gradient, 3D, and Sketch styles) ──
// ══════════════════════════════════════════════════════════════════════════════
const SVG_SKETCH_BLUE_ARROW = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120" fill="none">
  <path d="M15 45 C 50 42, 90 44, 125 43 L 122 20 C 135 32, 160 52, 185 60 C 160 68, 135 88, 122 100 L 125 77 C 88 78, 50 76, 15 75 Z" 
        fill="#38BDF8" fill-opacity="0.35" stroke="#0284C7" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 3"/>
  <path d="M 25 50 L 125 48 M 25 60 L 135 58 M 25 70 L 125 68 M 125 35 L 170 60 L 125 85" 
        stroke="#0369A1" stroke-width="3" stroke-linecap="round"/>
</svg>
`);

const SVG_CURVED_RED_ARROW = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 180" fill="none">
  <defs>
    <linearGradient id="redGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#EF4444"/>
      <stop offset="100%" stop-color="#991B1B"/>
    </linearGradient>
    <filter id="dropGlow" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="2" dy="4" stdDeviation="3" flood-opacity="0.25"/>
    </filter>
  </defs>
  <path d="M 30 150 C 45 145, 95 130, 130 90 C 145 70, 150 40, 140 25 L 120 40 C 135 22, 165 10, 185 8 C 182 28, 172 58, 155 75 L 142 55 C 135 75, 120 115, 75 145 C 55 158, 38 162, 30 150 Z" 
        fill="url(#redGrad)" filter="url(#dropGlow)"/>
</svg>
`);

const SVG_CHALK_WHITE_ARROW = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" fill="none">
  <path d="M 15 40 L 175 40 M 140 18 L 180 40 L 140 62" 
        stroke="#FFFFFF" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))"/>
</svg>
`);

const SVG_GREEN_DOWN_ARROW = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 180" fill="none">
  <defs>
    <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#22C55E"/>
      <stop offset="100%" stop-color="#15803D"/>
    </linearGradient>
  </defs>
  <path d="M 40 10 L 80 10 L 80 110 L 110 110 L 60 170 L 10 110 L 40 110 Z" 
        fill="url(#greenGrad)" stroke="#166534" stroke-width="4" stroke-linejoin="round"/>
</svg>
`);

const SVG_CURVED_PURPLE_ARROW = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 140" fill="none">
  <path d="M 20 120 C 60 125, 120 110, 135 55 L 115 65 L 160 30 L 165 85 L 145 75 C 130 125, 75 145, 20 120 Z" 
        fill="#8B5CF6" stroke="#6D28D9" stroke-width="3"/>
</svg>
`);

const SVG_SKETCH_RED_HAND_ARROW = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 100" fill="none">
  <path d="M 15 75 C 45 65, 85 55, 125 35 M 105 25 L 145 30 L 130 55" 
        stroke="#DC2626" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`);

const SVG_DOUBLE_ARROW = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" fill="none">
  <path d="M 40 20 L 15 40 L 40 60 M 20 40 L 180 40 M 160 20 L 185 40 L 160 60" 
        stroke="#F59E0B" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`);

const SVG_LOOP_ARROW = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" fill="none">
  <path d="M 80 25 C 115 25, 135 50, 135 80 C 135 115, 110 135, 80 135 C 45 135, 25 110, 25 80 C 25 60, 35 45, 50 35" 
        stroke="#06B6D4" stroke-width="8" stroke-linecap="round" stroke-dasharray="6 3"/>
  <polygon points="50,15 70,38 42,48" fill="#0891B2"/>
</svg>
`);

const SVG_NEON_YELLOW_ARROW = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 90" fill="none">
  <path d="M 20 45 L 130 45 L 120 20 L 165 45 L 120 70 L 130 45" 
        fill="#CCFF00" stroke="#84CC16" stroke-width="4" stroke-linejoin="round" filter="drop-shadow(0 0 8px rgba(204,255,0,0.8))"/>
</svg>
`);

const SVG_ZIGZAG_LIGHTNING_ARROW = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 120" fill="none">
  <path d="M 15 85 L 60 40 L 95 75 L 140 25 L 125 15 L 165 20 L 155 60 L 140 40 L 100 88 L 65 55 L 20 100 Z" 
        fill="#EC4899" stroke="#BE185D" stroke-width="3"/>
</svg>
`);

const SVG_CURVED_UP_TEAL_ARROW = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" fill="none">
  <path d="M 25 135 C 35 75, 80 40, 125 35" stroke="#14B8A6" stroke-width="8" stroke-linecap="round"/>
  <polygon points="105,18 145,30 130,70" fill="#0D9488"/>
</svg>
`);

const SVG_SKETCH_CIRCLE_RED = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 140" fill="none">
  <path d="M 85 20 C 135 15, 165 45, 160 85 C 155 120, 115 130, 70 125 C 30 120, 15 90, 20 55 C 25 25, 60 18, 95 22 C 125 25, 145 40, 150 60" 
        stroke="#EF4444" stroke-width="6" stroke-linecap="round" fill="none" opacity="0.85"/>
</svg>
`);

const SVG_SKETCH_FRAME_YELLOW = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 140" fill="none">
  <rect x="15" y="15" width="170" height="110" rx="10" 
        stroke="#EAB308" stroke-width="6" stroke-dasharray="14 6" fill="#FEF08A" fill-opacity="0.15"/>
</svg>
`);

// ══════════════════════════════════════════════════════════════════════════════
// ── SVG IDEAS & CREATIVE ──
// ══════════════════════════════════════════════════════════════════════════════
const SVG_LIGHTBULB_GLOW = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" fill="none">
  <circle cx="80" cy="80" r="70" fill="#FEF08A" fill-opacity="0.3"/>
  <path d="M 50 65 C 50 45, 63 30, 80 30 C 97 30, 110 45, 110 65 C 110 80, 98 90, 95 102 L 65 102 C 62 90, 50 80, 50 65 Z" 
        fill="#FACC15" stroke="#CA8A04" stroke-width="5"/>
  <path d="M 65 105 L 95 105 L 90 122 L 70 122 Z" fill="#94A3B8" stroke="#475569" stroke-width="3"/>
  <path d="M 72 122 C 72 128, 88 128, 88 122" stroke="#475569" stroke-width="3"/>
  <path d="M 80 12 L 80 22 M 35 35 L 43 43 M 125 35 L 117 43 M 20 70 L 30 70 M 130 70 L 140 70" 
        stroke="#EAB308" stroke-width="5" stroke-linecap="round"/>
</svg>
`);

const SVG_LIGHTBULB_IN_BOX = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" fill="none">
  <path d="M 60 50 C 60 38, 69 28, 80 28 C 91 28, 100 38, 100 50 C 100 60, 92 68, 90 75 L 70 75 C 68 68, 60 60, 60 50 Z" 
        fill="#FEF08A" stroke="#EAB308" stroke-width="4"/>
  <path d="M 80 10 L 80 18 M 52 22 L 58 28 M 108 22 L 102 28" stroke="#EAB308" stroke-width="4" stroke-linecap="round"/>
  <path d="M 30 75 L 80 95 L 130 75 L 80 55 Z" fill="#D97706" stroke="#92400E" stroke-width="3"/>
  <path d="M 30 75 L 30 125 L 80 148 L 80 95 Z" fill="#B45309" stroke="#92400E" stroke-width="3"/>
  <path d="M 80 95 L 80 148 L 130 125 L 130 75 Z" fill="#D97706" stroke="#92400E" stroke-width="3"/>
</svg>
`);

const SVG_THOUGHT_BUBBLE = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 140" fill="none">
  <path d="M 50 40 C 35 40, 20 55, 25 75 C 15 85, 20 105, 40 105 C 50 115, 80 115, 95 105 C 115 115, 145 110, 150 95 C 165 85, 160 60, 140 50 C 140 30, 115 25, 95 35 C 80 25, 55 28, 50 40 Z" 
        fill="#FFFFFF" stroke="#38BDF8" stroke-width="5" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.1))"/>
  <circle cx="45" cy="120" r="7" fill="#FFFFFF" stroke="#38BDF8" stroke-width="3"/>
  <circle cx="32" cy="130" r="4" fill="#FFFFFF" stroke="#38BDF8" stroke-width="2"/>
</svg>
`);

// ══════════════════════════════════════════════════════════════════════════════
// ── SVG SYMBOLS (Music, Questions, Exclamation) ──
// ══════════════════════════════════════════════════════════════════════════════
const SVG_MUSICAL_NOTES = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" fill="none">
  <ellipse cx="50" cy="120" rx="20" ry="15" fill="#0F172A" transform="rotate(-20 50 120)"/>
  <ellipse cx="120" cy="100" rx="20" ry="15" fill="#0F172A" transform="rotate(-20 120 100)"/>
  <rect x="62" y="30" width="8" height="85" fill="#0F172A"/>
  <rect x="132" y="10" width="8" height="85" fill="#0F172A"/>
  <polygon points="62,30 140,10 140,25 62,45" fill="#0F172A"/>
</svg>
`);

const SVG_EXCLAMATION_MARK = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 160" fill="none">
  <defs>
    <linearGradient id="exclGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#EF4444"/>
      <stop offset="100%" stop-color="#DC2626"/>
    </linearGradient>
  </defs>
  <path d="M 35 15 L 65 15 L 58 100 L 42 100 Z" fill="url(#exclGrad)" stroke="#B91C1C" stroke-width="4"/>
  <circle cx="50" cy="130" r="14" fill="url(#exclGrad)" stroke="#B91C1C" stroke-width="4"/>
</svg>
`);

const SVG_QUESTION_MARK_3D = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 160" fill="none">
  <defs>
    <linearGradient id="qGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#38BDF8"/>
      <stop offset="100%" stop-color="#0284C7"/>
    </linearGradient>
  </defs>
  <path d="M 35 50 C 35 30, 50 15, 70 15 C 90 15, 105 30, 105 48 C 105 65, 88 75, 75 88 L 75 100 L 55 100 L 55 82 C 72 70, 85 62, 85 48 C 85 38, 78 32, 68 32 C 55 32, 50 42, 50 50 Z" 
        fill="url(#qGrad)" stroke="#0369A1" stroke-width="4"/>
  <circle cx="65" cy="130" r="13" fill="url(#qGrad)" stroke="#0369A1" stroke-width="4"/>
</svg>
`);

// ══════════════════════════════════════════════════════════════════════════════
// ── SVG STAMPS / BADGES (Rubber Stamp Style) ──
// ══════════════════════════════════════════════════════════════════════════════
const SVG_STAMP_APPROVED = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 100" fill="none">
  <rect x="10" y="10" width="220" height="80" rx="14" fill="#ECFDF5" stroke="#059669" stroke-width="7" stroke-dasharray="12 4"/>
  <text x="120" y="58" font-family="'Arial Black', Impact, sans-serif" font-weight="900" font-size="28" fill="#059669" text-anchor="middle" letter-spacing="2">APPROVED</text>
  <text x="120" y="76" font-family="sans-serif" font-weight="700" font-size="11" fill="#10B981" text-anchor="middle">อนุมัติเรียบร้อย</text>
</svg>
`);

const SVG_STAMP_URGENT = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 100" fill="none">
  <rect x="10" y="10" width="200" height="80" rx="14" fill="#FEF2F2" stroke="#DC2626" stroke-width="7" stroke-dasharray="10 3"/>
  <text x="110" y="58" font-family="'Arial Black', Impact, sans-serif" font-weight="900" font-size="30" fill="#DC2626" text-anchor="middle" letter-spacing="3">URGENT!</text>
  <text x="110" y="76" font-family="sans-serif" font-weight="700" font-size="12" fill="#EF4444" text-anchor="middle">ด่วนที่สุด ⚠️</text>
</svg>
`);

const SVG_STAMP_IMPORTANT = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 100" fill="none">
  <rect x="10" y="10" width="220" height="80" rx="14" fill="#EFF6FF" stroke="#2563EB" stroke-width="7"/>
  <text x="120" y="58" font-family="'Arial Black', Impact, sans-serif" font-weight="900" font-size="25" fill="#2563EB" text-anchor="middle" letter-spacing="2">IMPORTANT</text>
  <text x="120" y="76" font-family="sans-serif" font-weight="700" font-size="11" fill="#3B82F6" text-anchor="middle">สำคัญมาก ★</text>
</svg>
`);

const SVG_STAMP_IDEA = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 90" fill="none">
  <rect x="10" y="10" width="180" height="70" rx="12" fill="#FEFCE8" stroke="#CA8A04" stroke-width="6"/>
  <text x="100" y="52" font-family="'Arial Black', Impact, sans-serif" font-weight="900" font-size="28" fill="#CA8A04" text-anchor="middle" letter-spacing="2">💡 IDEA</text>
</svg>
`);

const SVG_STAMP_COMPLETED = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 100" fill="none">
  <rect x="10" y="10" width="220" height="80" rx="14" fill="#F0FDF4" stroke="#16A34A" stroke-width="7"/>
  <text x="120" y="58" font-family="'Arial Black', Impact, sans-serif" font-weight="900" font-size="26" fill="#16A34A" text-anchor="middle" letter-spacing="2">COMPLETED</text>
  <text x="120" y="76" font-family="sans-serif" font-weight="700" font-size="11" fill="#22C55E" text-anchor="middle">✔ เสร็จสมบูรณ์</text>
</svg>
`);

const SVG_STAMP_DRAFT = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 90" fill="none">
  <rect x="10" y="10" width="180" height="70" rx="12" fill="#F8FAFC" stroke="#64748B" stroke-width="6" stroke-dasharray="8 4"/>
  <text x="100" y="52" font-family="'Arial Black', Impact, sans-serif" font-weight="900" font-size="28" fill="#64748B" text-anchor="middle" letter-spacing="3">DRAFT</text>
  <text x="100" y="70" font-family="sans-serif" font-weight="700" font-size="10" fill="#94A3B8" text-anchor="middle">ฉบับร่าง 📝</text>
</svg>
`);

const SVG_STAMP_CONFIDENTIAL = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 100" fill="none">
  <rect x="10" y="10" width="240" height="80" rx="12" fill="#FEF2F2" stroke="#991B1B" stroke-width="7" stroke-dasharray="10 3"/>
  <text x="130" y="58" font-family="'Arial Black', Impact, sans-serif" font-weight="900" font-size="23" fill="#991B1B" text-anchor="middle" letter-spacing="2">CONFIDENTIAL</text>
  <text x="130" y="76" font-family="sans-serif" font-weight="700" font-size="11" fill="#DC2626" text-anchor="middle">🔒 เอกสารลับเฉพาะ</text>
</svg>
`);

const SVG_STAMP_REJECTED = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 230 100" fill="none">
  <rect x="10" y="10" width="210" height="80" rx="14" fill="#FFF1F2" stroke="#BE123C" stroke-width="7"/>
  <text x="115" y="58" font-family="'Arial Black', Impact, sans-serif" font-weight="900" font-size="27" fill="#BE123C" text-anchor="middle" letter-spacing="2">REJECTED</text>
  <text x="115" y="76" font-family="sans-serif" font-weight="700" font-size="11" fill="#E11D48" text-anchor="middle">✖ ไม่อนุมัติ</text>
</svg>
`);

const SVG_STAMP_IN_PROGRESS = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 100" fill="none">
  <rect x="10" y="10" width="220" height="80" rx="14" fill="#F0F9FF" stroke="#0284C7" stroke-width="7" stroke-dasharray="8 4"/>
  <text x="120" y="58" font-family="'Arial Black', Impact, sans-serif" font-weight="900" font-size="23" fill="#0284C7" text-anchor="middle" letter-spacing="2">IN PROGRESS</text>
  <text x="120" y="76" font-family="sans-serif" font-weight="700" font-size="11" fill="#0EA5E9" text-anchor="middle">⏳ กำลังดำเนินการ</text>
</svg>
`);

const SVG_STAMP_NEW = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 90" fill="none">
  <rect x="10" y="10" width="140" height="70" rx="16" fill="#FDF2F8" stroke="#DB2777" stroke-width="6"/>
  <text x="80" y="54" font-family="'Arial Black', Impact, sans-serif" font-weight="900" font-size="34" fill="#DB2777" text-anchor="middle" letter-spacing="2">NEW!</text>
</svg>
`);

const SVG_STAMP_TOP_SECRET = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 100" fill="none">
  <rect x="10" y="10" width="220" height="80" rx="14" fill="#18181B" stroke="#EF4444" stroke-width="7"/>
  <text x="120" y="58" font-family="'Arial Black', Impact, sans-serif" font-weight="900" font-size="25" fill="#EF4444" text-anchor="middle" letter-spacing="2">TOP SECRET</text>
  <text x="120" y="76" font-family="sans-serif" font-weight="700" font-size="11" fill="#FCA5A5" text-anchor="middle">ความลับระดับสูงสุด 🛑</text>
</svg>
`);

// ── CDN BASE FOR MICROSOFT FLUENT 3D STICKERS (MIT License - 100% Free for commercial & personal use) ──
const CDN_FLUENT = 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/';

export const BOARD_STICKERS: BoardStickerItem[] = [
  // ══════════════════════════════════════════════════════════════════════════
  // 1. หมวดลูกศร & ทิศทาง (Arrows & Directions)
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'arrow_sketch_blue',
    name: 'Sketch Blue Arrow',
    thName: 'ลูกศรฟ้าลายมือ',
    category: 'arrows',
    url: SVG_SKETCH_BLUE_ARROW,
    defaultWidth: 160,
    defaultHeight: 96,
  },
  {
    id: 'arrow_curved_red',
    name: 'Curved Red Arrow',
    thName: 'ลูกศรแดงโค้งพุ่ง',
    category: 'arrows',
    url: SVG_CURVED_RED_ARROW,
    defaultWidth: 150,
    defaultHeight: 135,
  },
  {
    id: 'arrow_chalk_white',
    name: 'Chalk White Arrow',
    thName: 'ลูกศรชอล์กขาว',
    category: 'arrows',
    url: SVG_CHALK_WHITE_ARROW,
    defaultWidth: 160,
    defaultHeight: 64,
  },
  {
    id: 'arrow_green_down',
    name: 'Green Down Arrow',
    thName: 'ลูกศรเขียวชี้ลง',
    category: 'arrows',
    url: SVG_GREEN_DOWN_ARROW,
    defaultWidth: 100,
    defaultHeight: 150,
  },
  {
    id: 'arrow_curved_purple',
    name: 'Curved Purple Arrow',
    thName: 'ลูกศรม่วงโค้ง',
    category: 'arrows',
    url: SVG_CURVED_PURPLE_ARROW,
    defaultWidth: 140,
    defaultHeight: 110,
  },
  {
    id: 'arrow_sketch_red_hand',
    name: 'Hand-drawn Red Arrow',
    thName: 'ลูกศรแดงเขียนมือ',
    category: 'arrows',
    url: SVG_SKETCH_RED_HAND_ARROW,
    defaultWidth: 140,
    defaultHeight: 90,
  },
  {
    id: 'arrow_double_sided',
    name: 'Double Sided Arrow',
    thName: 'ลูกศร 2 หัว ซ้าย-ขวา',
    category: 'arrows',
    url: SVG_DOUBLE_ARROW,
    defaultWidth: 160,
    defaultHeight: 64,
  },
  {
    id: 'arrow_loop_cycle',
    name: 'Loop Cycle Arrow',
    thName: 'ลูกศรวนลูปวงกลม',
    category: 'arrows',
    url: SVG_LOOP_ARROW,
    defaultWidth: 130,
    defaultHeight: 130,
  },
  {
    id: 'arrow_neon_yellow',
    name: 'Neon Yellow Arrow',
    thName: 'ลูกศรนีออนเรืองแสง',
    category: 'arrows',
    url: SVG_NEON_YELLOW_ARROW,
    defaultWidth: 160,
    defaultHeight: 80,
  },
  {
    id: 'arrow_zigzag_lightning',
    name: 'Lightning Arrow',
    thName: 'ลูกศรสายฟ้าพุ่ง',
    category: 'arrows',
    url: SVG_ZIGZAG_LIGHTNING_ARROW,
    defaultWidth: 150,
    defaultHeight: 100,
  },
  {
    id: 'arrow_curved_up_teal',
    name: 'Trending Up Arrow',
    thName: 'ลูกศรชี้ขึ้นโค้งเขียว',
    category: 'arrows',
    url: SVG_CURVED_UP_TEAL_ARROW,
    defaultWidth: 135,
    defaultHeight: 135,
  },
  {
    id: 'arrow_sketch_circle_red',
    name: 'Sketch Red Circle',
    thName: 'วงกลมลายมือสีแดง (เน้นโน้ต)',
    category: 'arrows',
    url: SVG_SKETCH_CIRCLE_RED,
    defaultWidth: 150,
    defaultHeight: 120,
  },
  {
    id: 'arrow_sketch_frame_yellow',
    name: 'Sketch Yellow Frame',
    thName: 'กรอบสี่เหลี่ยมลายมือ (ตีกรอบ)',
    category: 'arrows',
    url: SVG_SKETCH_FRAME_YELLOW,
    defaultWidth: 170,
    defaultHeight: 120,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 2. หมวดไอเดีย & ความคิด (Ideas & Productivity)
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'idea_lightbulb_glow',
    name: 'Glowing Lightbulb',
    thName: 'หลอดไฟไอเดียเรืองแสง',
    category: 'ideas',
    url: SVG_LIGHTBULB_GLOW,
    defaultWidth: 130,
    defaultHeight: 130,
  },
  {
    id: 'idea_box_lightbulb',
    name: 'Idea in a Box',
    thName: 'คิดนอกกรอบในกล่อง',
    category: 'ideas',
    url: SVG_LIGHTBULB_IN_BOX,
    defaultWidth: 130,
    defaultHeight: 130,
  },
  {
    id: 'idea_thought_bubble',
    name: 'Thought Bubble',
    thName: 'เมฆฟองความคิด',
    category: 'ideas',
    url: SVG_THOUGHT_BUBBLE,
    defaultWidth: 150,
    defaultHeight: 120,
  },
  {
    id: 'fluent_3d_bulb',
    name: 'Fluent 3D Lightbulb',
    thName: 'หลอดไฟ 3D คมชัด',
    category: 'ideas',
    url: `${CDN_FLUENT}Light%20bulb/3D/light_bulb_3d.png`,
    defaultWidth: 120,
    defaultHeight: 120,
  },
  {
    id: 'fluent_3d_brain',
    name: 'Fluent 3D Brain',
    thName: 'สมองคิดไอเดีย 3D',
    category: 'ideas',
    url: `${CDN_FLUENT}Brain/3D/brain_3d.png`,
    defaultWidth: 120,
    defaultHeight: 120,
  },
  {
    id: 'fluent_3d_clipboard',
    name: 'Fluent 3D Clipboard',
    thName: 'คลิปบอร์ดเช็คลิสต์ 3D',
    category: 'ideas',
    url: `${CDN_FLUENT}Clipboard/3D/clipboard_3d.png`,
    defaultWidth: 120,
    defaultHeight: 120,
  },
  {
    id: 'fluent_3d_books',
    name: 'Fluent 3D Books',
    thName: 'กองหนังสือหาความรู้ 3D',
    category: 'ideas',
    url: `${CDN_FLUENT}Books/3D/books_3d.png`,
    defaultWidth: 125,
    defaultHeight: 125,
  },
  {
    id: 'fluent_3d_megaphone',
    name: 'Fluent 3D Megaphone',
    thName: 'โทรโข่งประกาศไอเดีย 3D',
    category: 'ideas',
    url: `${CDN_FLUENT}Megaphone/3D/megaphone_3d.png`,
    defaultWidth: 125,
    defaultHeight: 125,
  },
  {
    id: 'fluent_3d_hourglass',
    name: 'Fluent 3D Hourglass',
    thName: 'นาฬิกาทรายเตือนเวลา 3D',
    category: 'ideas',
    url: `${CDN_FLUENT}Hourglass%20done/3D/hourglass_done_3d.png`,
    defaultWidth: 120,
    defaultHeight: 120,
  },
  {
    id: 'fluent_3d_calendar',
    name: 'Fluent 3D Calendar',
    thName: 'ปฏิทินนัดหมาย 3D',
    category: 'ideas',
    url: `${CDN_FLUENT}Tear-off%20calendar/3D/tear-off_calendar_3d.png`,
    defaultWidth: 120,
    defaultHeight: 120,
  },
  {
    id: 'fluent_3d_sparkles',
    name: 'Fluent 3D Sparkles',
    thName: 'ประกายดาววิบวับ 3D',
    category: 'ideas',
    url: `${CDN_FLUENT}Sparkles/3D/sparkles_3d.png`,
    defaultWidth: 120,
    defaultHeight: 120,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 3. หมวดสัญลักษณ์ & กราฟิก 3D (Symbols & 3D Objects)
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'symbol_star_3d',
    name: 'Star Struck 3D',
    thName: 'ดาวประกายเหลือง 3D',
    category: 'symbols',
    url: `${CDN_FLUENT}Glowing%20star/3D/glowing_star_3d.png`,
    defaultWidth: 125,
    defaultHeight: 125,
  },
  {
    id: 'symbol_crown_3d',
    name: 'Crown 3D',
    thName: 'มงกุฎทองความสำเร็จ 3D',
    category: 'symbols',
    url: `${CDN_FLUENT}Crown/3D/crown_3d.png`,
    defaultWidth: 125,
    defaultHeight: 125,
  },
  {
    id: 'symbol_rocket_3d',
    name: 'Rocket 3D',
    thName: 'จรวดพุ่งทะยาน 3D',
    category: 'symbols',
    url: `${CDN_FLUENT}Rocket/3D/rocket_3d.png`,
    defaultWidth: 130,
    defaultHeight: 130,
  },
  {
    id: 'symbol_thumbs_up_3d',
    name: 'Thumbs Up 3D',
    thName: 'ยกนิ้วโป้งเยี่ยม 3D',
    category: 'symbols',
    url: `${CDN_FLUENT}Thumbs%20up/Default/3D/thumbs_up_3d_default.png`,
    defaultWidth: 120,
    defaultHeight: 120,
  },
  {
    id: 'symbol_party_popper_3d',
    name: 'Party Popper 3D',
    thName: 'พลุกระดาษฉลอง 3D',
    category: 'symbols',
    url: `${CDN_FLUENT}Party%20popper/3D/party_popper_3d.png`,
    defaultWidth: 125,
    defaultHeight: 125,
  },
  {
    id: 'symbol_trophy_3d',
    name: 'Trophy 3D',
    thName: 'ถ้วยรางวัลอันดับ 1',
    category: 'symbols',
    url: `${CDN_FLUENT}Trophy/3D/trophy_3d.png`,
    defaultWidth: 120,
    defaultHeight: 120,
  },
  {
    id: 'symbol_bullseye_3d',
    name: 'Target Bullseye 3D',
    thName: 'เป้าหมายตรงเป้า',
    category: 'symbols',
    url: `${CDN_FLUENT}Bullseye/3D/bullseye_3d.png`,
    defaultWidth: 120,
    defaultHeight: 120,
  },
  {
    id: 'symbol_fire_3d',
    name: 'Fire 3D',
    thName: 'ไฟร้อนแรง 3D',
    category: 'symbols',
    url: `${CDN_FLUENT}Fire/3D/fire_3d.png`,
    defaultWidth: 120,
    defaultHeight: 120,
  },
  {
    id: 'symbol_check_mark_3d',
    name: 'Check Mark Button 3D',
    thName: 'ปุ่มถูกต้องสีเขียว 3D',
    category: 'symbols',
    url: `${CDN_FLUENT}Check%20mark%20button/3D/check_mark_button_3d.png`,
    defaultWidth: 115,
    defaultHeight: 115,
  },
  {
    id: 'symbol_cross_mark_3d',
    name: 'Cross Mark 3D',
    thName: 'กากบาทสีแดง 3D',
    category: 'symbols',
    url: `${CDN_FLUENT}Cross%20mark/3D/cross_mark_3d.png`,
    defaultWidth: 115,
    defaultHeight: 115,
  },
  {
    id: 'symbol_100_points_3d',
    name: 'Hundred Points 3D',
    thName: 'คะแนน 100 เต็ม 3D',
    category: 'symbols',
    url: `${CDN_FLUENT}Hundred%20points/3D/hundred_points_3d.png`,
    defaultWidth: 120,
    defaultHeight: 120,
  },
  {
    id: 'symbol_money_bag_3d',
    name: 'Money Bag 3D',
    thName: 'ถุงเงินงบประมาณ 3D',
    category: 'symbols',
    url: `${CDN_FLUENT}Money%20bag/3D/money_bag_3d.png`,
    defaultWidth: 120,
    defaultHeight: 120,
  },
  {
    id: 'symbol_red_heart_3d',
    name: 'Red Heart 3D',
    thName: 'หัวใจแดง 3D',
    category: 'symbols',
    url: `${CDN_FLUENT}Red%20heart/3D/red_heart_3d.png`,
    defaultWidth: 120,
    defaultHeight: 120,
  },
  {
    id: 'symbol_gem_stone_3d',
    name: 'Gem Stone 3D',
    thName: 'เพชรคริสตัลประกาย 3D',
    category: 'symbols',
    url: `${CDN_FLUENT}Gem%20stone/3D/gem_stone_3d.png`,
    defaultWidth: 120,
    defaultHeight: 120,
  },
  {
    id: 'symbol_coffee_3d',
    name: 'Coffee Cup 3D',
    thName: 'แก้วกาแฟพักผ่อน 3D',
    category: 'symbols',
    url: `${CDN_FLUENT}Hot%20beverage/3D/hot_beverage_3d.png`,
    defaultWidth: 120,
    defaultHeight: 120,
  },
  {
    id: 'symbol_laptop_3d',
    name: 'Laptop 3D',
    thName: 'โน้ตบุ๊กคอมพิวเตอร์ 3D',
    category: 'symbols',
    url: `${CDN_FLUENT}Laptop/3D/laptop_3d.png`,
    defaultWidth: 125,
    defaultHeight: 125,
  },
  {
    id: 'symbol_locked_3d',
    name: 'Locked Padlock 3D',
    thName: 'แม่กุญแจความปลอดภัย 3D',
    category: 'symbols',
    url: `${CDN_FLUENT}Locked/3D/locked_3d.png`,
    defaultWidth: 120,
    defaultHeight: 120,
  },
  {
    id: 'symbol_pushpin_3d',
    name: 'Pushpin 3D',
    thName: 'หมุดปักสีแดง 3D',
    category: 'symbols',
    url: `${CDN_FLUENT}Pushpin/3D/pushpin_3d.png`,
    defaultWidth: 120,
    defaultHeight: 120,
  },
  {
    id: 'symbol_warning_3d',
    name: 'Warning Triangle 3D',
    thName: 'ป้ายเตือนสามเหลี่ยม 3D',
    category: 'symbols',
    url: `${CDN_FLUENT}Warning/3D/warning_3d.png`,
    defaultWidth: 125,
    defaultHeight: 125,
  },
  {
    id: 'symbol_question_mark_3d',
    name: 'Question Mark 3D',
    thName: 'เครื่องหมายคำถาม ?',
    category: 'symbols',
    url: SVG_QUESTION_MARK_3D,
    defaultWidth: 100,
    defaultHeight: 135,
  },
  {
    id: 'symbol_musical_notes',
    name: 'Musical Notes',
    thName: 'ตัวโน้ตดนตรี',
    category: 'symbols',
    url: SVG_MUSICAL_NOTES,
    defaultWidth: 120,
    defaultHeight: 120,
  },
  {
    id: 'symbol_exclamation_mark',
    name: 'Exclamation Mark',
    thName: 'เครื่องหมายตกใจ !',
    category: 'symbols',
    url: SVG_EXCLAMATION_MARK,
    defaultWidth: 80,
    defaultHeight: 130,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 4. หมวดแสตมป์ & ป้ายข้อความ (Stamps & Badges)
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'stamp_approved',
    name: 'Stamp Approved',
    thName: 'ตรายาง APPROVED',
    category: 'stamps',
    url: SVG_STAMP_APPROVED,
    defaultWidth: 170,
    defaultHeight: 70,
  },
  {
    id: 'stamp_completed',
    name: 'Stamp Completed',
    thName: 'ตรายาง COMPLETED',
    category: 'stamps',
    url: SVG_STAMP_COMPLETED,
    defaultWidth: 175,
    defaultHeight: 72,
  },
  {
    id: 'stamp_urgent',
    name: 'Stamp Urgent',
    thName: 'ตรายาง URGENT!',
    category: 'stamps',
    url: SVG_STAMP_URGENT,
    defaultWidth: 165,
    defaultHeight: 75,
  },
  {
    id: 'stamp_important',
    name: 'Stamp Important',
    thName: 'ตรายาง IMPORTANT',
    category: 'stamps',
    url: SVG_STAMP_IMPORTANT,
    defaultWidth: 175,
    defaultHeight: 75,
  },
  {
    id: 'stamp_idea',
    name: 'Stamp Idea',
    thName: 'ตรายาง IDEA',
    category: 'stamps',
    url: SVG_STAMP_IDEA,
    defaultWidth: 150,
    defaultHeight: 68,
  },
  {
    id: 'stamp_draft',
    name: 'Stamp Draft',
    thName: 'ตรายาง DRAFT',
    category: 'stamps',
    url: SVG_STAMP_DRAFT,
    defaultWidth: 155,
    defaultHeight: 70,
  },
  {
    id: 'stamp_in_progress',
    name: 'Stamp In Progress',
    thName: 'ตรายาง IN PROGRESS',
    category: 'stamps',
    url: SVG_STAMP_IN_PROGRESS,
    defaultWidth: 175,
    defaultHeight: 72,
  },
  {
    id: 'stamp_new',
    name: 'Stamp New',
    thName: 'ตรายาง NEW!',
    category: 'stamps',
    url: SVG_STAMP_NEW,
    defaultWidth: 140,
    defaultHeight: 75,
  },
  {
    id: 'stamp_confidential',
    name: 'Stamp Confidential',
    thName: 'ตรายาง CONFIDENTIAL',
    category: 'stamps',
    url: SVG_STAMP_CONFIDENTIAL,
    defaultWidth: 185,
    defaultHeight: 72,
  },
  {
    id: 'stamp_rejected',
    name: 'Stamp Rejected',
    thName: 'ตรายาง REJECTED',
    category: 'stamps',
    url: SVG_STAMP_REJECTED,
    defaultWidth: 170,
    defaultHeight: 72,
  },
  {
    id: 'stamp_top_secret',
    name: 'Stamp Top Secret',
    thName: 'ตรายาง TOP SECRET',
    category: 'stamps',
    url: SVG_STAMP_TOP_SECRET,
    defaultWidth: 180,
    defaultHeight: 75,
  },
];

// Helper to check if a note is a board sticker
export const isStickerNote = (note: { title?: string | null; content: string }): boolean => {
  if (!note) return false;
  if (note.title === '[STICKER]') return true;
  if (typeof note.content === 'string' && note.content.startsWith('[STICKER]:')) return true;
  return false;
};

// Helper to extract sticker URL from note content
export const getStickerUrl = (note: { content: string }): string => {
  if (!note || !note.content) return '';
  if (note.content.startsWith('[STICKER]:')) {
    return note.content.replace('[STICKER]:', '').trim();
  }
  return note.content;
};
