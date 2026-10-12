import api from '../utils/api';

export type StorageCategory = 'image' | 'audio' | 'video' | 'document' | 'other' | 'unknown';

export interface StorageSummary {
  totalUsers: number;
  totalFilesDetected: number;
  totalAttachmentSizeBytes: number;
  totalAttachmentSizeFormatted: string;
  actualDatabase: {
    sizeBytes: number;
    sizeFormatted: string;
    type: string;
  };
  logicalDatabaseText: {
    sizeBytes: number;
    sizeFormatted: string;
    explanation: string;
  };
  diskHealth: {
    physicalFilesCount: number;
    physicalTotalBytes: number;
    physicalTotalFormatted: string;
    orphanedCount: number;
    orphanedTotalBytes: number;
    orphanedTotalFormatted: string;
    missingCount: number;
    missingTotalBytes: number;
    status: string;
  };
  typeBreakdown: Record<
    StorageCategory,
    {
      count: number;
      sizeBytes: number;
      sizeFormatted: string;
      percentage: number;
    }
  >;
  topConsumers: Array<{
    userId: string;
    username: string;
    email: string;
    filesCount: number;
    totalSizeBytes: number;
    totalSizeFormatted: string;
    percentageOfTotal: number;
  }>;
  lastScannedAt: string;
}

export interface UserStorageItem {
  userId: string;
  username: string;
  email: string;
  role: string;
  createdAt: string;
  notesCount: number;
  boardsCount: number;
  totalFilesCount: number;
  totalSizeBytes: number;
  totalSizeFormatted: string;
  logicalDbSizeBytes: number;
  logicalDbSizeFormatted: string;
  categories: Record<
    StorageCategory,
    {
      count: number;
      sizeBytes: number;
      sizeFormatted: string;
    }
  >;
  inTrashFilesCount: number;
  inTrashSizeBytes: number;
  inTrashSizeFormatted: string;
  lastUploadedAt: string | null;
}

export interface UserFileItem {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  category: StorageCategory;
  sizeBytes: number;
  sizeFormatted: string;
  url: string;
  createdAt: string;
  noteId: string;
  noteTitle: string;
  isArchived: boolean;
  status: 'ACTIVE' | 'IN_TRASH';
  existsOnDisk: boolean;
}

export interface UserStorageDetailResponse {
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
    createdAt: string;
    _count: { notes: number; boards: number };
    totalFilesCount: number;
    totalSizeBytes: number;
    totalSizeFormatted: string;
    categories: Record<
      StorageCategory,
      {
        count: number;
        sizeBytes: number;
        sizeFormatted: string;
      }
    >;
  };
  files: UserFileItem[];
}

export interface OrphanedFileItem {
  filename: string;
  sizeBytes: number;
  sizeFormatted: string;
  category: StorageCategory;
  mtime: string;
}

export const storageAnalyticsService = {
  // 1. ดึงภาพรวมพื้นที่จัดเก็บ
  async getSummary(rescan: boolean = false): Promise<StorageSummary> {
    const res = await api.get('/admin/storage/summary', {
      params: { rescan: rescan ? 'true' : 'false' },
    });
    return res.data;
  },

  // 2. ดึงตารางพื้นที่แยกตาม User
  async getUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    filterType?: string;
  }): Promise<{
    users: UserStorageItem[];
    pagination: { total: number; totalPages: number; page: number; limit: number };
  }> {
    const res = await api.get('/admin/storage/users', { params });
    return {
      users: res.data.users,
      pagination: res.data.pagination,
    };
  },

  // 3. ดึงรายละเอียดไฟล์ของผู้ใช้รายคน
  async getUserDetail(userId: string): Promise<UserStorageDetailResponse> {
    const res = await api.get(`/admin/storage/users/${userId}`);
    return res.data;
  },

  // 4. ดึงรายการไฟล์ตกค้างบนดิสก์
  async getOrphanedFiles(): Promise<{
    orphanedFiles: OrphanedFileItem[];
    orphanedTotalBytes: number;
    orphanedTotalFormatted: string;
    orphanedCount: number;
  }> {
    const res = await api.get('/admin/storage/orphaned');
    return res.data;
  },
};
