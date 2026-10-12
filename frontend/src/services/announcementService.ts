import api from '../utils/api';

export type AnnouncementType = 'info' | 'warning' | 'critical' | 'success';

export interface AnnouncementItem {
  id: string;
  title: string;
  message: string;
  type: AnnouncementType;
  isActive: boolean;
  dismissible: boolean;
  linkText?: string | null;
  linkUrl?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  authorId?: string | null;
  author?: {
    id: string;
    username: string;
    email: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface AnnouncementInput {
  title: string;
  message: string;
  type?: AnnouncementType;
  isActive?: boolean;
  dismissible?: boolean;
  linkText?: string;
  linkUrl?: string;
  startDate?: string;
  endDate?: string;
}

export const announcementService = {
  // 1. ดึงประกาศที่กำลัง Active (สำหรับแสดงแถบหัวเว็บ)
  async getActive(): Promise<AnnouncementItem | null> {
    try {
      const res = await api.get('/announcements/active');
      return res.data.announcement || null;
    } catch (error) {
      console.warn('Failed to fetch active announcement:', error);
      return null;
    }
  },

  // 2. ดึงรายการประกาศทั้งหมด (สำหรับ Super Admin / ผู้มีสิทธิ์)
  async getAll(page: number = 1, limit: number = 10): Promise<{
    announcements: AnnouncementItem[];
    pagination: { total: number; totalPages: number; page: number; limit: number };
  }> {
    const res = await api.get('/announcements', { params: { page, limit } });
    return {
      announcements: res.data.announcements,
      pagination: res.data.pagination,
    };
  },

  // 3. สร้างประกาศใหม่
  async create(data: AnnouncementInput): Promise<AnnouncementItem> {
    const res = await api.post('/announcements', data);
    return res.data.announcement;
  },

  // 4. แก้ไขประกาศ
  async update(id: string, data: Partial<AnnouncementInput>): Promise<AnnouncementItem> {
    const res = await api.put(`/announcements/${id}`, data);
    return res.data.announcement;
  },

  // 5. ลบประกาศ
  async delete(id: string): Promise<void> {
    await api.delete(`/announcements/${id}`);
  },
};
