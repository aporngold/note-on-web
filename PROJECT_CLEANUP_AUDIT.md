# PROJECT_CLEANUP_AUDIT.md — รายงานการตรวจสอบและแผนทำความสะอาดโปรเจกต์ Note on Web

> **วันที่ทำการตรวจสอบ:** 4 ตุลาคม 2569  
> **สถานะ:** รอดำเนินการ (รอการตรวจสอบและอนุมัติจากผู้ใช้ — **ยังไม่มีการลบไฟล์ใดๆ ในขั้นตอนนี้**)  
> **เป้าหมาย:** ลบไฟล์ตกค้าง ขยะทดสอบ สคริปต์ และสิ่งที่ไม่เกี่ยวข้อง เพื่อให้โปรเจกต์สะอาด เป็นระเบียบ พร้อมสำหรับ Production โดยไม่กระทบต่อฟังก์ชันการทำงานใดๆ ของ Note on Web

---

## 1. Project Overview (ภาพรวมของโปรเจกต์)

โปรเจกต์ **Note on Web** (SecureNote) เป็น Full-stack Web Application แบบ Monorepo:
- **Frontend:** Next.js 14 (Pages Router), React 18, TypeScript, Tailwind CSS, TipTap Editor, Zustand, TanStack Query, React Three Fiber (GridBloom 3D Shader)
  - Production Deployment: Vercel (`https://note-on-web.vercel.app`)
- **Backend:** Node.js, Express, TypeScript, Prisma ORM, Socket.IO (Real-time Collaboration), Web Push Notifications, SimpleWebAuthn (Passkeys)
  - Production Deployment: Render (`https://note-on-web.onrender.com`)
- **Database:** Neon Serverless PostgreSQL Cloud (`neondb` ประจำ AWS Region ap-southeast-1)
- **สถานะปัจจุบัน:** ระบบเสถียร ทุกฟีเจอร์หลัก (Auth, Password Reset, Notes, StickyBoard, Kanban, Realtime, Uploads, WebPush, E2EE, Passkeys, Admin) พร้อมใช้งาน

---

## 2. Files Safe to Delete (กลุ่ม A — ลบได้อย่างปลอดภัย 100%)

รายการไฟล์และโฟลเดอร์ด้านล่างนี้ ได้รับการตรวจสอบ Reference, Code Import, Build Config และ Package Scripts แล้วว่า **ไม่มีการเรียกใช้งานในระบบปัจจุบัน** เป็นไฟล์ทดลอง วิดีโอบันทึกหน้าจอ หรือไฟล์ขยะตกค้าง สามารถลบออกได้ทันทีโดยไม่กระทบต่อระบบ:

| ลำดับ | File / Folder Path | ขนาด | เหตุผล | ผลการตรวจสอบ Reference | ความเสี่ยง |
| :---: | :--- | :---: | :--- | :--- | :---: |
| 1 | `2.mp4` (Root) | 10.1 MB | วิดีโอบันทึกหน้าจอทดสอบระบบที่วางไว้ใน Root | ไม่มีไฟล์ใด import / อยู่ใน `.gitignore` | **ไม่มี (Zero Risk)** |
| 2 | `3.mp4` (Root) | 16.7 MB | วิดีโอบันทึกหน้าจอทดสอบระบบที่วางไว้ใน Root | ไม่มีไฟล์ใด import / อยู่ใน `.gitignore` | **ไม่มี (Zero Risk)** |
| 3 | `frontend/public/1.mp4` | 15.5 MB | วิดีโอบันทึกหน้าจอทดสอบที่วางไว้ใน public | ไม่มี component ใดเรียกใช้ / อยู่ใน `.gitignore` | **ไม่มี (Zero Risk)** |
| 4 | `NoteALL.png` (Root) | 198 KB | ไฟล์รูปภาพซ้ำซ้อน วางทับไว้ที่ Root | ซ้ำกับ `frontend/public/NoteALL.png` ที่ระบบใช้งานจริง | **ไม่มี (Zero Risk)** |
| 5 | `NoteAll.ico` (Root) | 134 KB | ไฟล์ไอคอนซ้ำซ้อน วางทับไว้ที่ Root | ซ้ำกับ `frontend/public/NoteAll.ico` ที่ระบบใช้งานจริง | **ไม่มี (Zero Risk)** |
| 6 | `Favicon.png` (Root) | 145 KB | ไฟล์ Favicon ซ้ำซ้อน วางทับไว้ที่ Root | ซ้ำกับ `frontend/public/favicon.ico` ที่ระบบใช้งานจริง | **ไม่มี (Zero Risk)** |
| 7 | `scratch/` (Root) | 0 B | โฟลเดอร์ว่างเปล่าที่สร้างไว้สำหรับทดสอบสคริปต์ชั่วคราว | โฟลเดอร์ว่าง ไม่มีไฟล์ข้างใน | **ไม่มี (Zero Risk)** |
| 8 | `backend/prisma/test_empty.db` | 155 KB | ไฟล์ SQLite ฐานข้อมูลว่างเปล่าที่สร้างขึ้นตอนทดสอบ | ไม่มี code ใดเรียกใช้ / ปัจจุบันใช้ Neon PostgreSQL | **ไม่มี (Zero Risk)** |
| 9 | `backend/prisma/test_empty.db-journal` | 29 KB | ไฟล์ Journal ชั่วคราวของ SQLite test_empty.db | ไม่มี code ใดเรียกใช้ | **ไม่มี (Zero Risk)** |
| 10 | `frontend/src/components/ui/demo.tsx` | 396 B | คอมโพเนนต์ตัวอย่างเดโมของ GridBloom | ไม่มีไฟล์ใด import (มีเพียงประกาศ `GridBloomDemo`) | **ไม่มี (Zero Risk)** |
| 11 | `frontend/src/components/ui/social-auth-demo.tsx` | 131 B | คอมโพเนนต์เดโมตัวอย่างของ SocialAuthCard | ไม่มีไฟล์ใด import (มีเพียงประกาศ `DemoOne`) | **ไม่มี (Zero Risk)** |
| 12 | `frontend/src/components/ui/toggle.tsx` | 1.4 KB | คอมโพเนนต์ Toggle ของ Radix UI ที่ไม่ได้นำมาใช้ | ไม่มี component หรือหน้าใดในระบบเรียกใช้งาน | **ไม่มี (Zero Risk)** |

> 💡 **พื้นที่ที่จะได้คืนทันทีเมื่อลบกลุ่มนี้:** ประมาณ **42.8 MB** (ส่วนใหญ่เป็นไฟล์วิดีโอ MP4 ตกค้าง)

---

## 3. Files That Must Be Kept (กลุ่ม B — ต้องเก็บไว้ ห้ามแตะต้อง)

ไฟล์และโฟลเดอร์เหล่านี้เป็นหัวใจหลักในการรันระบบ Note on Web **ต้องไม่ลบหรือดัดแปลงโดยเด็ดขาด**:

| ส่วนของระบบ | รายการไฟล์ / โฟลเดอร์ | เหตุผลความจำเป็น |
| :--- | :--- | :--- |
| **Frontend Pages** | `src/pages/*.tsx`, `src/pages/notes/*`, `src/pages/settings/*`, `src/pages/share/*`, `src/pages/auth/*` | เป็นหน้าหลักทั้งหมด 19 หน้าของระบบ (Dashboard, Notes, Board, Login, Register, Forgot Password, Reset Password, Admin, Vault, Trash, Security, Privacy, Help) |
| **Frontend Components** | `src/components/notes/*`, `src/components/board/*`, `src/components/layout/*`, `src/components/modals/*`, `src/components/notifications/*` | คอมโพเนนต์ NoteEditor, StickyBoard, Kanban, AudioPlayer, RichToolbar, Sidebar, MobileBottomNav, Modal ทั้งหมด |
| **Frontend Interactive Assets** | `src/components/easter-egg/CinematicEasterEgg.tsx` | ถูกเรียกใช้ใน `Sidebar.tsx` สำหรับ Easter egg ของระบบ |
| **Frontend 3D Grid** | `src/components/ui/grid-bloom.tsx` | ถูกเรียกใช้ในหน้า Login, Register, Forgot Password, Reset Password สำหรับ 3D Shader Background |
| **Service Worker & Push** | `frontend/public/sw.js`, `frontend/src/utils/webPush.ts` | ระบบแจ้งเตือน Web Push Notification และการทำงานแบบ PWA |
| **Frontend Public Icons** | `frontend/public/favicon.ico`, `frontend/public/NoteAll-icon.png`, `frontend/public/NoteALL.png`, `frontend/public/NoteAll.ico` | ไอคอนและโลโก้หลักที่แสดงในแถบเบราว์เซอร์และการแชร์ |
| **Backend Core** | `backend/src/server.ts`, `backend/src/controllers/*`, `backend/src/routes/*`, `backend/src/middleware/*`, `backend/src/services/*`, `backend/src/utils/*` | เซิร์ฟเวอร์ API, Socket.IO, Auth, Google OAuth, Passkey, Uploads, Realtime, Rate Limiting, Email Service |
| **Database Schema & Migrations** | `backend/prisma/schema.prisma`, `backend/prisma/migrations/*` | โครงสร้าง Database Schema ของ Neon PostgreSQL และประวัติ Migration ทั้งหมด |
| **Active Backend Scripts** | `backend/scripts/backup.js`, `backend/scripts/restore.js`, `backend/scripts/init-db.js` | **จำเป็นอย่างยิ่ง:** ถูกผูกไว้ใน `package.json` (`npm start`, `npm run dev`, `npm run prisma:push`, `npm run db:backup`) |
| **User Uploads & Attachments** | `backend/uploads/*` (`.gitkeep`, `.webm`, `.jpg`, `.txt`) | เป็นไฟล์แนบและไฟล์เสียงที่ผู้ใช้งานอัปโหลดจริงลงในโน้ต |
| **Deployment & Config** | `docker/*`, `start.bat`, `frontend/next.config.js`, `backend/tsconfig.json`, `frontend/tsconfig.json` | คอนฟิกการ Deploy และ Build บน Vercel, Render และการรันในเครื่อง |
| **Guidelines & Instructions** | `GEMINI.md`, `README.md` | กฎระเบียบข้อบังคับของโปรเจกต์และคู่มือการติดตั้ง |

---

## 4. Files Requiring Review (กลุ่ม C — ต้องให้เจ้าของโปรเจกต์ตัดสินใจ)

ไฟล์ในกลุ่มนี้ไม่มีผลกระทบต่อระบบ Note on Web หลัก แต่เกี่ยวข้องกับเทมเพลตทดสอบ หรือเอกสาร จึงต้องขอการยืนยันก่อน:

| รายการ | รายละเอียด | ข้อเสนอแนะ |
| :--- | :--- | :--- |
| **1. `frontend/src/pages/test-auth.tsx`** (1.2 KB) และ **`frontend/src/components/ui/social-auth-card.tsx`** (5.6 KB) | หน้านี้สร้างไว้สำหรับดูตัวอย่างดีไซน์ Social Auth Card (ไม่ได้เชื่อมต่อใน Flow สมัครสมาชิกหรือล็อกอินจริงของเว็บ ซึ่งใช้ `login.tsx` อยู่แล้ว) | **เสนอให้ลบ** หากไม่ได้ใช้ทดสอบดีไซน์แล้ว หรือ **เก็บไว้** หากต้องการเก็บไว้เป็น Reference ออกแบบ |
| **2. `frontend/src/components/ui/button.tsx`, `input.tsx`, `label.tsx`** (รวม ~3.7 KB) | เป็น Primitive UI จาก shadcn/ui ซึ่งปัจจุบันมีเพียง `social-auth-card.tsx` ตัวเดียวที่ import ใช้งาน | หากเลือกเก็บ Social Auth ไว้ ต้องเก็บ 3 ไฟล์นี้ไว้ด้วย แต่ถ้าเลือกลบ Social Auth 3 ไฟล์นี้ก็สามารถลบได้ |
| **3. เอกสาร Markdown นโยบายและรายงานที่ Root (15 ไฟล์):**<br>- `PDPA_COMPLIANCE_AUDIT_2569.md`<br>- `PDPA_GAP_ANALYSIS_2569.md`<br>- `PRIVACY_NOTICE_TH.md`, `PRIVACY_NOTICE_EN.md`<br>- `COOKIE_POLICY_TH.md`<br>- `ROPA.md`, `DATA_RETENTION_POLICY.md`<br>- `DATA_SUBJECT_RIGHTS.md`<br>- `DATA_BREACH_RESPONSE_PLAN.md`<br>- `CONSENT_MANAGEMENT_SPEC.md`<br>- `THIRD_PARTY_DATA_PROCESSORS.md`<br>- `PASSWORD_MANAGEMENT_AUDIT.md`<br>- `PASSWORD_MANAGEMENT_IMPLEMENTATION.md`<br>- `REALTIME_AUDIT.md`<br>- `SHARING_ARCHITECTURE.md`<br>- `ADMIN_GUIDE.md` | เอกสารเหล่านี้เป็นรายงาน Audit, กฎหมาย PDPA และเอกสารสถาปัตยกรรมระบบที่สมบูรณ์มาก ซึ่งไม่ได้ถูกอ่านโดยโค้ด แต่มีคุณค่าสูงในแง่เอกสารอ้างอิงของโปรเจกต์ | **ห้ามลบทิ้งเด็ดขาด!**<br>เสนอให้จัดระเบียบโดยย้ายไปรวมไว้ในโฟลเดอร์ `docs/` และ `docs/pdpa/` เพื่อให้ Root ของโปรเจกต์สะอาดและเป็นมืออาชีพ |

---

## 5. Database Backups (กลุ่ม D — สำรองข้อมูลประวัติศาสตร์)

**การตรวจสอบ Database:**
- **Production Database ปัจจุบัน:** ทำงานบน **Neon Serverless PostgreSQL Cloud** (ข้อมูลผู้ใช้, โน้ต, บอร์ด, การแชร์ ปลอดภัย 100% ไม่มีการแตะต้อง)
- **ไฟล์ Database ที่พบในเครื่อง Local:**

| ไฟล์ | ขนาด | แหล่งที่มา / วันที่สร้าง | สถานะ / ประเภท | ข้อเสนอแนะ |
| :--- | :---: | :--- | :--- | :--- |
| `backend/prisma/dev.db` | 1.68 MB | 28 ก.ย. 2569 | Development SQLite DB (ก่อนย้ายไป Postgres) | **Archive:** เป็นฐานข้อมูลเก่าในเครื่อง ย้ายไปเก็บใน Archive หรือคงไว้ในเครื่อง (อยู่ใน `.gitignore` ไม่ได้ถูก push ขึ้น git อยู่แล้ว) |
| `backend/backups/dev_backup_*.db` (15 ไฟล์) | ไฟล์ละ 1.68 MB (รวม ~25.3 MB) | 25 - 28 ก.ย. 2569 | สำเนา Snapshot ของ SQLite ในอดีต | **Archive:** เป็นไฟล์สำรองเก่าที่มีความซ้ำซ้อนกัน แนะนำให้รวมบีบอัดเป็น `.zip` ก้อนเดียว หรือย้ายออกนอกโฟลเดอร์โปรเจกต์ |
| `backend/backups/pre_restore_safety_*.db` (1 ไฟล์) | 1.68 MB | 25 ก.ย. 2569 | สำเนาความปลอดภัยก่อน Restore SQLite ในอดีต | **Archive:** เช่นเดียวกับด้านบน |

> ⚠️ **คำยืนยัน:** ไม่มีคำสั่ง `DROP DATABASE`, `DROP TABLE` หรือการลบข้อมูลใดๆ บน Neon PostgreSQL ทั้งสิ้น

---

## 6. Test Scripts (การตรวจสอบสคริปต์ใน `backend/scripts/`)

ในโฟลเดอร์ `backend/scripts/` มีสคริปต์ 15 ไฟล์ แบ่งออกเป็น 2 กลุ่มชัดเจน:

### 6.1 สคริปต์ระบบหลัก (ห้ามลบ — KEEP):
1. `backup.js` — ใช้สำรองฐานข้อมูลอัตโนมัติก่อนรันคำสั่ง Prisma (ผูกกับ npm scripts)
2. `restore.js` — ใช้กู้คืนฐานข้อมูล (ผูกกับ npm scripts)
3. `init-db.js` — ใช้สร้างโครงสร้างเริ่มต้นและเช็คความสมบูรณ์ฐานข้อมูลตอนบูตเซิร์ฟเวอร์ (ผูกกับ npm scripts)

### 6.2 สคริปต์ทดสอบและตรวจสอบเฉพาะกิจ (Candidate for Review / Archive):
1. `test-admin-api.js` — ยิงทดสอบ Admin API
2. `test-delete-user.js` — ยิงทดสอบ API ลบบัญชีผู้ใช้
3. `test-mobile-push.js` — ยิงทดสอบ Web Push แจ้งเตือนบนมือถือ
4. `test-password-management.js` — ยิงทดสอบระบบตั้งรหัสผ่านใหม่
5. `test-phase4-verification.js` — ยิงทดสอบฟีเจอร์ Phase 4
6. `test-phase5-restore.js` — ยิงทดสอบการกู้คืน Phase 5
7. `test-phase6-e2e.js` — ยิงทดสอบ End-to-End Phase 6
8. `test-reminder-e2e.js` — ยิงทดสอบระบบแจ้งเตือนเตือนความจำ
9. `check-reminders.js` — สคริปต์ CLI ตรวจเช็คข้อมูลตาราง Reminder
10. `check-subs.js` — สคริปต์ CLI ตรวจเช็คข้อมูล WebPushSubscription
11. `check-users.js` — สคริปต์ CLI ตรวจเช็คข้อมูลตาราง User
12. `migrate-sqlite-to-postgres.js` — สคริปต์ถ่ายโอนข้อมูลจาก SQLite ไป Postgres (ใช้งานสำเร็จไปแล้วเมื่อย้ายระบบ)

**ข้อเสนอแนะสำหรับ Test Scripts:**  
สคริปต์ทดสอบเหล่านี้ไม่ได้ถูกเรียกโดย npm script หรือ backend runtime สามารถ:
- **ทางเลือกที่ 1 (แนะนำ):** จัดระเบียบโดยย้ายไฟล์ที่ขึ้นต้นด้วย `test-*` ไปรวมไว้ใน `backend/tests/` เพื่อแยกออกจากสคริปต์หลัก (`backup`, `restore`, `init-db`) อย่างเป็นสัดส่วน
- **ทางเลือกที่ 2:** ลบออกเฉพาะไฟล์ `test-phase4`, `test-phase5`, `test-phase6` ที่ผ่านการทดสอบแล้วในอดีต

---

## 7. Temporary / Debug Files (ไฟล์ชิ้นส่วนดิบในอดีต)

### โฟลเดอร์ `raw_deepseek_backup/` (26 ไฟล์)
- **ที่มา:** เป็นสำเนาโค้ดดิบ 26 ไฟล์ที่แบ็กอัปไว้ตั้งแต่วันที่ 3 กันยายน 2569 (วันแรกๆ ของโปรเจกต์)
- **การใช้งาน:** ไม่มีโค้ดใดใน Frontend หรือ Backend ทำการ import จากโฟลเดอร์นี้
- **ข้อเสนอแนะ:** 
  - สามารถลบออกจาก Source Code ได้อย่างปลอดภัย หรือ
  - บีบอัดเก็บเป็นไฟล์สำรองนอกโปรเจกต์ (Archive) เพื่อลดความรกของโฟลเดอร์โปรเจกต์

---

## 8. Unused Dependencies (การตรวจสอบ Package Dependencies)

จากการตรวจจับ Reference ของ `package.json` ทั้ง Frontend และ Backend:

### Frontend (`frontend/package.json`):
- `@radix-ui/react-toggle`: มีการติดตั้งไว้ แต่ไม่มีการเรียกใช้งานในคอมโพเนนต์จริงใดๆ (มีเพียงไฟล์ `toggle.tsx` ที่ไม่ได้ใช้งาน)
- Dependencies อื่นๆ ทั้งหมด (`tiptap`, `zustand`, `three`, `@react-three/fiber`, `lucide-react`, `date-fns`, `tesseract.js`, `simplewebauthn`, `react-hook-form`, `zod`, `axios`, `socket.io-client`, `next-themes`) **ถูกใช้งานจริงทั้งหมด ห้ามลบ**

### Backend (`backend/package.json`):
- Dependencies ทั้ง 18 ตัว (รวมถึง `web-push`, `node-cron`, `nodemailer`, `bcryptjs`, `jsonwebtoken`, `multer`, `socket.io`, `helmet`, `express-rate-limit`, `zod`, `prisma`) **ถูกใช้งานจริงทั้งหมดใน Controllers และ Services ห้ามลบ**

---

## 9. Documentation (การจัดการเอกสาร)

ปัจจุบันที่ Root มีไฟล์ `.md` จำนวน 18 ไฟล์ ซึ่งทำให้โครงสร้างโฟลเดอร์ด้านนอกดูหนาแน่นมาก 

**ข้อเสนอการจัดหมวดหมู่ที่เป็นระเบียบ:**
```text
NoteOnWeb/
├── README.md                           # คงไว้ที่ Root (ภาพรวมโปรเจกต์)
├── GEMINI.md                           # คงไว้ที่ Root (กฎและแนวทางการพัฒนา)
├── ADMIN_GUIDE.md                      # คงไว้ที่ Root (คู่มือ Admin)
├── PROJECT_CLEANUP_AUDIT.md            # รายงาน Audit การคลีนอัปนี้
└── docs/                               # 📁 โฟลเดอร์รวมเอกสารเฉพาะด้าน
    ├── pdpa/                           # รวบรวมเอกสารกฎหมาย PDPA ทั้ง 10 ไฟล์
    │   ├── PDPA_COMPLIANCE_AUDIT_2569.md
    │   ├── PDPA_GAP_ANALYSIS_2569.md
    │   ├── PRIVACY_NOTICE_TH.md
    │   ├── PRIVACY_NOTICE_EN.md
    │   ├── COOKIE_POLICY_TH.md
    │   ├── ROPA.md
    │   ├── DATA_RETENTION_POLICY.md
    │   ├── DATA_SUBJECT_RIGHTS.md
    │   ├── DATA_BREACH_RESPONSE_PLAN.md
    │   ├── CONSENT_MANAGEMENT_SPEC.md
    │   └── THIRD_PARTY_DATA_PROCESSORS.md
    └── architecture/                   # รวบรวมเอกสารการออกแบบระบบเชิงลึก
        ├── SHARING_ARCHITECTURE.md
        ├── REALTIME_AUDIT.md
        ├── PASSWORD_MANAGEMENT_AUDIT.md
        └── PASSWORD_MANAGEMENT_IMPLEMENTATION.md
```

---

## 10. Recommended Cleanup Plan (ลำดับขั้นตอนปฏิบัติการเมื่อได้รับอนุมัติ)

เมื่อผู้ใช้อนุมัติแล้ว จะดำเนินการตามขั้นตอนที่ปลอดภัยสูงสุดดังนี้:

1. **เฟส 1: ลบไฟล์ขยะและวิดีโอทดสอบที่ไม่ใช้งานแน่นอน (กลุ่ม A)**
   - ลบ `2.mp4`, `3.mp4`, `frontend/public/1.mp4` (ลดขนาดโปรเจกต์ทันที 42 MB)
   - ลบไฟล์ไอคอนซ้ำซ้อนที่ Root (`NoteALL.png`, `NoteAll.ico`, `Favicon.png`)
   - ลบโฟลเดอร์ว่าง `scratch/`
   - ลบ `test_empty.db` และ `test_empty.db-journal`
   - ลบไฟล์เดโมที่ไม่ได้ใช้งาน (`demo.tsx`, `social-auth-demo.tsx`, `toggle.tsx`)

2. **เฟส 2: จัดการกับไฟล์ Backup เก่า (กลุ่ม D)**
   - นำไฟล์ SQLite Backups ใน `backend/backups/` และ `raw_deepseek_backup/` จัดเก็บเป็นโฟลเดอร์ Archive หรือย้ายออกตามที่ผู้ใช้เห็นชอบ

3. **เฟส 3: จัดการส่วนที่รอการตัดสินใจ (กลุ่ม C)**
   - ตัดสินใจว่าจะเก็บหรือลบ `test-auth.tsx` และ `social-auth-card.tsx`
   - จัดระเบียบเอกสาร `.md` เข้าโฟลเดอร์ `docs/` เพื่อให้ Root สะอาดเรียบร้อย

4. **เฟส 4: ตรวจสอบความสมบูรณ์หลังการทำความสะอาด (Verification & Regression Test)**
   - รัน `npm run build` ใน Backend เพื่อเช็ค TypeScript
   - รัน `npm run build` ใน Frontend เพื่อเช็ค Next.js 20 หน้า
   - ทดสอบการเชื่อมต่อ API, Database Neon และ Socket.IO
   - สร้างรายงานสรุปผล `PROJECT_CLEANUP_RESULT.md`
