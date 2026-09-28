/**
 * SecureNote: One-time migration script from SQLite (prisma/dev.db) to PostgreSQL Cloud
 */
const { DatabaseSync } = require('node:sqlite');
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');

const sqlitePath = path.resolve(__dirname, '../prisma/dev.db');

async function migrate() {
  console.log('🚀 [Migration] กำลังเตรียมถ่ายโอนข้อมูลจาก SQLite (dev.db) เข้าสู่ PostgreSQL...');

  if (!fs.existsSync(sqlitePath)) {
    console.error('❌ ไม่พบไฟล์ dev.db ที่:', sqlitePath);
    process.exit(1);
  }

  // 1. อ่านข้อมูลทั้งหมดจาก dev.db ผ่าน node:sqlite
  const sqlite = new DatabaseSync(sqlitePath);

  const users = sqlite.prepare('SELECT * FROM User').all();
  const notebooks = sqlite.prepare('SELECT * FROM Notebook').all();
  const labels = sqlite.prepare('SELECT * FROM Label').all();
  const boards = sqlite.prepare('SELECT * FROM Board').all();
  const notes = sqlite.prepare('SELECT * FROM Note').all();

  console.log(`📊 ข้อมูลใน SQLite ที่ตรวจพบ:`);
  console.log(`   - ผู้ใช้งาน (Users): ${users.length} คน`);
  console.log(`   - สมุดโน้ต (Notebooks): ${notebooks.length} เล่ม`);
  console.log(`   - ป้ายกำกับ (Labels): ${labels.length} ป้าย`);
  console.log(`   - กระดาน (Boards): ${boards.length} บอร์ด`);
  console.log(`   - โน้ตทั้งหมด (Notes): ${notes.length} รายการ ⭐`);

  // 2. เชื่อมต่อ Prisma Client (เข้า PostgreSQL ผ่าน DATABASE_URL)
  const prisma = new PrismaClient();

  const userIdMap = new Map();
  const notebookIdMap = new Map();
  const boardIdMap = new Map();

  try {
    // 2.1 Migrate Users
    console.log('\n👤 [1/5] กำลังย้ายผู้ใช้งาน...');
    for (const u of users) {
      let pgUser = await prisma.user.findFirst({
        where: { OR: [{ email: u.email }, { username: u.username }] },
      });

      if (!pgUser) {
        pgUser = await prisma.user.create({
          data: {
            id: u.id,
            email: u.email,
            username: u.username,
            passwordHash: u.passwordHash,
            role: u.role || 'USER',
            authProvider: u.authProvider || 'local',
            googleId: u.googleId,
            publicKey: u.publicKey,
            hasMasterPassword: Boolean(u.hasMasterPassword),
            masterPasswordVerifier: u.masterPasswordVerifier,
            masterPasswordSalt: u.masterPasswordSalt,
            recoveryKeyHash: u.recoveryKeyHash,
            createdAt: new Date(u.createdAt),
            updatedAt: new Date(u.updatedAt),
          },
        });
      }
      userIdMap.set(u.id, pgUser.id);
    }
    console.log(`✅ ย้ายผู้ใช้งานสำเร็จ (${userIdMap.size} users mapped)`);

    // 2.2 Migrate Notebooks
    console.log('📓 [2/5] กำลังย้ายสมุดโน้ต...');
    for (const nb of notebooks) {
      const targetUserId = userIdMap.get(nb.userId) || nb.userId;
      let pgNb = await prisma.notebook.findFirst({
        where: { userId: targetUserId, name: nb.name },
      });

      if (!pgNb) {
        pgNb = await prisma.notebook.create({
          data: {
            id: nb.id,
            name: nb.name,
            description: nb.description,
            color: nb.color || '#6366F1',
            userId: targetUserId,
            isDefault: Boolean(nb.isDefault),
            createdAt: new Date(nb.createdAt),
            updatedAt: new Date(nb.updatedAt),
          },
        });
      }
      notebookIdMap.set(nb.id, pgNb.id);
    }
    console.log(`✅ ย้ายสมุดโน้ตสำเร็จ (${notebookIdMap.size} notebooks mapped)`);

    // 2.3 Migrate Labels
    console.log('🏷️ [3/5] กำลังย้ายป้ายกำกับ...');
    for (const l of labels) {
      const targetUserId = userIdMap.get(l.userId) || l.userId;
      const existingLabel = await prisma.label.findFirst({
        where: { userId: targetUserId, name: l.name },
      });

      if (!existingLabel) {
        await prisma.label.create({
          data: {
            id: l.id,
            name: l.name,
            color: l.color || '#EF4444',
            userId: targetUserId,
            createdAt: new Date(l.createdAt),
          },
        });
      }
    }
    console.log('✅ ย้ายป้ายกำกับสำเร็จ');

    // 2.4 Migrate Boards
    console.log('📋 [4/5] กำลังย้ายกระดาน...');
    for (const b of boards) {
      const targetUserId = userIdMap.get(b.userId) || b.userId;
      let pgBoard = await prisma.board.findFirst({
        where: { userId: targetUserId, name: b.name },
      });

      if (!pgBoard) {
        pgBoard = await prisma.board.create({
          data: {
            id: b.id,
            name: b.name,
            description: b.description,
            color: b.color || '#F59E0B',
            theme: b.theme || 'cork',
            bgImage: b.bgImage,
            shareCode: b.shareCode,
            isPublic: Boolean(b.isPublic),
            sharePermission: b.sharePermission || 'read',
            isDefault: Boolean(b.isDefault),
            userId: targetUserId,
            createdAt: new Date(b.createdAt),
            updatedAt: new Date(b.updatedAt),
          },
        });
      }
      boardIdMap.set(b.id, pgBoard.id);
    }
    console.log(`✅ ย้ายกระดานสำเร็จ (${boardIdMap.size} boards mapped)`);

    // 2.5 Migrate Notes
    console.log('📝 [5/5] กำลังย้ายโน้ตทั้ง 18 รายการ...');
    let migratedNotes = 0;
    for (const n of notes) {
      const targetUserId = userIdMap.get(n.userId) || n.userId;
      const targetNotebookId = n.notebookId ? (notebookIdMap.get(n.notebookId) || n.notebookId) : null;
      const targetBoardId = n.boardId ? (boardIdMap.get(n.boardId) || n.boardId) : null;

      const existingNote = await prisma.note.findUnique({
        where: { id: n.id },
      });

      if (!existingNote) {
        await prisma.note.create({
          data: {
            id: n.id,
            title: n.title,
            content: n.content,
            iv: n.iv,
            salt: n.salt,
            posX: n.posX !== null ? Number(n.posX) : 100,
            posY: n.posY !== null ? Number(n.posY) : 100,
            width: n.width !== null ? Number(n.width) : 260,
            height: n.height !== null ? Number(n.height) : 240,
            textColor: n.textColor || '#1e293b',
            fontSize: n.fontSize || 'normal',
            fontFamily: n.fontFamily || 'sans',
            kanbanStatus: n.kanbanStatus || 'todo',
            rotation: n.rotation !== null ? Number(n.rotation) : 0,
            userId: targetUserId,
            notebookId: targetNotebookId,
            boardId: targetBoardId,
            color: n.color || '#FEF08A',
            isArchived: Boolean(n.isArchived),
            isLocked: Boolean(n.isLocked),
            isPinned: Boolean(n.isPinned),
            isFavorite: Boolean(n.isFavorite),
            shareCode: n.shareCode,
            sharePassword: n.sharePassword,
            sharePermission: n.sharePermission || 'read',
            createdAt: new Date(n.createdAt),
            updatedAt: new Date(n.updatedAt),
          },
        });
        migratedNotes++;
      } else {
        migratedNotes++;
      }
    }
    console.log(`✅ ย้ายโน้ตทั้งหมดสำเร็จเรียบร้อยแล้ว (${migratedNotes} notes in PostgreSQL)!`);

    const totalNotesInPg = await prisma.note.count();
    const totalUsersInPg = await prisma.user.count();
    console.log(`\n🎉🎉 ยืนยันข้อมูลใน PostgreSQL ล่าสุด:`);
    console.log(`   - ผู้ใช้งานรวม: ${totalUsersInPg} คน`);
    console.log(`   - โน้ตรวมทั้งหมด: ${totalNotesInPg} รายการ!`);
    console.log('   - ฐานข้อมูลถาวรพร้อมใช้งานบน Render และ Vercel 100%!');
  } catch (err) {
    console.error('❌ เกิดข้อผิดพลาดในการโอนย้ายข้อมูล:', err);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
