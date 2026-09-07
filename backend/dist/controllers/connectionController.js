"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectionController = void 0;
const database_1 = require("../utils/database");
const zod_1 = require("zod");
const createConnectionSchema = zod_1.z.object({
    sourceId: zod_1.z.string().min(1),
    targetId: zod_1.z.string().min(1),
    boardId: zod_1.z.string().min(1),
    label: zod_1.z.string().optional().nullable(),
    color: zod_1.z.string().optional().default('#6366f1'),
    arrowType: zod_1.z.string().optional().default('arrow'),
});
class ConnectionController {
    static async getConnections(req, res) {
        try {
            const { boardId } = req.query;
            if (!boardId) {
                return res.status(400).json({ error: 'boardId is required' });
            }
            const connections = await database_1.prisma.noteConnection.findMany({
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
        }
        catch (error) {
            console.error('getConnections error:', error);
            return res.status(500).json({ error: 'Failed to retrieve connections' });
        }
    }
    static async createConnection(req, res) {
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
            const existing = await database_1.prisma.noteConnection.findFirst({
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
            const connection = await database_1.prisma.noteConnection.create({
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
        }
        catch (error) {
            console.error('createConnection error:', error);
            return res.status(500).json({ error: 'Failed to create connection' });
        }
    }
    static async deleteConnection(req, res) {
        try {
            const { id } = req.params;
            await database_1.prisma.noteConnection.delete({
                where: { id },
            });
            return res.json({ message: 'ลบการเชื่อมต่อเรียบร้อยแล้ว' });
        }
        catch (error) {
            console.error('deleteConnection error:', error);
            return res.status(500).json({ error: 'Failed to delete connection' });
        }
    }
}
exports.ConnectionController = ConnectionController;
