"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageAnalyticsController = void 0;
exports.getFileCategory = getFileCategory;
exports.formatBytes = formatBytes;
const database_1 = require("../utils/database");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const UPLOADS_DIR = path_1.default.resolve(__dirname, '../../uploads');
function getFileCategory(mimeType, filename) {
    if (!mimeType) {
        if (filename) {
            const ext = path_1.default.extname(filename).toLowerCase();
            if (['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.bmp', '.ico', '.avif'].includes(ext))
                return 'image';
            if (['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac', '.webm'].includes(ext))
                return 'audio';
            if (['.mp4', '.mov', '.avi', '.mkv', '.webm'].includes(ext))
                return 'video';
            if (['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.md', '.csv'].includes(ext))
                return 'document';
        }
        return 'unknown';
    }
    const mime = mimeType.toLowerCase();
    if (mime.startsWith('image/'))
        return 'image';
    if (mime.startsWith('audio/'))
        return 'audio';
    if (mime.startsWith('video/'))
        return 'video';
    if (mime.includes('pdf') ||
        mime.includes('document') ||
        mime.includes('word') ||
        mime.includes('sheet') ||
        mime.includes('excel') ||
        mime.includes('presentation') ||
        mime.includes('powerpoint') ||
        mime.startsWith('text/')) {
        return 'document';
    }
    return 'other';
}
function formatBytes(bytes) {
    if (bytes === 0)
        return '0 B';
    if (bytes < 1024)
        return `${bytes} B`;
    if (bytes < 1024 * 1024)
        return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024)
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
let scanCache = null;
const CACHE_TTL_MS = 30 * 1000;
class StorageAnalyticsController {
    /**
     * Helper: Scan physical disk in backend/uploads/ and detect orphaned & missing files
     */
    static async scanPhysicalDisk() {
        let physicalFilesOnDisk = [];
        if (fs_1.default.existsSync(UPLOADS_DIR)) {
            const files = fs_1.default.readdirSync(UPLOADS_DIR);
            for (const f of files) {
                if (f === '.gitkeep')
                    continue;
                try {
                    const filePath = path_1.default.join(UPLOADS_DIR, f);
                    const st = fs_1.default.statSync(filePath);
                    if (st.isFile()) {
                        physicalFilesOnDisk.push({
                            filename: f,
                            size: st.size,
                            mtime: st.mtime,
                        });
                    }
                }
                catch {
                    // Skip unreadable files
                }
            }
        }
        const allDbAttachments = await database_1.prisma.fileAttachment.findMany({
            select: { id: true, filename: true, size: true, mimeType: true, originalName: true },
        });
        const dbFilenameSet = new Set(allDbAttachments.map((a) => a.filename));
        const diskFilenameSet = new Set(physicalFilesOnDisk.map((f) => f.filename));
        // Orphaned: On disk but NOT in DB
        const orphaned = physicalFilesOnDisk.filter((f) => !dbFilenameSet.has(f.filename));
        const orphanedTotalBytes = orphaned.reduce((acc, f) => acc + f.size, 0);
        // Missing: In DB but NOT on disk
        const missing = allDbAttachments.filter((a) => !diskFilenameSet.has(a.filename));
        const missingTotalBytes = missing.reduce((acc, a) => acc + a.size, 0);
        return {
            physicalFilesCount: physicalFilesOnDisk.length,
            physicalTotalBytes: physicalFilesOnDisk.reduce((acc, f) => acc + f.size, 0),
            orphanedFiles: orphaned.map((f) => ({
                filename: f.filename,
                sizeBytes: f.size,
                sizeFormatted: formatBytes(f.size),
                category: getFileCategory(null, f.filename),
                mtime: f.mtime,
            })),
            orphanedTotalBytes,
            orphanedCount: orphaned.length,
            missingCount: missing.length,
            missingTotalBytes,
            missingFiles: missing.map((m) => ({
                id: m.id,
                filename: m.filename,
                originalName: m.originalName,
                sizeBytes: m.size,
                mimeType: m.mimeType,
            })),
        };
    }
    /**
     * Helper: Get Actual PostgreSQL database size (Cloud Neon DB)
     */
    static async getActualDatabaseSize() {
        try {
            const res = await database_1.prisma.$queryRawUnsafe('SELECT pg_database_size(current_database()) as db_size;');
            if (res && res.length > 0 && res[0].db_size !== undefined) {
                return {
                    sizeBytes: Number(res[0].db_size),
                    type: 'PostgreSQL (Neon Cloud Database)',
                };
            }
        }
        catch {
            // Fallback to SQLite dev.db if running locally
            const sqlitePath = path_1.default.resolve(__dirname, '../../prisma/dev.db');
            if (fs_1.default.existsSync(sqlitePath)) {
                return {
                    sizeBytes: fs_1.default.statSync(sqlitePath).size,
                    type: 'SQLite Local File (dev.db)',
                };
            }
        }
        return { sizeBytes: 0, type: 'Unknown Database' };
    }
    /**
     * 1. GET /api/admin/storage/summary
     * Dashboard ภาพรวมพื้นที่จัดเก็บทั้งหมด
     */
    static async getStorageSummary(req, res) {
        try {
            const forceRescan = req.query.rescan === 'true';
            const now = Date.now();
            if (!forceRescan && scanCache && now - scanCache.timestamp < CACHE_TTL_MS) {
                return res.json({
                    success: true,
                    ...scanCache.summary,
                    isCached: true,
                });
            }
            // 1. Scan Disk and database in parallel
            const [diskScan, actualDb, usersCount, attachments] = await Promise.all([
                StorageAnalyticsController.scanPhysicalDisk(),
                StorageAnalyticsController.getActualDatabaseSize(),
                database_1.prisma.user.count(),
                database_1.prisma.fileAttachment.findMany({
                    include: {
                        note: {
                            select: {
                                id: true,
                                title: true,
                                userId: true,
                                isArchived: true,
                                user: {
                                    select: { id: true, username: true, email: true },
                                },
                            },
                        },
                    },
                }),
            ]);
            // 2. Aggregate attachment metrics
            let totalAttachmentSizeBytes = 0;
            const typeBreakdown = {
                image: { count: 0, sizeBytes: 0, sizeFormatted: '0 B', percentage: 0 },
                audio: { count: 0, sizeBytes: 0, sizeFormatted: '0 B', percentage: 0 },
                video: { count: 0, sizeBytes: 0, sizeFormatted: '0 B', percentage: 0 },
                document: { count: 0, sizeBytes: 0, sizeFormatted: '0 B', percentage: 0 },
                other: { count: 0, sizeBytes: 0, sizeFormatted: '0 B', percentage: 0 },
                unknown: { count: 0, sizeBytes: 0, sizeFormatted: '0 B', percentage: 0 },
            };
            const userAttachmentMap = new Map();
            for (const att of attachments) {
                const cat = getFileCategory(att.mimeType, att.filename);
                totalAttachmentSizeBytes += att.size;
                typeBreakdown[cat].count += 1;
                typeBreakdown[cat].sizeBytes += att.size;
                const ownerId = att.note?.userId || 'unknown';
                const ownerName = att.note?.user?.username || 'Unknown User';
                const ownerEmail = att.note?.user?.email || 'unknown@system.local';
                let uData = userAttachmentMap.get(ownerId);
                if (!uData) {
                    uData = {
                        userId: ownerId,
                        username: ownerName,
                        email: ownerEmail,
                        filesCount: 0,
                        totalSizeBytes: 0,
                        categories: {
                            image: { count: 0, sizeBytes: 0 },
                            audio: { count: 0, sizeBytes: 0 },
                            video: { count: 0, sizeBytes: 0 },
                            document: { count: 0, sizeBytes: 0 },
                            other: { count: 0, sizeBytes: 0 },
                            unknown: { count: 0, sizeBytes: 0 },
                        },
                    };
                    userAttachmentMap.set(ownerId, uData);
                }
                uData.filesCount += 1;
                uData.totalSizeBytes += att.size;
                uData.categories[cat].count += 1;
                uData.categories[cat].sizeBytes += att.size;
            }
            // Calculate percentage for type breakdown
            for (const key of Object.keys(typeBreakdown)) {
                typeBreakdown[key].sizeFormatted = formatBytes(typeBreakdown[key].sizeBytes);
                typeBreakdown[key].percentage =
                    totalAttachmentSizeBytes > 0
                        ? Number(((typeBreakdown[key].sizeBytes / totalAttachmentSizeBytes) * 100).toFixed(1))
                        : 0;
            }
            // 3. Top 10 Storage Consumers
            const topConsumers = Array.from(userAttachmentMap.values())
                .sort((a, b) => b.totalSizeBytes - a.totalSizeBytes)
                .slice(0, 10)
                .map((u) => ({
                userId: u.userId,
                username: u.username,
                email: u.email,
                filesCount: u.filesCount,
                totalSizeBytes: u.totalSizeBytes,
                totalSizeFormatted: formatBytes(u.totalSizeBytes),
                percentageOfTotal: totalAttachmentSizeBytes > 0
                    ? Number(((u.totalSizeBytes / totalAttachmentSizeBytes) * 100).toFixed(1))
                    : 0,
            }));
            // 4. Calculate Logical Database Text Size (sum length of notes and versions)
            const allNotes = await database_1.prisma.note.findMany({
                select: { title: true, content: true },
            });
            const logicalTextBytes = allNotes.reduce((sum, n) => sum + Buffer.byteLength(n.title || '', 'utf8') + Buffer.byteLength(n.content || '', 'utf8'), 0);
            const summaryPayload = {
                totalUsers: usersCount,
                totalFilesDetected: attachments.length,
                totalAttachmentSizeBytes,
                totalAttachmentSizeFormatted: formatBytes(totalAttachmentSizeBytes),
                actualDatabase: {
                    sizeBytes: actualDb.sizeBytes,
                    sizeFormatted: formatBytes(actualDb.sizeBytes),
                    type: actualDb.type,
                },
                logicalDatabaseText: {
                    sizeBytes: logicalTextBytes,
                    sizeFormatted: formatBytes(logicalTextBytes),
                    explanation: 'ขนาดข้อมูลตัวอักษรของชื่อและเนื้อหาโน้ตทั้งหมดในฐานข้อมูล (UTF-8)',
                },
                diskHealth: {
                    physicalFilesCount: diskScan.physicalFilesCount,
                    physicalTotalBytes: diskScan.physicalTotalBytes,
                    physicalTotalFormatted: formatBytes(diskScan.physicalTotalBytes),
                    orphanedCount: diskScan.orphanedCount,
                    orphanedTotalBytes: diskScan.orphanedTotalBytes,
                    orphanedTotalFormatted: formatBytes(diskScan.orphanedTotalBytes),
                    missingCount: diskScan.missingCount,
                    missingTotalBytes: diskScan.missingTotalBytes,
                    status: diskScan.orphanedCount > 0 ? 'WARNING_ORPHANED_FILES' : 'HEALTHY',
                },
                typeBreakdown,
                topConsumers,
                lastScannedAt: new Date().toISOString(),
            };
            // Save to cache
            scanCache = {
                summary: summaryPayload,
                orphanedFiles: diskScan.orphanedFiles,
                timestamp: now,
            };
            return res.json({
                success: true,
                ...summaryPayload,
                isCached: false,
            });
        }
        catch (error) {
            console.error('getStorageSummary error:', error);
            return res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลสรุปการใช้พื้นที่จัดเก็บได้' });
        }
    }
    /**
     * 2. GET /api/admin/storage/users
     * รายการการใช้พื้นที่จัดเก็บของผู้ใช้แต่ละคน (Pagination, Search, Sorting, Filter)
     */
    static async getUsersStorage(req, res) {
        try {
            const page = Math.max(1, parseInt(req.query.page) || 1);
            const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
            const search = req.query.search?.trim().toLowerCase() || '';
            const sortBy = req.query.sortBy || 'size'; // 'size' | 'files' | 'notes' | 'dbSize' | 'createdAt'
            const sortOrder = req.query.sortOrder === 'asc' ? 'asc' : 'desc';
            const filterType = req.query.filterType || 'all'; // 'all' | 'hasFiles' | 'images' | 'audio' | 'video' | 'documents'
            // ดึงข้อมูลผู้ใช้ทั้งหมดพร้อม Notes และ Attachments
            const whereCondition = {};
            if (search) {
                whereCondition.OR = [
                    { email: { contains: search, mode: 'insensitive' } },
                    { username: { contains: search, mode: 'insensitive' } },
                ];
            }
            const users = await database_1.prisma.user.findMany({
                where: whereCondition,
                select: {
                    id: true,
                    username: true,
                    email: true,
                    role: true,
                    createdAt: true,
                    _count: {
                        select: { notes: true, boards: true },
                    },
                    notes: {
                        select: {
                            id: true,
                            title: true,
                            content: true,
                            isArchived: true,
                            attachments: {
                                select: {
                                    id: true,
                                    filename: true,
                                    mimeType: true,
                                    size: true,
                                    createdAt: true,
                                },
                            },
                        },
                    },
                },
            });
            // ประมวลผลสถิติของ User แต่ละคน
            const userStorageItems = users.map((u) => {
                let totalSizeBytes = 0;
                let totalFilesCount = 0;
                let inTrashSizeBytes = 0;
                let inTrashFilesCount = 0;
                let logicalDbSizeBytes = 0;
                let lastUploadedAt = null;
                const categories = {
                    image: { count: 0, sizeBytes: 0 },
                    audio: { count: 0, sizeBytes: 0 },
                    video: { count: 0, sizeBytes: 0 },
                    document: { count: 0, sizeBytes: 0 },
                    other: { count: 0, sizeBytes: 0 },
                    unknown: { count: 0, sizeBytes: 0 },
                };
                for (const n of u.notes) {
                    logicalDbSizeBytes +=
                        Buffer.byteLength(n.title || '', 'utf8') + Buffer.byteLength(n.content || '', 'utf8');
                    for (const att of n.attachments) {
                        totalFilesCount += 1;
                        totalSizeBytes += att.size;
                        const cat = getFileCategory(att.mimeType, att.filename);
                        categories[cat].count += 1;
                        categories[cat].sizeBytes += att.size;
                        if (n.isArchived) {
                            inTrashFilesCount += 1;
                            inTrashSizeBytes += att.size;
                        }
                        if (!lastUploadedAt || new Date(att.createdAt) > new Date(lastUploadedAt)) {
                            lastUploadedAt = att.createdAt.toISOString();
                        }
                    }
                }
                return {
                    userId: u.id,
                    username: u.username,
                    email: u.email,
                    role: u.role,
                    createdAt: u.createdAt,
                    notesCount: u._count.notes,
                    boardsCount: u._count.boards,
                    totalFilesCount,
                    totalSizeBytes,
                    totalSizeFormatted: formatBytes(totalSizeBytes),
                    logicalDbSizeBytes,
                    logicalDbSizeFormatted: formatBytes(logicalDbSizeBytes),
                    categories: {
                        image: {
                            count: categories.image.count,
                            sizeBytes: categories.image.sizeBytes,
                            sizeFormatted: formatBytes(categories.image.sizeBytes),
                        },
                        audio: {
                            count: categories.audio.count,
                            sizeBytes: categories.audio.sizeBytes,
                            sizeFormatted: formatBytes(categories.audio.sizeBytes),
                        },
                        video: {
                            count: categories.video.count,
                            sizeBytes: categories.video.sizeBytes,
                            sizeFormatted: formatBytes(categories.video.sizeBytes),
                        },
                        document: {
                            count: categories.document.count,
                            sizeBytes: categories.document.sizeBytes,
                            sizeFormatted: formatBytes(categories.document.sizeBytes),
                        },
                        other: {
                            count: categories.other.count,
                            sizeBytes: categories.other.sizeBytes,
                            sizeFormatted: formatBytes(categories.other.sizeBytes),
                        },
                        unknown: {
                            count: categories.unknown.count,
                            sizeBytes: categories.unknown.sizeBytes,
                            sizeFormatted: formatBytes(categories.unknown.sizeBytes),
                        },
                    },
                    inTrashFilesCount,
                    inTrashSizeBytes,
                    inTrashSizeFormatted: formatBytes(inTrashSizeBytes),
                    lastUploadedAt,
                };
            });
            // ตัวกรอง (Filter)
            let filtered = userStorageItems;
            if (filterType === 'hasFiles') {
                filtered = filtered.filter((u) => u.totalFilesCount > 0);
            }
            else if (filterType === 'images') {
                filtered = filtered.filter((u) => u.categories.image.count > 0);
            }
            else if (filterType === 'audio') {
                filtered = filtered.filter((u) => u.categories.audio.count > 0);
            }
            else if (filterType === 'video') {
                filtered = filtered.filter((u) => u.categories.video.count > 0);
            }
            else if (filterType === 'documents') {
                filtered = filtered.filter((u) => u.categories.document.count > 0);
            }
            // การเรียงลำดับ (Sorting)
            filtered.sort((a, b) => {
                let diff = 0;
                if (sortBy === 'files') {
                    diff = a.totalFilesCount - b.totalFilesCount;
                }
                else if (sortBy === 'notes') {
                    diff = a.notesCount - b.notesCount;
                }
                else if (sortBy === 'dbSize') {
                    diff = a.logicalDbSizeBytes - b.logicalDbSizeBytes;
                }
                else if (sortBy === 'createdAt') {
                    diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                }
                else {
                    // default: size
                    diff = a.totalSizeBytes - b.totalSizeBytes;
                }
                return sortOrder === 'asc' ? diff : -diff;
            });
            const total = filtered.length;
            const paginated = filtered.slice((page - 1) * limit, page * limit);
            return res.json({
                success: true,
                users: paginated,
                pagination: {
                    total,
                    totalPages: Math.ceil(total / limit) || 1,
                    page,
                    limit,
                },
            });
        }
        catch (error) {
            console.error('getUsersStorage error:', error);
            return res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลการใช้พื้นที่ของผู้ใช้ได้' });
        }
    }
    /**
     * 3. GET /api/admin/storage/users/:userId
     * ดูรายละเอียดและรายการไฟล์ทั้งหมดของ User รายคน (พร้อมตรวจสถานะไฟล์จริงบนดิสก์)
     */
    static async getUserStorageDetail(req, res) {
        try {
            const { userId } = req.params;
            const user = await database_1.prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    username: true,
                    email: true,
                    role: true,
                    createdAt: true,
                    _count: {
                        select: { notes: true, boards: true },
                    },
                },
            });
            if (!user) {
                return res.status(404).json({ error: 'ไม่พบผู้ใช้งานที่ระบุ' });
            }
            // ดึงไฟล์แนบทั้งหมดที่ผูกกับ Notes ของผู้ใช้นี้
            const attachments = await database_1.prisma.fileAttachment.findMany({
                where: {
                    note: { userId: user.id },
                },
                include: {
                    note: {
                        select: {
                            id: true,
                            title: true,
                            isArchived: true,
                            createdAt: true,
                        },
                    },
                },
                orderBy: { size: 'desc' }, // เรียงจากขนาดใหญ่สุดไปเล็กสุด
            });
            let totalSizeBytes = 0;
            const categories = {
                image: { count: 0, sizeBytes: 0 },
                audio: { count: 0, sizeBytes: 0 },
                video: { count: 0, sizeBytes: 0 },
                document: { count: 0, sizeBytes: 0 },
                other: { count: 0, sizeBytes: 0 },
                unknown: { count: 0, sizeBytes: 0 },
            };
            const fileList = attachments.map((att) => {
                totalSizeBytes += att.size;
                const cat = getFileCategory(att.mimeType, att.filename);
                categories[cat].count += 1;
                categories[cat].sizeBytes += att.size;
                const filePath = path_1.default.join(UPLOADS_DIR, att.filename);
                const existsOnDisk = fs_1.default.existsSync(filePath);
                return {
                    id: att.id,
                    filename: att.filename,
                    originalName: att.originalName,
                    mimeType: att.mimeType,
                    category: cat,
                    sizeBytes: att.size,
                    sizeFormatted: formatBytes(att.size),
                    url: att.url,
                    createdAt: att.createdAt,
                    noteId: att.noteId,
                    noteTitle: att.note?.title || 'โน้ตไม่มีชื่อ',
                    isArchived: att.note?.isArchived || false,
                    status: att.note?.isArchived ? 'IN_TRASH' : 'ACTIVE',
                    existsOnDisk,
                };
            });
            return res.json({
                success: true,
                user: {
                    ...user,
                    totalFilesCount: attachments.length,
                    totalSizeBytes,
                    totalSizeFormatted: formatBytes(totalSizeBytes),
                    categories: {
                        image: { ...categories.image, sizeFormatted: formatBytes(categories.image.sizeBytes) },
                        audio: { ...categories.audio, sizeFormatted: formatBytes(categories.audio.sizeBytes) },
                        video: { ...categories.video, sizeFormatted: formatBytes(categories.video.sizeBytes) },
                        document: { ...categories.document, sizeFormatted: formatBytes(categories.document.sizeBytes) },
                        other: { ...categories.other, sizeFormatted: formatBytes(categories.other.sizeBytes) },
                        unknown: { ...categories.unknown, sizeFormatted: formatBytes(categories.unknown.sizeBytes) },
                    },
                },
                files: fileList,
            });
        }
        catch (error) {
            console.error('getUserStorageDetail error:', error);
            return res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลรายละเอียดไฟล์ของผู้ใช้ได้' });
        }
    }
    /**
     * 4. GET /api/admin/storage/orphaned
     * รายการไฟล์ที่ค้างอยู่บน Disk แต่ไม่มี Record ในฐานข้อมูล
     */
    static async getOrphanedFiles(req, res) {
        try {
            const diskScan = await StorageAnalyticsController.scanPhysicalDisk();
            return res.json({
                success: true,
                orphanedFiles: diskScan.orphanedFiles,
                orphanedTotalBytes: diskScan.orphanedTotalBytes,
                orphanedTotalFormatted: formatBytes(diskScan.orphanedTotalBytes),
                orphanedCount: diskScan.orphanedCount,
            });
        }
        catch (error) {
            console.error('getOrphanedFiles error:', error);
            return res.status(500).json({ error: 'ไม่สามารถดึงรายการไฟล์ตกค้างได้' });
        }
    }
}
exports.StorageAnalyticsController = StorageAnalyticsController;
