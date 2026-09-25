import { Response } from 'express';
import fs from 'fs';
import path from 'path';
import { prisma } from '../utils/database';
import { AuthRequest } from '../middleware/auth';

const MAX_NOTES_PER_BOARD = 56;
const DB_PATH = path.join(__dirname, '../../prisma/dev.db');
const BACKUP_DIR = path.join(__dirname, '../../backups');
const MAX_BACKUPS = 15;

function formatTimestamp(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const min = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  return `${yyyy}-${mm}-${dd}_${hh}-${min}-${ss}`;
}

export class AdminController {
  /**
   * 1. GET /api/admin/stats
   * ดึงตัวเลขสรุปภาพรวมทั้งหมดของระบบ
   */
  static async getStats(req: AuthRequest, res: Response) {
    try {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [
        totalUsers,
        superAdmins,
        admins,
        regularUsers,
        totalNotes,
        lockedNotes,
        totalBoards,
        totalNotebooks,
        totalLabels,
        totalPasskeys,
        newUsersToday,
        newUsersThisWeek,
        newUsersThisMonth,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { role: 'SUPER_ADMIN' } }),
        prisma.user.count({ where: { role: 'ADMIN' } }),
        prisma.user.count({ where: { role: 'USER' } }),
        prisma.note.count(),
        prisma.note.count({ where: { isLocked: true } }),
        prisma.board.count(),
        prisma.notebook.count(),
        prisma.label.count(),
        prisma.passkey.count(),
        prisma.user.count({ where: { createdAt: { gte: startOfDay } } }),
        prisma.user.count({ where: { createdAt: { gte: startOfWeek } } }),
        prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
      ]);

      // ตรวจสอบขนาดฐานข้อมูลจริงบน Disk
      let dbSizeBytes = 0;
      if (fs.existsSync(DB_PATH)) {
        const stat = fs.statSync(DB_PATH);
        dbSizeBytes = stat.size;
      }

      // ดึงข้อมูล Backup ล่าสุด
      const latestBackup = await prisma.backupRecord.findFirst({
        orderBy: { createdAt: 'desc' },
      });

      // ตรวจสอบจำนวนบอร์ดที่เต็มความจุ (>= 56 notes)
      const allBoardsWithCount = await prisma.board.findMany({
        select: {
          id: true,
          _count: { select: { notes: true } },
        },
      });
      const fullBoardsCount = allBoardsWithCount.filter((b) => b._count.notes >= MAX_NOTES_PER_BOARD).length;

      return res.json({
        success: true,
        stats: {
          users: {
            total: totalUsers,
            superAdmins,
            admins,
            regularUsers,
            newToday: newUsersToday,
            newThisWeek: newUsersThisWeek,
            newThisMonth: newUsersThisMonth,
          },
          notes: {
            total: totalNotes,
            locked: lockedNotes,
            unlocked: totalNotes - lockedNotes,
          },
          boards: {
            total: totalBoards,
            full: fullBoardsCount,
            maxPerBoard: MAX_NOTES_PER_BOARD,
          },
          notebooks: { total: totalNotebooks },
          labels: { total: totalLabels },
          passkeys: { total: totalPasskeys },
          database: {
            sizeBytes: dbSizeBytes,
            sizeFormatted: `${(dbSizeBytes / (1024 * 1024)).toFixed(2)} MB`,
          },
          backup: {
            lastBackupAt: latestBackup ? latestBackup.createdAt : null,
            lastStatus: latestBackup ? latestBackup.status : 'NO_BACKUPS_YET',
          },
        },
      });
    } catch (error: any) {
      console.error('Admin getStats error:', error);
      return res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลสถิติภาพรวมได้' });
    }
  }

  /**
   * 2. GET /api/admin/users
   * ดึงรายชื่อผู้ใช้แบบแบ่งหน้า (Pagination + Search + Filter Role)
   * ปลอดภัย 100%: ไม่ส่งรหัสผ่านหรือความลับใดๆ ออกไป
   */
  static async getUsers(req: AuthRequest, res: Response) {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
      const search = (req.query.search as string)?.trim() || '';
      const roleFilter = (req.query.role as string)?.trim() || '';
      const sortBy = (req.query.sortBy as string) || 'createdAt';
      const sortOrder = (req.query.sortOrder as string) === 'asc' ? 'asc' : 'desc';

      const where: any = {};
      if (roleFilter && ['USER', 'ADMIN', 'SUPER_ADMIN'].includes(roleFilter)) {
        where.role = roleFilter;
      }

      if (search) {
        where.OR = [
          { email: { contains: search } },
          { username: { contains: search } },
        ];
      }

      const [total, users] = await Promise.all([
        prisma.user.count({ where }),
        prisma.user.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
          select: {
            id: true,
            email: true,
            username: true,
            role: true,
            authProvider: true,
            hasMasterPassword: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: {
                notes: true,
                boards: true,
                notebooks: true,
                passkeys: true,
              },
            },
          },
        }),
      ]);

      return res.json({
        success: true,
        users,
        pagination: {
          total,
          totalPages: Math.ceil(total / limit),
          page,
          limit,
        },
      });
    } catch (error: any) {
      console.error('Admin getUsers error:', error);
      return res.status(500).json({ error: 'ไม่สามารถดึงรายชื่อผู้ใช้งานได้' });
    }
  }

  /**
   * 3. GET /api/admin/users/:id
   * ดึงข้อมูลผู้ใช้รายบุคคลพร้อมสถิติเจาะลึก
   */
  static async getUserDetail(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          authProvider: true,
          hasMasterPassword: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              notes: true,
              boards: true,
              notebooks: true,
              labels: true,
              passkeys: true,
              sessions: true,
            },
          },
        },
      });

      if (!user) {
        return res.status(404).json({ error: 'ไม่พบบัญชีผู้ใช้นี้ในระบบ' });
      }

      const lockedNotesCount = await prisma.note.count({
        where: { userId: id, isLocked: true },
      });

      return res.json({
        success: true,
        user: {
          ...user,
          lockedNotesCount,
          unlockedNotesCount: user._count.notes - lockedNotesCount,
        },
      });
    } catch (error: any) {
      console.error('Admin getUserDetail error:', error);
      return res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลผู้ใช้ได้' });
    }
  }

  /**
   * 4. PUT /api/admin/users/:id/role
   * ปรับเปลี่ยนสิทธิ์ของผู้ใช้ (เฉพาะ SUPER_ADMIN เท่านั้น)
   */
  static async updateUserRole(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!['USER', 'ADMIN', 'SUPER_ADMIN'].includes(role)) {
        return res.status(400).json({
          error: 'สิทธิ์ไม่ถูกต้อง (ต้องเป็น USER, ADMIN หรือ SUPER_ADMIN เท่านั้น)',
        });
      }

      if (req.user?.id === id) {
        return res.status(400).json({
          error: 'ไม่สามารถปรับเปลี่ยนสิทธิ์ของบัญชีตนเองได้ เพื่อความปลอดภัยของระบบ',
        });
      }

      const targetUser = await prisma.user.findUnique({ where: { id } });
      if (!targetUser) {
        return res.status(404).json({ error: 'ไม่พบผู้ใช้งานที่ต้องการแก้ไข' });
      }

      // ถ้ากำลังจะปลด SUPER_ADMIN ตรวจสอบว่ายังมี SUPER_ADMIN คนอื่นเหลืออยู่อย่างน้อย 1 คนหรือไม่
      if (targetUser.role === 'SUPER_ADMIN' && role !== 'SUPER_ADMIN') {
        const superAdminCount = await prisma.user.count({
          where: { role: 'SUPER_ADMIN' },
        });
        if (superAdminCount <= 1) {
          return res.status(400).json({
            error: 'ไม่สามารถลดสิทธิ์ได้ เนื่องจากต้องมี SUPER_ADMIN ในระบบอย่างน้อย 1 คน',
          });
        }
      }

      const oldRole = targetUser.role;
      const updatedUser = await prisma.user.update({
        where: { id },
        data: { role },
        select: { id: true, email: true, username: true, role: true },
      });

      // บันทึกลง AuditLog
      await prisma.auditLog.create({
        data: {
          adminId: req.user!.id,
          action: 'CHANGE_USER_ROLE',
          target: targetUser.email,
          details: `เปลี่ยนสิทธิ์จาก ${oldRole} เป็น ${role}`,
          ipAddress: (req.ip || req.socket.remoteAddress || 'unknown').slice(0, 45),
          result: 'SUCCESS',
        },
      });

      return res.json({
        success: true,
        message: `อัปเดตสิทธิ์ของ ${targetUser.email} เป็น ${role} เรียบร้อยแล้ว`,
        user: updatedUser,
      });
    } catch (error: any) {
      console.error('Admin updateUserRole error:', error);
      return res.status(500).json({ error: 'ไม่สามารถอัปเดตสิทธิ์ผู้ใช้ได้' });
    }
  }

  /**
   * 5. GET /api/admin/notes/stats
   * สถิติโน้ตภาพรวม (รักษา Privacy/E2EE: ไม่ดึงหรือส่งเนื้อหาโน้ตใดๆ)
   */
  static async getNotesStats(req: AuthRequest, res: Response) {
    try {
      const [
        totalNotes,
        lockedNotes,
        pinnedNotes,
        favoriteNotes,
        totalUsers,
      ] = await Promise.all([
        prisma.note.count(),
        prisma.note.count({ where: { isLocked: true } }),
        prisma.note.count({ where: { isPinned: true } }),
        prisma.note.count({ where: { isFavorite: true } }),
        prisma.user.count(),
      ]);

      // สถิติผู้ใช้งานที่มีโน้ตมากที่สุด 5 อันดับแรก (เฉพาะชื่อและจำนวน ไม่แตะเนื้อหา)
      const topCreators = await prisma.user.findMany({
        take: 5,
        orderBy: {
          notes: {
            _count: 'desc',
          },
        },
        select: {
          id: true,
          username: true,
          email: true,
          _count: { select: { notes: true } },
        },
      });

      return res.json({
        success: true,
        stats: {
          totalNotes,
          lockedNotes,
          unlockedNotes: totalNotes - lockedNotes,
          pinnedNotes,
          favoriteNotes,
          averageNotesPerUser: totalUsers > 0 ? (totalNotes / totalUsers).toFixed(1) : 0,
          topCreators: topCreators.map((u) => ({
            id: u.id,
            username: u.username,
            email: u.email,
            notesCount: u._count.notes,
          })),
        },
      });
    } catch (error: any) {
      console.error('Admin getNotesStats error:', error);
      return res.status(500).json({ error: 'ไม่สามารถดึงสถิติโน้ตได้' });
    }
  }

  /**
   * 6. GET /api/admin/boards/stats
   * สถิติบอร์ดทั้งหมด ตรวจสอบขีดจำกัดความจุ 56 แผ่น (MAX_NOTES_PER_BOARD = 56)
   */
  static async getBoardsStats(req: AuthRequest, res: Response) {
    try {
      const boards = await prisma.board.findMany({
        orderBy: { updatedAt: 'desc' },
        include: {
          user: {
            select: { id: true, username: true, email: true },
          },
          _count: {
            select: { notes: true },
          },
        },
      });

      const boardList = boards.map((b) => ({
        id: b.id,
        name: b.name,
        color: b.color,
        isPublic: b.isPublic,
        shareCode: b.shareCode,
        owner: b.user,
        notesCount: b._count.notes,
        maxCapacity: MAX_NOTES_PER_BOARD,
        isFull: b._count.notes >= MAX_NOTES_PER_BOARD,
        remainingCapacity: Math.max(0, MAX_NOTES_PER_BOARD - b._count.notes),
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
      }));

      const fullBoards = boardList.filter((b) => b.isFull);
      const nearFullBoards = boardList.filter((b) => b.notesCount >= 45 && !b.isFull);

      return res.json({
        success: true,
        summary: {
          totalBoards: boardList.length,
          fullBoardsCount: fullBoards.length,
          nearFullBoardsCount: nearFullBoards.length,
          maxNotesLimit: MAX_NOTES_PER_BOARD,
        },
        boards: boardList,
      });
    } catch (error: any) {
      console.error('Admin getBoardsStats error:', error);
      return res.status(500).json({ error: 'ไม่สามารถดึงสถิติบอร์ดได้' });
    }
  }

  /**
   * 7. GET /api/admin/database
   * ข้อมูลระบบฐานข้อมูล (File Size, PRAGMA Integrity Check, Table Counts)
   */
  static async getDatabaseInfo(req: AuthRequest, res: Response) {
    try {
      let dbStat: fs.Stats | null = null;
      if (fs.existsSync(DB_PATH)) {
        dbStat = fs.statSync(DB_PATH);
      }

      // ตรวจสอบความสมบูรณ์ของฐานข้อมูล SQLite
      let integrityResult = 'UNKNOWN';
      try {
        const rawCheck = await prisma.$queryRawUnsafe<{ integrity_check: string }[]>(
          'PRAGMA integrity_check;'
        );
        integrityResult = rawCheck[0]?.integrity_check || 'ok';
      } catch (err: any) {
        integrityResult = `Error: ${err.message}`;
      }

      // นับจำนวนแถวในตารางต่างๆ
      const [
        usersCount,
        notesCount,
        boardsCount,
        notebooksCount,
        labelsCount,
        sessionsCount,
        passkeysCount,
        auditLogsCount,
        backupRecordsCount,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.note.count(),
        prisma.board.count(),
        prisma.notebook.count(),
        prisma.label.count(),
        prisma.session.count(),
        prisma.passkey.count(),
        prisma.auditLog.count(),
        prisma.backupRecord.count(),
      ]);

      return res.json({
        success: true,
        database: {
          type: 'SQLite',
          filePath: 'prisma/dev.db',
          exists: !!dbStat,
          sizeBytes: dbStat?.size || 0,
          sizeFormatted: dbStat ? `${(dbStat.size / (1024 * 1024)).toFixed(2)} MB` : '0 MB',
          lastModified: dbStat?.mtime || null,
          integrityCheck: integrityResult,
          tables: {
            users: usersCount,
            notes: notesCount,
            boards: boardsCount,
            notebooks: notebooksCount,
            labels: labelsCount,
            sessions: sessionsCount,
            passkeys: passkeysCount,
            auditLogs: auditLogsCount,
            backupRecords: backupRecordsCount,
          },
        },
      });
    } catch (error: any) {
      console.error('Admin getDatabaseInfo error:', error);
      return res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลฐานข้อมูลได้' });
    }
  }

  /**
   * 8. GET /api/admin/backups
   * ดึงรายการ Backup ทั้งหมด (ทั้งจาก DB Record และโฟลเดอร์ backups/)
   */
  static async getBackupsList(req: AuthRequest, res: Response) {
    try {
      const records = await prisma.backupRecord.findMany({
        orderBy: { createdAt: 'desc' },
      });

      // สแกนไฟล์จริงในโฟลเดอร์ backups/
      let physicalFiles: { name: string; size: number; mtime: Date }[] = [];
      if (fs.existsSync(BACKUP_DIR)) {
        physicalFiles = fs
          .readdirSync(BACKUP_DIR)
          .filter((file) => file.endsWith('.db'))
          .map((file) => {
            const p = path.join(BACKUP_DIR, file);
            const st = fs.statSync(p);
            return {
              name: file,
              size: st.size,
              mtime: st.mtime,
            };
          })
          .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
      }

      return res.json({
        success: true,
        records,
        physicalFiles: physicalFiles.map((f) => ({
          ...f,
          sizeFormatted: `${(f.size / 1024).toFixed(1)} KB`,
        })),
      });
    } catch (error: any) {
      console.error('Admin getBackupsList error:', error);
      return res.status(500).json({ error: 'ไม่สามารถดึงรายการสำรองข้อมูลได้' });
    }
  }

  /**
   * 9. POST /api/admin/backups/create
   * สั่งสร้าง Snapshot Backup ฐานข้อมูลทันที
   */
  static async triggerBackup(req: AuthRequest, res: Response) {
    try {
      if (!fs.existsSync(DB_PATH)) {
        return res.status(404).json({ error: 'ไม่พบไฟล์ฐานข้อมูล dev.db' });
      }

      if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
      }

      const stat = fs.statSync(DB_PATH);
      if (stat.size === 0) {
        return res.status(400).json({ error: 'ไฟล์ฐานข้อมูลมีขนาด 0 ไบต์ ข้ามการสำรองข้อมูล' });
      }

      const timestamp = formatTimestamp(new Date());
      const backupFileName = `dev_backup_${timestamp}.db`;
      const backupFilePath = path.join(BACKUP_DIR, backupFileName);

      // สำรองไฟล์
      fs.copyFileSync(DB_PATH, backupFilePath);

      const note = req.body?.note?.trim() || 'Manual backup from Admin Dashboard';

      // บันทึกลงตาราง BackupRecord
      const backupRecord = await prisma.backupRecord.create({
        data: {
          filename: backupFileName,
          size: stat.size,
          status: 'SUCCESS',
          triggerBy: req.user?.email || 'admin',
          note,
        },
      });

      // บันทึกลง AuditLog
      await prisma.auditLog.create({
        data: {
          adminId: req.user!.id,
          action: 'CREATE_BACKUP',
          target: backupFileName,
          details: `สำรองฐานข้อมูลขนาด ${(stat.size / 1024).toFixed(1)} KB`,
          ipAddress: (req.ip || req.socket.remoteAddress || 'unknown').slice(0, 45),
          result: 'SUCCESS',
        },
      });

      // จัดการหมุนเวียนไฟล์สำรองเก่า (เก็บสูงสุด 15 ไฟล์)
      try {
        const files = fs
          .readdirSync(BACKUP_DIR)
          .filter((file) => file.startsWith('dev_backup_') && file.endsWith('.db'))
          .map((file) => {
            const p = path.join(BACKUP_DIR, file);
            return { name: file, path: p, time: fs.statSync(p).mtime.getTime() };
          })
          .sort((a, b) => b.time - a.time);

        if (files.length > MAX_BACKUPS) {
          const filesToDelete = files.slice(MAX_BACKUPS);
          for (const f of filesToDelete) {
            fs.unlinkSync(f.path);
          }
        }
      } catch (cleanErr) {
        console.warn('Backup cleanup warning:', cleanErr);
      }

      return res.status(201).json({
        success: true,
        message: `สำรองฐานข้อมูลสำเร็จ: ${backupFileName}`,
        backup: backupRecord,
      });
    } catch (error: any) {
      console.error('Admin triggerBackup error:', error);
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการสำรองฐานข้อมูล' });
    }
  }

  /**
   * 10. GET /api/admin/audit-logs
   * ดึงรายการ Audit Log ของระบบแบบแบ่งหน้า
   */
  static async getAuditLogs(req: AuthRequest, res: Response) {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
      const action = (req.query.action as string)?.trim() || '';

      const where: any = {};
      if (action) {
        where.action = action;
      }

      const [total, logs] = await Promise.all([
        prisma.auditLog.count({ where }),
        prisma.auditLog.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            admin: {
              select: { id: true, username: true, email: true, role: true },
            },
          },
        }),
      ]);

      return res.json({
        success: true,
        logs,
        pagination: {
          total,
          totalPages: Math.ceil(total / limit),
          page,
          limit,
        },
      });
    } catch (error: any) {
      console.error('Admin getAuditLogs error:', error);
      return res.status(500).json({ error: 'ไม่สามารถดึงบันทึกประวัติการกระทำได้' });
    }
  }

  /**
   * 11. GET /api/admin/backups/:filename/download
   * ดาวน์โหลดไฟล์สำรองฐานข้อมูล (.db)
   */
  static async downloadBackup(req: AuthRequest, res: Response) {
    try {
      const filename = path.basename(req.params.filename || '');
      if (!filename.endsWith('.db') || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        return res.status(400).json({ error: 'ชื่อไฟล์ไม่ถูกต้องหรือไม่อนุญาต' });
      }

      const filePath = path.join(BACKUP_DIR, filename);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'ไม่พบไฟล์สำรองข้อมูลที่ระบุ' });
      }

      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', 'application/x-sqlite3');
      return res.sendFile(filePath);
    } catch (error: any) {
      console.error('Admin downloadBackup error:', error);
      return res.status(500).json({ error: 'ไม่สามารถดาวน์โหลดไฟล์สำรองได้' });
    }
  }

  /**
   * 12. POST /api/admin/backups/restore
   * กู้คืนฐานข้อมูลจากไฟล์สำรอง (เฉพาะ SUPER_ADMIN เท่านั้น พร้อมระบบ Multi-layer Safety)
   */
  static async triggerRestore(req: AuthRequest, res: Response) {
    try {
      const { filename, confirmation } = req.body;
      if (confirmation !== 'CONFIRM_RESTORE') {
        return res.status(400).json({
          error: 'กรุณากรอกคำยืนยัน "CONFIRM_RESTORE" ให้ถูกต้องเพื่อดำเนินการกู้คืน',
        });
      }

      const safeFilename = path.basename(filename || '');
      if (!safeFilename.endsWith('.db') || safeFilename.includes('..')) {
        return res.status(400).json({ error: 'ชื่อไฟล์สำรองไม่ถูกต้อง' });
      }

      const targetBackupPath = path.join(BACKUP_DIR, safeFilename);
      if (!fs.existsSync(targetBackupPath)) {
        return res.status(404).json({ error: 'ไม่พบไฟล์สำรองที่ต้องการกู้คืน' });
      }

      const backupStat = fs.statSync(targetBackupPath);
      if (backupStat.size === 0) {
        return res.status(400).json({ error: 'ไฟล์สำรองมีขนาด 0 ไบต์ ข้ามการกู้คืนเพื่อความปลอดภัย' });
      }

      // ด่านความปลอดภัยที่ 1: สร้าง Safety Backup ของฐานข้อมูลปัจจุบันทันทีก่อนกู้คืน
      let safetyBackupName = '';
      if (fs.existsSync(DB_PATH)) {
        const timestamp = formatTimestamp(new Date());
        safetyBackupName = `pre_restore_safety_${timestamp}.db`;
        const safetyPath = path.join(BACKUP_DIR, safetyBackupName);
        fs.copyFileSync(DB_PATH, safetyPath);

        const safetyStat = fs.statSync(safetyPath);
        await prisma.backupRecord.create({
          data: {
            filename: safetyBackupName,
            size: safetyStat.size,
            status: 'SUCCESS',
            triggerBy: req.user?.email || 'admin',
            note: `Auto Safety Backup before restoring ${safeFilename}`,
          },
        });
      }

      // ดำเนินการกู้คืน (Overwrite dev.db)
      fs.copyFileSync(targetBackupPath, DB_PATH);

      // บันทึกลง AuditLog
      await prisma.auditLog.create({
        data: {
          adminId: req.user!.id,
          action: 'RESTORE_DATABASE',
          target: safeFilename,
          details: `กู้คืนฐานข้อมูลจาก ${safeFilename} สำเร็จ (ระบบทำ Safety Backup อัตโนมัติไว้ที่ ${safetyBackupName})`,
          ipAddress: (req.ip || req.socket.remoteAddress || 'unknown').slice(0, 45),
          result: 'SUCCESS',
        },
      });

      return res.json({
        success: true,
        message: `กู้คืนฐานข้อมูลจาก ${safeFilename} สำเร็จเรียบร้อย!`,
        restoredFile: safeFilename,
        safetyBackup: safetyBackupName,
      });
    } catch (error: any) {
      console.error('Admin triggerRestore error:', error);
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการกู้คืนฐานข้อมูล' });
    }
  }
}
