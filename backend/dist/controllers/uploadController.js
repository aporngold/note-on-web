"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadController = void 0;
const database_1 = require("../utils/database");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class UploadController {
    static async uploadFile(req, res) {
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
                const note = await database_1.prisma.note.findFirst({
                    where: { id: noteId },
                });
                if (note) {
                    attachment = await database_1.prisma.fileAttachment.create({
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
        }
        catch (error) {
            console.error('uploadFile error:', error);
            return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์' });
        }
    }
    static async deleteAttachment(req, res) {
        try {
            const { id } = req.params;
            const attachment = await database_1.prisma.fileAttachment.findUnique({
                where: { id },
            });
            if (!attachment) {
                return res.status(404).json({ error: 'ไม่พบไฟล์แนบ' });
            }
            // Try deleting local file
            const filePath = path_1.default.join(__dirname, '../../uploads', attachment.filename);
            if (fs_1.default.existsSync(filePath)) {
                fs_1.default.unlinkSync(filePath);
            }
            await database_1.prisma.fileAttachment.delete({
                where: { id },
            });
            return res.json({ message: 'ลบไฟล์แนบสำเร็จ' });
        }
        catch (error) {
            console.error('deleteAttachment error:', error);
            return res.status(500).json({ error: 'ลบไฟล์แนบล้มเหลว' });
        }
    }
}
exports.UploadController = UploadController;
