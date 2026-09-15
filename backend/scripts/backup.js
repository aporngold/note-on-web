const fs = require('fs');
const path = require('path');

const PRISMA_DIR = path.join(__dirname, '../prisma');
const DB_PATH = path.join(PRISMA_DIR, 'dev.db');
const BACKUP_DIR = path.join(__dirname, '../backups');
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

function runBackup() {
  console.log('🔄 [SecureNote Backup] กำลังตรวจสอบฐานข้อมูล...');

  if (!fs.existsSync(DB_PATH)) {
    console.log('ℹ️  ไม่พบไฟล์ dev.db (อาจเป็นครั้งแรกที่เริ่มระบบ)');
    return;
  }

  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const stat = fs.statSync(DB_PATH);
  if (stat.size === 0) {
    console.warn('⚠️ ไฟล์ dev.db มีขนาด 0 ไบต์ ข้ามการสำรองข้อมูลเพื่อความปลอดภัย');
    return;
  }

  const timestamp = formatTimestamp(new Date());
  const backupFileName = `dev_backup_${timestamp}.db`;
  const backupFilePath = path.join(BACKUP_DIR, backupFileName);

  try {
    fs.copyFileSync(DB_PATH, backupFilePath);
    console.log(`✅ สำรองฐานข้อมูลสำเร็จ: ${backupFileName} (${(stat.size / 1024).toFixed(1)} KB)`);
    console.log(`📁 จัดเก็บที่: ${backupFilePath}`);

    // จัดการหมุนเวียนไฟล์สำรอง (เก็บสูงสุด 15 ไฟล์ล่าสุด)
    cleanOldBackups();
  } catch (err) {
    console.error('❌ เกิดข้อผิดพลาดในการสำรองฐานข้อมูล:', err.message);
  }
}

function cleanOldBackups() {
  try {
    const files = fs
      .readdirSync(BACKUP_DIR)
      .filter((file) => file.startsWith('dev_backup_') && file.endsWith('.db'))
      .map((file) => {
        const filePath = path.join(BACKUP_DIR, file);
        return {
          name: file,
          path: filePath,
          time: fs.statSync(filePath).mtime.getTime(),
        };
      })
      .sort((a, b) => b.time - a.time);

    if (files.length > MAX_BACKUPS) {
      const filesToDelete = files.slice(MAX_BACKUPS);
      for (const f of filesToDelete) {
        fs.unlinkSync(f.path);
        console.log(`🧹 ล้างไฟล์สำรองเก่า: ${f.name}`);
      }
    }
  } catch (err) {
    console.warn('⚠️ ไม่สามารถจัดระเบียบไฟล์สำรองเก่าได้:', err.message);
  }
}

runBackup();
