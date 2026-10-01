"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrivacyController = void 0;
const database_1 = require("../utils/database");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
class PrivacyController {
    /**
     * 1. Get current user's consent records
     */
    static async getConsents(req, res) {
        try {
            const userId = req.userId;
            const consents = await database_1.prisma.userConsent.findMany({
                where: { userId },
                orderBy: { updatedAt: 'desc' },
            });
            return res.json({
                success: true,
                consents,
            });
        }
        catch (error) {
            console.error('getConsents error:', error);
            return res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลความยินยอมได้' });
        }
    }
    /**
     * 2. Record or update a user consent (Grant or Revoke)
     */
    static async updateConsent(req, res) {
        try {
            const userId = req.userId;
            const { consentType, isGranted, version = '2569.1' } = req.body;
            if (!consentType) {
                return res.status(400).json({ error: 'กรุณาระบุประเภทความยินยอม (consentType)' });
            }
            const ipAddress = req.headers['x-forwarded-for'] || req.ip || req.socket.remoteAddress || null;
            const userAgent = req.headers['user-agent'] || null;
            // Upsert consent record
            const existing = await database_1.prisma.userConsent.findFirst({
                where: { userId, consentType },
            });
            let consent;
            if (existing) {
                consent = await database_1.prisma.userConsent.update({
                    where: { id: existing.id },
                    data: {
                        isGranted: Boolean(isGranted),
                        version,
                        ipAddress,
                        userAgent,
                        grantedAt: isGranted ? new Date() : existing.grantedAt,
                        revokedAt: !isGranted ? new Date() : null,
                    },
                });
            }
            else {
                consent = await database_1.prisma.userConsent.create({
                    data: {
                        userId,
                        consentType,
                        version,
                        isGranted: Boolean(isGranted),
                        ipAddress,
                        userAgent,
                        grantedAt: isGranted ? new Date() : null,
                        revokedAt: !isGranted ? new Date() : null,
                    },
                });
            }
            return res.json({
                success: true,
                message: isGranted ? 'บันทึกความยินยอมเรียบร้อย' : 'บันทึกการถอนความยินยอมเรียบร้อย',
                consent,
            });
        }
        catch (error) {
            console.error('updateConsent error:', error);
            return res.status(500).json({ error: 'ไม่สามารถอัปเดตความยินยอมได้' });
        }
    }
    /**
     * 3. Export all user data (PDPA Section 31 - Right to Data Portability)
     */
    static async exportUserData(req, res) {
        try {
            const userId = req.userId;
            const user = await database_1.prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    username: true,
                    email: true,
                    role: true,
                    authProvider: true,
                    createdAt: true,
                    updatedAt: true,
                    hasMasterPassword: true,
                },
            });
            if (!user) {
                return res.status(404).json({ error: 'ไม่พบข้อมูลผู้ใช้งาน' });
            }
            // Fetch all notes (including tags, attachments metadata, versions)
            const notes = await database_1.prisma.note.findMany({
                where: { userId },
                include: {
                    labels: {
                        include: { label: true },
                    },
                    attachments: {
                        select: {
                            id: true,
                            filename: true,
                            originalName: true,
                            mimeType: true,
                            size: true,
                            url: true,
                            createdAt: true,
                        },
                    },
                    notebook: {
                        select: { id: true, name: true, color: true },
                    },
                },
            });
            // Fetch boards
            const boards = await database_1.prisma.board.findMany({
                where: { userId },
                include: {
                    connections: true,
                },
            });
            // Fetch notebooks
            const notebooks = await database_1.prisma.notebook.findMany({
                where: { userId },
            });
            // Fetch labels
            const labels = await database_1.prisma.label.findMany({
                where: { userId },
            });
            // Fetch notifications
            const notifications = await database_1.prisma.notification.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: 100,
            });
            // Fetch consents
            const consents = await database_1.prisma.userConsent.findMany({
                where: { userId },
            });
            const exportPackage = {
                meta: {
                    appName: 'Note on Web',
                    exportDate: new Date().toISOString(),
                    compliance: 'PDPA B.E. 2562 (Section 31 - Data Portability)',
                    version: '2569.1',
                },
                profile: user,
                summary: {
                    totalNotes: notes.length,
                    totalBoards: boards.length,
                    totalNotebooks: notebooks.length,
                    totalLabels: labels.length,
                },
                notes,
                boards,
                notebooks,
                labels,
                notifications,
                consents,
            };
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename="note-on-web-data-export-${user.username}-${Date.now()}.json"`);
            return res.status(200).send(JSON.stringify(exportPackage, null, 2));
        }
        catch (error) {
            console.error('exportUserData error:', error);
            return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการส่งออกข้อมูลส่วนบุคคล' });
        }
    }
    /**
     * 4. Submit Data Subject Request (PDPA Sections 30-36)
     */
    static async submitRequest(req, res) {
        try {
            const userId = req.userId;
            const { requestType, details } = req.body;
            const validTypes = [
                'ACCESS',
                'DATA_PORTABILITY',
                'ERASURE',
                'RECTIFICATION',
                'RESTRICTION',
                'OBJECTION',
                'WITHDRAW_CONSENT',
            ];
            if (!requestType || !validTypes.includes(requestType)) {
                return res.status(400).json({
                    error: `ประเภทคำร้องไม่ถูกต้อง (Supported: ${validTypes.join(', ')})`,
                });
            }
            const request = await database_1.prisma.dataSubjectRequest.create({
                data: {
                    userId,
                    requestType,
                    details: details ? String(details).trim() : null,
                    status: 'PENDING',
                },
            });
            return res.status(201).json({
                success: true,
                message: 'ส่งคำขอใช้สิทธิเรียบร้อย เจ้าหน้าที่จะดำเนินการภายใน 30 วันตามกฎหมาย',
                request,
            });
        }
        catch (error) {
            console.error('submitRequest error:', error);
            return res.status(500).json({ error: 'ไม่สามารถบันทึกคำร้องขอได้' });
        }
    }
    /**
     * 5. Get user's Data Subject Requests
     */
    static async getUserRequests(req, res) {
        try {
            const userId = req.userId;
            const requests = await database_1.prisma.dataSubjectRequest.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
            });
            return res.json({
                success: true,
                requests,
            });
        }
        catch (error) {
            console.error('getUserRequests error:', error);
            return res.status(500).json({ error: 'ไม่สามารถดึงรายการคำขอได้' });
        }
    }
    /**
     * 6. Self-service Account Deletion (PDPA Section 33 - Right to Erasure)
     */
    static async deleteAccount(req, res) {
        try {
            const userId = req.userId;
            const { password, confirmText } = req.body;
            if (confirmText !== 'DELETE') {
                return res.status(400).json({
                    error: 'กรุณากรอกคำว่า DELETE เพื่อยืนยันการลบบัญชีอย่างถาวร',
                });
            }
            const user = await database_1.prisma.user.findUnique({
                where: { id: userId },
            });
            if (!user) {
                return res.status(404).json({ error: 'ไม่พบบัญชีผู้ใช้นี้' });
            }
            // If user has local password, require confirmation
            if (user.passwordHash) {
                if (!password) {
                    return res.status(400).json({ error: 'กรุณากรอกรหัสผ่านปัจจุบันเพื่อยืนยันตัวตน' });
                }
                const isMatch = await bcryptjs_1.default.compare(password, user.passwordHash);
                if (!isMatch) {
                    return res.status(401).json({ error: 'รหัสผ่านไม่ถูกต้อง ไม่สามารถลบบัญชีได้' });
                }
            }
            // Cascade Delete User: Prisma relation `onDelete: Cascade` cleans up:
            // notes, boards, notebooks, labels, sessions, reminders, notifications, pushSubscriptions, consents, requests
            await database_1.prisma.user.delete({
                where: { id: userId },
            });
            return res.json({
                success: true,
                message: 'บัญชีและข้อมูลทั้งหมดของคุณถูกลบออกจากระบบอย่างถาวรแล้ว',
            });
        }
        catch (error) {
            console.error('deleteAccount error:', error);
            return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการลบบัญชีผู้ใช้' });
        }
    }
}
exports.PrivacyController = PrivacyController;
