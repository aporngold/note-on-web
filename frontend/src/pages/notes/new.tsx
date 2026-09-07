import React from 'react';
import Layout from '@/components/layout/Layout';
import NoteEditor from '@/components/notes/NoteEditor';

export default function NewNotePage() {
  return (
    <Layout showSearch={false}>
      <NoteEditor />
    </Layout>
  );
}
