# PASSWORD MANAGEMENT AUDIT & ARCHITECTURE SPECIFICATION
**โครงการ:** Note on Web (SecureNote)  
**วันที่ตรวจสอบ:** 3 ตุลาคม 2026  
**สถานะ:** Phase 1 & 2 Completed (Audit & Architecture Planning)

---

## 1. ผลการตรวจสอบระบบ Authentication & Password ปัจจุบัน (Code Audit)

### 1.1 Frontend (Next.js 14 Pages Router + React + Tailwind CSS)
* **หน้า Login (`/frontend/src/pages/login.tsx`):**
  * มีฟอร์มกรอก `email` (หรือ username) และ `password` (validation: min 6 chars)
  * มีปุ่ม "เข้าสู่ระบบ", ปุ่ม "เข้าสู่ระบบด้วย Google", ปุ่ม "เข้าสู่ระบบด้วย Passkey (WebAuthn)", และลิงก์ไปยัง `/register`
  * **สิ่งที่ขาด:** ยังไม่มีลิงก์ **"ลืมรหัสผ่าน?"** สำหรับกู้คืนบัญชี
* **หน้า Register (`/frontend/src/pages/register.tsx`):**
  * ใช้ 2-step verification: Step 1 ยืนยันตัวตนด้วย Google + Cloudflare Turnstile เพื่อรับ `registrationToken`, Step 2 กำหนด `username` และ optional `password`
  * ข้อกำหนดรหัสผ่านใน Register: ความยาวขั้นต่ำ 13 ตัวอักษร, มีตัวพิมพ์เล็ก, พิมพ์ใหญ่, ตัวเลข, และอักขระพิเศษ
* **หน้า Forgot Password & Reset Password:**
  * ยังไม่มีหน้า `/forgot-password`
  * ยังไม่มีหน้า `/reset-password?token=...`
* **หน้า Settings / Security:**
  * ปัจจุบันยังไม่มีหน้า `/settings/security` หรือหน้าจัดการความปลอดภัยสำหรับเปลี่ยนรหัสผ่าน
  * มีเฉพาะ `MasterPasswordModal` (สำหรับเข้ารหัส E2EE Vault / ล็อกโน้ต ซึ่งเป็นคนละส่วนกับรหัสผ่านบัญชีเว็บ) และ `PasskeyModal`
* **Auth State (`/frontend/src/store/authStore.ts`):**
  * จัดการ JWT token ใน `localStorage.getItem('secure_note_token')`
  * ข้อมูล user ใน `localStorage.getItem('secure_note_user')`
  * ส่ง Authorization header แบบ `Bearer <token>` ผ่าน Axios interceptor

---

### 1.2 Backend (Express + TypeScript + Prisma ORM + PostgreSQL/SQLite)
* **User Model (`User` ใน `prisma/schema.prisma`):**
  * `id`: `String @id @default(cuid())`
  * `email`: `String @unique`
  * `username`: `String @unique`
  * `passwordHash`: `String?` (เป็น nullable: ผู้ใช้ที่สมัครผ่าน Google โดยไม่ตั้งรหัสผ่านจะมีค่าเป็น `null`)
  * `authProvider`: `String @default("local")`
  * `googleId`: `String? @unique`
  * `role`: `String @default("USER")`
* **Session Model (`Session` ใน `prisma/schema.prisma`):**
  * `id`: `String @id @default(cuid())`
  * `userId`: `String` (Relation กับ `User` Cascade delete)
  * `token`: `String @unique` (เก็บค่า JWT token)
  * `expiresAt`: `DateTime` (มีอายุ 7 วัน)
  * `createdAt`: `DateTime @default(now())`
* **Authentication Middleware (`/backend/src/middleware/auth.ts`):**
  * ตรวจสอบ JWT Signature ด้วย `JWT_SECRET`
  * ยืนยันสถานะ Session จริงในฐานข้อมูล (`prisma.session.findFirst({ where: { token, expiresAt: { gt: new Date() } } })`)
  * ผูก `req.userId`, `req.sessionId`, `req.user` เข้ากับ Express Request
* **Password Hashing:**
  * ใช้ `bcryptjs` ด้วย `genSalt(10)` และ `bcrypt.hash()`
* **API Endpoints ปัจจุบันใน `/backend/src/routes/authRoutes.ts`:**
  * `POST /api/auth/register` (มี `registerLimiter`)
  * `POST /api/auth/login` (มี `loginLimiter`)
  * `POST /api/auth/logout` (ลบ Session จาก database)
  * `GET /api/auth/me` (คืนข้อมูลโปรไฟล์ผู้ใช้ แต่ยังไม่ได้บอกว่าบัญชีมีรหัสผ่านหรือไม่)
  * `POST /api/auth/change-password` (มี method ใน controller แล้ว แต่ยังขาด rate limiting, logging และ session revocation options)
  * **สิ่งที่ขาด:** `POST /api/auth/forgot-password` และ `POST /api/auth/reset-password`
* **Rate Limiting (`/backend/src/middleware/rateLimiter.ts`):**
  * มี `registerLimiter` (10 req/ชม.)
  * มี `loginLimiter` (10 req/15 นาที)
  * มี `googleAuthLimiter` (20 req/15 นาที)
  * ยังไม่มี Rate Limiter สำหรับ Password Reset และ Change Password
* **ระบบส่งอีเมล (Email System):**
  * ในโค้ดปัจจุบัน **ยังไม่มี email provider หรือ email library ติดตั้งอยู่เลย** (ไม่มี `nodemailer`, `resend`, `sendgrid` ใน `package.json`)
  * ต้องติดตั้งและสร้าง Email Service ที่ปลอดภัย พร้อมโหมด Development (Logging/Preview) และ Production (SMTP / API)

---

## 2. จุดที่สามารถนำกลับมาใช้ได้ (Reusable Components & Logic)

1. **User Data Model & Session Model:**
   * ใช้ตาราง `User` และ `Session` เดิม 100% ไม่ต้องดัดแปลงโครงสร้างหลัก
2. **Bcryptjs & JWT:**
   * ใช้งาน `bcryptjs` (salt round 10) สำหรับ hash รหัสผ่าน
   * ใช้งาน `jsonwebtoken` ร่วมกับ `Session` table เพื่อยืนยันตัวตน
3. **Authentication Middleware (`authenticate`):**
   * ใช้ป้องกัน Endpoint `/api/auth/change-password` และ `/api/auth/me`
4. **AuditLog Model (`AuditLog`):**
   * มีตาราง `AuditLog` อยู่แล้วใน Prisma schema สามารถบันทึก Security Events เช่น `PASSWORD_RESET_REQUEST`, `PASSWORD_RESET_SUCCESS`, `PASSWORD_CHANGED` ได้ทันที
5. **Glassmorphic UI Design System & Icons:**
   * ใช้สไตล์การออกแบบเดิมของหน้า Login (Glassmorphism, Tailwind CSS, Lucide Icons, Framer/Dynamic Background) เพื่อให้หน้า Forgot Password และ Reset Password มีความสวยงาม กลมกลืน และเป็นเอกลักษณ์เดียวกัน

---

## 3. จุดที่ต้องเพิ่ม (Gaps & Additions Needed)

### 3.1 Database Layer (Prisma)
* เพิ่มโมเดล `PasswordResetToken` ใน `schema.prisma`:
  ```prisma
  model PasswordResetToken {
    id        String    @id @default(cuid())
    userId    String
    user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
    tokenHash String    @unique
    expiresAt DateTime
    usedAt    DateTime?
    createdAt DateTime  @default(now())

    @@index([userId])
    @@index([tokenHash])
  }
  ```
* เชื่อมโยง relation ใน `User`: `passwordResetTokens PasswordResetToken[]`

### 3.2 Backend Services & Routes
1. **Email Service (`backend/src/services/emailService.ts`):**
   * ติดตั้ง `nodemailer` (และ `@types/nodemailer`)
   * รองรับการส่งอีเมลผ่าน SMTP (เช่น Gmail, SendGrid, Amazon SES) ผ่าน ENV: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`
   * หากรันใน Local Dev และไม่มี SMTP ให้ fallback เป็น Dev Logger / Ethereal URL โดยไม่ทำให้ระบบล่ม และไม่เปิดเผยใน Production
2. **Rate Limiters ใน `backend/src/middleware/rateLimiter.ts`:**
   * `forgotPasswordLimiter`: 5 ครั้งต่อ 15 นาที ต่อ IP
   * `resetPasswordLimiter`: 5 ครั้งต่อ 15 นาที ต่อ IP
   * `changePasswordLimiter`: 5 ครั้งต่อ 15 นาที ต่อ IP
3. **API Endpoints ใน `authController.ts` & `authRoutes.ts`:**
   * `POST /api/auth/forgot-password` (Public, Rate-limited)
   * `POST /api/auth/reset-password` (Public, Rate-limited)
   * `POST /api/auth/change-password` (Protected, Rate-limited, รองรับ Option "ออกจากระบบทุกอุปกรณ์")
   * ปรับปรุง `GET /api/auth/me` ให้คืนค่า `hasPassword: boolean` เพื่อให้ Frontend รู้สถานะของผู้ใช้

### 3.3 Frontend Pages & UI Components
1. **หน้า Login (`/frontend/src/pages/login.tsx`):**
   * เพิ่มลิงก์ **"ลืมรหัสผ่าน?"** เหนือช่อง Password หรือตำแหน่งที่เห็นชัดเจน
2. **หน้า Forgot Password (`/frontend/src/pages/forgot-password.tsx`):**
   * ฟอร์มกรอก Email พร้อมระบบป้องกัน Account Enumeration
   * ลิงก์กลับไปยังหน้า Login
3. **หน้า Reset Password (`/frontend/src/pages/reset-password.tsx`):**
   * รับ query parameter `?token=...`
   * ฟอร์มกรอกรหัสผ่านใหม่ + ยืนยันรหัสผ่านใหม่
   * แสดง Checklist ตรวจสอบ Password Policy แบบ Real-time
4. **หน้า Settings / Security (`/frontend/src/pages/settings/security.tsx` หรือ Security Modal):**
   * Section สำหรับเปลี่ยนรหัสผ่าน (Current Password, New Password, Confirm New Password)
   * Checkbox: "ออกจากระบบอุปกรณ์อื่นทั้งหมด (Log out of all other devices)"
   * แจ้งเตือนชัดเจนสำหรับบัญชี Google ที่ยังไม่มีรหัสผ่าน

---

## 4. ข้อควรระวังและ Security Risks ที่พบ (Security Risk Analysis)

| ความเสี่ยง (Security Risk) | รายละเอียดที่ตรวจพบ | แนวทางแก้ไขและป้องกัน |
|---|---|---|
| **Account Enumeration** | หากแจ้งว่า "ไม่พบบัญชีนี้ในระบบ" ผู้โจมตีจะเดาอีเมลผู้ใช้ได้ | API จะตอบข้อความคงที่เสมอว่า *"หากอีเมลนี้มีบัญชีอยู่ในระบบ ระบบจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ให้คุณ"* ไม่ว่าจะพบอีเมลหรือไม่ |
| **Token Hijacking & DB Leak** | หากเก็บ Reset Token เป็น Plaintext ในฐานข้อมูล เมื่อ DB หลุด แฮกเกอร์จะยึดบัญชีได้ทันที | สร้าง Token ด้วย `crypto.randomBytes(32).toString('hex')` ส่ง Raw Token ทางอีเมล แต่ใน Database เก็บเป็น **SHA-256 Hash (`tokenHash`)** |
| **Token Reuse & Replay Attack** | Token ถูกนำกลับมาใช้ซ้ำหลังจากถูกรีเซ็ตไปแล้ว | ตรวจสอบ `usedAt == null` และ `expiresAt > now()` เมื่อใช้งานสำเร็จจะบันทึก `usedAt = new Date()` และลบ Token ทันที (One-time use) |
| **Brute Force & Flooding** | ยิง Endpoint รัวเพื่อทำ DoS หรือคาดเดา Token | บังคับใช้ `rateLimit` เข้มงวด 5 ครั้งต่อ 15 นาทีต่อ IP บนทุก Endpoint ที่เกี่ยวกับ Password Reset |
| **Session Hijacking After Password Change** | แฮกเกอร์ที่ค้าง Session อยู่ในเครื่องอื่นยังเข้าถึงบัญชีได้แม้เปลี่ยนรหัสผ่านแล้ว | เมื่อรีเซ็ตหรือเปลี่ยนรหัสผ่าน สำเร็จ ให้เพิกถอน Session เดิมทั้งหมด (`prisma.session.deleteMany`) เพื่อบังคับให้อุปกรณ์อื่นทั้งหมดหลุดออกจากระบบทันที |
| **Google OAuth Collision** | บัญชี Google ที่ไม่มีรหัสผ่านอาจเกิดความสับสนหรือถูกสวมรอย | แยกสถานะชัดเจน บัญชี Google ที่ไม่มี passwordHash จะไม่สามารถ Change Password ได้จนกว่าจะผ่าน Flow พิเศษ หรือแสดงข้อความอธิบายอย่างถูกต้อง |

---

## 5. แผนการดำเนินงานและสถาปัตยกรรม (Implementation Plan)

```
[ Phase 1 & 2: Audit & Report ] (เสร็จสิ้น)
             ↓
[ Phase 3: Architecture & Schema Preparation ]
  - ออกแบบ Prisma Model `PasswordResetToken`
  - ติดตั้ง nodemailer & @types/nodemailer
  - สร้าง `backend/src/services/emailService.ts`
             ↓
[ Phase 4: Backend Implementation ]
  - เพิ่ม Rate Limiters ใน `rateLimiter.ts`
  - เพิ่ม `forgotPassword`, `resetPassword`, ปรับปรุง `changePassword` ใน `authController.ts`
  - เพิ่ม routes ใน `authRoutes.ts`
  - เชื่อมโยง AuditLog
             ↓
[ Phase 5: Database Migration & Verification ]
  - รัน `npx prisma db push`
  - ตรวจสอบความถูกต้องของ schema
             ↓
[ Phase 6: Frontend Implementation ]
  - เพิ่มลิงก์ "ลืมรหัสผ่าน?" ใน `login.tsx`
  - สร้างหน้า `pages/forgot-password.tsx`
  - สร้างหน้า `pages/reset-password.tsx`
  - สร้างหน้า `pages/settings/security.tsx` (และเชื่อมต่อกับ Sidebar/Mobile Navigation)
             ↓
[ Phase 7: Testing & Verification ]
  - ทดสอบ Forgot Password (ทั้ง Email ที่มีและไม่มีในระบบ)
  - ทดสอบ Rate Limiting
  - ทดสอบ Reset Password Token (หมดอายุ, ผิด, ใช้ซ้ำ)
  - ทดสอบ Change Password & Session Invalidation
  - ตรวจสอบ Responsive Breakpoints (Mobile 360px-430px, Tablet 768px, Desktop 1280px+)
  - Desktop Regression Test (ตรวจสอบว่าฟังก์ชันเดิมของ Note on Web ไม่ได้รับผลกระทบ)
             ↓
[ Phase 8: Final Summary & Documentation ]
  - จัดทำเอกสาร `PASSWORD_MANAGEMENT_IMPLEMENTATION.md`
```
