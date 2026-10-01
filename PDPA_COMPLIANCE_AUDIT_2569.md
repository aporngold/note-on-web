# เอกสารรายงานการตรวจสอบความสอดคล้องตามกฎหมาย PDPA ประจำปี พ.ศ. 2569 (ค.ศ. 2026)
## โครงการ: Note on Web (SecureNote)
**สถานะการตรวจสอบ:** `PDPA COMPLIANCE STATUS — IN PROGRESS (AUDIT & PLAN PHASE)`  
**วันที่ตรวจสอบ:** 2 ตุลาคม พ.ศ. 2569 (2026)  
**ผู้วิเคราะห์:** Senior Frontend Engineer & Privacy Systems Architect  
**เอกสารอ้างอิงหลัก:** พระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA) และประกาศคณะกรรมการคุ้มครองข้อมูลส่วนบุคคล (สคส. / PDPC) ที่เกี่ยวข้อง

---

## สรุปภาพรวมสำหรับผู้บริหารและเจ้าของระบบ (Executive Summary)

ระบบ **Note on Web** ได้รับการตรวจสอบโครงสร้างสถาปัตยกรรมทั้งฝั่ง Frontend, Backend, Database (Prisma ORM), ระบบ Real-time (Socket.io), Web Push และการเชื่อมต่อผู้ให้บริการภายนอก เพื่อประเมินความพร้อมและช่องว่างตามกฎหมายคุ้มครองข้อมูลส่วนบุคคลของประเทศไทย (PDPA) ประจำปี พ.ศ. 2569

ผลการตรวจสอบพบว่า **ระบบมีจุดแข็งด้านความมั่นคงปลอดภัยสูงกว่าเว็บแอปพลิเคชันทั่วไป** โดยเฉพาะการมีสถาปัตยกรรม **Zero-Knowledge End-to-End Encryption (AES-GCM-256)** ในห้องนิรภัย (Vault) และการไม่ติดตั้งระบบสะกดรอยหรือ Tracker โฆษณา อย่างไรก็ตาม ยังมีช่องว่างสำคัญด้านการกำกับดูแล (Governance), การแจ้งสิทธิ, การควบคุมสิทธิ์ไฟล์แนบ, และกระบวนการรองรับคำขอใช้สิทธิของเจ้าของข้อมูล (Data Subject Rights) ที่ต้องดำเนินการปรับปรุงให้ครบถ้วนก่อนการเปิดให้บริการสาธารณะอย่างเป็นทางการ

---

## 1. บทบาททางกฎหมายของ Note on Web (Role Assessment)

การวิเคราะห์จากลักษณะการทำงานจริงของระบบ (ไม่ใช่การสมมติชื่อ):

| บริบทการใช้งาน | บทบาททางกฎหมาย | เหตุผลอ้างอิงตาม พ.ร.บ. PDPA |
| :--- | :--- | :--- |
| **การให้บริการระบบจดบันทึกแก่ผู้ใช้ทั่วไป (B2C / Personal SaaS)** | **ผู้ควบคุมข้อมูลส่วนบุคคล (Data Controller)** | ระบบเป็นผู้กำหนดวัตถุประสงค์ (Purpose) และฐานการประมวลผล (Means) ในการจัดเก็บข้อมูลบัญชีผู้ใช้, การยืนยันตัวตน, โครงสร้างโน้ต, และการตั้งค่าระบบ |
| **การจัดเก็บบันทึกข้อมูลและข้อความที่ผู้ใช้ป้อนลงในโน้ตส่วนตัว** | **Data Controller (ร่วมกับ User ในฐานะ Data Subject)** | แม้ผู้ใช้จะเป็นผู้พิมพ์เนื้อหาเอง แต่ระบบเป็นผู้จัดเตรียมฐานข้อมูลและควบคุมการจัดเก็บบนคลาวด์ (กรณีห้องนิรภัย Vault มีการเข้ารหัสแบบ Zero-Knowledge ทำให้ระบบเป็นผู้ดูแล Ciphertext) |
| **กรณีองค์กรนำ Note on Web ไปโฮสต์ภายใน (On-Premises / Enterprise)** | **ผู้ประมวลผลข้อมูลส่วนบุคคล (Data Processor)** | *กรณีนี้ต้องทำบันทึกข้อตกลงประมวลผลข้อมูล (Data Processing Agreement - DPA) ร่วมกับองค์กรผู้ว่าจ้าง* `REQUIRES BUSINESS/LEGAL DECISION` |

---

## 2. แผนที่การไหลของข้อมูลส่วนบุคคล (Data Flow Map)

```
[ เจ้าของข้อมูล (User / Client Device) ]
     │
     ├── 1. ลงทะเบียน / เข้าสู่ระบบ (Email, Password Hash, Google OAuth, Passkey)
     ├── 2. ส่งเนื้อหาโน้ต, บอร์ด, รูปภาพ, ไฟล์แนบ, พิกัด Sticky Note
     ├── 3. ขอรับสัญญาณแจ้งเตือน Web Push (Browser Token: endpoint, p256dh, auth)
     │
     ▼
[ Cloudflare Edge / Turnstile Bot Verification ]  <-- (US/Global Edge) ตรวจสอบความปลอดภัย
     │
     ▼
[ Frontend: Vercel / Next.js Client ]
     │ (HTTPS / WSS, LocalStorage: Token, Theme, UI State - ไม่ใช้ Tracker ใดๆ)
     │
     ▼
[ Backend API: Node.js / Express Server (Render / Cloud VPS) ]
     │
     ├── In-Memory Socket.io Live Sync (user:id, note:id, board:id)
     ├── Local NLP AI Processing (Summarize, Rewrite - ทำบนเครื่อง 100% ฟรีภายนอก)
     │
     ├── (Optional) Google Gemini API (US) <-- เฉพาะเมื่อระบุ GEMINI_API_KEY
     ├── Google OAuth API (US) <-- ยืนยัน Token & ข้อมูลโปรไฟล์ Gmail
     ├── Web Push Service (Google FCM / Apple APNs / Mozilla Push) <-- ยิง Push Notification
     │
     ▼
[ Persistent Storage / Database Layer ]
     ├── Database: PostgreSQL (Neon Cloud / Singapore-AWS) หรือ SQLite
     │    ├── User (Credentials, Salt, Role)
     │    ├── Note / Board / Label / Notebook (Plaintext & AES-GCM Ciphertext)
     │    ├── Reminder & Notification (Timestamps, Targets)
     │    ├── PushSubscription (Tokens, Device Types)
     │    ├── Passkey / WebAuthnChallenge (Public Keys)
     │    └── AuditLog / BackupRecord (Admin Actions, System Snapshots)
     │
     └── Local / Attached Storage: `/uploads` (ไฟล์รูปภาพ, เอกสารแนบ)
```

---

## 3. สรุปผลการตรวจสอบ 9 มิติหลัก (A – I)

### A. ระบบปัจจุบัน (Current State What Exists)
1. **การเข้ารหัสระดับสูง (Encryption):** รหัสผ่านแฮชด้วย `bcryptjs`, ห้องนิรภัยเข้ารหัสที่เครื่องไคลเอนต์ (Client-Side AES-GCM-256) เซิร์ฟเวอร์ไม่ถือกุญแจถอดรหัส
2. **การถ่ายโอนข้อมูล (Data Portability):** มีระบบส่งออกข้อมูล (Export Backup) ในรูปแบบ JSON โครงสร้างสมบูรณ์ และ Markdown ตามมาตรา 31
3. **การลบบัญชีแบบ Cascade (Erasure Base):** มี Prisma schema cascading rules เมื่อลบผู้ใช้ โน้ต บอร์ด การเชื่อมต่อ และการแจ้งเตือนจะถูกลบตามทันที
4. **การยืนยันตัวตนสมัยใหม่ (FIDO2 / Passkeys):** ไม่มีการเก็บข้อมูลลายนิ้วมือหรือใบหน้าบนเซิร์ฟเวอร์ เก็บเฉพาะ Public Key ตามมาตรฐาน W3C WebAuthn
5. **ไม่มี Third-Party Ad Trackers:** ไม่มี Google Analytics, Meta Pixel, Hotjar หรือสคริปต์สอดแนมพฤติกรรม

### B. สิ่งที่ PDPA ต้องการ (PDPA Legal Requirements as of 2569)
1. **มาตรา 23 (Privacy Notice):** ต้องแจ้งวัตถุประสงค์ ฐานทางกฎหมาย ระยะเวลาจัดเก็บ สิทธิ และช่องทางติดต่อก่อนหรือขณะเก็บรวบรวม
2. **มาตรา 30 - 36 (สิทธิของเจ้าของข้อมูล):** สิทธิเข้าถึง (Access), แก้ไข (Rectification), ลบทำลาย (Erasure), ระงับใช้ (Restriction), โอนย้าย (Portability), คัดค้าน (Objection), และถอนความยินยอม (Withdrawal)
3. **มาตรา 28 - 29 (การส่งข้อมูลไปต่างประเทศ):** ต้องมีกลไกทางกฎหมายรองรับการส่งข้อมูลไปยังเซิร์ฟเวอร์ Vercel, Neon, Google, Cloudflare ในต่างประเทศ
4. **มาตรา 37 (มาตรการรักษาความมั่นคงปลอดภัย):** ต้องมีมาตรการความปลอดภัยเชิงเทคนิคและเชิงบริหารจัดการ (Technical & Organizational Measures)
5. **มาตรา 37(4) (การแจ้งเหตุละเมิดข้อมูลส่วนบุคคล):** ต้องมีแผนรับมือและแจ้ง สคส. ภายใน 72 ชั่วโมงหากเกิด Data Breach ที่มีความเสี่ยง
6. **มาตรา 39 (บันทึกรายการกิจกรรม ROPA):** ผู้ควบคุมข้อมูลต้องจัดทำบันทึกรายการกิจกรรมการประมวลผล

### C. ช่องว่างที่ตรวจพบ (Gap Analysis)
1. **ช่องโหว่การเข้าถึงไฟล์แนบโดยตรง (Unauthenticated `/uploads` Access):** เส้นทาง `/uploads` ถูกเสิร์ฟผ่าน `express.static` สาธารณะ หากบุคคลภายนอกทราบหรือเดาชื่อไฟล์ UUID ได้ จะสามารถดาวน์โหลดรูปภาพหรือไฟล์แนบได้โดยไม่ต้องล็อกอิน
2. **โน้ตที่ถูก Archive ยังเข้าถึงผ่าน Public Share ได้:** ใน `shareController.getPublicNote` ไม่มีการตรวจเช็คเงื่อนไข `isArchived: false` ทำให้โน้ตที่ถูกย้ายลงถังขยะยังสามารถเปิดอ่านผ่านลิงก์แชร์เดิมได้หากไม่ได้กดปิดแชร์
3. **ยังไม่มีหน้าจอศูนย์รับคำร้องสิทธิ PDPA (Data Rights Portal):** ผู้ใช้ยังไม่มีช่องทางยื่นคำร้องขอระงับการใช้, ขอคัดค้าน หรือตรวจสอบสถานะคำร้องแบบมีระบบบันทึก (Ticketing / Workflow)
4. **การบันทึก Audit Log ไม่ครอบคลุม:** มีการบันทึก AuditLog เฉพาะการกระทำของ Admin แต่ยังไม่มีการบันทึกประวัติการเข้าถึงข้อมูลส่วนบุคคลสำคัญ (Access Logs) หรือประวัติการยินยอม (Consent Logs)
5. **เนื้อหาแจ้งเตือนบน Lock Screen:** ข้อความพุช Web Push ยังส่งเนื้อหาโน้ต (Body snippet) ไปยังหน้าจออุปกรณ์ ซึ่งอาจถูกบุคคลอื่นมองเห็นบนหน้าจอล็อกได้ (Should offer "Hide Content on Lock Screen" toggle)

### D. การประเมินระดับความเสี่ยง (Risk Assessment Matrix)

| รายการความเสี่ยง | ระดับความเสี่ยง | ผลกระทบตามกฎหมาย / ความปลอดภัย |
| :--- | :---: | :--- |
| 1. ไฟล์แนบ `/uploads` เข้าถึงได้โดยไม่ต้องยืนยันตัวตน | **HIGH** | ผิดมาตรา 37 ด้านมาตรการควบคุมการเข้าถึง (Access Control) |
| 2. โน้ตในถังขยะยังเข้าถึงได้ผ่าน Public Share Link เดิม | **MEDIUM** | อาจขัดต่อความประสงค์ของผู้ใช้ในการจำกัดการเข้าถึงข้อมูล |
| 3. ขาดบันทึก ROPA ทางการตามมาตรา 39 | **MEDIUM** | มีโทษปรับทางปกครองตามกฎหมาย PDPA หากถูกเจ้าพนักงานตรวจสอบ |
| 4. ขาดกระบวนการรองรับเหตุ Data Breach ภายใน 72 ชั่วโมง | **HIGH** | โทษปรับทางปกครองตามมาตรา 83 สูงสุดไม่เกิน 3,000,000 บาท |
| 5. ข้อมูลส่งไปยัง Cloud Server ในต่างประเทศโดยไม่มีการชี้แจง | **MEDIUM** | ต้องระบุใน Privacy Notice ให้สอดคล้องตามข้อยกเว้นมาตรา 28 |
| 6. ป้ายสถานะ Cookie/Local Storage ไม่ได้ระบุแยกประเภท | **LOW** | ระบบมีเฉพาะ Strictly Necessary & Functional LocalStorage ไม่มีความเสี่ยงเรื่องโฆษณา |

### E. รายการไฟล์ทางเทคนิคที่เกี่ยวข้อง (Technical Scope)
- `backend/src/server.ts` (ปรับปรุง Static File Serving สำหรับ `/uploads` ให้มี Token/Auth check)
- `backend/src/controllers/shareController.ts` (เพิ่มการตรวจสอบ `isArchived: false` ใน `getPublicNote`)
- `backend/src/controllers/uploadController.ts` (จัดระเบียบสิทธิ์การอ่านไฟล์)
- `backend/src/services/reminderScheduler.ts` (เพิ่มตัวเลือกซ่อนเนื้อหาใน Web Push)
- `backend/src/controllers/authController.ts` (ระบบ Audit Log เพิ่มเติม)
- `frontend/src/pages/privacy.tsx` (เชื่อมโยงเอกสารนโยบาย PDPA)
- `frontend/src/components/modals/DeleteAccountModal.tsx` (ส่วนหนึ่งของ Right to Erasure)

### F. เอกสารประกอบการปฏิบัติตามกฎหมายที่จัดทำขึ้น (Documentation Set)
1. [PDPA_COMPLIANCE_AUDIT_2569.md](file:///c:/Users/AsusF15/Desktop/%28%28_Gemini_ProJect_%29%29/NoteOnWeb/PDPA_COMPLIANCE_AUDIT_2569.md) *(เอกสารหลักฉบับนี้)*
2. [PDPA_GAP_ANALYSIS_2569.md](file:///c:/Users/AsusF15/Desktop/%28%28_Gemini_ProJect_%29%29/NoteOnWeb/PDPA_GAP_ANALYSIS_2569.md) *(ตารางวิเคราะห์ช่องว่างและการเปรียบเทียบข้อกฎหมาย)*
3. [ROPA.md](file:///c:/Users/AsusF15/Desktop/%28%28_Gemini_ProJect_%29%29/NoteOnWeb/ROPA.md) *(บันทึกรายการกิจกรรมการประมวลผลข้อมูลตามมาตรา 39)*
4. [PRIVACY_NOTICE_TH.md](file:///c:/Users/AsusF15/Desktop/%28%28_Gemini_ProJect_%29%29/NoteOnWeb/PRIVACY_NOTICE_TH.md) *(ประกาศความเป็นส่วนตัวภาษาไทย มาตรา 23)*
5. [PRIVACY_NOTICE_EN.md](file:///c:/Users/AsusF15/Desktop/%28%28_Gemini_ProJect_%29%29/NoteOnWeb/PRIVACY_NOTICE_EN.md) *(Privacy Notice English Version)*
6. [COOKIE_POLICY_TH.md](file:///c:/Users/AsusF15/Desktop/%28%28_Gemini_ProJect_%29%29/NoteOnWeb/COOKIE_POLICY_TH.md) *(นโยบายการใช้งานคุกกี้และ LocalStorage)*
7. [DATA_RETENTION_POLICY.md](file:///c:/Users/AsusF15/Desktop/%28%28_Gemini_ProJect_%29%29/NoteOnWeb/DATA_RETENTION_POLICY.md) *(นโยบายระยะเวลาการจัดเก็บและทำลายข้อมูล)*
8. [DATA_SUBJECT_RIGHTS.md](file:///c:/Users/AsusF15/Desktop/%28%28_Gemini_ProJect_%29%29/NoteOnWeb/DATA_SUBJECT_RIGHTS.md) *(คู่มือและขั้นตอนปฏิบัติการจัดการสิทธิของเจ้าของข้อมูล)*
9. [DATA_BREACH_RESPONSE_PLAN.md](file:///c:/Users/AsusF15/Desktop/%28%28_Gemini_ProJect_%29%29/NoteOnWeb/DATA_BREACH_RESPONSE_PLAN.md) *(แผนเผชิญเหตุและการแจ้งเหตุละเมิดข้อมูล 72 ชม.)*
10. [THIRD_PARTY_DATA_PROCESSORS.md](file:///c:/Users/AsusF15/Desktop/%28%28_Gemini_ProJect_%29%29/NoteOnWeb/THIRD_PARTY_DATA_PROCESSORS.md) *(บัญชีผู้ประมวลผลข้อมูลและบริการภายนอก)*
11. [CONSENT_MANAGEMENT_SPEC.md](file:///c:/Users/AsusF15/Desktop/%28%28_Gemini_ProJect_%29%29/NoteOnWeb/CONSENT_MANAGEMENT_SPEC.md) *(ข้อกำหนดเชิงเทคนิคการจัดการความยินยอม)*

### G. เรื่องที่ต้องให้เจ้าของระบบตัดสินใจ (Business Decisions Required)
- `REQUIRES SYSTEM OWNER INPUT`: ชื่อองค์กร / นิติบุคคล หรือชื่อบุคคลธรรมดาผู้ถือสิทธิ์เป็นผู้ควบคุมข้อมูล (Data Controller) พร้อมที่อยู่และอีเมลทางการ
- `REQUIRES SYSTEM OWNER INPUT`: กำหนดระยะเวลาการล้างไฟล์ขยะใน Trash แบบอัตโนมัติ (เช่น 30 วัน หรือ เก็บจนกว่าผู้ใช้จะกดล้างเอง)
- `REQUIRES SYSTEM OWNER INPUT`: การตัดสินใจว่าจะเปิดใช้งาน Gemini AI ในโหมดคลาวด์สำหรับผู้ใช้ทั่วไปหรือไม่ (เนื่องจากเนื้อหาโน้ตจะถูกส่งไปประมวลผลที่ Google Cloud US) หรือคงไว้เฉพาะ Local Smart NLP ที่ประมวลผลในเครื่อง 100%

### H. เรื่องที่ต้องให้ผู้เชี่ยวชาญกฎหมายตรวจสอบ (Legal Review Required)
- `REQUIRES LEGAL REVIEW`: การประเมินข้อยกเว้นการแต่งตั้งเจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล (DPO) ตามมาตรา 41 อย่างเป็นทางการเมื่อมีปริมาณผู้ใช้งานเพิ่มขึ้นในอนาคต
- `REQUIRES LEGAL REVIEW`: การทบทวนสัญญาประมวลผลข้อมูล (Data Processing Agreements - DPA) กับผู้ให้บริการต่างประเทศ (Vercel, Render, Neon, Google) เพื่อให้สอดคล้องกับประกาศ สคส. เรื่องการโอนข้อมูลไปต่างประเทศตามมาตรา 28 และ 29

### I. ลำดับการดำเนินงานที่แนะนำ (Implementation Roadmap)
1. **ระยะเร่งด่วน (Immediate Priority):**
   - แก้ไข `shareController.ts` ปิดการเข้าถึง Public Share เมื่อโน้ตอยู่ในสถานะ `isArchived: true`
   - ปรับปรุงการเข้าถึง `/uploads` ป้องกัน Direct Insecure Access
2. **ระยะกลาง (Medium Priority):**
   - เพิ่มระบบบันทึก Audit Log สำหรับการเข้าสู่ระบบ, การ Export ข้อมูล และการลบบัญชี
   - บันทึกเวอร์ชันของ Privacy Notice เมื่อผู้ใช้ยินยอม
3. **ระยะสมบูรณ์ (Governance & Operations):**
   - อัปเดตข้อมูลผู้ควบคุมข้อมูลส่วนบุคคลในเอกสาร Privacy Notice เมื่อพร้อมเปิดให้บริการเชิงพาณิชย์
   - ซักซ้อมกระบวนการ Data Breach Response Plan ร่วมกับทีมผู้ดูแลระบบ

---
*เอกสารนี้จัดทำขึ้นจากการตรวจสอบ Source Code และระบบโครงสร้างพื้นฐานจริง ณ เดือนตุลาคม 2569*
