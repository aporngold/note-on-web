const { execSync } = require('child_process');
const path = require('path');

console.log('🔄 [SecureNote DB-Init] กำลังเตรียมและตรวจสอบฐานข้อมูล SQLite...');

const backendDir = path.join(__dirname, '..');

try {
  // 1. Generate Prisma Client
  console.log('📦 [1/3] กำลังสร้าง Prisma Client (prisma generate)...');
  execSync('npx prisma generate', { stdio: 'inherit', cwd: backendDir });

  // 2. ตรวจสอบและสร้าง/อัปเดตตารางฐานข้อมูล
  console.log('🔄 [2/3] กำลังตรวจสอบและรัน Migration (prisma migrate deploy)...');
  try {
    execSync('npx prisma migrate deploy', { stdio: 'inherit', cwd: backendDir });
    console.log('✅ ตรวจสอบและรัน Migration สำเร็จเรียบร้อย');
  } catch (migrateErr) {
    console.warn('⚠️ Migrate deploy ไม่สำเร็จ กำลังใช้มาตรการสำรอง (prisma db push)...');
    execSync('npx prisma db push', { stdio: 'inherit', cwd: backendDir });
    console.log('✅ ซิงค์โครงสร้างตารางด้วย db push สำเร็จเรียบร้อย');
  }

  console.log('🎉 [3/3] ตารางฐานข้อมูลทั้งหมดพร้อมใช้งานเรียบร้อยแล้ว!\n');
} catch (error) {
  console.error('❌ เกิดข้อผิดพลาดในการเตรียมฐานข้อมูล:', error.message);
  process.exit(1);
}
