import { Response, Request } from 'express';
import { prisma } from '../utils/database';
import { AuthRequest } from '../middleware/auth';
import { z } from 'zod';
import crypto from 'crypto';

const boardSchema = z.object({
  name: z.string().min(1, 'ชื่อบอร์ดต้องไม่ว่างเปล่า').max(50),
  description: z.string().optional(),
  color: z.string().optional().default('#F59E0B'),
  theme: z.string().optional().default('cork'),
  bgImage: z.string().optional().nullable(),
  isPublic: z.boolean().optional().default(false),
  sharePermission: z.enum(['read', 'edit']).optional().default('read'),
});

export class BoardController {
  static async getBoards(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;

      // Map any stray notes with null boardId to the default board
      const defaultBoardRec = await prisma.board.findFirst({
        where: { userId, isDefault: true },
      });
      if (defaultBoardRec) {
        await prisma.note.updateMany({
          where: { userId, boardId: null },
          data: { boardId: defaultBoardRec.id },
        });
      }

      let boards = await prisma.board.findMany({
        where: { userId },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
        include: {
          _count: {
            select: {
              notes: {
                where: { isArchived: false, userId },
              },
            },
          },
        },
      });

      // If user has no boards yet, create default main board
      if (boards.length === 0) {
        const defaultBoard = await prisma.board.create({
          data: {
            name: 'กระดานหลัก',
            description: 'กระดานบันทึกโพสต์อิทหลัก',
            color: '#F59E0B',
            theme: 'cork',
            isDefault: true,
            userId,
          },
        });

        // Assign existing notes with null boardId to this default board
        await prisma.note.updateMany({
          where: { userId, boardId: null },
          data: { boardId: defaultBoard.id },
        });

        boards = [
          {
            ...defaultBoard,
            _count: {
              notes: await prisma.note.count({
                where: { userId, boardId: defaultBoard.id, isArchived: false },
              }),
            },
          },
        ];
      }

      return res.json(
        boards.map((b) => ({
          id: b.id,
          name: b.name,
          description: b.description,
          color: b.color,
          theme: b.theme,
          bgImage: b.bgImage,
          isPublic: b.isPublic,
          shareCode: b.shareCode,
          sharePermission: b.sharePermission,
          isDefault: b.isDefault,
          noteCount: b._count.notes,
          createdAt: b.createdAt,
          updatedAt: b.updatedAt,
        }))
      );
    } catch (error) {
      console.error('getBoards error:', error);
      return res.status(500).json({ error: 'Failed to retrieve boards' });
    }
  }

  static async createBoard(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      const parsed = boardSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || 'Invalid board data' });
      }

      const { name, description, color, theme, bgImage } = parsed.data;

      const board = await prisma.board.create({
        data: {
          name: name.trim(),
          description: description || '',
          color: color || '#F59E0B',
          theme: theme || 'cork',
          bgImage: bgImage || null,
          userId,
        },
      });

      return res.status(201).json({
        ...board,
        noteCount: 0,
      });
    } catch (error) {
      console.error('createBoard error:', error);
      return res.status(500).json({ error: 'Failed to create board' });
    }
  }

  static async updateBoard(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      const { id } = req.params;
      const parsed = boardSchema.partial().safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || 'Invalid board data' });
      }

      const board = await prisma.board.findFirst({
        where: { id, userId },
      });

      if (!board) {
        return res.status(404).json({ error: 'Board not found' });
      }

      const updated = await prisma.board.update({
        where: { id },
        data: {
          ...(parsed.data.name && { name: parsed.data.name.trim() }),
          ...(parsed.data.description !== undefined && { description: parsed.data.description }),
          ...(parsed.data.color && { color: parsed.data.color }),
          ...(parsed.data.theme && { theme: parsed.data.theme }),
          ...(parsed.data.bgImage !== undefined && { bgImage: parsed.data.bgImage }),
          ...(parsed.data.isPublic !== undefined && { isPublic: parsed.data.isPublic }),
          ...(parsed.data.sharePermission !== undefined && { sharePermission: parsed.data.sharePermission }),
        },
      });

      return res.json(updated);
    } catch (error) {
      console.error('updateBoard error:', error);
      return res.status(500).json({ error: 'Failed to update board' });
    }
  }

  static async shareBoard(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      const { id } = req.params;
      const { isPublic, sharePermission } = req.body;

      const board = await prisma.board.findFirst({
        where: { id, userId },
      });

      if (!board) {
        return res.status(404).json({ error: 'Board not found' });
      }

      let shareCode = board.shareCode;
      if (!shareCode) {
        shareCode = crypto.randomBytes(8).toString('hex');
      }

      const updated = await prisma.board.update({
        where: { id },
        data: {
          isPublic: isPublic !== undefined ? !!isPublic : true,
          sharePermission: sharePermission === 'edit' ? 'edit' : 'read',
          shareCode,
        },
      });

      return res.json(updated);
    } catch (error) {
      console.error('shareBoard error:', error);
      return res.status(500).json({ error: 'Failed to update share settings' });
    }
  }

  static async getSharedBoard(req: Request, res: Response) {
    try {
      const { shareCode } = req.params;

      const board = await prisma.board.findUnique({
        where: { shareCode },
        include: {
          user: {
            select: { id: true, username: true },
          },
          notes: {
            where: { isArchived: false, isLocked: false },
            include: {
              attachments: true,
              labels: {
                include: { label: true },
              },
            },
            orderBy: [{ isPinned: 'desc' }, { updatedAt: 'desc' }],
          },
          connections: {
            include: {
              sourceNote: { select: { id: true, title: true, posX: true, posY: true, width: true, height: true, color: true } },
              targetNote: { select: { id: true, title: true, posX: true, posY: true, width: true, height: true, color: true } },
            },
          },
        },
      });

      if (!board || !board.isPublic) {
        return res.status(404).json({ error: 'ไม่พบกระดานที่แชร์ หรือกระดานนี้ไม่ได้เปิดสาธารณะ' });
      }

      const anyBoard = board as any;
      const formattedNotes = anyBoard.notes?.map((n: any) => ({
        ...n,
        labels: n.labels?.map((l: any) => l.label) || [],
      })) || [];

      return res.json({
        ...board,
        notes: formattedNotes,
      });
    } catch (error) {
      console.error('getSharedBoard error:', error);
      return res.status(500).json({ error: 'Failed to fetch shared board' });
    }
  }

  static async deleteBoard(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      const board = await prisma.board.findFirst({
        where: { id, userId },
      });

      if (!board) {
        return res.status(404).json({ error: 'Board not found' });
      }

      // If user deletes the default board ("กระดานหลัก"): clear all notes on it into Trash, but keep the board intact!
      if (board.isDefault) {
        await prisma.note.updateMany({
          where: { userId, boardId: id },
          data: { isArchived: true },
        });
        await prisma.noteConnection.deleteMany({
          where: { boardId: id },
        });

        return res.json({
          message: 'ลบโน้ตทั้งหมดบนกระดานหลักเรียบร้อยแล้ว (ย้ายไปที่ถังขยะ)',
          isDefaultBoardCleared: true,
          boardId: id,
        });
      }

      // If it's another board: move all its notes to Trash and delete the board
      await prisma.note.updateMany({
        where: { userId, boardId: id },
        data: { isArchived: true },
      });

      await prisma.noteConnection.deleteMany({
        where: { boardId: id },
      });

      const fallbackBoard = await prisma.board.findFirst({
        where: { userId, id: { not: id } },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
      });

      await prisma.board.delete({ where: { id } });

      return res.json({
        message: 'ลบกระดานเรียบร้อยแล้ว (โน้ตทั้งหมดถูกย้ายไปที่ถังขยะ)',
        fallbackBoardId: fallbackBoard?.id,
      });
    } catch (error) {
      console.error('deleteBoard error:', error);
      return res.status(500).json({ error: 'Failed to delete board' });
    }
  }
}
