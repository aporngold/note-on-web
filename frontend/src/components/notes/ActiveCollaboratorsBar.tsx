import React, { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { ActiveCollaborator } from '@/types';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/authStore';

interface ActiveCollaboratorsBarProps {
  noteId?: string;
}

export default function ActiveCollaboratorsBar({ noteId }: ActiveCollaboratorsBarProps) {
  const [collaborators, setCollaborators] = useState<ActiveCollaborator[]>([]);
  const { user } = useAuthStore();

  useEffect(() => {
    if (!noteId || !user) return;

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5000';
    const socket: Socket = io(wsUrl, {
      transports: ['websocket', 'polling'],
    });

    socket.emit('join-note', {
      noteId,
      userId: user.id,
      username: user.username,
    });

    socket.on('note-presence-updated', (users: ActiveCollaborator[]) => {
      setCollaborators(users);
    });

    return () => {
      socket.emit('leave-note', noteId);
      socket.disconnect();
    };
  }, [noteId, user]);

  if (!noteId || collaborators.length === 0) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-sm animate-fade-in">
      <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>กำลังดู ({collaborators.length}):</span>
      </div>

      <div className="flex items-center -space-x-1.5">
        {collaborators.map((c, i) => (
          <div
            key={i}
            title={`${c.username} (กำลังเปิดโน้ตนี้อยู่)`}
            className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-bold text-white shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 transition-transform hover:scale-110"
            style={{ backgroundColor: c.color || '#6366F1' }}
          >
            {c.username.charAt(0).toUpperCase()}
          </div>
        ))}
      </div>
    </div>
  );
}
