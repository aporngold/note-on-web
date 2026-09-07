import { Response } from 'express';
import { prisma } from '../utils/database';
import { AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const labelSchema = z.object({
  name: z.string().min(1, 'Label name is required').max(30),
  color: z.string().optional().default('#EF4444'),
});

export class LabelController {
  static async getLabels(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      const labels = await prisma.label.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
        include: {
          _count: {
            select: {
              notes: true,
            },
          },
        },
      });

      return res.json(
        labels.map((l) => ({
          id: l.id,
          name: l.name,
          color: l.color,
          noteCount: l._count.notes,
        }))
      );
    } catch (error) {
      return res.status(500).json({ error: 'Failed to retrieve labels' });
    }
  }

  static async createLabel(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      const parsed = labelSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || 'Invalid label data' });
      }

      const { name, color } = parsed.data;

      // Check duplicate label name for this user
      const existing = await prisma.label.findFirst({
        where: { userId, name: name.trim() },
      });

      if (existing) {
        return res.status(409).json({ error: 'มีป้ายกำกับชื่อนี้อยู่แล้ว' });
      }

      const label = await prisma.label.create({
        data: {
          name: name.trim(),
          color: color || '#EF4444',
          userId,
        },
      });

      return res.status(201).json({
        ...label,
        noteCount: 0,
      });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to create label' });
    }
  }

  static async updateLabel(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      const { id } = req.params;
      const parsed = labelSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || 'Invalid label data' });
      }

      const label = await prisma.label.findFirst({
        where: { id, userId },
      });

      if (!label) {
        return res.status(404).json({ error: 'Label not found' });
      }

      const updated = await prisma.label.update({
        where: { id },
        data: {
          name: parsed.data.name.trim(),
          color: parsed.data.color,
        },
      });

      return res.json(updated);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to update label' });
    }
  }

  static async deleteLabel(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      const label = await prisma.label.findFirst({
        where: { id, userId },
      });

      if (!label) {
        return res.status(404).json({ error: 'Label not found' });
      }

      await prisma.label.delete({ where: { id } });

      return res.json({ message: 'ลบป้ายกำกับสำเร็จ' });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to delete label' });
    }
  }
}
