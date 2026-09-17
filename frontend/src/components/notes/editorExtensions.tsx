import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Node, Extension, mergeAttributes } from '@tiptap/core';
import Image from '@tiptap/extension-image';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Trash2,
  Maximize2,
} from 'lucide-react';

// ══════════════════════════════════════════════════════════════════════════════
// 1. Audio Node Extension for TipTap
// ══════════════════════════════════════════════════════════════════════════════
export const AudioExtension = Node.create({
  name: 'audio',
  group: 'block',
  selectable: true,
  draggable: true,
  atom: true,

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: (element) => element.getAttribute('src') || element.querySelector('source')?.getAttribute('src') || null,
        renderHTML: (attributes) => {
          if (!attributes.src) return {};
          return { src: attributes.src };
        },
      },
      controls: {
        default: true,
        parseHTML: () => true,
        renderHTML: () => ({ controls: 'true' }),
      },
      title: {
        default: 'บันทึกเสียง',
        parseHTML: (element) => element.getAttribute('title') || 'บันทึกเสียง',
        renderHTML: (attributes) => ({ title: attributes.title }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'audio',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'audio',
      mergeAttributes(
        {
          controls: 'true',
          class: 'w-full my-2.5 rounded-xl shadow-xs border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-1',
        },
        HTMLAttributes
      ),
    ];
  },
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. Interactive Resizable Image View Component
// ══════════════════════════════════════════════════════════════════════════════
function ResizableImageView(props: NodeViewProps) {
  const { node, updateAttributes, deleteNode, selected } = props;
  const { src, alt, title, width, alignment = 'center' } = node.attrs;

  const [isResizing, setIsResizing] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  // Alignment classes
  const getAlignmentClass = () => {
    if (alignment === 'left') return 'mr-auto ml-0 block';
    if (alignment === 'right') return 'ml-auto mr-0 block';
    return 'mx-auto block';
  };

  const handleResizeStart = (
    direction: 'se' | 'sw' | 'ne' | 'nw' | 'e' | 'w'
  ) => (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    startXRef.current = clientX;

    const imgEl = containerRef.current?.querySelector('img');
    startWidthRef.current = imgEl ? imgEl.getBoundingClientRect().width : 300;
    setIsResizing(true);

    const onMove = (moveEvent: MouseEvent | TouchEvent) => {
      const currentX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const rawDeltaX = currentX - startXRef.current;
      
      // If dragging from left side (sw, nw, w), pulling left expands, pulling right shrinks
      const isLeft = direction === 'sw' || direction === 'nw' || direction === 'w';
      const deltaX = isLeft ? -rawDeltaX : rawDeltaX;
      
      const parentWidth = containerRef.current?.parentElement?.clientWidth || 800;

      // Minimum 80px, maximum 100% of parent
      const newWidthPx = Math.max(80, Math.min(parentWidth, startWidthRef.current + deltaX));
      const percentage = Math.round((newWidthPx / parentWidth) * 100);
      updateAttributes({ width: `${percentage}%` });
    };

    const onEnd = () => {
      setIsResizing(false);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onMove);
    window.addEventListener('touchend', onEnd);
  };

  const handleSetWidthPercent = (pct: number) => {
    updateAttributes({ width: `${pct}%`, class: `img-w-${pct}` });
  };

  const handleSetAlignment = (align: 'left' | 'center' | 'right') => {
    updateAttributes({ alignment: align, class: `img-align-${align}` });
  };

  return (
    <NodeViewWrapper
      ref={containerRef}
      className={`relative my-4 select-none ${getAlignmentClass()}`}
      style={{ width: width || '100%', maxWidth: '100%' }}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => !isResizing && setShowControls(false)}
      onClick={() => setShowControls(true)}
    >
      {/* Floating Control Toolbar (Visible when selected or hovered) */}
      {(selected || showControls || isResizing) && (
        <div className="absolute -top-11 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 bg-slate-900/90 text-white backdrop-blur-md px-2.5 py-1 rounded-xl shadow-xl text-xs font-semibold select-none border border-white/20 animate-fade-in whitespace-nowrap">
          {/* Width Presets */}
          <span className="text-[10px] text-slate-400 mr-1">ขนาด:</span>
          <button
            type="button"
            onClick={() => handleSetWidthPercent(25)}
            className="px-1.5 py-0.5 rounded hover:bg-slate-700 transition text-[11px]"
          >
            25%
          </button>
          <button
            type="button"
            onClick={() => handleSetWidthPercent(50)}
            className="px-1.5 py-0.5 rounded hover:bg-slate-700 transition text-[11px]"
          >
            50%
          </button>
          <button
            type="button"
            onClick={() => handleSetWidthPercent(75)}
            className="px-1.5 py-0.5 rounded hover:bg-slate-700 transition text-[11px]"
          >
            75%
          </button>
          <button
            type="button"
            onClick={() => handleSetWidthPercent(100)}
            className="px-1.5 py-0.5 rounded hover:bg-slate-700 transition text-[11px]"
          >
            100%
          </button>

          <span className="w-px h-3.5 bg-slate-700 mx-1" />

          {/* Alignment Presets */}
          <button
            type="button"
            onClick={() => handleSetAlignment('left')}
            className={`p-1 rounded hover:bg-slate-700 transition ${
              alignment === 'left' ? 'text-indigo-400 bg-slate-800' : ''
            }`}
            title="จัดชิดซ้าย"
          >
            <AlignLeft size={13} />
          </button>
          <button
            type="button"
            onClick={() => handleSetAlignment('center')}
            className={`p-1 rounded hover:bg-slate-700 transition ${
              alignment === 'center' ? 'text-indigo-400 bg-slate-800' : ''
            }`}
            title="จัดกึ่งกลาง"
          >
            <AlignCenter size={13} />
          </button>
          <button
            type="button"
            onClick={() => handleSetAlignment('right')}
            className={`p-1 rounded hover:bg-slate-700 transition ${
              alignment === 'right' ? 'text-indigo-400 bg-slate-800' : ''
            }`}
            title="จัดชิดขวา"
          >
            <AlignRight size={13} />
          </button>

          <span className="w-px h-3.5 bg-slate-700 mx-1" />

          {/* Delete Button */}
          <button
            type="button"
            onClick={() => deleteNode()}
            className="p-1 rounded hover:bg-rose-500/30 text-rose-400 transition"
            title="ลบรูปภาพ"
          >
            <Trash2 size={13} />
          </button>
        </div>
      )}

      {/* The Actual Image with Outline & Visual Feedback */}
      <div
        className={`relative inline-block w-full rounded-2xl overflow-hidden transition-all duration-150 ${
          selected || isResizing
            ? 'ring-3 ring-indigo-600 ring-offset-2 dark:ring-offset-slate-900 shadow-xl'
            : 'hover:ring-2 hover:ring-indigo-400/60'
        }`}
      >
        <img
          src={src}
          alt={alt || ''}
          title={title || undefined}
          className="w-full h-auto object-contain rounded-2xl block"
        />

        {/* Caption Display if provided */}
        {title && (
          <div className="text-center text-xs text-slate-500 dark:text-slate-400 italic py-1 bg-slate-100/70 dark:bg-slate-800/70">
            {title}
          </div>
        )}

        {/* Multi-directional Drag Resize Handles (All 4 Corners + 2 Edges) */}
        {(selected || showControls || isResizing) && (
          <>
            {/* 1. Bottom-Right (SE) */}
            <div
              onMouseDown={handleResizeStart('se')}
              onTouchStart={handleResizeStart('se')}
              className="absolute bottom-1.5 right-1.5 w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-lg cursor-nwse-resize hover:scale-110 active:scale-95 transition-transform z-20"
              title="ลากมุมขวาล่างเพื่อปรับขนาด"
            >
              <Maximize2 size={12} className="rotate-90" />
            </div>

            {/* 2. Bottom-Left (SW) */}
            <div
              onMouseDown={handleResizeStart('sw')}
              onTouchStart={handleResizeStart('sw')}
              className="absolute bottom-1.5 left-1.5 w-5 h-5 rounded-md bg-white dark:bg-slate-800 border-2 border-indigo-600 shadow-md cursor-nesw-resize hover:scale-125 active:scale-95 transition-transform z-20"
              title="ลากมุมซ้ายล่างเพื่อปรับขนาด"
            />

            {/* 3. Top-Right (NE) */}
            <div
              onMouseDown={handleResizeStart('ne')}
              onTouchStart={handleResizeStart('ne')}
              className="absolute top-1.5 right-1.5 w-5 h-5 rounded-md bg-white dark:bg-slate-800 border-2 border-indigo-600 shadow-md cursor-nesw-resize hover:scale-125 active:scale-95 transition-transform z-20"
              title="ลากมุมขวาบนเพื่อปรับขนาด"
            />

            {/* 4. Top-Left (NW) */}
            <div
              onMouseDown={handleResizeStart('nw')}
              onTouchStart={handleResizeStart('nw')}
              className="absolute top-1.5 left-1.5 w-5 h-5 rounded-md bg-white dark:bg-slate-800 border-2 border-indigo-600 shadow-md cursor-nwse-resize hover:scale-125 active:scale-95 transition-transform z-20"
              title="ลากมุมซ้ายบนเพื่อปรับขนาด"
            />

            {/* 5. Middle-Right Edge (E) */}
            <div
              onMouseDown={handleResizeStart('e')}
              onTouchStart={handleResizeStart('e')}
              className="absolute top-1/2 -translate-y-1/2 right-1 w-2.5 h-8 rounded-full bg-indigo-600 shadow-md cursor-ew-resize hover:scale-125 active:scale-95 transition-transform z-20"
              title="ลากขอบขวาเพื่อปรับความกว้าง"
            />

            {/* 6. Middle-Left Edge (W) */}
            <div
              onMouseDown={handleResizeStart('w')}
              onTouchStart={handleResizeStart('w')}
              className="absolute top-1/2 -translate-y-1/2 left-1 w-2.5 h-8 rounded-full bg-indigo-600 shadow-md cursor-ew-resize hover:scale-125 active:scale-95 transition-transform z-20"
              title="ลากขอบซ้ายเพื่อปรับความกว้าง"
            />
          </>
        )}
      </div>
    </NodeViewWrapper>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 3. Resizable Image Extension for TipTap
// ══════════════════════════════════════════════════════════════════════════════
export const ResizableImageExtension = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: '100%',
        parseHTML: (element) => element.getAttribute('width') || element.style.width || '100%',
        renderHTML: (attributes) => {
          if (!attributes.width) return {};
          return {
            width: attributes.width,
            style: `width: ${attributes.width}`,
          };
        },
      },
      class: {
        default: null,
        parseHTML: (element) => element.getAttribute('class') || null,
        renderHTML: (attributes) => {
          if (!attributes.class) return {};
          return {
            class: attributes.class,
          };
        },
      },
      alignment: {
        default: 'center',
        parseHTML: (element) => element.getAttribute('data-align') || 'center',
        renderHTML: (attributes) => {
          return {
            'data-align': attributes.alignment || 'center',
          };
        },
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView);
  },
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. Font Family Extension & Presets for TipTap
// ══════════════════════════════════════════════════════════════════════════════
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fontFamily: {
      setFontFamily: (fontFamily: string) => ReturnType;
      unsetFontFamily: () => ReturnType;
    };
  }
}

export interface FontPreset {
  id: string;
  name: string;
  family: string;
  className: string;
  category: 'sans' | 'handwriting' | 'formal' | 'code';
}

export const FONT_PRESETS: FontPreset[] = [
  // ── โมเดิร์น & มินิมอล (Sans) ──
  { id: 'sans', name: 'ปกติ (Inter / Sans)', family: "'Inter', 'Plus Jakarta Sans', system-ui, sans-serif", className: 'font-sans-note', category: 'sans' },
  { id: 'kanit', name: 'คณิต (Kanit)', family: "'Kanit', sans-serif", className: 'font-kanit', category: 'sans' },
  { id: 'prompt', name: 'พร้อมท์ (Prompt)', family: "'Prompt', sans-serif", className: 'font-prompt', category: 'sans' },
  { id: 'mitr', name: 'มิตร (Mitr)', family: "'Mitr', sans-serif", className: 'font-mitr', category: 'sans' },
  { id: 'krub', name: 'ครับ (Krub)', family: "'Krub', sans-serif", className: 'font-krub', category: 'sans' },
  { id: 'k2d', name: 'เคทูดี (K2D)', family: "'K2D', sans-serif", className: 'font-k2d', category: 'sans' },
  { id: 'chakra', name: 'ชักระ เพชร (Chakra Petch)', family: "'Chakra Petch', sans-serif", className: 'font-chakra', category: 'sans' },
  { id: 'baijamjuree', name: 'จามจุรี (Bai Jamjuree)', family: "'Bai Jamjuree', sans-serif", className: 'font-bai-jamjuree', category: 'sans' },
  { id: 'fahkwang', name: 'ฟ้ากว้าง (Fahkwang)', family: "'Fahkwang', sans-serif", className: 'font-fahkwang', category: 'sans' },

  // ── ทางการ สุภาพ & มีหัว (Formal / Serif) ──
  { id: 'sarabun', name: 'สารบรรณ (Sarabun)', family: "'Sarabun', sans-serif", className: 'font-sarabun', category: 'formal' },
  { id: 'pridi', name: 'ปรีดี (Pridi)', family: "'Pridi', serif", className: 'font-pridi', category: 'formal' },
  { id: 'taviraj', name: 'ทวิราช (Taviraj)', family: "'Taviraj', serif", className: 'font-taviraj', category: 'formal' },
  { id: 'serif', name: 'ซีรีฟ (Merriweather)', family: "'Merriweather', serif", className: 'font-serif-note', category: 'formal' },

  // ── ลายมือ น่ารัก & สร้างสรรค์ (Handwriting / Creative) ──
  { id: 'mali', name: 'ลายมือ มะลิ (Mali)', family: "'Mali', cursive, sans-serif", className: 'font-mali', category: 'handwriting' },
  { id: 'itim', name: 'ไอติม (Itim)', family: "'Itim', cursive, sans-serif", className: 'font-itim', category: 'handwriting' },
  { id: 'sriracha', name: 'ศรีราชา (Sriracha)', family: "'Sriracha', cursive, sans-serif", className: 'font-sriracha', category: 'handwriting' },
  { id: 'charm', name: 'ชาม (Charm)', family: "'Charm', cursive, sans-serif", className: 'font-charm', category: 'handwriting' },

  // ── โค้ด & พิมพ์ดีด (Monospace) ──
  { id: 'mono', name: 'โค้ด (JetBrains Mono)', family: "'JetBrains Mono', monospace", className: 'font-mono-note', category: 'code' },
];

export interface FontSizePreset {
  id: string;
  name: string;
  size: string;
  desc?: string;
  description?: string;
}

export const FONT_SIZE_PRESETS: FontSizePreset[] = [
  { id: '12px', name: '12px', size: '12px', desc: 'เล็กมาก', description: 'เล็กมาก' },
  { id: '14px', name: '14px', size: '14px', desc: 'เล็ก', description: 'เล็ก' },
  { id: '16px', name: '16px', size: '16px', desc: 'ปกติ (มาตรฐาน)', description: 'ปกติ (มาตรฐาน)' },
  { id: '18px', name: '18px', size: '18px', desc: 'ปานกลาง', description: 'ปานกลาง' },
  { id: '20px', name: '20px', size: '20px', desc: 'ใหญ่', description: 'ใหญ่' },
  { id: '24px', name: '24px', size: '24px', desc: 'ใหญ่พิเศษ', description: 'ใหญ่พิเศษ' },
  { id: '28px', name: '28px', size: '28px', desc: 'หัวข้อย่อย', description: 'หัวข้อย่อย' },
  { id: '32px', name: '32px', size: '32px', desc: 'หัวข้อ', description: 'หัวข้อ' },
];

// ══════════════════════════════════════════════════════════════════════════════
// 5. Inline 3D Fluent Emoji Extension for TipTap
// ══════════════════════════════════════════════════════════════════════════════
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    inlineEmoji: {
      insert3DEmoji: (options: { src: string; alt?: string; title?: string }) => ReturnType;
    };
  }
}

export const InlineEmojiExtension = Node.create({
  name: 'inlineEmoji',
  group: 'inline',
  inline: true,
  selectable: true,
  draggable: true,
  atom: true,

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: (element) => element.getAttribute('src'),
        renderHTML: (attributes) => ({ src: attributes.src }),
      },
      alt: {
        default: 'emoji',
        parseHTML: (element) => element.getAttribute('alt') || 'emoji',
        renderHTML: (attributes) => ({ alt: attributes.alt }),
      },
      title: {
        default: null,
        parseHTML: (element) => element.getAttribute('title') || undefined,
        renderHTML: (attributes) => (attributes.title ? { title: attributes.title } : {}),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'img[data-emoji="3d"]',
      },
      {
        tag: 'img.fluent-emoji-3d',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'img',
      mergeAttributes(HTMLAttributes, {
        'data-emoji': '3d',
        class: 'fluent-emoji-3d inline-block select-auto pointer-events-auto cursor-pointer',
        style: 'width: 1.25em; height: 1.25em; vertical-align: -0.22em; display: inline-block; margin: 0 0.15em; object-fit: contain;',
      }),
    ];
  },

  addCommands() {
    return {
      insert3DEmoji:
        (options: { src: string; alt?: string; title?: string }) =>
        ({ commands }: any) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },
});



