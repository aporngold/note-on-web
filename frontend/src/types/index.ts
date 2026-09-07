export interface User {
  id: string;
  email: string;
  username: string;
  createdAt: string;
}

export interface Label {
  id: string;
  name: string;
  color: string;
  noteCount?: number;
}

export interface Notebook {
  id: string;
  name: string;
  description?: string | null;
  color: string;
  isDefault: boolean;
  createdAt: string;
  noteCount?: number;
}

export interface FileAttachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  noteId: string;
  createdAt: string;
}

export interface NoteConnection {
  id: string;
  sourceId: string;
  targetId: string;
  boardId?: string | null;
  label?: string | null;
  color: string;
  arrowType: string;
  createdAt: string;
  sourceNote?: {
    id: string;
    title: string;
    posX: number;
    posY: number;
    width: number;
    height: number;
    color: string;
  };
  targetNote?: {
    id: string;
    title: string;
    posX: number;
    posY: number;
    width: number;
    height: number;
    color: string;
  };
}

export interface Board {
  id: string;
  name: string;
  description?: string | null;
  color: string;
  theme: string;
  bgImage?: string | null;
  shareCode?: string | null;
  isPublic?: boolean;
  sharePermission?: 'read' | 'edit';
  isDefault: boolean;
  createdAt: string;
  noteCount?: number;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  textColor?: string | null;
  fontSize?: string | null;
  fontFamily?: string | null;
  kanbanStatus?: 'todo' | 'doing' | 'done' | string | null;
  posX?: number | null;
  posY?: number | null;
  width?: number | null;
  height?: number | null;
  isArchived: boolean;
  isLocked: boolean;
  isPinned: boolean;
  iv?: string | null;
  salt?: string | null;
  notebookId?: string | null;
  notebook?: Notebook | null;
  boardId?: string | null;
  board?: Board | null;
  labels?: Label[];
  attachments?: FileAttachment[];
  createdAt: string;
  updatedAt: string;
}

export type ViewMode = 'grid' | 'list' | 'kanban' | 'board';
export type BoardViewMode = 'freeform' | 'kanban';
