# ข้อกำหนดเชิงเทคนิคการจัดการความยินยอม (Consent Management Specification)
**โครงการ Note on Web**
*มีผลบังคับใช้ตั้งแต่วันที่: [TODO — INFORMATION REQUIRED FROM SYSTEM OWNER / ระบุวันที่ พ.ศ. 2569]*
*เวอร์ชันเอกสาร: 1.0 (ปรับปรุง พ.ศ. 2569)*

---

## 1. หลักการสำคัญตาม PDPA (มาตรา 19)
ตาม **มาตรา 19 แห่งพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)** การขอความยินยอมจะต้อง:
1. **ชัดแจ้งและแยกส่วน (Freely given & Specific):** แยกการขอความยินยอมอย่างชัดเจน ไม่ผูกติดหรือบังคับให้ยินยอมเป็นเงื่อนไขในการเข้าใช้งานระบบ (ห้ามรวม Consent เข้าไปใน Terms of Service เป็นกล่องเดียวกัน)
2. **เข้าใจง่าย (Informed & Transparent):** ชี้แจงวัตถุประสงค์โดยใช้ภาษาที่อ่านง่าย ไม่คลุมเครือ
3. **ถอนความยินยอมได้โดยง่าย (Easy to Withdraw):** การถอนความยินยอมต้องทำได้ง่ายเช่นเดียวกับการให้ความยินยอม และต้องไม่มีค่าใช้จ่ายหรือขั้นตอนซับซ้อน

---

## 2. การจำแนกประเภทข้อตกลงและความยินยอมในระบบ Note on Web

| ประเภทเอกสาร / รายการ | วัตถุประสงค์ | ฐานกฎหมาย | รูปแบบการแสดงผลบนหน้าจอ | การบันทึกข้อมูล |
| :--- | :--- | :--- | :--- | :--- |
| **1. ข้อตกลงการให้บริการ (Terms of Service)** | เงื่อนไขการใช้งานแอปพลิเคชัน | สัญญา (Contract) | Checkbox บังคับ: *"ฉันยอมรับข้อตกลงการให้บริการ"* | บันทึก Timestamp และ Version ที่ยอมรับ |
| **2. การรับทราบประกาศความเป็นส่วนตัว (Privacy Notice Acknowledgment)** | แจ้งรายละเอียดการประมวลผลข้อมูลตามสัญญา | สัญญา / แจ้งเพื่อทราบ | ข้อความแจ้งเตือน: *"โปรดอ่านประกาศความเป็นส่วนตัวเพื่อรับทราบวิธีการที่เราดูแลข้อมูลของคุณ"* | บันทึก Timestamp และ Version ที่เปิดดู/รับทราบ |
| **3. ความยินยอมรับการแจ้งเตือน Web Push (Web Push Notifications)** | แจ้งเตือนบันทึกและการทำงานบนเบราว์เซอร์ | **ความยินยอม (Consent)** | Popup / Toggle แยกต่างหาก: *"ยินยอมรับการแจ้งเตือนผ่านอุปกรณ์"* | บันทึกความยินยอม พร้อม Endpoint Token |
| **4. ความยินยอมเพื่อการตลาด / ข้อมูลข่าวสาร (Marketing Communications)** | ส่งอีเมลแนะนำฟีเจอร์หรือโปรโมชัน | **ความยินยอม (Consent)** | Checkbox ตัวเลือก (Optional Unchecked by Default) | บันทึกประวัติการ Opt-in / Opt-out |

---

## 3. สถาปัตยกรรมโมเดลข้อมูล (Database Schema Design for Consent)

เพื่อรองรับการตรวจสอบย้อนหลัง (Auditability) และการถอนความยินยอม เสนอโมเดลสำหรับ Prisma Schema ดังนี้:

```prisma
model UserConsent {
  id              String    @id @default(uuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  consentType     String    // e.g. "TERMS_OF_SERVICE", "PRIVACY_NOTICE_ACK", "WEB_PUSH", "MARKETING_EMAIL"
  version         String    // e.g. "2026.1"
  isGranted       Boolean   // true = ยินยอม, false = ถอนความยินยอม
  
  ipAddress       String?   // IP ที่ใช้ในการทำรายการ (สำหรับยืนยันความถูกต้อง)
  userAgent       String?   // เบราว์เซอร์ที่ใช้
  
  grantedAt       DateTime? // เวลาที่ยินยอม
  revokedAt       DateTime? // เวลาที่ถอนความยินยอม
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([userId, consentType])
}
```

---

## 4. แผนภาพลำดับการทำงาน (Sequence Diagram: Consent & Withdrawal)

```
[ผู้ใช้]                      [Frontend UI]                 [Backend API]             [Database]
   │                               │                             │                        │
   ├── (1) สมัครสมาชิก ───────────>│                             │                        │
   │   - Check Terms (Required)    │                             │                        │
   │   - Opt-in Email (Optional)   │                             │                        │
   │                               ├── (2) POST /auth/register ─>│                        │
   │                               │   (พร้อมรายการ Consents)     ├── บันทึก User ─────────>│
   │                               │                             ├── บันทึก Consents ────>│
   │                               │<── (3) 201 Created ─────────│                        │
   │                               │                             │                        │
   ├── (4) เปิด/ปิด Push ในหน้าเว็บ ──>│                             │                        │
   │                               ├── (5) PUT /api/consents ───>│                        │
   │                               │   (type: "WEB_PUSH",        ├── อัปเดต UserConsent ──>│
   │                               │    isGranted: false/true)   │   (revokedAt/grantedAt)│
   │                               │<── (6) 200 OK ──────────────│                        │
```

---

## 5. ข้อกำหนดสำหรับหน้าจอผู้ใช้งาน (UI Requirements)
1. **หน้า Register:**
   * ช่อง Checkbox สัญญาการใช้งานต้องไม่ถูกติ๊กเลือกไว้ล่วงหน้า (No pre-ticked box)
   * ข้อความต้องมีลิงก์คลิกเปิดอ่าน `[Terms of Service]` และ `[Privacy Notice]` ใน Modal หรือแท็บใหม่ได้อย่างสะดวก
2. **หน้า Privacy Settings (การตั้งค่าความเป็นส่วนตัว):**
   * มีแท็บ **"จัดการความยินยอม (Consent Preferences)"**
   * แสดงรายการความยินยอมทั้งหมด พร้อมวันที่ที่เคยกดให้ความยินยอม และเวอร์ชันของประกาศ
   * มีสวิตช์ Toggle ให้ผู้ใช้กด **"ถอนความยินยอม (Withdraw)"** ได้ทันทีโดยไม่มีขั้นตอนหน่วงเวลา
   * เมื่อถอนความยินยอมแล้ว ระบบจะหยุดกิจกรรมนั้นทันที (เช่น หยุดส่ง Push Notification ทันที)
