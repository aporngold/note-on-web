"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LabelController = void 0;
const database_1 = require("../utils/database");
const zod_1 = require("zod");
const labelSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Label name is required').max(30),
    color: zod_1.z.string().optional().default('#EF4444'),
});
class LabelController {
    static async getLabels(req, res) {
        try {
            const userId = req.userId;
            const labels = await database_1.prisma.label.findMany({
                where: { userId },
                orderBy: { createdAt: 'asc' },
                include: {
                    _count: {
                        select: {
                            notes: true,
                        },
                    },
                },
            });
            return res.json(labels.map((l) => ({
                id: l.id,
                name: l.name,
                color: l.color,
                noteCount: l._count.notes,
            })));
        }
        catch (error) {
            return res.status(500).json({ error: 'Failed to retrieve labels' });
        }
    }
    static async createLabel(req, res) {
        try {
            const userId = req.userId;
            const parsed = labelSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ error: parsed.error.errors[0]?.message || 'Invalid label data' });
            }
            const { name, color } = parsed.data;
            // Check duplicate label name for this user
            const existing = await database_1.prisma.label.findFirst({
                where: { userId, name: name.trim() },
            });
            if (existing) {
                return res.status(409).json({ error: 'มีป้ายกำกับชื่อนี้อยู่แล้ว' });
            }
            const label = await database_1.prisma.label.create({
                data: {
                    name: name.trim(),
                    color: color || '#EF4444',
                    userId,
                },
            });
            return res.status(201).json({
                ...label,
                noteCount: 0,
            });
        }
        catch (error) {
            return res.status(500).json({ error: 'Failed to create label' });
        }
    }
    static async updateLabel(req, res) {
        try {
            const userId = req.userId;
            const { id } = req.params;
            const parsed = labelSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ error: parsed.error.errors[0]?.message || 'Invalid label data' });
            }
            const label = await database_1.prisma.label.findFirst({
                where: { id, userId },
            });
            if (!label) {
                return res.status(404).json({ error: 'Label not found' });
            }
            const updated = await database_1.prisma.label.update({
                where: { id },
                data: {
                    name: parsed.data.name.trim(),
                    color: parsed.data.color,
                },
            });
            return res.json(updated);
        }
        catch (error) {
            return res.status(500).json({ error: 'Failed to update label' });
        }
    }
    static async deleteLabel(req, res) {
        try {
            const userId = req.userId;
            const { id } = req.params;
            const label = await database_1.prisma.label.findFirst({
                where: { id, userId },
            });
            if (!label) {
                return res.status(404).json({ error: 'Label not found' });
            }
            await database_1.prisma.label.delete({ where: { id } });
            return res.json({ message: 'ลบป้ายกำกับสำเร็จ' });
        }
        catch (error) {
            return res.status(500).json({ error: 'Failed to delete label' });
        }
    }
}
exports.LabelController = LabelController;
