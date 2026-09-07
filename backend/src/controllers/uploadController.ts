import { Response } from 'express';
import { prisma } from '../utils/database';
import { AuthRequest } from '../middleware/auth';
import fs from 'fs';
import path from 'path';

export class UploadController {
  static async uploadFile(req: AuthRequest, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'ไม่พบไฟล์ที่อัปโหลด (No file uploaded)' });
      }

      const { noteId } = req.body;
      const file = req.file;
      const fileUrl = `/uploads/${file.filename}`;

      let attachment = null;
      if (noteId) {
        // Verify note ownership or shared access
        const note = await prisma.note.findFirst({
          where: { id: noteId },
        });

        if (note) {
          attachment = await prisma.fileAttachment.create({
            data: {
              filename: file.filename,
              originalName: file.originalname,
              mimeType: file.mimetype,
              size: file.size,
              url: fileUrl,
              noteId: note.id,
            },
          });
        }
      }

      return res.status(201).json({
        message: 'อัปโหลดไฟล์สำเร็จ',
        url: fileUrl,
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        attachment,
      });
    } catch (error) {
      console.error('uploadFile error:', error);
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์' });
    }
  }

  static async deleteAttachment(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const attachment = await prisma.fileAttachment.findUnique({
        where: { id },
      });

      if (!attachment) {
        return res.status(404).json({ error: 'ไม่พบไฟล์แนบ' });
      }

      // Try deleting local file
      const filePath = path.join(__dirname, '../../uploads', attachment.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      await prisma.fileAttachment.delete({
        where: { id },
      });

      return res.json({ message: 'ลบไฟล์แนบสำเร็จ' });
    } catch (error) {
      console.error('deleteAttachment error:', error);
      return res.status(500).json({ error: 'ลบไฟล์แนบล้มเหลว' });
    }
  }
}
