# PASSWORD MANAGEMENT IMPLEMENTATION REPORT
**โครงการ:** Note on Web (SecureNote)  
**วันที่ดำเนินการ:** 3 ตุลาคม 2026  
**สถานะ:** เสร็จสมบูรณ์และผ่านการทดสอบทุกระดับ (Production Ready)

---

## 1. สิ่งที่เพิ่มในระบบ (Features Added)

1. **ลิงก์ "ลืมรหัสผ่าน?" บนหน้า Login:**
   * เพิ่มปุ่มข้อความ "ลืมรหัสผ่าน?" บริเวณส่วนหัวของช่องกรอกรหัสผ่านในหน้า `/login`
   * สอดคล้องกับ UX มาตรฐานสากล มองเห็นชัดเจนบนทุกอุปกรณ์ ทั้ง Mobile, Tablet และ Desktop
2. **หน้าขอรีเซ็ตรหัสผ่าน (`/forgot-password`):**
   * ฟอร์มกรอกอีเมลเพื่อขอรับลิงก์ตั้งรหัสผ่านใหม่
   * ป้องกัน **Account Enumeration Attack** ด้วยข้อความสถานะเดียวกันเสมอ ไม่ว่าจะพบอีเมลในระบบหรือไม่
   * ออกแบบด้วย Glassmorphic Design สวยงาม มีระบบ 3D GridBloom Background สบายตา
3. **หน้าตั้งรหัสผ่านใหม่ (`/reset-password?token=...`):**
   * ตรวจสอบความถูกต้องและวันหมดอายุของ One-Time Token (มีอายุ 15 นาที)
   * ฟอร์มกรอกรหัสผ่านใหม่ + ยืนยันรหัสผ่านใหม่ พร้อมปุ่มแสดง/ซ่อนรหัสผ่าน
   * แสดง Checklist นโยบายรหัสผ่านแบบ Real-time Live Feedback (13 ตัวอักษร, พิมพ์เล็ก, พิมพ์ใหญ่, ตัวเลข, สัญลักษณ์พิเศษ, รหัสผ่านตรงกัน)
   * ป้องกันการตั้งรหัสผ่านใหม่ซ้ำกับรหัสผ่านเดิม
   * เมื่อตั้งรหัสผ่านสำเร็จ จะทำการเพิกถอน (Revoke) ทุก Session เดิมในทุกอุปกรณ์เพื่อความปลอดภัย แล้วนำทางกลับไปหน้า `/login`
4. **หน้ารักษาความปลอดภัยและเปลี่ยนรหัสผ่าน (`/settings/security`):**
   * สำหรับผู้ใช้ที่เข้าสู่ระบบแล้ว สามารถเปลี่ยนรหัสผ่านของบัญชีตนเองได้
   * มีตัวเลือก *"ออกจากระบบอุปกรณ์อื่นทั้งหมด (Log out of all other devices)"* ซึ่งเปิดเป็นค่าเริ่มต้น เพื่อความปลอดภัย
   * ตรวจสอบสิทธิ์และแยกแยะกรณี **Google OAuth Account** หากบัญชีเข้าสู่ระบบด้วย Google และไม่มีรหัสผ่านในระบบ จะแสดงข้อความแนะนำอย่างชัดเจนโดยไม่อนุญาตให้เปลี่ยนรหัสผ่านที่นี่
   * รวบรวมทางลัดการรักษาความปลอดภัยอื่นๆ เช่น Passkey (FIDO2/WebAuthn) และ Master Password (E2EE Vault)
5. **การเชื่อมต่อเมนูบน Desktop และ Mobile:**
   * **Desktop (Sidebar):** เพิ่มไอคอนรูปกุญแจ (`KeyRound`) ในส่วน Footer ของทั้ง Collapsed Sidebar และ Expanded Sidebar
   * **Mobile (MobileBottomNav):** เพิ่มเมนู *"ความปลอดภัย & เปลี่ยนรหัสผ่าน"* ใน More Bottom Sheet

---

## 2. ไฟล์ที่สร้างใหม่และไฟล์ที่แก้ไข (Files Modified & Created)

### ไฟล์ที่สร้างใหม่
* `frontend/src/pages/forgot-password.tsx` (หน้าขอลิงก์รีเซ็ตรหัสผ่าน)
* `frontend/src/pages/reset-password.tsx` (หน้าตั้งรหัสผ่านใหม่)
* `frontend/src/pages/settings/security.tsx` (หน้าตั้งค่าความปลอดภัยและเปลี่ยนรหัสผ่าน)
* `backend/src/services/emailService.ts` (บริการส่งอีเมลรีเซ็ตรหัสผ่านด้วย Nodemailer)
* `backend/scripts/test-password-management.js` (สคริปต์ทดสอบระบบอัตโนมัติ)

### ไฟล์ที่แก้ไข
* `backend/package.json` (ติดตั้ง `nodemailer` และ `@types/nodemailer`)
* `backend/prisma/schema.prisma` (เพิ่มโมเดล `PasswordResetToken` และ relation ใน `User`)
* `backend/src/utils/ensureDb.ts` (เพิ่มการตรวจเช็คและสร้างตาราง `PasswordResetToken` อัตโนมัติสำหรับ dev database)
* `backend/src/middleware/rateLimiter.ts` (เพิ่ม Rate Limiters: `forgotPasswordLimiter`, `resetPasswordLimiter`, `changePasswordLimiter`)
* `backend/src/controllers/authController.ts` (เพิ่ม `forgotPassword`, `resetPassword`, ปรับปรุง `changePassword`, `me`)
* `backend/src/routes/authRoutes.ts` (ผูก route `/forgot-password`, `/reset-password` และ Rate Limiting)
* `frontend/src/types/index.ts` (เพิ่ม `hasPassword?: boolean` ใน `User` interface)
* `frontend/src/pages/login.tsx` (เพิ่มลิงก์ "ลืมรหัสผ่าน?")
* `frontend/src/components/layout/Sidebar.tsx` (เพิ่มปุ่มไปยังหน้า Security ใน Footer)
* `frontend/src/components/layout/MobileBottomNav.tsx` (เพิ่มปุ่มไปยังหน้า Security ใน More BottomSheet)

---

## 3. API Endpoints ที่เพิ่มและปรับปรุง (API Specification)

| Endpoint | Method | Auth Required | Rate Limit | รายละเอียดการทำงาน |
|---|---|---|---|---|
| `/api/auth/forgot-password` | POST | ไม่ต้อง (Public) | 5 ครั้ง / 15 นาที / IP | รับ `{ email }` สร้าง One-Time Token (32 bytes), เก็บ Hash ใน DB และส่งอีเมลแจ้งผู้ใช้ (Account Enumeration Protected) |
| `/api/auth/reset-password` | POST | ไม่ต้อง (Public) | 5 ครั้ง / 15 นาที / IP | รับ `{ token, password }` ตรวจสอบ Token Hash, เช็ควันหมดอายุ (15 นาที), Hash รหัสผ่านใหม่ด้วย Bcrypt, ลบ Token, เพิกถอนทุก Session ของผู้ใช้ |
| `/api/auth/change-password` | POST | ต้องมี (Bearer Token) | 5 ครั้ง / 15 นาที / IP | รับ `{ oldPassword, newPassword, revokeOtherSessions }` ตรวจสอบรหัสเดิม, บันทึกรหัสใหม่ และเพิกถอน Session อุปกรณ์อื่นหากเลือกไว้ |
| `/api/auth/me` | GET | ต้องมี (Bearer Token) | ปกติ | ปรับปรุงให้ส่ง `hasPassword: boolean` และ `authProvider` เพิ่มเติม เพื่อให้ Frontend รู้สถานะรหัสผ่านของผู้ใช้ |

---

## 4. โครงสร้าง Database ที่เพิ่ม (Prisma Schema Changes)

เพิ่มโมเดล `PasswordResetToken` ใน `backend/prisma/schema.prisma`:

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

และเชื่อมความสัมพันธ์ในโมเดล `User`:
```prisma
passwordResetTokens PasswordResetToken[]
```

---

## 5. มาตรการความปลอดภัย (Security Measures Implemented)

1. **การป้องกัน Account Enumeration:**
   * การส่งคำขอ Forgot Password จะได้รับคำตอบสำเร็จเดียวกันเสมอ: *"หากอีเมลนี้มีบัญชีอยู่ในระบบ ระบบจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปยังอีเมลของคุณ"* ไม่ว่าจะมีบัญชีนั้นจริงหรือไม่
2. **การจัดเก็บ Token แบบ Cryptographic Hash (No Plaintext):**
   * Raw Token ที่สร้างด้วย `crypto.randomBytes(32).toString('hex')` จะถูกส่งไปยังอีเมลของผู้ใช้เท่านั้น
   * ในฐานข้อมูลจะจัดเก็บเฉพาะ **SHA-256 Hash (`tokenHash`)** เท่านั้น แม้ฐานข้อมูลรั่วไหล แฮกเกอร์ก็ไม่สามารถนำค่าใน DB ไปใช้รีเซ็ตรหัสผ่านได้
3. **One-Time Token & Short Expiration:**
   * โทเคนมีอายุการใช้งานจำกัดเพียง **15 นาที**
   * เมื่อถูกใช้งานแล้ว จะถูก Invalidate และลบทิ้งทันที ไม่สามารถนำมา Replay ได้
4. **Session Revocation (การตัดเซสชันข้ามอุปกรณ์):**
   * **เมื่อรีเซ็ตรหัสผ่านผ่าน Forgot Password:** บังคับตัดเซสชันเดิมทั้งหมด (`Session.deleteMany({ where: { userId } })`) เพื่อให้อุปกรณ์ที่อาจถูกขโมยหลุดออกจากระบบทันที
   * **เมื่อเปลี่ยนรหัสผ่านใน Settings:** สามารถเลือกตัดเซสชันบนอุปกรณ์อื่นทั้งหมด ยกเว้นอุปกรณ์ปัจจุบันที่กำลังใช้งานอยู่ได้
5. **Rate Limiting ป้องกัน Brute Force & DoS:**
   * จำกัดการร้องขอรีเซ็ตรหัสผ่านสูงสุด 5 ครั้ง ต่อ 15 นาที ต่อ IP
6. **Password Policy Enforcement:**
   * ความยาวขั้นต่ำ 13 ตัวอักษร, มีตัวพิมพ์เล็ก, ตัวพิมพ์ใหญ่, ตัวเลข และอักขระพิเศษ
   * ป้องกันการตั้งรหัสผ่านใหม่ซ้ำกับรหัสผ่านเดิม
7. **Security Event Audit Logging:**
   * บันทึกเหตุการณ์ความปลอดภัยลงในตาราง `AuditLog` (`PASSWORD_RESET_REQUESTED`, `PASSWORD_RESET_COMPLETED`, `PASSWORD_RESET_FAILED`, `PASSWORD_CHANGED`, `PASSWORD_CHANGE_FAILED`) โดยไม่บันทึกข้อมูลอ่อนไหว เช่น รหัสผ่าน หรือ Raw Token

---

## 6. วิธีการทดสอบ (Verification & Testing)

### 6.1 การรัน Automated Verification Script
รันคำสั่ง:
```powershell
cd backend
node scripts/test-password-management.js
```
**ผลการทดสอบ:** ผ่านครบถ้วน 100% (Account Enumeration, Token SHA-256 Storage, Invalid/Expired Token Rejection, Password Reset Invalidation, Session Revocation, Selective Session Revocation)

### 6.2 การตรวจสอบ Type Check และ Production Build
* **Backend:** `npx tsc --noEmit` ผ่านฉลุย 100% (Zero Errors)
* **Frontend:** `npx tsc --noEmit` ผ่านฉลุย 100% (Zero Errors)
* **Next.js Production Build:** `npm run build` ในโฟลเดอร์ `frontend` สำเร็จสมบูรณ์ ผ่านการ Generate Static Pages ทั้ง 20 หน้า

### 6.3 Responsive Breakpoints Test
* **Mobile (320px - 430px):** หน้า Forgot Password, Reset Password และ Security Settings แสดงผลแบบ Touch Target สบายตา ไม่ล้นขอบจอ
* **Tablet (768px - 820px):** จัดวางแบบ Dual-column Grid สำหรับ Checklist และ Security Cards ได้อย่างลงตัว
* **Desktop (1280px+):** Sidebar มีปุ่มทางลัดเข้าสู่หน้าความปลอดภัย และหน้าเพจจัดกึ่งกลางสวยงามสมดุล

---

## 7. สิ่งที่ต้องตั้งค่าใน Production & Environment Variables

สำหรับ Production บน Render / Vercel หรือเซิร์ฟเวอร์จริง ให้เพิ่ม Environment Variables ใน `backend/.env` ดังนี้:

```env
# URL ของ Frontend สำหรับสร้างลิงก์รีเซ็ตรหัสผ่านในอีเมล
FRONTEND_URL="https://note-on-web.vercel.app"

# การตั้งค่า SMTP สำหรับส่งอีเมลจริง (รองรับ Gmail, SendGrid, Amazon SES, Mailgun, Brevo ฯลฯ)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-notification-email@gmail.com"
SMTP_PASS="your-app-specific-password"
EMAIL_FROM="\"NoteAll Security\" <no-reply@noteonweb.com>"
```

> **หมายเหตุสำหรับ Local Development Mode:**  
> หากไม่ได้ระบุค่า `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` ระบบ `EmailService` จะทำงานในโหมด **Development Mode** โดยอัตโนมัติ ซึ่งจะพิมพ์ Reset URL ออกทาง Console Log เพื่อให้ผู้พัฒนาสามารถคลิกทดสอบได้สะดวกและปลอดภัย โดยไม่ทำให้เซิร์ฟเวอร์หยุดทำงาน

---

## 8. วิธี Rollback หากเกิดปัญหา (Rollback Plan)

หากต้องการย้อนกลับการเปลี่ยนแปลง:
1. **Database:** ลบตาราง `PasswordResetToken` ออกจากฐานข้อมูล:
   ```sql
   DROP TABLE IF EXISTS "PasswordResetToken";
   ```
2. **Backend:** ลบโมเดล `PasswordResetToken` ใน `schema.prisma` แล้วรัน `npx prisma generate`
3. **Git Rollback:** ย้อนการเปลี่ยนแปลงของ commit หรือ checkout ไฟล์เดิม:
   ```bash
   git checkout HEAD~1 backend/ frontend/
   ```
