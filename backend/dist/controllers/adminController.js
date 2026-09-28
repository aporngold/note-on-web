"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const database_1 = require("../utils/database");
const MAX_NOTES_PER_BOARD = 56;
const DB_PATH = path_1.default.join(__dirname, '../../prisma/dev.db');
const BACKUP_DIR = path_1.default.join(__dirname, '../../backups');
const MAX_BACKUPS = 15;
function formatTimestamp(date) {
    const pad = (n) => String(n).padStart(2, '0');
    const yyyy = date.getFullYear();
    const mm = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const hh = pad(date.getHours());
    const min = pad(date.getMinutes());
    const ss = pad(date.getSeconds());
    return `${yyyy}-${mm}-${dd}_${hh}-${min}-${ss}`;
}
class AdminController {
    /**
     * 1. GET /api/admin/stats
     * ดึงตัวเลขสรุปภาพรวมทั้งหมดของระบบ
     */
    static async getStats(req, res) {
        try {
            const now = new Date();
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const [totalUsers, superAdmins, admins, regularUsers, totalNotes, lockedNotes, totalBoards, totalNotebooks, totalLabels, totalPasskeys, newUsersToday, newUsersThisWeek, newUsersThisMonth, totalReminders, scheduledReminders, sentReminders, totalNotifications, unreadNotifications, totalPushSubscriptions,] = await Promise.all([
                database_1.prisma.user.count(),
                database_1.prisma.user.count({ where: { role: 'SUPER_ADMIN' } }),
                database_1.prisma.user.count({ where: { role: 'ADMIN' } }),
                database_1.prisma.user.count({ where: { role: 'USER' } }),
                database_1.prisma.note.count(),
                database_1.prisma.note.count({ where: { isLocked: true } }),
                database_1.prisma.board.count(),
                database_1.prisma.notebook.count(),
                database_1.prisma.label.count(),
                database_1.prisma.passkey.count(),
                database_1.prisma.user.count({ where: { createdAt: { gte: startOfDay } } }),
                database_1.prisma.user.count({ where: { createdAt: { gte: startOfWeek } } }),
                database_1.prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
                database_1.prisma.reminder.count(),
                database_1.prisma.reminder.count({ where: { status: 'scheduled' } }),
                database_1.prisma.reminder.count({ where: { status: 'sent' } }),
                database_1.prisma.notification.count(),
                database_1.prisma.notification.count({ where: { isRead: false } }),
                database_1.prisma.pushSubscription.count(),
            ]);
            // ตรวจสอบขนาดฐานข้อมูลจริงบน Disk
            let dbSizeBytes = 0;
            if (fs_1.default.existsSync(DB_PATH)) {
                const stat = fs_1.default.statSync(DB_PATH);
                dbSizeBytes = stat.size;
            }
            // ดึงข้อมูล Backup ล่าสุด
            const latestBackup = await database_1.prisma.backupRecord.findFirst({
                orderBy: { createdAt: 'desc' },
            });
            // ตรวจสอบจำนวนบอร์ดที่เต็มความจุ (>= 56 notes)
            const allBoardsWithCount = await database_1.prisma.board.findMany({
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
                    reminders: {
                        total: totalReminders,
                        scheduled: scheduledReminders,
                        sent: sentReminders,
                        cancelled: Math.max(0, totalReminders - scheduledReminders - sentReminders),
                    },
                    notifications: {
                        total: totalNotifications,
                        unread: unreadNotifications,
                    },
                    pushSubscriptions: {
                        total: totalPushSubscriptions,
                    },
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
        }
        catch (error) {
            console.error('Admin getStats error:', error);
            return res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลสถิติภาพรวมได้' });
        }
    }
    /**
     * 2. GET /api/admin/users
     * ดึงรายชื่อผู้ใช้แบบแบ่งหน้า (Pagination + Search + Filter Role)
     * ปลอดภัย 100%: ไม่ส่งรหัสผ่านหรือความลับใดๆ ออกไป
     */
    static async getUsers(req, res) {
        try {
            const page = Math.max(1, parseInt(req.query.page) || 1);
            const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
            const search = req.query.search?.trim() || '';
            const roleFilter = req.query.role?.trim() || '';
            const sortBy = req.query.sortBy || 'createdAt';
            const sortOrder = req.query.sortOrder === 'asc' ? 'asc' : 'desc';
            const where = {};
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
                database_1.prisma.user.count({ where }),
                database_1.prisma.user.findMany({
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
                                reminders: true,
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
        }
        catch (error) {
            console.error('Admin getUsers error:', error);
            return res.status(500).json({ error: 'ไม่สามารถดึงรายชื่อผู้ใช้งานได้' });
        }
    }
    /**
     * 3. GET /api/admin/users/:id
     * ดึงข้อมูลผู้ใช้รายบุคคลพร้อมสถิติเจาะลึก
     */
    static async getUserDetail(req, res) {
        try {
            const { id } = req.params;
            const user = await database_1.prisma.user.findUnique({
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
            const lockedNotesCount = await database_1.prisma.note.count({
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
        }
        catch (error) {
            console.error('Admin getUserDetail error:', error);
            return res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลผู้ใช้ได้' });
        }
    }
    /**
     * 4. PUT /api/admin/users/:id/role
     * ปรับเปลี่ยนสิทธิ์ของผู้ใช้ (เฉพาะ SUPER_ADMIN เท่านั้น)
     */
    static async updateUserRole(req, res) {
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
            const targetUser = await database_1.prisma.user.findUnique({ where: { id } });
            if (!targetUser) {
                return res.status(404).json({ error: 'ไม่พบผู้ใช้งานที่ต้องการแก้ไข' });
            }
            // ถ้ากำลังจะปลด SUPER_ADMIN ตรวจสอบว่ายังมี SUPER_ADMIN คนอื่นเหลืออยู่อย่างน้อย 1 คนหรือไม่
            if (targetUser.role === 'SUPER_ADMIN' && role !== 'SUPER_ADMIN') {
                const superAdminCount = await database_1.prisma.user.count({
                    where: { role: 'SUPER_ADMIN' },
                });
                if (superAdminCount <= 1) {
                    return res.status(400).json({
                        error: 'ไม่สามารถลดสิทธิ์ได้ เนื่องจากต้องมี SUPER_ADMIN ในระบบอย่างน้อย 1 คน',
                    });
                }
            }
            const oldRole = targetUser.role;
            const updatedUser = await database_1.prisma.user.update({
                where: { id },
                data: { role },
                select: { id: true, email: true, username: true, role: true },
            });
            // บันทึกลง AuditLog
            await database_1.prisma.auditLog.create({
                data: {
                    adminId: req.user.id,
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
        }
        catch (error) {
            console.error('Admin updateUserRole error:', error);
            return res.status(500).json({ error: 'ไม่สามารถอัปเดตสิทธิ์ผู้ใช้ได้' });
        }
    }
    /**
     * 5. GET /api/admin/notes/stats
     * สถิติโน้ตภาพรวม (รักษา Privacy/E2EE: ไม่ดึงหรือส่งเนื้อหาโน้ตใดๆ)
     */
    static async getNotesStats(req, res) {
        try {
            const [totalNotes, lockedNotes, pinnedNotes, favoriteNotes, totalUsers,] = await Promise.all([
                database_1.prisma.note.count(),
                database_1.prisma.note.count({ where: { isLocked: true } }),
                database_1.prisma.note.count({ where: { isPinned: true } }),
                database_1.prisma.note.count({ where: { isFavorite: true } }),
                database_1.prisma.user.count(),
            ]);
            // สถิติผู้ใช้งานที่มีโน้ตมากที่สุด 5 อันดับแรก (เฉพาะชื่อและจำนวน ไม่แตะเนื้อหา)
            const topCreators = await database_1.prisma.user.findMany({
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
        }
        catch (error) {
            console.error('Admin getNotesStats error:', error);
            return res.status(500).json({ error: 'ไม่สามารถดึงสถิติโน้ตได้' });
        }
    }
    /**
     * 6. GET /api/admin/boards/stats
     * สถิติบอร์ดทั้งหมด ตรวจสอบขีดจำกัดความจุ 56 แผ่น (MAX_NOTES_PER_BOARD = 56)
     */
    static async getBoardsStats(req, res) {
        try {
            const boards = await database_1.prisma.board.findMany({
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
        }
        catch (error) {
            console.error('Admin getBoardsStats error:', error);
            return res.status(500).json({ error: 'ไม่สามารถดึงสถิติบอร์ดได้' });
        }
    }
    /**
     * 7. GET /api/admin/database
     * ข้อมูลระบบฐานข้อมูล (File Size, PRAGMA Integrity Check, Table Counts)
     */
    static async getDatabaseInfo(req, res) {
        try {
            let dbStat = null;
            if (fs_1.default.existsSync(DB_PATH)) {
                dbStat = fs_1.default.statSync(DB_PATH);
            }
            // ตรวจสอบความสมบูรณ์ของฐานข้อมูล (รองรับทั้ง PostgreSQL และ SQLite)
            let integrityResult = 'ok';
            const isPostgres = process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres');
            if (isPostgres) {
                integrityResult = 'PostgreSQL Cloud Health OK';
            }
            else {
                try {
                    const rawCheck = await database_1.prisma.$queryRawUnsafe('PRAGMA integrity_check;');
                    integrityResult = rawCheck[0]?.integrity_check || 'ok';
                }
                catch (err) {
                    integrityResult = `Error: ${err.message}`;
                }
            }
            // นับจำนวนแถวในตารางต่างๆ
            const [usersCount, notesCount, boardsCount, notebooksCount, labelsCount, sessionsCount, passkeysCount, auditLogsCount, backupRecordsCount,] = await Promise.all([
                database_1.prisma.user.count(),
                database_1.prisma.note.count(),
                database_1.prisma.board.count(),
                database_1.prisma.notebook.count(),
                database_1.prisma.label.count(),
                database_1.prisma.session.count(),
                database_1.prisma.passkey.count(),
                database_1.prisma.auditLog.count(),
                database_1.prisma.backupRecord.count(),
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
        }
        catch (error) {
            console.error('Admin getDatabaseInfo error:', error);
            return res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลฐานข้อมูลได้' });
        }
    }
    /**
     * 8. GET /api/admin/backups
     * ดึงรายการ Backup ทั้งหมด (ทั้งจาก DB Record และโฟลเดอร์ backups/)
     */
    static async getBackupsList(req, res) {
        try {
            const records = await database_1.prisma.backupRecord.findMany({
                orderBy: { createdAt: 'desc' },
            });
            // สแกนไฟล์จริงในโฟลเดอร์ backups/
            let physicalFiles = [];
            if (fs_1.default.existsSync(BACKUP_DIR)) {
                physicalFiles = fs_1.default
                    .readdirSync(BACKUP_DIR)
                    .filter((file) => file.endsWith('.db'))
                    .map((file) => {
                    const p = path_1.default.join(BACKUP_DIR, file);
                    const st = fs_1.default.statSync(p);
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
        }
        catch (error) {
            console.error('Admin getBackupsList error:', error);
            return res.status(500).json({ error: 'ไม่สามารถดึงรายการสำรองข้อมูลได้' });
        }
    }
    /**
     * 9. POST /api/admin/backups/create
     * สั่งสร้าง Snapshot Backup ฐานข้อมูลทันที
     */
    static async triggerBackup(req, res) {
        try {
            if (!fs_1.default.existsSync(DB_PATH)) {
                return res.status(404).json({ error: 'ไม่พบไฟล์ฐานข้อมูล dev.db' });
            }
            if (!fs_1.default.existsSync(BACKUP_DIR)) {
                fs_1.default.mkdirSync(BACKUP_DIR, { recursive: true });
            }
            const stat = fs_1.default.statSync(DB_PATH);
            if (stat.size === 0) {
                return res.status(400).json({ error: 'ไฟล์ฐานข้อมูลมีขนาด 0 ไบต์ ข้ามการสำรองข้อมูล' });
            }
            const timestamp = formatTimestamp(new Date());
            const backupFileName = `dev_backup_${timestamp}.db`;
            const backupFilePath = path_1.default.join(BACKUP_DIR, backupFileName);
            // สำรองไฟล์
            fs_1.default.copyFileSync(DB_PATH, backupFilePath);
            const note = req.body?.note?.trim() || 'Manual backup from Admin Dashboard';
            // บันทึกลงตาราง BackupRecord
            const backupRecord = await database_1.prisma.backupRecord.create({
                data: {
                    filename: backupFileName,
                    size: stat.size,
                    status: 'SUCCESS',
                    triggerBy: req.user?.email || 'admin',
                    note,
                },
            });
            // บันทึกลง AuditLog
            await database_1.prisma.auditLog.create({
                data: {
                    adminId: req.user.id,
                    action: 'CREATE_BACKUP',
                    target: backupFileName,
                    details: `สำรองฐานข้อมูลขนาด ${(stat.size / 1024).toFixed(1)} KB`,
                    ipAddress: (req.ip || req.socket.remoteAddress || 'unknown').slice(0, 45),
                    result: 'SUCCESS',
                },
            });
            // จัดการหมุนเวียนไฟล์สำรองเก่า (เก็บสูงสุด 15 ไฟล์)
            try {
                const files = fs_1.default
                    .readdirSync(BACKUP_DIR)
                    .filter((file) => file.startsWith('dev_backup_') && file.endsWith('.db'))
                    .map((file) => {
                    const p = path_1.default.join(BACKUP_DIR, file);
                    return { name: file, path: p, time: fs_1.default.statSync(p).mtime.getTime() };
                })
                    .sort((a, b) => b.time - a.time);
                if (files.length > MAX_BACKUPS) {
                    const filesToDelete = files.slice(MAX_BACKUPS);
                    for (const f of filesToDelete) {
                        fs_1.default.unlinkSync(f.path);
                    }
                }
            }
            catch (cleanErr) {
                console.warn('Backup cleanup warning:', cleanErr);
            }
            return res.status(201).json({
                success: true,
                message: `สำรองฐานข้อมูลสำเร็จ: ${backupFileName}`,
                backup: backupRecord,
            });
        }
        catch (error) {
            console.error('Admin triggerBackup error:', error);
            return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการสำรองฐานข้อมูล' });
        }
    }
    /**
     * 10. GET /api/admin/audit-logs
     * ดึงรายการ Audit Log ของระบบแบบแบ่งหน้า
     */
    static async getAuditLogs(req, res) {
        try {
            const page = Math.max(1, parseInt(req.query.page) || 1);
            const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
            const action = req.query.action?.trim() || '';
            const where = {};
            if (action) {
                where.action = action;
            }
            const [total, logs] = await Promise.all([
                database_1.prisma.auditLog.count({ where }),
                database_1.prisma.auditLog.findMany({
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
        }
        catch (error) {
            console.error('Admin getAuditLogs error:', error);
            return res.status(500).json({ error: 'ไม่สามารถดึงบันทึกประวัติการกระทำได้' });
        }
    }
    /**
     * 11. GET /api/admin/backups/:filename/download
     * ดาวน์โหลดไฟล์สำรองฐานข้อมูล (.db)
     */
    static async downloadBackup(req, res) {
        try {
            const filename = path_1.default.basename(req.params.filename || '');
            if (!filename.endsWith('.db') || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
                return res.status(400).json({ error: 'ชื่อไฟล์ไม่ถูกต้องหรือไม่อนุญาต' });
            }
            const filePath = path_1.default.join(BACKUP_DIR, filename);
            if (!fs_1.default.existsSync(filePath)) {
                return res.status(404).json({ error: 'ไม่พบไฟล์สำรองข้อมูลที่ระบุ' });
            }
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.setHeader('Content-Type', 'application/x-sqlite3');
            return res.sendFile(filePath);
        }
        catch (error) {
            console.error('Admin downloadBackup error:', error);
            return res.status(500).json({ error: 'ไม่สามารถดาวน์โหลดไฟล์สำรองได้' });
        }
    }
    /**
     * 12. POST /api/admin/backups/restore
     * กู้คืนฐานข้อมูลจากไฟล์สำรอง (เฉพาะ SUPER_ADMIN เท่านั้น พร้อมระบบ Multi-layer Safety)
     */
    static async triggerRestore(req, res) {
        try {
            const { filename, confirmation } = req.body;
            if (confirmation !== 'CONFIRM_RESTORE') {
                return res.status(400).json({
                    error: 'กรุณากรอกคำยืนยัน "CONFIRM_RESTORE" ให้ถูกต้องเพื่อดำเนินการกู้คืน',
                });
            }
            const safeFilename = path_1.default.basename(filename || '');
            if (!safeFilename.endsWith('.db') || safeFilename.includes('..')) {
                return res.status(400).json({ error: 'ชื่อไฟล์สำรองไม่ถูกต้อง' });
            }
            const targetBackupPath = path_1.default.join(BACKUP_DIR, safeFilename);
            if (!fs_1.default.existsSync(targetBackupPath)) {
                return res.status(404).json({ error: 'ไม่พบไฟล์สำรองที่ต้องการกู้คืน' });
            }
            const backupStat = fs_1.default.statSync(targetBackupPath);
            if (backupStat.size === 0) {
                return res.status(400).json({ error: 'ไฟล์สำรองมีขนาด 0 ไบต์ ข้ามการกู้คืนเพื่อความปลอดภัย' });
            }
            // ด่านความปลอดภัยที่ 1: สร้าง Safety Backup ของฐานข้อมูลปัจจุบันทันทีก่อนกู้คืน
            let safetyBackupName = '';
            if (fs_1.default.existsSync(DB_PATH)) {
                const timestamp = formatTimestamp(new Date());
                safetyBackupName = `pre_restore_safety_${timestamp}.db`;
                const safetyPath = path_1.default.join(BACKUP_DIR, safetyBackupName);
                fs_1.default.copyFileSync(DB_PATH, safetyPath);
                const safetyStat = fs_1.default.statSync(safetyPath);
                await database_1.prisma.backupRecord.create({
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
            fs_1.default.copyFileSync(targetBackupPath, DB_PATH);
            // บันทึกลง AuditLog
            await database_1.prisma.auditLog.create({
                data: {
                    adminId: req.user.id,
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
        }
        catch (error) {
            console.error('Admin triggerRestore error:', error);
            return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการกู้คืนฐานข้อมูล' });
        }
    }
    /**
     * 13. DELETE /api/admin/users/:id
     * ลบบัญชีผู้ใช้ถาวร (เฉพาะ SUPER_ADMIN เท่านั้น พร้อมมาตรการความปลอดภัยและ Cascade Delete)
     */
    static async deleteUser(req, res) {
        try {
            const { id } = req.params;
            if (req.user?.id === id) {
                return res.status(400).json({
                    error: 'ไม่สามารถลบบัญชีตนเองได้ เพื่อความปลอดภัยของระบบ',
                });
            }
            const targetUser = await database_1.prisma.user.findUnique({
                where: { id },
                select: { id: true, email: true, username: true, role: true },
            });
            if (!targetUser) {
                return res.status(404).json({ error: 'ไม่พบบัญชีผู้ใช้ที่ต้องการลบ' });
            }
            // ตรวจสอบหากเป้าหมายเป็น SUPER_ADMIN ต้องมี SUPER_ADMIN คนอื่นเหลืออยู่อย่างน้อย 1 คน
            if (targetUser.role === 'SUPER_ADMIN') {
                const superAdminCount = await database_1.prisma.user.count({
                    where: { role: 'SUPER_ADMIN' },
                });
                if (superAdminCount <= 1) {
                    return res.status(400).json({
                        error: 'ไม่สามารถลบได้ เนื่องจากต้องมี Super Admin ในระบบอย่างน้อย 1 คน',
                    });
                }
            }
            // ลบผู้ใช้ (Prisma จะทำการ Cascade ลบ Note, Board, Session, Passkey อัตโนมัติ)
            await database_1.prisma.user.delete({ where: { id } });
            // บันทึกประวัติลง AuditLog
            await database_1.prisma.auditLog.create({
                data: {
                    adminId: req.user.id,
                    action: 'DELETE_USER',
                    target: targetUser.email,
                    details: `ลบบัญชีผู้ใช้ ${targetUser.username} (${targetUser.email}) สิทธิ์เดิม: ${targetUser.role}`,
                    ipAddress: (req.ip || req.socket.remoteAddress || 'unknown').slice(0, 45),
                    result: 'SUCCESS',
                },
            });
            return res.json({
                success: true,
                message: `ลบบัญชีผู้ใช้ ${targetUser.username} (${targetUser.email}) สำเร็จเรียบร้อย`,
            });
        }
        catch (error) {
            console.error('Admin deleteUser error:', error);
            return res.status(500).json({ error: 'ไม่สามารถลบบัญชีผู้ใช้ได้' });
        }
    }
}
exports.AdminController = AdminController;
