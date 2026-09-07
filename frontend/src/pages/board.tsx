import React, { useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import StickyBoard from '@/components/board/StickyBoard';
import { useNoteStore } from '@/store/noteStore';
import { useAuthStore } from '@/store/authStore';

export default function BoardPage() {
  const { user } = useAuthStore();
  const { notes, activeBoardId, fetchNotes, fetchBoards, setBoardViewMode } = useNoteStore();

  useEffect(() => {
    setBoardViewMode('freeform');
    if (user) {
      fetchNotes({ isArchived: false });
      fetchBoards();
    }
  }, [user, fetchNotes, fetchBoards, setBoardViewMode]);

  const activeNotes = notes.filter((n) => {
    if (n.isArchived) return false;
    if (!activeBoardId) return true;
    return n.boardId === activeBoardId;
  });

  return (
    <Layout showSearch={false}>
      <StickyBoard notes={activeNotes} />
    </Layout>
  );
}
