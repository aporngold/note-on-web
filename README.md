# 🔒 SecureNote - Complete Web Application

> เว็บแอปพลิเคชันจดบันทึกความปลอดภัยสูงระดับโลก พร้อมระบบ **End-to-End Encryption (AES-256)**, **Secure Vault**, สมุดบันทึก (Notebooks), ป้ายกำกับ (Labels), ระบบค้นหา Real-time, และดีไซน์ระดับพรีเมียม (Rich Glassmorphism & Dark Mode)

---

## ✨ ฟีเจอร์เด่น (Features)

### 1. 🔐 ความปลอดภัยระดับสูงสุด (End-to-End Encryption)
- **AES-256-GCM / CBC + PBKDF2**: โน้ตที่ถูกล็อกจะถูกเข้ารหัสลับบนเบราว์เซอร์ของผู้ใช้ก่อนส่งไปเก็บที่เซิร์ฟเวอร์
- **Secure Vault (ห้องนิรภัย)**: หน้าต่างนิรภัยเฉพาะที่ต้องใช้ Master Password เพื่อปลดล็อกและดูข้อมูล
- **Client-Side Decryption**: กุญแจรหัสผ่านถูกประมวลผลใน Memory ของเครื่องเท่านั้น เซิร์ฟเวอร์ไม่สามารถเข้าถึงข้อมูลลับได้

### 2. 📝 จัดการโน้ตอย่างยืดหยุ่น (Rich Note Management)
- **Editor ทรงพลัง**: รองรับหัวข้อ (H1, H2), ตัวหนา, ตัวเอียง, เช็คลิสต์งาน, โค้ดบล็อก, คำพูดอ้างอิง, รายการลำดับ
- **Markdown & Live Preview**: สลับมุมมองดูตัวอย่าง Markdown ได้ทันที
- **ปักหมุด (Pin)**: ตรึงโน้ตสำคัญไว้ด้านบนสุดเสมอ
- **สีประจำโน้ต (Color Palette)**: ปรับแต่งสีขอบโน้ตได้ 8 เฉดสีเพื่อความสวยงามและการจดจำ
- **คัดลอก (Duplicate)**: โคลนโน้ตเพื่อนำไปต่อยอดได้ในคลิกเดียว
- **ถังขยะและกู้คืน (Trash & Restore)**: ลบโน้ตลงถังขยะ และสามารถกู้คืนกลับมาหรือลบถาวรได้
- **ส่งออกข้อมูล (Export)**: ดาวน์โหลดโน้ตเป็นไฟล์ `.md` (Markdown) หรือสั่งพิมพ์ / บันทึกเป็น PDF ได้ทันที

### 3. 📂 การจัดระเบียบที่สมบูรณ์แบบ (Organization)
- **สมุดบันทึก (Notebooks)**: สร้างหมวดหมู่ เช่น งาน, ส่วนตัว, บันทึกการประชุม พร้อมแสดงจำนวนโน้ต
- **ป้ายกำกับ (Labels/Tags)**: สร้างแฮชแท็กใส่สีสัน เพื่อจัดกลุ่มโน้ตข้ามสมุด
- **ค้นหาแบบ Real-time**: พิมพ์ค้นหาตามชื่อเรื่องหรือเนื้อหาภายในโน้ตได้ทันที
- **ตัวกรอง (Filters)**: กรองตามสมุดบันทึก, ป้ายกำกับ, สี, หรือโน้ตที่ปักหมุด
- **Grid View & List View**: สลับมุมมองการแสดงผลแบบการ์ดตารางหรือแบบรายการ

### 4. 🎨 ประสบการณ์ใช้งานระดับพรีเมียม (UI/UX Aesthetics)
- **Dark Mode & Light Mode**: สลับธีมมืดและสว่างได้สมบูรณ์แบบ ถนอมสายตา
- **Modern Typography**: ใช้ฟอนต์ Plus Jakarta Sans ดีไซน์สวยงาม ทันสมัย
- **Responsive**: ใช้งานได้ลื่นไหลทั้งบนคอมพิวเตอร์ แท็บเล็ต และสมาร์ทโฟน

---

## 📁 โครงสร้างโปรเจกต์ (Directory Structure)

```
NoteOnWeb/
├── backend/                  # REST API Server (Node.js, Express, TypeScript, Prisma, SQLite/PostgreSQL)
│   ├── prisma/schema.prisma  # Database Model & Schema
│   ├── src/
│   │   ├── controllers/      # Auth, Notes, Notebooks, Labels controllers
│   │   ├── middleware/       # JWT Auth & Global Error Handler
│   │   ├── routes/           # Express Route definitions
│   │   ├── utils/            # Prisma Client instance
│   │   └── server.ts         # Express + Socket.io Server Entry Point
│   └── package.json
│
├── frontend/                 # Client Web Application (Next.js, Tailwind CSS, Zustand, Lucide)
│   ├── src/
│   │   ├── components/       # Layout, Sidebar, NoteCard, NoteList, Modals, NoteEditor
│   │   ├── pages/            # Dashboard, Login, Register, Notes Editor, Vault, Trash
│   │   ├── store/            # Zustand Stores (authStore, noteStore)
│   │   ├── utils/            # Axios API Client, Encryption Service (AES-256)
│   │   └── styles/           # Tailwind & Custom Global CSS
│   └── package.json
│
├── docker/                   # Dockerfiles & docker-compose for Production
├── raw_deepseek_backup/      # สำเนาไฟล์ชิ้นส่วนดิบ 26 ไฟล์ดั้งเดิม
├── start.bat                 # สคริปต์คลิกเดียวรันระบบบน Windows
└── package.json              # Root package configuration
```

---

## 🚀 วิธีการติดตั้งและเริ่มใช้งาน (Quick Start)

### ข้อกำหนดเบื้องต้น (Prerequisites)
- ติดตั้ง [Node.js](https://nodejs.org/) (เวอร์ชัน 18 ขึ้นไป)

### วิธีที่ 1: รันด้วย start.bat (ง่ายที่สุดบน Windows)
ดับเบิลคลิกไฟล์ `start.bat` ในโฟลเดอร์ `NoteOnWeb` ระบบจะเปิดเซิร์ฟเวอร์ Backend และ Frontend ให้อัตโนมัติ

---

### วิธีที่ 2: รันผ่าน Terminal (Command Line)

1. **เข้าสู่โฟลเดอร์โปรเจกต์:**
   ```bash
   cd NoteOnWeb
   ```

2. **รัน Backend:**
   ```bash
   cd backend
   npm run dev
   ```
   *Backend จะทำงานที่ `http://localhost:5000` (ใช้ SQLite ฐานข้อมูลในตัว ไม่ต้องติดตั้ง PostgreSQL)*

3. **รัน Frontend (ในอีกหน้าต่าง Terminal หนึ่ง):**
   ```bash
   cd frontend
   npm run dev
   ```
   *Frontend จะทำงานที่ `http://localhost:3000`*

4. **เปิดเบราว์เซอร์เข้าใช้งาน:**
   👉 เข้าไปที่ [http://localhost:3000](http://localhost:3000)

---

## 🐳 การใช้งานด้วย Docker (Production Deployment)

หากต้องการ Deploy ด้วย Docker และใช้ PostgreSQL + Redis:

```bash
cd NoteOnWeb/docker
docker-compose up -d
```
- Web Application: `http://localhost:3000`
- API Server: `http://localhost:5000`
- PostgreSQL: `localhost:5432`

---

## 🛡️ ข้อมูลทางเทคนิคด้านความปลอดภัย (Security Architecture)

- **Authentication**: JWT (JSON Web Tokens) อายุ 7 วัน พร้อม Session Tracking ใน Database
- **Password Hashing**: Bcrypt with Salt rounds 10
- **Vault Encryption**: AES-256-CBC with PBKDF2 key derivation (100,000 iterations)
- **API Protection**: Helmet security headers, CORS origin verification, Express Rate Limiter
