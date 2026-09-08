import { Response } from 'express';
import { prisma } from '../utils/database';
import { AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const createNoteSchema = z.object({
  title: z.string().optional().default(''),
  content: z.string().optional().default(''),
  color: z.string().optional().default('#FEF08A'),
  textColor: z.string().optional().default('#1e293b'),
  fontSize: z.string().optional().default('normal'),
  fontFamily: z.string().optional().default('sans'),
  kanbanStatus: z.string().optional().default('todo'),
  posX: z.number().optional().default(100),
  posY: z.number().optional().default(100),
  width: z.number().optional().default(260),
  height: z.number().optional().default(240),
  isLocked: z.boolean().optional().default(false),
  isPinned: z.boolean().optional().default(false),
  isFavorite: z.boolean().optional().default(false),
  notebookId: z.string().nullable().optional(),
  boardId: z.string().nullable().optional(),
  labelIds: z.array(z.string()).optional().default([]),
  iv: z.string().optional().nullable(),
  salt: z.string().optional().nullable(),
});

const updateNoteSchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
  color: z.string().optional(),
  textColor: z.string().optional(),
  fontSize: z.string().optional(),
  fontFamily: z.string().optional(),
  kanbanStatus: z.string().optional(),
  posX: z.number().optional(),
  posY: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  isLocked: z.boolean().optional(),
  isPinned: z.boolean().optional(),
  isFavorite: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  notebookId: z.string().nullable().optional(),
  boardId: z.string().nullable().optional(),
  labelIds: z.array(z.string()).optional(),
  iv: z.string().optional().nullable(),
  salt: z.string().optional().nullable(),
});

export class NoteController {
  static async getNotes(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      const {
        search,
        notebookId,
        labelId,
        isArchived,
        isPinned,
        isFavorite,
        isLocked,
        color,
        boardId,
      } = req.query;

      const where: any = {
        userId,
      };

      // Archive / Trash filter
      if (isArchived !== undefined) {
        where.isArchived = isArchived === 'true';
      } else {
        where.isArchived = false; // Default: show active notes only
      }

      // If viewing trash, show all archived notes for the user (don't hide notes created under other boards/notebooks)
      const isViewingTrash = isArchived === 'true';

      // Vault / Locked filter
      if (isLocked !== undefined) {
        where.isLocked = isLocked === 'true';
      }

      // Pin filter
      if (isPinned !== undefined) {
        where.isPinned = isPinned === 'true';
      }

      // Favorite filter
      if (isFavorite !== undefined) {
        where.isFavorite = isFavorite === 'true';
      }

      // Notebook filter
      if (notebookId && !isViewingTrash) {
        where.notebookId = String(notebookId);
      }

      // Board filter
      if (boardId && !isViewingTrash) {
        where.boardId = String(boardId);
      }

      // Color filter
      if (color && !isViewingTrash) {
        where.color = String(color);
      }

      // Label filter
      if (labelId && !isViewingTrash) {
        where.labels = {
          some: {
            labelId: String(labelId),
          },
        };
      }

      // Search filter
      if (search) {
        const query = String(search);
        where.OR = [
          { title: { contains: query } },
          { content: { contains: query } },
        ];
      }

      const notes = await prisma.note.findMany({
        where,
        orderBy: [
          { isPinned: 'desc' },
          { updatedAt: 'desc' },
        ],
        include: {
          attachments: true,
          notebook: {
            select: { id: true, name: true, color: true },
          },
          board: {
            select: { id: true, name: true, color: true, theme: true },
          },
          labels: {
            include: {
              label: true,
            },
          },
        },
      });

      // Format response to flatten labels array
      const formatted = notes.map((n) => ({
        ...n,
        labels: n.labels.map((l) => l.label),
      }));

      return res.json(formatted);
    } catch (error) {
      console.error('getNotes error:', error);
      return res.status(500).json({ error: 'Failed to retrieve notes' });
    }
  }

  static async getNoteById(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      const note = await prisma.note.findFirst({
        where: {
          id,
          OR: [
            { userId },
            { shares: { some: { sharedWithId: userId } } },
          ],
        },
        include: {
          attachments: true,
          notebook: true,
          labels: {
            include: {
              label: true,
            },
          },
          shares: {
            include: {
              sharedWith: {
                select: { id: true, email: true, username: true },
              },
            },
          },
        },
      });

      if (!note) {
        return res.status(404).json({ error: 'Note not found' });
      }

      return res.json({
        ...note,
        labels: note.labels.map((l) => l.label),
      });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch note' });
    }
  }

  static async createNote(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      const parsed = createNoteSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || 'Invalid note data' });
      }

      const {
        title,
        content,
        color,
        textColor,
        fontSize,
        fontFamily,
        kanbanStatus,
        posX,
        posY,
        width,
        height,
        isLocked,
        isPinned,
        isFavorite,
        notebookId,
        boardId,
        labelIds,
        iv,
        salt,
      } = parsed.data;

      // Verify notebook ownership if provided
      if (notebookId) {
        const nb = await prisma.notebook.findFirst({
          where: { id: notebookId, userId },
        });
        if (!nb) {
          return res.status(400).json({ error: 'Notebook not found or not owned by user' });
        }
      }

      const newNote = await prisma.note.create({
        data: {
          title: title || 'ไม่มีชื่อ',
          content: content || '',
          color: color || '#FEF08A',
          textColor: textColor || '#1e293b',
          fontSize: fontSize || 'normal',
          fontFamily: fontFamily || 'sans',
          kanbanStatus: kanbanStatus || 'todo',
          posX: posX !== undefined ? posX : 100,
          posY: posY !== undefined ? posY : 100,
          width: width !== undefined ? width : 260,
          height: height !== undefined ? height : 240,
          isLocked: !!isLocked,
          isPinned: !!isPinned,
          isFavorite: !!isFavorite,
          iv: iv || null,
          salt: salt || null,
          userId,
          notebookId: notebookId || null,
          boardId: boardId || null,
          labels: {
            create: labelIds.map((lid) => ({
              label: {
                connect: { id: lid },
              },
            })),
          },
        },
        include: {
          attachments: true,
          notebook: true,
          board: true,
          labels: {
            include: {
              label: true,
            },
          },
        },
      });

      return res.status(201).json({
        ...newNote,
        labels: newNote.labels.map((l) => l.label),
      });
    } catch (error) {
      console.error('createNote error:', error);
      return res.status(500).json({ error: 'Failed to create note' });
    }
  }

  static async updateNote(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      const parsed = updateNoteSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || 'Invalid note data' });
      }

      const note = await prisma.note.findFirst({
        where: { id, userId },
      });

      if (!note) {
        return res.status(404).json({ error: 'Note not found' });
      }

      const {
        title,
        content,
        color,
        textColor,
        fontSize,
        fontFamily,
        kanbanStatus,
        posX,
        posY,
        width,
        height,
        isLocked,
        isPinned,
        isFavorite,
        isArchived,
        notebookId,
        boardId,
        labelIds,
        iv,
        salt,
      } = parsed.data;

      // Handle label relations update if provided
      if (labelIds !== undefined) {
        await prisma.labelNote.deleteMany({
          where: { noteId: id },
        });
      }

      const updated = await prisma.note.update({
        where: { id },
        data: {
          ...(title !== undefined && { title }),
          ...(content !== undefined && { content }),
          ...(color !== undefined && { color }),
          ...(textColor !== undefined && { textColor }),
          ...(fontSize !== undefined && { fontSize }),
          ...(fontFamily !== undefined && { fontFamily }),
          ...(kanbanStatus !== undefined && { kanbanStatus }),
          ...(posX !== undefined && { posX }),
          ...(posY !== undefined && { posY }),
          ...(width !== undefined && { width }),
          ...(height !== undefined && { height }),
          ...(isLocked !== undefined && { isLocked }),
          ...(isPinned !== undefined && { isPinned }),
          ...(isFavorite !== undefined && { isFavorite }),
          ...(isArchived !== undefined && { isArchived }),
          ...(notebookId !== undefined && { notebookId }),
          ...(boardId !== undefined && { boardId }),
          ...(iv !== undefined && { iv }),
          ...(salt !== undefined && { salt }),
          ...(labelIds !== undefined && {
            labels: {
              create: labelIds.map((lid) => ({
                label: { connect: { id: lid } },
              })),
            },
          }),
        },
        include: {
          attachments: true,
          notebook: true,
          board: true,
          labels: {
            include: {
              label: true,
            },
          },
        },
      });

      return res.json({
        ...updated,
        labels: updated.labels.map((l) => l.label),
      });
    } catch (error) {
      console.error('updateNote error:', error);
      return res.status(500).json({ error: 'Failed to update note' });
    }
  }

  static async deleteNote(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      const note = await prisma.note.findFirst({
        where: { id, userId },
      });

      if (!note) {
        return res.status(404).json({ error: 'Note not found' });
      }

      // If already in trash, delete permanently
      if (note.isArchived) {
        await prisma.note.delete({ where: { id } });
        return res.json({ message: 'ลบโน้ตถาวรเรียบร้อยแล้ว' });
      } else {
        // Move to trash
        await prisma.note.update({
          where: { id },
          data: { isArchived: true, isPinned: false },
        });
        return res.json({ message: 'ย้ายโน้ตไปที่ถังขยะแล้ว' });
      }
    } catch (error) {
      return res.status(500).json({ error: 'Failed to delete note' });
    }
  }

  static async restoreNote(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      const note = await prisma.note.findFirst({
        where: { id, userId },
      });

      if (!note) {
        return res.status(404).json({ error: 'Note not found' });
      }

      const restored = await prisma.note.update({
        where: { id },
        data: { isArchived: false },
      });

      return res.json({ message: 'กู้คืนโน้ตเรียบร้อยแล้ว', note: restored });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to restore note' });
    }
  }

  static async duplicateNote(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      const original = await prisma.note.findFirst({
        where: { id, userId },
        include: { labels: true },
      });

      if (!original) {
        return res.status(404).json({ error: 'Note not found' });
      }

      const duplicated = await prisma.note.create({
        data: {
          title: original.title ? `[คัดลอก] ${original.title}` : '[คัดลอก] ไม่มีชื่อ',
          content: original.content,
          color: original.color,
          isLocked: original.isLocked,
          isPinned: false,
          isFavorite: original.isFavorite,
          iv: original.iv,
          salt: original.salt,
          userId,
          notebookId: original.notebookId,
          labels: {
            create: original.labels.map((l) => ({
              labelId: l.labelId,
            })),
          },
        },
        include: {
          notebook: true,
          labels: {
            include: { label: true },
          },
        },
      });

      return res.status(201).json({
        ...duplicated,
        labels: duplicated.labels.map((l) => l.label),
      });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to duplicate note' });
    }
  }

  static async togglePin(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      const note = await prisma.note.findFirst({
        where: { id, userId },
      });

      if (!note) {
        return res.status(404).json({ error: 'Note not found' });
      }

      const updated = await prisma.note.update({
        where: { id },
        data: { isPinned: !note.isPinned },
      });

      return res.json({
        message: updated.isPinned ? 'ปักหมุดโน้ตแล้ว' : 'ยกเลิกการปักหมุดแล้ว',
        isPinned: updated.isPinned,
      });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to toggle pin' });
    }
  }

  static async toggleFavorite(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      const note = await prisma.note.findFirst({
        where: { id, userId },
      });

      if (!note) {
        return res.status(404).json({ error: 'Note not found' });
      }

      const updated = await prisma.note.update({
        where: { id },
        data: { isFavorite: !note.isFavorite },
      });

      return res.json({
        message: updated.isFavorite ? 'เพิ่มในรายการโปรดแล้ว' : 'นำออกจากรายการโปรดแล้ว',
        isFavorite: updated.isFavorite,
      });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to toggle favorite' });
    }
  }

  static async emptyTrash(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      const result = await prisma.note.deleteMany({
        where: { userId, isArchived: true },
      });

      return res.json({ message: `ลบโน้ตในถังขยะทั้งหมดแล้ว (${result.count} รายการ)` });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to empty trash' });
    }
  }

  static async exportBackup(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, username: true, createdAt: true },
      });

      const [boards, notebooks, labels, notes, connections] = await Promise.all([
        prisma.board.findMany({ where: { userId } }),
        prisma.notebook.findMany({ where: { userId } }),
        prisma.label.findMany({ where: { userId } }),
        prisma.note.findMany({
          where: { userId },
          include: {
            attachments: true,
            labels: { include: { label: true } },
          },
        }),
        prisma.noteConnection.findMany({
          where: {
            board: { userId },
          },
        }),
      ]);

      const formattedNotes = notes.map((n) => ({
        ...n,
        labels: n.labels.map((l) => l.label.name),
      }));

      const backupData = {
        app: 'NoteOnWeb',
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        user,
        stats: {
          boardCount: boards.length,
          notebookCount: notebooks.length,
          labelCount: labels.length,
          noteCount: notes.length,
          connectionCount: connections.length,
        },
        boards,
        notebooks,
        labels,
        notes: formattedNotes,
        connections,
      };

      const dateStr = new Date().toISOString().split('T')[0];
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="noteonweb-backup-${dateStr}.json"`);
      return res.json(backupData);
    } catch (error) {
      console.error('exportBackup error:', error);
      return res.status(500).json({ error: 'Failed to export backup' });
    }
  }

  static async restoreBackup(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      const { notes } = req.body;

      if (!notes || !Array.isArray(notes)) {
        return res.status(400).json({ error: 'รูปแบบไฟล์ Backup ไม่ถูกต้อง (Invalid backup data)' });
      }

      let restoredCount = 0;
      for (const n of notes) {
        await prisma.note.create({
          data: {
            title: n.title || 'ไม่มีชื่อ',
            content: n.content || '',
            color: n.color || '#FEF08A',
            textColor: n.textColor || '#1e293b',
            fontSize: n.fontSize || 'normal',
            fontFamily: n.fontFamily || 'sans',
            kanbanStatus: n.kanbanStatus || 'todo',
            posX: typeof n.posX === 'number' ? n.posX : 100,
            posY: typeof n.posY === 'number' ? n.posY : 100,
            width: typeof n.width === 'number' ? n.width : 260,
            height: typeof n.height === 'number' ? n.height : 240,
            isLocked: !!n.isLocked,
            isPinned: !!n.isPinned,
            userId,
          },
        });
        restoredCount++;
      }

      return res.json({
        message: `กู้คืนข้อมูลโน้ตสำเร็จทั้งหมด ${restoredCount} รายการ`,
        restoredCount,
      });
    } catch (error) {
      console.error('restoreBackup error:', error);
      return res.status(500).json({ error: 'Failed to restore backup' });
    }
  }
}
