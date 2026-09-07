import { Response } from 'express';
import { prisma } from '../utils/database';
import { AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const notebookSchema = z.object({
  name: z.string().min(1, 'Notebook name is required').max(50),
  description: z.string().optional(),
  color: z.string().optional().default('#6366F1'),
});

export class NotebookController {
  static async getNotebooks(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      const notebooks = await prisma.notebook.findMany({
        where: { userId },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
        include: {
          _count: {
            select: {
              notes: {
                where: { isArchived: false },
              },
            },
          },
        },
      });

      return res.json(
        notebooks.map((nb) => ({
          id: nb.id,
          name: nb.name,
          description: nb.description,
          color: nb.color,
          isDefault: nb.isDefault,
          createdAt: nb.createdAt,
          noteCount: nb._count.notes,
        }))
      );
    } catch (error) {
      return res.status(500).json({ error: 'Failed to retrieve notebooks' });
    }
  }

  static async createNotebook(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      const parsed = notebookSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || 'Invalid notebook data' });
      }

      const { name, description, color } = parsed.data;

      const notebook = await prisma.notebook.create({
        data: {
          name,
          description: description || '',
          color: color || '#6366F1',
          userId,
        },
      });

      return res.status(201).json({
        ...notebook,
        noteCount: 0,
      });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to create notebook' });
    }
  }

  static async updateNotebook(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      const { id } = req.params;
      const parsed = notebookSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || 'Invalid notebook data' });
      }

      const notebook = await prisma.notebook.findFirst({
        where: { id, userId },
      });

      if (!notebook) {
        return res.status(404).json({ error: 'Notebook not found' });
      }

      const updated = await prisma.notebook.update({
        where: { id },
        data: parsed.data,
      });

      return res.json(updated);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to update notebook' });
    }
  }

  static async deleteNotebook(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      const notebook = await prisma.notebook.findFirst({
        where: { id, userId },
      });

      if (!notebook) {
        return res.status(404).json({ error: 'Notebook not found' });
      }

      if (notebook.isDefault) {
        return res.status(400).json({ error: 'ไม่สามารถลบสมุดบันทึกหลักได้ (Cannot delete default notebook)' });
      }

      // Unassign notes from this notebook
      await prisma.note.updateMany({
        where: { notebookId: id },
        data: { notebookId: null },
      });

      await prisma.notebook.delete({ where: { id } });

      return res.json({ message: 'ลบสมุดบันทึกสำเร็จ' });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to delete notebook' });
    }
  }
}
