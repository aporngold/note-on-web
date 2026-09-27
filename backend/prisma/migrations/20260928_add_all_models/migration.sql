-- AlterTable User if columns not exist
ALTER TABLE "User" ADD COLUMN "role" TEXT DEFAULT 'USER';
ALTER TABLE "User" ADD COLUMN "authProvider" TEXT DEFAULT 'local';
ALTER TABLE "User" ADD COLUMN "googleId" TEXT;
ALTER TABLE "User" ADD COLUMN "publicKey" TEXT;
ALTER TABLE "User" ADD COLUMN "hasMasterPassword" BOOLEAN DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "masterPasswordVerifier" TEXT;
ALTER TABLE "User" ADD COLUMN "masterPasswordSalt" TEXT;
ALTER TABLE "User" ADD COLUMN "recoveryKeyHash" TEXT;

-- AlterTable Note
ALTER TABLE "Note" ADD COLUMN "posX" REAL DEFAULT 100;
ALTER TABLE "Note" ADD COLUMN "posY" REAL DEFAULT 100;
ALTER TABLE "Note" ADD COLUMN "width" REAL DEFAULT 260;
ALTER TABLE "Note" ADD COLUMN "height" REAL DEFAULT 240;
ALTER TABLE "Note" ADD COLUMN "textColor" TEXT DEFAULT '#1e293b';
ALTER TABLE "Note" ADD COLUMN "fontSize" TEXT DEFAULT 'normal';
ALTER TABLE "Note" ADD COLUMN "fontFamily" TEXT DEFAULT 'sans';
ALTER TABLE "Note" ADD COLUMN "kanbanStatus" TEXT DEFAULT 'todo';
ALTER TABLE "Note" ADD COLUMN "rotation" REAL DEFAULT 0;
ALTER TABLE "Note" ADD COLUMN "boardId" TEXT;

-- CreateTable Passkey
CREATE TABLE IF NOT EXISTS "Passkey" (
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
    CONSTRAINT "Passkey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable WebAuthnChallenge
CREATE TABLE IF NOT EXISTS "WebAuthnChallenge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "challenge" TEXT NOT NULL,
    "userId" TEXT,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable AuditLog
CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "adminId" TEXT,
    "action" TEXT NOT NULL,
    "target" TEXT,
    "details" TEXT,
    "ipAddress" TEXT,
    "result" TEXT NOT NULL DEFAULT 'SUCCESS',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable BackupRecord
CREATE TABLE IF NOT EXISTS "BackupRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "filename" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SUCCESS',
    "triggerBy" TEXT NOT NULL DEFAULT 'SYSTEM',
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable Reminder
CREATE TABLE IF NOT EXISTS "Reminder" (
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
    CONSTRAINT "Reminder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Reminder_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "Note" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable Notification
CREATE TABLE IF NOT EXISTS "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "noteId" TEXT,
    "reminderId" TEXT,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Notification_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "Note" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Notification_reminderId_fkey" FOREIGN KEY ("reminderId") REFERENCES "Reminder" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable PushSubscription
CREATE TABLE IF NOT EXISTS "PushSubscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "userAgent" TEXT,
    "deviceType" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" DATETIME,
    CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Passkey_credentialId_key" ON "Passkey"("credentialId");
CREATE UNIQUE INDEX IF NOT EXISTS "WebAuthnChallenge_challenge_key" ON "WebAuthnChallenge"("challenge");
CREATE UNIQUE INDEX IF NOT EXISTS "BackupRecord_filename_key" ON "BackupRecord"("filename");
CREATE INDEX IF NOT EXISTS "Reminder_userId_status_reminderDateTime_idx" ON "Reminder"("userId", "status", "reminderDateTime");
CREATE INDEX IF NOT EXISTS "Reminder_noteId_idx" ON "Reminder"("noteId");
CREATE INDEX IF NOT EXISTS "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");
CREATE INDEX IF NOT EXISTS "PushSubscription_userId_idx" ON "PushSubscription"("userId");
