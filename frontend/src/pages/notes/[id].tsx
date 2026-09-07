import React from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/layout/Layout';
import NoteEditor from '@/components/notes/NoteEditor';

export default function EditNotePage() {
  const router = useRouter();
  const { id } = router.query;

  if (!id || typeof id !== 'string') {
    return null;
  }

  return (
    <Layout showSearch={false}>
      <NoteEditor initialNoteId={id} />
    </Layout>
  );
}
