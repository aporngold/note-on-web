import { Response } from 'express';
import { prisma } from '../utils/database';
import { AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const createConnectionSchema = z.object({
  sourceId: z.string().min(1),
  targetId: z.string().min(1),
  boardId: z.string().min(1),
  label: z.string().optional().nullable(),
  color: z.string().optional().default('#6366f1'),
  arrowType: z.string().optional().default('arrow'),
});

export class ConnectionController {
  static async getConnections(req: AuthRequest, res: Response) {
    try {
      const { boardId } = req.query;
      if (!boardId) {
        return res.status(400).json({ error: 'boardId is required' });
      }

      const connections = await prisma.noteConnection.findMany({
        where: { boardId: String(boardId) },
        include: {
          sourceNote: {
            select: { id: true, title: true, posX: true, posY: true, width: true, height: true, color: true },
          },
          targetNote: {
            select: { id: true, title: true, posX: true, posY: true, width: true, height: true, color: true },
          },
        },
      });

      return res.json(connections);
    } catch (error) {
      console.error('getConnections error:', error);
      return res.status(500).json({ error: 'Failed to retrieve connections' });
    }
  }

  static async createConnection(req: AuthRequest, res: Response) {
    try {
      const parsed = createConnectionSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || 'Invalid connection data' });
      }

      const { sourceId, targetId, boardId, label, color, arrowType } = parsed.data;

      if (sourceId === targetId) {
        return res.status(400).json({ error: 'ไม่สามารถเชื่อมต่อโน้ตเดียวกันได้' });
      }

      // Check if connection already exists
      const existing = await prisma.noteConnection.findFirst({
        where: {
          boardId,
          OR: [
            { sourceId, targetId },
            { sourceId: targetId, targetId: sourceId },
          ],
        },
      });

      if (existing) {
        return res.status(400).json({ error: 'มีการเชื่อมต่อระหว่างสองโน้ตนี้อยู่แล้ว' });
      }

      const connection = await prisma.noteConnection.create({
        data: {
          sourceId,
          targetId,
          boardId,
          label: label || null,
          color: color || '#6366f1',
          arrowType: arrowType || 'arrow',
        },
        include: {
          sourceNote: {
            select: { id: true, title: true, posX: true, posY: true, width: true, height: true, color: true },
          },
          targetNote: {
            select: { id: true, title: true, posX: true, posY: true, width: true, height: true, color: true },
          },
        },
      });

      return res.status(201).json(connection);
    } catch (error) {
      console.error('createConnection error:', error);
      return res.status(500).json({ error: 'Failed to create connection' });
    }
  }

  static async deleteConnection(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      await prisma.noteConnection.delete({
        where: { id },
      });

      return res.json({ message: 'ลบการเชื่อมต่อเรียบร้อยแล้ว' });
    } catch (error) {
      console.error('deleteConnection error:', error);
      return res.status(500).json({ error: 'Failed to delete connection' });
    }
  }
}
