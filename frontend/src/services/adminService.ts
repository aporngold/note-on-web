import api from '../utils/api';

export interface AdminStats {
  users: {
    total: number;
    superAdmins: number;
    admins: number;
    regularUsers: number;
    newToday: number;
    newThisWeek: number;
    newThisMonth: number;
  };
  notes: {
    total: number;
    locked: number;
    unlocked: number;
  };
  boards: {
    total: number;
    full: number;
    maxPerBoard: number;
  };
  notebooks: { total: number };
  labels: { total: number };
  passkeys: { total: number };
  database: {
    sizeBytes: number;
    sizeFormatted: string;
  };
  backup: {
    lastBackupAt: string | null;
    lastStatus: string;
  };
}

export interface AdminUserItem {
  id: string;
  email: string;
  username: string;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  authProvider: string;
  hasMasterPassword: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    notes: number;
    boards: number;
    notebooks: number;
    passkeys: number;
  };
}

export interface BoardStatItem {
  id: string;
  name: string;
  color: string;
  isPublic: boolean;
  shareCode?: string | null;
  owner: {
    id: string;
    username: string;
    email: string;
  };
  notesCount: number;
  maxCapacity: number;
  isFull: boolean;
  remainingCapacity: number;
  createdAt: string;
  updatedAt: string;
}

export interface DatabaseInfo {
  type: string;
  filePath: string;
  exists: boolean;
  sizeBytes: number;
  sizeFormatted: string;
  lastModified: string | null;
  integrityCheck: string;
  tables: {
    users: number;
    notes: number;
    boards: number;
    notebooks: number;
    labels: number;
    sessions: number;
    passkeys: number;
    auditLogs: number;
    backupRecords: number;
  };
}

export interface BackupRecordItem {
  id: string;
  filename: string;
  size: number;
  status: string;
  triggerBy?: string | null;
  note?: string | null;
  createdAt: string;
}

export interface PhysicalBackupFile {
  name: string;
  size: number;
  sizeFormatted: string;
  mtime: string;
}

export interface AuditLogItem {
  id: string;
  adminId: string;
  action: string;
  target?: string | null;
  details?: string | null;
  ipAddress?: string | null;
  result: string;
  createdAt: string;
  admin?: {
    id: string;
    username: string;
    email: string;
    role: string;
  };
}

export const adminService = {
  // 1. ดึงสถิติภาพรวม
  async getStats(): Promise<AdminStats> {
    const res = await api.get('/admin/stats');
    return res.data.stats;
  },

  // 2. ดึงรายชื่อผู้ใช้
  async getUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{
    users: AdminUserItem[];
    pagination: { total: number; totalPages: number; page: number; limit: number };
  }> {
    const res = await api.get('/admin/users', { params });
    return { users: res.data.users, pagination: res.data.pagination };
  },

  // 3. ปรับเปลี่ยนสิทธิ์ (เฉพาะ SUPER_ADMIN)
  async updateUserRole(
    userId: string,
    role: 'USER' | 'ADMIN' | 'SUPER_ADMIN'
  ): Promise<{ success: boolean; message: string; user: any }> {
    const res = await api.put(`/admin/users/${userId}/role`, { role });
    return res.data;
  },

  // 3.1 ลบบัญชีผู้ใช้ถาวร (เฉพาะ SUPER_ADMIN)
  async deleteUser(userId: string): Promise<{ success: boolean; message: string }> {
    const res = await api.delete(`/admin/users/${userId}`);
    return res.data;
  },

  // 4. สถิติโน้ต
  async getNotesStats(): Promise<{
    totalNotes: number;
    lockedNotes: number;
    unlockedNotes: number;
    pinnedNotes: number;
    favoriteNotes: number;
    averageNotesPerUser: string | number;
    topCreators: { id: string; username: string; email: string; notesCount: number }[];
  }> {
    const res = await api.get('/admin/notes/stats');
    return res.data.stats;
  },

  // 5. สถิติบอร์ด
  async getBoardsStats(): Promise<{
    summary: {
      totalBoards: number;
      fullBoardsCount: number;
      nearFullBoardsCount: number;
      maxNotesLimit: number;
    };
    boards: BoardStatItem[];
  }> {
    const res = await api.get('/admin/boards/stats');
    return res.data;
  },

  // 6. ข้อมูลฐานข้อมูล
  async getDatabaseInfo(): Promise<DatabaseInfo> {
    const res = await api.get('/admin/database');
    return res.data.database;
  },

  // 7. รายการสำรองข้อมูล
  async getBackupsList(): Promise<{
    records: BackupRecordItem[];
    physicalFiles: PhysicalBackupFile[];
  }> {
    const res = await api.get('/admin/backups');
    return { records: res.data.records, physicalFiles: res.data.physicalFiles };
  },

  // 8. สั่งสำรองข้อมูลทันที
  async triggerBackup(note?: string): Promise<{ success: boolean; message: string; backup: BackupRecordItem }> {
    const res = await api.post('/admin/backups/create', { note });
    return res.data;
  },

  // 9. ดึง Audit Logs
  async getAuditLogs(params?: {
    page?: number;
    limit?: number;
    action?: string;
  }): Promise<{
    logs: AuditLogItem[];
    pagination: { total: number; totalPages: number; page: number; limit: number };
  }> {
    const res = await api.get('/admin/audit-logs', { params });
    return { logs: res.data.logs, pagination: res.data.pagination };
  },

  // 10. ดาวน์โหลดไฟล์สำรองข้อมูล (.db)
  async downloadBackup(filename: string): Promise<Blob> {
    const res = await api.get(`/admin/backups/${encodeURIComponent(filename)}/download`, {
      responseType: 'blob',
    });
    return res.data;
  },

  // 11. กู้คืนฐานข้อมูล (เฉพาะ SUPER_ADMIN พร้อมคำยืนยัน CONFIRM_RESTORE)
  async restoreDatabase(
    filename: string,
    confirmation: string
  ): Promise<{ success: boolean; message: string; restoredFile: string; safetyBackup: string }> {
    const res = await api.post('/admin/backups/restore', { filename, confirmation });
    return res.data;
  },
};

