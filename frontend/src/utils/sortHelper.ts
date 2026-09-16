import { Note, SortOption } from '@/types';

export interface SortOptionMeta {
  value: SortOption;
  label: string;
  subLabel: string;
}

export const SORT_OPTIONS: SortOptionMeta[] = [
  {
    value: 'updated_desc',
    label: 'แก้ไขล่าสุด',
    subLabel: 'ใหม่ ➔ เก่า (ค่าเริ่มต้น)',
  },
  {
    value: 'updated_asc',
    label: 'แก้ไขเดิม',
    subLabel: 'เก่า ➔ ใหม่',
  },
  {
    value: 'created_desc',
    label: 'วันที่สร้าง',
    subLabel: 'ใหม่ ➔ เก่า',
  },
  {
    value: 'created_asc',
    label: 'วันที่สร้าง',
    subLabel: 'เก่า ➔ ใหม่',
  },
  {
    value: 'title_asc',
    label: 'ชื่อเรื่อง',
    subLabel: 'ก ➔ ฮ (A ➔ Z)',
  },
  {
    value: 'title_desc',
    label: 'ชื่อเรื่อง',
    subLabel: 'ฮ ➔ ก (Z ➔ A)',
  },
];

const STORAGE_KEY = 'secure_note_sort_by';

export function getStoredSortOption(): SortOption {
  if (typeof window === 'undefined') return 'updated_desc';
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as SortOption | null;
    if (saved && SORT_OPTIONS.some((o) => o.value === saved)) {
      return saved;
    }
  } catch {
    // Ignore storage errors
  }
  return 'updated_desc';
}

export function setStoredSortOption(option: SortOption): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, option);
  } catch {
    // Ignore storage errors
  }
}

/**
 * Sorts notes according to the chosen SortOption.
 * Golden rule: Pinned notes always remain at the top!
 */
export function sortNotes(notes: Note[], sortBy: SortOption): Note[] {
  return [...notes].sort((a, b) => {
    // 1. Pinned notes always come first!
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;

    // 2. Secondary sort by criteria
    switch (sortBy) {
      case 'updated_desc':
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      case 'updated_asc':
        return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      case 'created_desc':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'created_asc':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'title_asc': {
        const titleA = (a.title || '').trim();
        const titleB = (b.title || '').trim();
        if (!titleA && titleB) return 1;
        if (titleA && !titleB) return -1;
        return titleA.localeCompare(titleB, 'th', { numeric: true, sensitivity: 'base' });
      }
      case 'title_desc': {
        const titleA = (a.title || '').trim();
        const titleB = (b.title || '').trim();
        if (!titleA && titleB) return 1;
        if (titleA && !titleB) return -1;
        return titleB.localeCompare(titleA, 'th', { numeric: true, sensitivity: 'base' });
      }
      default:
        return 0;
    }
  });
}
