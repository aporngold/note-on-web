import { Request, Response } from 'express';
import { prisma } from '../utils/database';
import { AuthRequest } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

export class ShareController {
  // Update or create share link for a note (Private / Public with code and optional password)
  static async updateShareSettings(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      const { noteId } = req.params;
      const { isShared, permission, password } = req.body;

      const note = await prisma.note.findFirst({
        where: { id: noteId, userId },
      });

      if (!note) {
        return res.status(404).json({ error: 'ไม่พบบันทึกนี้ หรือคุณไม่มีสิทธิ์เป็นเจ้าของ' });
      }

      if (!isShared) {
        // Disable sharing
        const updated = await prisma.note.update({
          where: { id: noteId },
          data: {
            shareCode: null,
            sharePassword: null,
            sharePermission: 'read',
          },
        });
        return res.json({
          message: 'ยกเลิกการแชร์สาธารณะเรียบร้อยแล้ว',
          isShared: false,
          shareCode: null,
        });
      }

      // If generating code or already has one
      const shareCode = note.shareCode || uuidv4().substring(0, 10);
      let hashedPassword = note.sharePassword;

      if (password !== undefined) {
        if (password.trim() === '') {
          hashedPassword = null;
        } else {
          hashedPassword = await bcrypt.hash(password.trim(), 10);
        }
      }

      const updated = await prisma.note.update({
        where: { id: noteId },
        data: {
          shareCode,
          sharePassword: hashedPassword,
          sharePermission: permission === 'edit' ? 'edit' : 'read',
        },
      });

      return res.json({
        message: 'อัปเดตการแชร์สำเร็จ',
        isShared: true,
        shareCode: updated.shareCode,
        sharePermission: updated.sharePermission,
        hasPassword: Boolean(updated.sharePassword),
      });
    } catch (error: any) {
      console.error('Error updating share settings:', error);
      return res.status(500).json({ error: 'ไม่สามารถตั้งค่าการแชร์ได้' });
    }
  }

  // Get shared note settings for the owner
  static async getShareSettings(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      const { noteId } = req.params;

      const note = await prisma.note.findFirst({
        where: { id: noteId, userId },
        select: {
          shareCode: true,
          sharePermission: true,
          sharePassword: true,
        },
      });

      if (!note) {
        return res.status(404).json({ error: 'ไม่พบบันทึกนี้' });
      }

      return res.json({
        isShared: Boolean(note.shareCode),
        shareCode: note.shareCode,
        sharePermission: note.sharePermission,
        hasPassword: Boolean(note.sharePassword),
      });
    } catch (error: any) {
      console.error('Error fetching share settings:', error);
      return res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลการแชร์ได้' });
    }
  }

  // Public endpoint: Fetch a shared note by its shareCode
  static async getPublicNote(req: Request, res: Response) {
    try {
      const { code } = req.params;
      const providedPassword = (req.headers['x-share-password'] as string) || (req.query.password as string) || '';

      const note = await prisma.note.findUnique({
        where: { shareCode: code },
        include: {
          user: {
            select: {
              username: true,
            },
          },
          attachments: true,
        },
      });

      if (!note) {
        return res.status(404).json({ error: 'ไม่พบบันทึกนี้ หรือลิงก์การแชร์ถูกปิดไปแล้ว' });
      }

      // If password protected
      if (note.sharePassword) {
        if (!providedPassword) {
          return res.status(401).json({
            isPasswordRequired: true,
            title: note.title || 'บันทึกที่ได้รับการป้องกันด้วยรหัสผ่าน',
            author: note.user.username,
            updatedAt: note.updatedAt,
          });
        }

        const isMatch = await bcrypt.compare(providedPassword, note.sharePassword);
        if (!isMatch) {
          return res.status(401).json({
            isPasswordRequired: true,
            error: 'รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง',
          });
        }
      }

      return res.json({
        id: note.id,
        title: note.title,
        content: note.content,
        color: note.color,
        textColor: note.textColor,
        permission: note.sharePermission,
        updatedAt: note.updatedAt,
        author: note.user.username,
        attachments: note.attachments,
      });
    } catch (error: any) {
      console.error('Error fetching public note:', error);
      return res.status(500).json({ error: 'ไม่สามารถเปิดบันทึกสาธารณะได้' });
    }
  }
}
