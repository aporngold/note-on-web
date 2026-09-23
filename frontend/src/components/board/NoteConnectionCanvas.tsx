import React from 'react';
import { NoteConnection, Note } from '@/types';
import { useNoteStore } from '@/store/noteStore';
import { X } from 'lucide-react';

interface NoteConnectionCanvasProps {
  connections: NoteConnection[];
  notes: Note[];
}

interface Point {
  x: number;
  y: number;
}

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

type Side = 'top' | 'bottom' | 'left' | 'right';

interface IntersectionResult {
  x: number;
  y: number;
  side: Side;
}

/**
 * Calculates the exact intersection point of a ray from the box center
 * towards the target center with the bounding rectangle of the note.
 */
function getBoxIntersection(box: Box, targetCenter: Point): IntersectionResult {
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  const dx = targetCenter.x - cx;
  const dy = targetCenter.y - cy;

  // Overlapping centers fallback
  if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) {
    return { x: cx + box.w / 2, y: cy, side: 'right' };
  }

  const hw = box.w / 2;
  const hh = box.h / 2;

  // Determine intersection based on slope comparisons
  if (Math.abs(dy * hw) < Math.abs(dx * hh)) {
    // Hits left or right vertical edge
    if (dx > 0) {
      return { x: cx + hw, y: cy + (hw * dy) / dx, side: 'right' };
    } else {
      return { x: cx - hw, y: cy - (hw * dy) / dx, side: 'left' };
    }
  } else {
    // Hits top or bottom horizontal edge
    if (dy > 0) {
      return { x: cx + (hh * dx) / dy, y: cy + hh, side: 'bottom' };
    } else {
      return { x: cx - (hh * dx) / dy, y: cy - hh, side: 'top' };
    }
  }
}

/**
 * Computes cubic bezier control points giving a natural smooth curve out of the edges
 */
function getBezierControlPoints(
  sEdge: IntersectionResult,
  tEdge: IntersectionResult
): { cx1: number; cy1: number; cx2: number; cy2: number } {
  const dist = Math.hypot(tEdge.x - sEdge.x, tEdge.y - sEdge.y);
  const offset = Math.max(25, Math.min(dist * 0.4, 120));

  let cx1 = sEdge.x;
  let cy1 = sEdge.y;
  let cx2 = tEdge.x;
  let cy2 = tEdge.y;

  // Source direction offset
  if (sEdge.side === 'right') cx1 += offset;
  else if (sEdge.side === 'left') cx1 -= offset;
  else if (sEdge.side === 'bottom') cy1 += offset;
  else if (sEdge.side === 'top') cy1 -= offset;

  // Target direction offset (approaches along the normal)
  if (tEdge.side === 'right') cx2 += offset;
  else if (tEdge.side === 'left') cx2 -= offset;
  else if (tEdge.side === 'bottom') cy2 += offset;
  else if (tEdge.side === 'top') cy2 -= offset;

  return { cx1, cy1, cx2, cy2 };
}

export default function NoteConnectionCanvas({
  connections,
  notes,
}: NoteConnectionCanvasProps) {
  const { deleteConnection } = useNoteStore();

  const noteMap = new Map<string, Note>();
  notes.forEach((n) => noteMap.set(n.id, n));

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none z-[12]"
      style={{ overflow: 'visible' }}
    >
      <defs>
        {/* Dynamic sleek bow arrowheads for each connection */}
        {connections.map((conn) => {
          const lineColor = conn.color || '#6366F1';
          return (
            <React.Fragment key={`marker-def-${conn.id}`}>
              {/* Normal bow arrowhead */}
              <marker
                id={`arrow-marker-${conn.id}`}
                viewBox="0 0 14 14"
                refX="11.5"
                refY="7"
                markerWidth="9"
                markerHeight="9"
                orient="auto"
              >
                {/* Sleek bow arrowhead (ธนู) with aerodynamic notched back */}
                <path
                  d="M 1 2.5 L 12 7 L 1 11.5 L 4 7 Z"
                  fill={lineColor}
                  className="transition-colors"
                />
              </marker>

              {/* Hover active bow arrowhead */}
              <marker
                id={`arrow-marker-hover-${conn.id}`}
                viewBox="0 0 14 14"
                refX="11.5"
                refY="7"
                markerWidth="10"
                markerHeight="10"
                orient="auto"
              >
                <path
                  d="M 1 2.5 L 12 7 L 1 11.5 L 4 7 Z"
                  fill="#4F46E5"
                />
              </marker>
            </React.Fragment>
          );
        })}
      </defs>

      {connections.map((conn) => {
        const source = noteMap.get(conn.sourceId);
        const target = noteMap.get(conn.targetId);

        if (!source || !target) return null;

        const sW = source.width ?? 260;
        const sH = source.height ?? 260;
        const tW = target.width ?? 260;
        const tH = target.height ?? 260;

        const sCenter: Point = {
          x: (source.posX ?? 100) + sW / 2,
          y: (source.posY ?? 100) + sH / 2,
        };
        const tCenter: Point = {
          x: (target.posX ?? 100) + tW / 2,
          y: (target.posY ?? 100) + tH / 2,
        };

        const sBox: Box = {
          x: source.posX ?? 100,
          y: source.posY ?? 100,
          w: sW,
          h: sH,
        };
        const tBox: Box = {
          x: target.posX ?? 100,
          y: target.posY ?? 100,
          w: tW,
          h: tH,
        };

        // Edge-to-edge intersection points
        const sEdge = getBoxIntersection(sBox, tCenter);
        const tEdge = getBoxIntersection(tBox, sCenter);

        // Calculate smooth cubic bezier control points based on sides
        const { cx1, cy1, cx2, cy2 } = getBezierControlPoints(sEdge, tEdge);

        // Midpoint on cubic Bezier curve at t = 0.5
        const midX =
          0.125 * sEdge.x + 0.375 * cx1 + 0.375 * cx2 + 0.125 * tEdge.x;
        const midY =
          0.125 * sEdge.y + 0.375 * cy1 + 0.375 * cy2 + 0.125 * tEdge.y;

        const lineColor = conn.color || '#6366F1';
        const pathData = `M ${sEdge.x} ${sEdge.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${tEdge.x} ${tEdge.y}`;

        return (
          <g key={conn.id} className="group pointer-events-auto">
            {/* Background wider invisible stroke for easy clicking/hovering */}
            <path
              d={pathData}
              fill="none"
              stroke="transparent"
              strokeWidth="20"
              className="cursor-pointer"
            />

            {/* Visual connecting bezier line with bow arrowhead */}
            <path
              d={pathData}
              fill="none"
              stroke={lineColor}
              strokeWidth="2.5"
              strokeDasharray={conn.arrowType === 'dashed' ? '6,6' : undefined}
              markerEnd={`url(#arrow-marker-${conn.id})`}
              className="transition-all duration-200 group-hover:stroke-indigo-600 group-hover:stroke-[3.5] drop-shadow-xs"
            />

            {/* Center link badge with label and delete button */}
            <foreignObject
              x={midX - 40}
              y={midY - 14}
              width="80"
              height="28"
              className="overflow-visible pointer-events-auto select-none"
            >
              <div className="flex items-center justify-center">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConnection(conn.id);
                  }}
                  className="px-2.5 py-0.5 bg-white/95 dark:bg-slate-800/95 hover:bg-rose-50 dark:hover:bg-rose-950/60 border border-indigo-200 dark:border-indigo-800 hover:border-rose-400 rounded-full shadow-md text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-rose-600 flex items-center gap-1 transition-all duration-150 scale-95 hover:scale-105 cursor-pointer backdrop-blur-xs"
                  title="คลิกเพื่อลบเส้นเชื่อมต่อนี้"
                >
                  <span className="truncate max-w-[50px]">{conn.label || 'เชื่อมต่อ'}</span>
                  <X size={10} className="shrink-0 text-slate-400 hover:text-rose-600" />
                </button>
              </div>
            </foreignObject>
          </g>
        );
      })}
    </svg>
  );
}
