import { execSync } from 'child_process';
import path from 'path';
import { prisma } from './database';

export async function ensureDatabaseSchema(): Promise<void> {
  const isPostgres = process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres');
  console.log(`🔄 [DB-Sync] Checking ${isPostgres ? 'PostgreSQL' : 'SQLite'} database schema synchronization...`);

  // Method 1: Prisma db push (Native schema synchronization for PostgreSQL & SQLite)
  try {
    const backendDir = path.resolve(__dirname, '../../');
    console.log(`📦 [DB-Sync] Running npx prisma db push --skip-generate from ${backendDir}...`);
    execSync('npx prisma db push --skip-generate', {
      cwd: backendDir,
      stdio: 'pipe',
      timeout: 30000,
      env: { ...process.env },
    });
    console.log('✅ [DB-Sync] prisma db push completed successfully.');
  } catch (pushErr: any) {
    console.warn('⚠️ [DB-Sync] prisma db push skipped or failed:', pushErr?.message || pushErr);
  }

  // If PostgreSQL, Prisma db push handles all columns/tables natively, so skip SQLite PRAGMAs
  if (isPostgres) {
    console.log('🐘 [DB-Sync] PostgreSQL schema managed by Prisma. Proceeding to role synchronization...');
    await syncAdminRoles();
    return;
  }

  // Method 2: Direct SQLite Self-Healing (For local SQLite development)
  try {
    console.log('🛡️ [DB-Sync] Verifying table columns directly in SQLite...');

    // 1. Check User table columns
    const userColumns = await prisma.$queryRawUnsafe<Array<{ name: string }>>('PRAGMA table_info("User");');
    const existingUserCols = new Set(userColumns.map((c) => c.name));

    const userColumnDefs: Array<{ name: string; sql: string }> = [
      { name: 'role', sql: 'ALTER TABLE "User" ADD COLUMN "role" TEXT DEFAULT \'USER\';' },
      { name: 'authProvider', sql: 'ALTER TABLE "User" ADD COLUMN "authProvider" TEXT DEFAULT \'local\';' },
      { name: 'googleId', sql: 'ALTER TABLE "User" ADD COLUMN "googleId" TEXT;' },
      { name: 'publicKey', sql: 'ALTER TABLE "User" ADD COLUMN "publicKey" TEXT;' },
      { name: 'hasMasterPassword', sql: 'ALTER TABLE "User" ADD COLUMN "hasMasterPassword" BOOLEAN DEFAULT 0;' },
      { name: 'masterPasswordVerifier', sql: 'ALTER TABLE "User" ADD COLUMN "masterPasswordVerifier" TEXT;' },
      { name: 'masterPasswordSalt', sql: 'ALTER TABLE "User" ADD COLUMN "masterPasswordSalt" TEXT;' },
      { name: 'recoveryKeyHash', sql: 'ALTER TABLE "User" ADD COLUMN "recoveryKeyHash" TEXT;' },
    ];

    for (const col of userColumnDefs) {
      if (!existingUserCols.has(col.name)) {
        try {
          await prisma.$executeRawUnsafe(col.sql);
          console.log(`✅ [DB-Sync] Added missing column User.${col.name}`);
        } catch (colErr: any) {
          console.warn(`⚠️ [DB-Sync] Could not add User.${col.name}:`, colErr.message);
        }
      }
    }

    // 2. Check Note table columns
    const noteColumns = await prisma.$queryRawUnsafe<Array<{ name: string }>>('PRAGMA table_info("Note");');
    const existingNoteCols = new Set(noteColumns.map((c) => c.name));

    const noteColumnDefs: Array<{ name: string; sql: string }> = [
      { name: 'posX', sql: 'ALTER TABLE "Note" ADD COLUMN "posX" REAL DEFAULT 100;' },
      { name: 'posY', sql: 'ALTER TABLE "Note" ADD COLUMN "posY" REAL DEFAULT 100;' },
      { name: 'width', sql: 'ALTER TABLE "Note" ADD COLUMN "width" REAL DEFAULT 260;' },
      { name: 'height', sql: 'ALTER TABLE "Note" ADD COLUMN "height" REAL DEFAULT 240;' },
      { name: 'textColor', sql: 'ALTER TABLE "Note" ADD COLUMN "textColor" TEXT DEFAULT \'#1e293b\';' },
      { name: 'fontSize', sql: 'ALTER TABLE "Note" ADD COLUMN "fontSize" TEXT DEFAULT \'normal\';' },
      { name: 'fontFamily', sql: 'ALTER TABLE "Note" ADD COLUMN "fontFamily" TEXT DEFAULT \'sans\';' },
      { name: 'kanbanStatus', sql: 'ALTER TABLE "Note" ADD COLUMN "kanbanStatus" TEXT DEFAULT \'todo\';' },
      { name: 'rotation', sql: 'ALTER TABLE "Note" ADD COLUMN "rotation" REAL DEFAULT 0;' },
      { name: 'boardId', sql: 'ALTER TABLE "Note" ADD COLUMN "boardId" TEXT;' },
    ];

    for (const col of noteColumnDefs) {
      if (!existingNoteCols.has(col.name)) {
        try {
          await prisma.$executeRawUnsafe(col.sql);
          console.log(`✅ [DB-Sync] Added missing column Note.${col.name}`);
        } catch (colErr: any) {
          console.warn(`⚠️ [DB-Sync] Could not add Note.${col.name}:`, colErr.message);
        }
      }
    }

    // 3. Ensure tables exist (Passkey, WebAuthnChallenge, AuditLog, BackupRecord, Reminder, Notification, PushSubscription)
    const tables = await prisma.$queryRawUnsafe<Array<{ name: string }>>('SELECT name FROM sqlite_master WHERE type=\'table\';');
    const existingTables = new Set(tables.map((t) => t.name));

    const tableCreationQueries: Array<{ name: string; sql: string }> = [
      {
        name: 'Passkey',
        sql: `CREATE TABLE IF NOT EXISTS "Passkey" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "userId" TEXT NOT NULL,
          "credentialId" TEXT NOT NULL,
          "publicKey" TEXT NOT NULL,
          "counter" BIGINT NOT NULL DEFAULT 0,
          "deviceType" TEXT,
          "backedUp" BOOLEAN NOT NULL DEFAULT 0,
          "transports" TEXT,
          "name" TEXT,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "lastUsedAt" DATETIME,
          FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
        ); CREATE UNIQUE INDEX IF NOT EXISTS "Passkey_credentialId_key" ON "Passkey"("credentialId");`,
      },
      {
        name: 'WebAuthnChallenge',
        sql: `CREATE TABLE IF NOT EXISTS "WebAuthnChallenge" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "challenge" TEXT NOT NULL,
          "userId" TEXT,
          "expiresAt" DATETIME NOT NULL,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ); CREATE UNIQUE INDEX IF NOT EXISTS "WebAuthnChallenge_challenge_key" ON "WebAuthnChallenge"("challenge");`,
      },
      {
        name: 'AuditLog',
        sql: `CREATE TABLE IF NOT EXISTS "AuditLog" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "adminId" TEXT,
          "action" TEXT NOT NULL,
          "target" TEXT,
          "details" TEXT,
          "ipAddress" TEXT,
          "result" TEXT NOT NULL DEFAULT 'SUCCESS',
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("adminId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
        );`,
      },
      {
        name: 'BackupRecord',
        sql: `CREATE TABLE IF NOT EXISTS "BackupRecord" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "filename" TEXT NOT NULL,
          "size" INTEGER NOT NULL,
          "status" TEXT NOT NULL DEFAULT 'SUCCESS',
          "triggerBy" TEXT NOT NULL DEFAULT 'SYSTEM',
          "note" TEXT,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ); CREATE UNIQUE INDEX IF NOT EXISTS "BackupRecord_filename_key" ON "BackupRecord"("filename");`,
      },
      {
        name: 'Reminder',
        sql: `CREATE TABLE IF NOT EXISTS "Reminder" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "userId" TEXT NOT NULL,
          "noteId" TEXT NOT NULL,
          "title" TEXT,
          "reminderDateTime" DATETIME NOT NULL,
          "timezone" TEXT NOT NULL DEFAULT 'Asia/Bangkok',
          "repeatRule" TEXT NOT NULL DEFAULT 'none',
          "status" TEXT NOT NULL DEFAULT 'scheduled',
          "sentAt" DATETIME,
          "cancelledAt" DATETIME,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
          FOREIGN KEY ("noteId") REFERENCES "Note" ("id") ON DELETE CASCADE ON UPDATE CASCADE
        );`,
      },
      {
        name: 'Notification',
        sql: `CREATE TABLE IF NOT EXISTS "Notification" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "userId" TEXT NOT NULL,
          "noteId" TEXT,
          "reminderId" TEXT,
          "title" TEXT NOT NULL,
          "message" TEXT NOT NULL,
          "isRead" BOOLEAN NOT NULL DEFAULT 0,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
          FOREIGN KEY ("noteId") REFERENCES "Note" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
          FOREIGN KEY ("reminderId") REFERENCES "Reminder" ("id") ON DELETE SET NULL ON UPDATE CASCADE
        );`,
      },
      {
        name: 'PushSubscription',
        sql: `CREATE TABLE IF NOT EXISTS "PushSubscription" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "userId" TEXT NOT NULL,
          "endpoint" TEXT NOT NULL,
          "p256dh" TEXT NOT NULL,
          "auth" TEXT NOT NULL,
          "userAgent" TEXT,
          "deviceType" TEXT,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "lastUsedAt" DATETIME,
          FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
        ); CREATE UNIQUE INDEX IF NOT EXISTS "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");`,
      },
      {
        name: 'PasswordResetToken',
        sql: `CREATE TABLE IF NOT EXISTS "PasswordResetToken" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "userId" TEXT NOT NULL,
          "tokenHash" TEXT NOT NULL,
          "expiresAt" DATETIME NOT NULL,
          "usedAt" DATETIME,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
        ); CREATE UNIQUE INDEX IF NOT EXISTS "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");
        CREATE INDEX IF NOT EXISTS "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");`,
      },
    ];

    for (const table of tableCreationQueries) {
      if (!existingTables.has(table.name)) {
        try {
          await prisma.$executeRawUnsafe(table.sql);
          console.log(`✅ [DB-Sync] Created missing table: ${table.name}`);
        } catch (tErr: any) {
          console.warn(`⚠️ [DB-Sync] Could not create table ${table.name}:`, tErr.message);
        }
      }
    }

    // 4. Synchronize Admin Roles safely (Zero Ghost Recreation)
    await syncAdminRoles();

    console.log('🎉 [DB-Sync] SQLite schema verified and ready.');
  } catch (err: any) {
    console.error('❌ [DB-Sync] Schema verification encountered an error:', err.message);
  }
}

/**
 * Synchronize Admin and Super Admin roles safely across databases
 */
async function syncAdminRoles(): Promise<void> {
  try {
    // 1. Owner Root Super Admin (heros5510@gmail.com)
    const ownerEmail = (process.env.INITIAL_SUPER_ADMIN || 'heros5510@gmail.com').toLowerCase().trim();
    const ownerUser = await prisma.user.findUnique({ where: { email: ownerEmail } });
    if (ownerUser && ownerUser.role !== 'SUPER_ADMIN') {
      await prisma.user.update({
        where: { id: ownerUser.id },
        data: { role: 'SUPER_ADMIN' },
      });
      console.log(`👑 [DB-Sync] Guaranteed SUPER_ADMIN role for system owner: ${ownerEmail}`);
    }

    // 2. Standard Admin (aporngold@gmail.com)
    const adminEmail = 'aporngold@gmail.com';
    const adminUser = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (adminUser && adminUser.role !== 'ADMIN' && adminUser.role !== 'SUPER_ADMIN') {
      await prisma.user.update({
        where: { id: adminUser.id },
        data: { role: 'ADMIN' },
      });
      console.log(`🛡️ [DB-Sync] Guaranteed ADMIN role for: ${adminEmail}`);
    }

    // 3. Staging / Dev Test User (knowman@securenote.test)
    const testAdminEmail = 'knowman@securenote.test';
    const testAdminUser = await prisma.user.findUnique({ where: { email: testAdminEmail } });
    if (testAdminUser && testAdminUser.role !== 'SUPER_ADMIN') {
      await prisma.user.update({
        where: { id: testAdminUser.id },
        data: { role: 'SUPER_ADMIN' },
      });
      console.log(`🧪 [DB-Sync] Synchronized SUPER_ADMIN role for existing test user: ${testAdminEmail}`);
    }
  } catch (roleErr: any) {
    console.warn('⚠️ [DB-Sync] Admin role synchronization notice:', roleErr.message);
  }
}
