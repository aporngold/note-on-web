const fs = require('fs');
const path = require('path');

const PRISMA_DIR = path.join(__dirname, '../prisma');
const DB_PATH = path.join(PRISMA_DIR, 'dev.db');
const BACKUP_DIR = path.join(__dirname, '../backups');

function runRestore() {
  console.log('🔄 [SecureNote Restore] เริ่มกระบวนการกู้คืนฐานข้อมูล...');

  if (!fs.existsSync(BACKUP_DIR)) {
    console.error('❌ ไม่พบโฟลเดอร์สำรองข้อมูล (backend/backups)');
    process.exit(1);
  }

  const backupFiles = fs
    .readdirSync(BACKUP_DIR)
    .filter((file) => file.endsWith('.db'))
    .map((file) => {
      const filePath = path.join(BACKUP_DIR, file);
      const stat = fs.statSync(filePath);
      return {
        name: file,
        path: filePath,
        size: stat.size,
        mtime: stat.mtime,
      };
    })
    .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

  if (backupFiles.length === 0) {
    console.error('❌ ไม่พบไฟล์สำรอง (.db) ในโฟลเดอร์ backups');
    process.exit(1);
  }

  // ดูว่าผู้ใช้ส่งชื่อไฟล์มาเป็น argument หรือไม่ (เช่น node restore.js <filename>)
  const targetArg = process.argv[2];
  let targetBackup = null;

  if (targetArg) {
    targetBackup = backupFiles.find((f) => f.name === targetArg || f.name.includes(targetArg));
    if (!targetBackup) {
      console.error(`❌ ไม่พบไฟล์สำรองที่ตรงกับคำค้นหา: "${targetArg}"`);
      console.log('\n📋 รายการไฟล์สำรองที่มีอยู่ทั้งหมด:');
      backupFiles.forEach((f, idx) => {
        console.log(`  [${idx + 1}] ${f.name} (${(f.size / 1024).toFixed(1)} KB) - ${f.mtime.toLocaleString('th-TH')}`);
      });
      process.exit(1);
    }
  } else {
    // ถ้าไม่ระบุ ให้เลือกไฟล์ล่าสุด
    targetBackup = backupFiles[0];
  }

  console.log(`\n📦 เลือกไฟล์สำรอง: ${targetBackup.name}`);
  console.log(`🕒 บันทึกเมื่อ: ${targetBackup.mtime.toLocaleString('th-TH')}`);
  console.log(`📊 ขนาดไฟล์: ${(targetBackup.size / 1024).toFixed(1)} KB`);

  // ด่านความปลอดภัย: สำรอง dev.db ปัจจุบันไว้ก่อนกู้คืน (Pre-restore Safety Backup)
  if (fs.existsSync(DB_PATH)) {
    const safetyName = `pre_restore_safety_${Date.now()}.db`;
    const safetyPath = path.join(BACKUP_DIR, safetyName);
    fs.copyFileSync(DB_PATH, safetyPath);
    console.log(`🛡️  สร้าง Safety Backup ของฐานข้อมูลปัจจุบันไว้ที่: ${safetyName}`);
  }

  // ทำการกู้คืน
  try {
    fs.copyFileSync(targetBackup.path, DB_PATH);
    const restoredStat = fs.statSync(DB_PATH);
    console.log(`\n✅ กู้คืนฐานข้อมูลสำเร็จเรียบร้อย!`);
    console.log(`📍 ฐานข้อมูล dev.db ปัจจุบันขนาด: ${(restoredStat.size / 1024).toFixed(1)} KB`);
    console.log(`💡 คุณสามารถเริ่มเซิร์ฟเวอร์ด้วย npm run dev หรือ start.bat ได้ทันทีครับ`);
  } catch (err) {
    console.error('❌ เกิดข้อผิดพลาดในการกู้คืนฐานข้อมูล:', err.message);
    process.exit(1);
  }
}

runRestore();
