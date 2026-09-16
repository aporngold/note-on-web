@echo off
chcp 65001 > nul
echo ========================================================
echo        🚀 กำลังเริ่มระบบ SecureNote Web Application
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/3] สำรองและตรวจสอบฐานข้อมูล SQLite อย่างปลอดภัย...
cd backend
call node scripts/backup.js
call node scripts/init-db.js
cd ..

echo.
echo [2/3] กำลังสตาร์ท Backend (Port 5000) และ Frontend (Port 3000)...
echo.
echo เข้าใช้งานได้ที่: http://localhost:3000
echo.

start "SecureNote Backend" cmd /k "cd backend && npm run dev"
timeout /t 2 > nul
start "SecureNote Frontend" cmd /k "cd frontend && npm run dev"

echo ระบบกำลังเปิดทำงานในเบื้องหลังเรียบร้อยแล้ว!
pause
