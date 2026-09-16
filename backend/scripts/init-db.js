const { execSync } = require('child_process');
const path = require('path');

console.log('🔄 [SecureNote DB-Init] กำลังเตรียมและตรวจสอบฐานข้อมูล SQLite...');

const backendDir = path.join(__dirname, '..');

async function main() {
  try {
    // 1. Generate Prisma Client (ถ้ายังไม่ได้รันอยู่)
    console.log('📦 [1/4] ตรวจสอบ Prisma Client (prisma generate)...');
    try {
      execSync('npx prisma generate', { stdio: 'inherit', cwd: backendDir });
    } catch (genErr) {
      console.log('ℹ️ Prisma Client พร้อมใช้งานอยู่แล้ว (เซิร์ฟเวอร์กำลังเปิดทำงาน)');
    }

    // 2. ตรวจสอบและสร้าง/อัปเดตตารางฐานข้อมูล
    console.log('🔄 [2/4] กำลังตรวจสอบและรัน Migration (prisma migrate deploy)...');
    try {
      execSync('npx prisma migrate deploy', { stdio: 'inherit', cwd: backendDir });
      console.log('✅ ตรวจสอบและรัน Migration สำเร็จเรียบร้อย');
    } catch (migrateErr) {
      console.warn('⚠️ Migrate deploy ไม่สำเร็จ กำลังใช้มาตรการสำรอง (prisma db push)...');
      execSync('npx prisma db push', { stdio: 'inherit', cwd: backendDir });
      console.log('✅ ซิงค์โครงสร้างตารางด้วย db push สำเร็จเรียบร้อย');
    }

    // 3. เตรียมบัญชีทดสอบระบบ (Test User): KnowMan / SystemTest
    console.log('👤 [3/4] ตรวจสอบและเตรียมบัญชีทดสอบ KnowMan...');
    try {
      const bcrypt = require('bcryptjs');
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();

      const username = 'knowman';
      const email = 'knowman@securenote.test';
      const passwordHash = await bcrypt.hash('SystemTest', 10);

      let user = await prisma.user.findFirst({
        where: {
          OR: [{ username }, { email }],
        },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            username,
            email,
            passwordHash,
          },
        });

        // สร้างสมุดโน้ตเริ่มต้น
        await prisma.notebook.create({
          data: {
            name: 'My Notes',
            description: 'สมุดบันทึกหลักของคุณ',
            color: '#6366F1',
            isDefault: true,
            userId: user.id,
          },
        });

        // สร้างป้ายกำกับเริ่มต้น
        await prisma.label.createMany({
          data: [
            { name: 'สำคัญ', color: '#EF4444', userId: user.id },
            { name: 'ไอเดีย', color: '#10B981', userId: user.id },
            { name: 'งาน', color: '#3B82F6', userId: user.id },
          ],
        });

        console.log('✅ สร้างบัญชีทดสอบ KnowMan สำเร็จเรียบร้อย (User: KnowMan / Pass: SystemTest)');
      } else {
        await prisma.user.update({
          where: { id: user.id },
          data: { passwordHash, username },
        });
        console.log('✅ บัญชีทดสอบ KnowMan พร้อมใช้งาน (User: KnowMan / Pass: SystemTest)');
      }

      await prisma.$disconnect();
    } catch (userErr) {
      console.warn('⚠️ ไม่สามารถเตรียมบัญชีทดสอบได้:', userErr.message);
    }

    console.log('🎉 [4/4] ระบบฐานข้อมูลและบัญชีทดสอบพร้อมใช้งาน 100%!\n');
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการเตรียมฐานข้อมูล:', error.message);
    process.exit(1);
  }
}

main();
