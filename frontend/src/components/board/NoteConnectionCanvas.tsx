import React from 'react';
import { NoteConnection, Note } from '@/types';
import { useNoteStore } from '@/store/noteStore';
import { X } from 'lucide-react';

interface NoteConnectionCanvasProps {
  connections: NoteConnection[];
  notes: Note[];
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
      className="absolute inset-0 w-full h-full pointer-events-none z-15"
      style={{ overflow: 'visible' }}
    >
      <defs>
        {/* Standard arrowhead marker */}
        <marker
          id="arrow-marker"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#6366F1" />
        </marker>
        <marker
          id="arrow-marker-active"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#4F46E5" />
        </marker>
      </defs>

      {connections.map((conn) => {
        const source = noteMap.get(conn.sourceId);
        const target = noteMap.get(conn.targetId);

        if (!source || !target) return null;

        const sW = source.width ?? 260;
        const sH = source.height ?? 260;
        const tW = target.width ?? 260;
        const tH = target.height ?? 260;

        const sX = (source.posX ?? 100) + sW / 2;
        const sY = (source.posY ?? 100) + sH / 2;
        const tX = (target.posX ?? 100) + tW / 2;
        const tY = (target.posY ?? 100) + tH / 2;

        // Calculate control points for smooth bezier curve
        const dx = tX - sX;
        const dy = tY - sY;
        const cx1 = sX + dx * 0.4;
        const cy1 = sY;
        const cx2 = sX + dx * 0.6;
        const cy2 = tY;

        const midX = (sX + tX) / 2;
        const midY = (sY + tY) / 2;

        const lineColor = conn.color || '#6366F1';

        return (
          <g key={conn.id} className="group pointer-events-auto">
            {/* Background wider line for easier clicking/hover */}
            <path
              d={`M ${sX} ${sY} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${tX} ${tY}`}
              fill="none"
              stroke="transparent"
              strokeWidth="18"
              className="cursor-pointer"
            />

            {/* Visual connecting bezier line */}
            <path
              d={`M ${sX} ${sY} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${tX} ${tY}`}
              fill="none"
              stroke={lineColor}
              strokeWidth="3"
              strokeDasharray={conn.arrowType === 'dashed' ? '6,6' : undefined}
              markerEnd="url(#arrow-marker)"
              className="transition-all hover:stroke-indigo-700 hover:stroke-[4]"
            />

            {/* Center link badge with label and delete button */}
            <foreignObject
              x={midX - 35}
              y={midY - 14}
              width="70"
              height="28"
              className="overflow-visible"
            >
              <div className="flex items-center justify-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConnection(conn.id);
                  }}
                  className="px-2 py-0.5 bg-white/95 dark:bg-slate-800/95 hover:bg-rose-50 dark:hover:bg-rose-950/60 border border-indigo-200 dark:border-indigo-800 hover:border-rose-400 rounded-full shadow-md text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-rose-600 flex items-center gap-1 transition scale-90 hover:scale-100"
                  title="คลิกเพื่อลบเส้นเชื่อมต่อนี้"
                >
                  <span>{conn.label || 'เชื่อมต่อ'}</span>
                  <X size={10} className="text-slate-400 hover:text-rose-600" />
                </button>
              </div>
            </foreignObject>
          </g>
        );
      })}
    </svg>
  );
}
