import { useRouter } from 'next/router';
import { formatDistanceToNow } from 'date-fns';
import { MoreVertical, Pin, Archive, Trash2, Copy, Lock, Unlock } from 'lucide-react';
import { Note } from '@/types';
import { useNoteStore } from '@/store/noteStore';

interface NoteCardProps {
  note: Note;
}

export default function NoteCard({ note }: NoteCardProps) {
  const router = useRouter();
  const { updateNote, deleteNote, archiveNote } = useNoteStore();

  const handleClick = () => {
    router.push(`/notes/${note.id}`);
  };

  return (
    <div
      className={`group relative bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer border border-gray-200 dark:border-gray-700 overflow-hidden`}
      style={{ borderTopColor: note.color || '#6366F1', borderTopWidth: '4px' }}
      onClick={handleClick}
    >
      {/* Pin Badge */}
      {note.isPinned && (
        <div className="absolute top-2 right-2 z-10">
          <Pin size={16} className="text-indigo-500 fill-indigo-500" />
        </div>
      )}

      {/* Lock Badge */}
      {note.isLocked && (
        <div className="absolute top-2 left-2 z-10">
          <Lock size={16} className="text-gray-500" />
        </div>
      )}

      <div className="p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-1">
          {note.title || 'ไม่มีชื่อ'}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
          {note.content || 'ไม่มีเนื้อหา'}
        </p>

        {/* Labels */}
        {note.labels && note.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {note.labels.map((label) => (
              <span
                key={label}
                className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs rounded-full"
              >
                #{label}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
          </span>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                archiveNote(note.id);
              }}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <Archive size={14} className="text-gray-500" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteNote(note.id);
              }}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <Trash2 size={14} className="text-gray-500" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}