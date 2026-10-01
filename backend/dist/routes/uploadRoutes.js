"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const uploadController_1 = require("../controllers/uploadController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path_1.default.join(__dirname, '../../uploads'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${crypto_1.default.randomBytes(6).toString('hex')}`;
        const ext = path_1.default.extname(file.originalname);
        cb(null, `${uniqueSuffix}${ext}`);
    },
});
const ALLOWED_MIME_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
    'text/plain',
    'text/markdown',
    'text/csv',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'audio/webm',
    'audio/mp4',
]);
const DANGEROUS_EXTENSIONS = new Set([
    '.exe', '.bat', '.cmd', '.sh', '.php', '.pl', '.py', '.js', '.vbs', '.msi', '.scr', '.html', '.htm'
]);
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 25 * 1024 * 1024, // 25MB max file size
    },
    fileFilter: (req, file, cb) => {
        const ext = path_1.default.extname(file.originalname).toLowerCase();
        if (DANGEROUS_EXTENSIONS.has(ext)) {
            return cb(new Error('ประเภทไฟล์นี้ไม่อนุญาตให้อัปโหลดเนื่องจากเหตุผลด้านความปลอดภัย'));
        }
        if (!ALLOWED_MIME_TYPES.has(file.mimetype) && !file.mimetype.startsWith('image/') && !file.mimetype.startsWith('audio/')) {
            return cb(new Error('ชนิดไฟล์ไม่ได้รับการรองรับ (Supported files: images, audio, pdf, txt, docs)'));
        }
        cb(null, true);
    },
});
router.use(auth_1.authenticate);
router.post('/', upload.single('file'), uploadController_1.UploadController.uploadFile);
router.delete('/attachment/:id', uploadController_1.UploadController.deleteAttachment);
exports.default = router;
