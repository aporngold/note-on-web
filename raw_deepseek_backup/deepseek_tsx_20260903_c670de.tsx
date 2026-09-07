import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Plus, Search, Grid, List, Filter, Layout } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import NoteCard from '@/components/notes/NoteCard';
import NoteList from '@/components/notes/NoteList';
import { useNoteStore } from '@/store/noteStore';
import { useAuthStore } from '@/store/authStore';

export default function Dashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { notes, searchQuery, viewMode, setSearchQuery, toggleViewMode } = useNoteStore();
  const [filteredNotes, setFilteredNotes] = useState(notes);

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  useEffect(() => {
    const filtered = notes.filter(
      (note) =>
        note.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredNotes(filtered);
  }, [notes, searchQuery]);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              โน้ตทั้งหมด
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {filteredNotes.length} รายการ
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="ค้นหาโน้ต..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* View Toggle */}
            <button
              onClick={toggleViewMode}
              className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {viewMode === 'grid' ? <List size={20} /> : <Grid size={20} />}
            </button>

            {/* New Note */}
            <button
              onClick={() => router.push('/notes/new')}
              className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 flex items-center gap-2"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">โน้ตใหม่</span>
            </button>
          </div>
        </div>

        {/* Notes Grid/List */}
        {filteredNotes.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
              ยังไม่มีโน้ต
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              เริ่มจดบันทึกครั้งแรกของคุณ
            </p>
            <button
              onClick={() => router.push('/notes/new')}
              className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              สร้างโน้ตใหม่
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredNotes.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        ) : (
          <NoteList notes={filteredNotes} />
        )}
      </div>
    </Layout>
  );
}