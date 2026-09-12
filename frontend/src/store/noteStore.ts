import { create } from 'zustand';
import api from '@/utils/api';
import { Note, Notebook, Label, Board, ViewMode, BoardViewMode, NoteConnection } from '@/types';
import toast from 'react-hot-toast';

interface NoteState {
  notes: Note[];
  trashNotes: Note[];
  notebooks: Notebook[];
  labels: Label[];
  boards: Board[];
  connections: NoteConnection[];
  activeBoardId: string | null;
  selectedNotebook: string | null;
  selectedLabel: string | null;
  selectedColor: string | null;
  searchQuery: string;
  defaultViewMode: ViewMode;
  viewMode: ViewMode;
  boardViewMode: BoardViewMode;
  isLoading: boolean;
  isTrashLoading: boolean;

  // Actions
  fetchNotes: (params?: { isArchived?: boolean; isLocked?: boolean; boardId?: string | null }) => Promise<void>;
  fetchTrashNotes: () => Promise<void>;
  fetchNotebooks: () => Promise<void>;
  fetchLabels: () => Promise<void>;
  fetchBoards: () => Promise<void>;
  fetchConnections: (boardId: string) => Promise<void>;
  
  createBoard: (data: { name: string; color?: string; theme?: string; bgImage?: string | null }) => Promise<Board>;
  updateBoard: (id: string, data: { name?: string; color?: string; theme?: string; bgImage?: string | null; isPublic?: boolean; sharePermission?: 'read' | 'edit' }) => Promise<Board>;
  deleteBoard: (id: string) => Promise<void>;
  shareBoard: (id: string, data: { isPublic: boolean; sharePermission: 'read' | 'edit' }) => Promise<Board>;
  setActiveBoardId: (id: string | null) => void;
  setBoardViewMode: (mode: BoardViewMode) => void;

  createConnection: (data: { sourceId: string; targetId: string; boardId: string; label?: string; color?: string; arrowType?: string }) => Promise<void>;
  deleteConnection: (id: string) => Promise<void>;

  createNote: (data: Partial<Note> & { labelIds?: string[] }) => Promise<Note>;
  updateNote: (id: string, data: Partial<Note> & { labelIds?: string[] }) => Promise<Note>;
  deleteNote: (id: string) => Promise<void>;
  restoreNote: (id: string) => Promise<void>;
  duplicateNote: (id: string) => Promise<void>;
  togglePin: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  emptyTrash: () => Promise<void>;

  uploadAttachment: (file: File, noteId?: string) => Promise<any>;
  deleteAttachment: (attachmentId: string, noteId: string) => Promise<void>;

  createNotebook: (data: { name: string; description?: string; color?: string }) => Promise<Notebook>;
  deleteNotebook: (id: string) => Promise<void>;

  createLabel: (data: { name: string; color?: string }) => Promise<Label>;
  deleteLabel: (id: string) => Promise<void>;

  // Remote updates from WebSocket
  setRemoteNoteMoved: (noteId: string, posX: number, posY: number) => void;
  setRemoteNoteUpdated: (note: Note) => void;
  setRemoteConnectionChanged: (data: any) => void;

  setSearchQuery: (q: string) => void;
  setViewMode: (mode: ViewMode) => void;
  setDefaultViewMode: (mode: ViewMode) => void;
  toggleViewMode: () => void;
  setSelectedNotebook: (id: string | null) => void;
  setSelectedLabel: (id: string | null) => void;
  setSelectedColor: (color: string | null) => void;
}

export const useNoteStore = create<NoteState>((set, get) => ({
  notes: [],
  trashNotes: [],
  notebooks: [],
  labels: [],
  boards: [],
  connections: [],
  activeBoardId: null,
  selectedNotebook: null,
  selectedLabel: null,
  selectedColor: null,
  searchQuery: '',
  defaultViewMode: (typeof window !== 'undefined' ? (localStorage.getItem('secure_note_default_view_mode') as ViewMode) : null) || 'board',
  viewMode: (typeof window !== 'undefined' ? (localStorage.getItem('secure_note_default_view_mode') as ViewMode) : null) || 'board',
  boardViewMode: 'freeform',
  isLoading: false,
  isTrashLoading: false,

  fetchNotes: async (params = {}) => {
    set({ isLoading: true });
    try {
      const { selectedNotebook, selectedLabel, selectedColor, activeBoardId, viewMode } = get();
      const queryParams: any = { ...params };

      // Only apply ambient filters (notebook, label, color, board) if NOT querying trash
      if (!params.isArchived) {
        if (selectedNotebook) queryParams.notebookId = selectedNotebook;
        if (selectedLabel) queryParams.labelId = selectedLabel;
        if (selectedColor) queryParams.color = selectedColor;
        if (viewMode === 'board' && activeBoardId) {
          queryParams.boardId = activeBoardId;
        } else if (params.boardId) {
          queryParams.boardId = params.boardId;
        }
      }

      const res = await api.get('/notes', { params: queryParams });
      
      if (params.isArchived) {
        set({ trashNotes: res.data, isLoading: false, isTrashLoading: false });
      } else {
        set({ notes: res.data, isLoading: false });
      }

      // If activeBoardId, also fetch connections for the board (only when not viewing trash)
      if (!params.isArchived) {
        const bId = queryParams.boardId || activeBoardId;
        if (bId) {
          get().fetchConnections(bId);
        }
      }
    } catch (error) {
      console.error('fetchNotes error:', error);
      set({ isLoading: false, isTrashLoading: false });
    }
  },

  fetchTrashNotes: async () => {
    set({ isTrashLoading: true });
    try {
      const res = await api.get('/notes', { params: { isArchived: true } });
      set({ trashNotes: res.data, isTrashLoading: false });
    } catch (error) {
      console.error('fetchTrashNotes error:', error);
      set({ isTrashLoading: false });
    }
  },

  fetchNotebooks: async () => {
    try {
      const res = await api.get('/notebooks');
      set({ notebooks: res.data });
    } catch (error) {
      console.error('fetchNotebooks error:', error);
    }
  },

  fetchLabels: async () => {
    try {
      const res = await api.get('/labels');
      set({ labels: res.data });
    } catch (error) {
      console.error('fetchLabels error:', error);
    }
  },

  fetchBoards: async () => {
    try {
      const res = await api.get('/boards');
      const boards = res.data;
      set({ boards });
      // If no active board selected or active board is not in list, select default or first
      const currentActive = get().activeBoardId;
      if (!currentActive || !boards.some((b: Board) => b.id === currentActive)) {
        const defaultBoard = boards.find((b: Board) => b.isDefault) || boards[0];
        if (defaultBoard) {
          set({ activeBoardId: defaultBoard.id });
        }
      }
    } catch (error) {
      console.error('fetchBoards error:', error);
    }
  },

  fetchConnections: async (boardId: string) => {
    try {
      const res = await api.get('/connections', { params: { boardId } });
      set({ connections: res.data });
    } catch (error) {
      console.error('fetchConnections error:', error);
    }
  },

  createBoard: async (data) => {
    const res = await api.post('/boards', data);
    const newBoard = res.data;
    set((state) => ({
      boards: [...state.boards, newBoard],
      activeBoardId: newBoard.id,
    }));
    toast.success('สร้างกระดานใหม่สำเร็จ');
    get().fetchNotes();
    return newBoard;
  },

  updateBoard: async (id, data) => {
    const res = await api.put(`/boards/${id}`, data);
    const updated = res.data;
    set((state) => ({
      boards: state.boards.map((b) => (b.id === id ? { ...b, ...updated } : b)),
    }));
    toast.success('บันทึกการแก้ไขบอร์ดแล้ว');
    return updated;
  },

  shareBoard: async (id, data) => {
    const res = await api.post(`/boards/${id}/share`, data);
    const updated = res.data;
    set((state) => ({
      boards: state.boards.map((b) => (b.id === id ? { ...b, ...updated } : b)),
    }));
    toast.success('อัปเดตการแชร์บอร์ดแล้ว');
    return updated;
  },

  deleteBoard: async (id) => {
    try {
      const res = await api.delete(`/boards/${id}`);
      const data = res.data;
      if (data.isDefaultBoardCleared) {
        // Default board notes were cleared into trash, but default board stays
        set((state) => ({
          boards: state.boards.map((b) => (b.id === id ? { ...b, noteCount: 0 } : b)),
          notes: state.notes.filter((n) => n.boardId !== id && n.boardId != null),
        }));
        toast.success(data.message || 'ลบโน้ตทั้งหมดบนกระดานหลักเรียบร้อยแล้ว (ย้ายไปที่ถังขยะ)');
        get().fetchNotes();
        get().fetchBoards();
        return;
      }

      const remaining = get().boards.filter((b) => b.id !== id);
      const fallback = remaining.find((b) => b.isDefault) || remaining[0] || null;
      set({
        boards: remaining,
        activeBoardId: fallback ? fallback.id : null,
        notes: get().notes.filter((n) => n.boardId !== id),
      });
      toast.success(data.message || 'ลบบอร์ดเรียบร้อย (โน้ตทั้งหมดถูกย้ายไปที่ถังขยะ)');
      get().fetchNotes();
      get().fetchBoards();
    } catch (error: any) {
      console.error('deleteBoard error:', error);
      toast.error(error.response?.data?.error || 'เกิดข้อผิดพลาดในการลบบอร์ด');
    }
  },

  setActiveBoardId: (id) => {
    set({ activeBoardId: id });
    get().fetchNotes();
  },

  setBoardViewMode: (mode) => {
    set({ boardViewMode: mode });
  },

  createConnection: async (data) => {
    try {
      const res = await api.post('/connections', data);
      const newConn = res.data;
      set((state) => ({
        connections: [...state.connections, newConn],
      }));
      toast.success('เชื่อมต่อโน้ตสำเร็จ');
    } catch (error: any) {
      const msg = error.response?.data?.error || 'เกิดข้อผิดพลาดในการเชื่อมต่อโน้ต';
      toast.error(msg);
    }
  },

  deleteConnection: async (id) => {
    try {
      await api.delete(`/connections/${id}`);
      set((state) => ({
        connections: state.connections.filter((c) => c.id !== id),
      }));
      toast.success('ลบการเชื่อมต่อแล้ว');
    } catch (error) {
      console.error('deleteConnection error:', error);
    }
  },

  createNote: async (data) => {
    const res = await api.post('/notes', data);
    const newNote = res.data;
    set((state) => ({
      notes: [newNote, ...state.notes],
      boards: state.boards.map((b) => {
        const matches = newNote.boardId ? b.id === newNote.boardId : b.isDefault;
        return matches ? { ...b, noteCount: (b.noteCount || 0) + 1 } : b;
      }),
    }));
    get().fetchNotebooks();
    get().fetchLabels();
    return newNote;
  },

  updateNote: async (id, data) => {
    // 1. Optimistic update immediately in local store so dragging/editing never bounces back
    set((state) => ({
      notes: state.notes.map((n) => (n.id === id ? { ...n, ...data } : n)),
    }));
    const res = await api.put(`/notes/${id}`, data);
    const updated = res.data;
    set((state) => ({
      notes: state.notes.map((n) => (n.id === id ? { ...n, ...updated } : n)),
    }));
    get().fetchNotebooks();
    get().fetchLabels();
    return updated;
  },

  deleteNote: async (id) => {
    try {
      const res = await api.delete(`/notes/${id}`);
      const isPermanent = get().trashNotes.some((n) => n.id === id);
      
      set((state) => {
        const foundInNotes = state.notes.find((n) => n.id === id);
        return {
          notes: state.notes.filter((n) => n.id !== id),
          boards: state.boards.map((b) => {
            const matches = foundInNotes?.boardId ? b.id === foundInNotes.boardId : b.isDefault;
            return matches ? { ...b, noteCount: Math.max(0, (b.noteCount || 1) - 1) } : b;
          }),
          trashNotes: isPermanent
            ? state.trashNotes.filter((n) => n.id !== id)
            : foundInNotes
            ? [{ ...foundInNotes, isArchived: true }, ...state.trashNotes]
            : state.trashNotes,
          connections: state.connections.filter((c) => c.sourceId !== id && c.targetId !== id),
        };
      });
      
      toast.success(res.data.message || (isPermanent ? 'ลบโน้ตถาวรเรียบร้อยแล้ว' : 'ย้ายโน้ตไปที่ถังขยะแล้ว'));
      get().fetchTrashNotes();
      get().fetchNotebooks();
      get().fetchBoards();
    } catch (error: any) {
      console.error('deleteNote error:', error);
      toast.error(error.response?.data?.error || 'เกิดข้อผิดพลาดในการลบโน้ต');
    }
  },

  restoreNote: async (id) => {
    try {
      const res = await api.post(`/notes/${id}/restore`);
      set((state) => {
        const restoredNote = state.trashNotes.find((n) => n.id === id);
        return {
          trashNotes: state.trashNotes.filter((n) => n.id !== id),
          notes: restoredNote
            ? [{ ...restoredNote, isArchived: false, updatedAt: new Date().toISOString() }, ...state.notes]
            : state.notes,
        };
      });
      toast.success(res.data.message || 'กู้คืนโน้ตเรียบร้อย');
      get().fetchTrashNotes();
      get().fetchNotes();
      get().fetchNotebooks();
      get().fetchBoards();
    } catch (error: any) {
      console.error('restoreNote error:', error);
      toast.error(error.response?.data?.error || 'เกิดข้อผิดพลาดในการกู้คืนโน้ต');
    }
  },

  duplicateNote: async (id) => {
    const res = await api.post(`/notes/${id}/duplicate`);
    set((state) => ({
      notes: [res.data, ...state.notes],
    }));
    toast.success('คัดลอกโน้ตสำเร็จ');
    get().fetchNotebooks();
  },

  togglePin: async (id) => {
    const res = await api.post(`/notes/${id}/pin`);
    set((state) => ({
      notes: state.notes
        .map((n) => (n.id === id ? { ...n, isPinned: res.data.isPinned } : n))
        .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0)),
    }));
    toast.success(res.data.message);
  },

  toggleFavorite: async (id) => {
    const res = await api.post(`/notes/${id}/favorite`);
    set((state) => ({
      notes: state.notes.map((n) =>
        n.id === id ? { ...n, isFavorite: res.data.isFavorite } : n
      ),
    }));
    toast.success(res.data.message);
  },

  emptyTrash: async () => {
    try {
      const res = await api.delete('/notes/trash/empty');
      set({ trashNotes: [] });
      toast.success(res.data.message || 'ล้างถังขยะเรียบร้อย');
      get().fetchTrashNotes();
      get().fetchNotebooks();
      get().fetchBoards();
    } catch (error: any) {
      console.error('emptyTrash error:', error);
      toast.error(error.response?.data?.error || 'เกิดข้อผิดพลาดในการล้างถังขยะ');
    }
  },

  uploadAttachment: async (file: File, noteId?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (noteId) {
      formData.append('noteId', noteId);
    }

    const res = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (noteId && res.data.attachment) {
      set((state) => ({
        notes: state.notes.map((n) =>
          n.id === noteId
            ? { ...n, attachments: [...(n.attachments || []), res.data.attachment] }
            : n
        ),
      }));
    }

    toast.success('อัปโหลดไฟล์สำเร็จ');
    return res.data;
  },

  deleteAttachment: async (attachmentId: string, noteId: string) => {
    await api.delete(`/upload/attachment/${attachmentId}`);
    set((state) => ({
      notes: state.notes.map((n) =>
        n.id === noteId
          ? { ...n, attachments: (n.attachments || []).filter((a) => a.id !== attachmentId) }
          : n
      ),
    }));
    toast.success('ลบไฟล์แนบแล้ว');
  },

  createNotebook: async (data) => {
    const res = await api.post('/notebooks', data);
    set((state) => ({
      notebooks: [...state.notebooks, res.data],
    }));
    toast.success('สร้างสมุดบันทึกสำเร็จ');
    return res.data;
  },

  deleteNotebook: async (id) => {
    await api.delete(`/notebooks/${id}`);
    set((state) => ({
      notebooks: state.notebooks.filter((nb) => nb.id !== id),
      selectedNotebook: state.selectedNotebook === id ? null : state.selectedNotebook,
    }));
    toast.success('ลบสมุดบันทึกสำเร็จ');
    get().fetchNotes();
  },

  createLabel: async (data) => {
    const res = await api.post('/labels', data);
    set((state) => ({
      labels: [...state.labels, res.data],
    }));
    toast.success('สร้างป้ายกำกับสำเร็จ');
    return res.data;
  },

  deleteLabel: async (id) => {
    await api.delete(`/labels/${id}`);
    set((state) => ({
      labels: state.labels.filter((l) => l.id !== id),
      selectedLabel: state.selectedLabel === id ? null : state.selectedLabel,
    }));
    toast.success('ลบป้ายกำกับสำเร็จ');
    get().fetchNotes();
  },

  setRemoteNoteMoved: (noteId: string, posX: number, posY: number) => {
    set((state) => ({
      notes: state.notes.map((n) => (n.id === noteId ? { ...n, posX, posY } : n)),
    }));
  },

  setRemoteNoteUpdated: (note: Note) => {
    set((state) => ({
      notes: state.notes.map((n) => (n.id === note.id ? { ...n, ...note } : n)),
    }));
  },

  setRemoteConnectionChanged: () => {
    const activeBoard = get().activeBoardId;
    if (activeBoard) {
      get().fetchConnections(activeBoard);
    }
  },

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setViewMode: (viewMode) => set({ viewMode }),
  setDefaultViewMode: (defaultViewMode) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('secure_note_default_view_mode', defaultViewMode);
    }
    set({ defaultViewMode, viewMode: defaultViewMode });
  },
  toggleViewMode: () => set((state) => ({ viewMode: state.viewMode === 'grid' ? 'list' : 'grid' })),
  setSelectedNotebook: (selectedNotebook) => set({ selectedNotebook }),
  setSelectedLabel: (selectedLabel) => set({ selectedLabel }),
  setSelectedColor: (selectedColor) => set({ selectedColor }),
}));
