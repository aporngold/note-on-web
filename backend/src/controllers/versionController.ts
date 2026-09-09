import { Response } from 'express';
import { prisma } from '../utils/database';
import { AuthRequest } from '../middleware/auth';

export class VersionController {
  // Get all version snapshots for a note
  static async getVersions(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      const { noteId } = req.params;

      // Verify note belongs to user or is accessible
      const note = await prisma.note.findFirst({
        where: {
          id: noteId,
          OR: [
            { userId },
            { shares: { some: { sharedWithId: userId } } },
          ],
        },
      });

      if (!note) {
        return res.status(404).json({ error: 'ไม่พบบันทึกนี้ หรือคุณไม่มีสิทธิ์เข้าถึง' });
      }

      const versions = await prisma.noteVersion.findMany({
        where: { noteId },
        orderBy: { createdAt: 'desc' },
        take: 50, // Keep last 50 versions
      });

      return res.json(versions);
    } catch (error: any) {
      console.error('Error fetching note versions:', error);
      return res.status(500).json({ error: 'ไม่สามารถดึงประวัติเวอร์ชันได้' });
    }
  }

  // Create a new version snapshot
  static async createVersion(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      const { noteId } = req.params;
      const { title, content } = req.body;

      const note = await prisma.note.findFirst({
        where: {
          id: noteId,
          OR: [
            { userId },
            { shares: { some: { sharedWithId: userId, permission: 'edit' } } },
          ],
        },
      });

      if (!note) {
        return res.status(404).json({ error: 'ไม่พบบันทึกนี้' });
      }

      const version = await prisma.noteVersion.create({
        data: {
          noteId,
          title: title !== undefined ? title : note.title,
          content: content !== undefined ? content : note.content,
          userId,
        },
      });

      return res.status(201).json(version);
    } catch (error: any) {
      console.error('Error creating note version:', error);
      return res.status(500).json({ error: 'ไม่สามารถบันทึกเวอร์ชันได้' });
    }
  }

  // Restore a specific version
  static async restoreVersion(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      const { noteId, versionId } = req.params;

      const note = await prisma.note.findFirst({
        where: {
          id: noteId,
          OR: [
            { userId },
            { shares: { some: { sharedWithId: userId, permission: 'edit' } } },
          ],
        },
      });

      if (!note) {
        return res.status(404).json({ error: 'ไม่พบบันทึกนี้' });
      }

      const targetVersion = await prisma.noteVersion.findUnique({
        where: { id: versionId },
      });

      if (!targetVersion || targetVersion.noteId !== noteId) {
        return res.status(404).json({ error: 'ไม่พบเวอร์ชันที่ต้องการกู้คืน' });
      }

      // Save current note state as a snapshot before restoring
      await prisma.noteVersion.create({
        data: {
          noteId,
          title: note.title,
          content: note.content,
          userId,
        },
      });

      // Update note with restored content
      const updatedNote = await prisma.note.update({
        where: { id: noteId },
        data: {
          title: targetVersion.title,
          content: targetVersion.content,
        },
        include: {
          labels: { include: { label: true } },
          attachments: true,
        },
      });

      return res.json({
        message: 'กู้คืนเวอร์ชันสำเร็จเรียบร้อย',
        note: {
          ...updatedNote,
          labels: updatedNote.labels.map((l) => l.label),
        },
      });
    } catch (error: any) {
      console.error('Error restoring note version:', error);
      return res.status(500).json({ error: 'ไม่สามารถกู้คืนเวอร์ชันได้' });
    }
  }
}
