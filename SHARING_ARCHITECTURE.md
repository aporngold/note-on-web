# Note on Web — Sharing Architecture Documentation

เอกสารนี้รวบรวมและวิเคราะห์สถาปัตยกรรมระบบ **Sharing (การแชร์ข้อมูล)** ทั้งหมดที่มีอยู่จริงใน Source Code ของโปรเจกต์ **Note on Web (SecureNote)** เพื่อใช้เป็นข้อมูลอ้างอิงสำหรับ AI หรือทีมนักพัฒนา

> **ข้อกำหนดในการจัดทำเอกสาร:**
> - อ้างอิงจาก Source Code ที่มีอยู่จริง ณ ปัจจุบันเท่านั้น
> - ไม่มีการสมมติฟีเจอร์หรือโครงสร้างที่ไม่มีอยู่จริง
> - ส่วนใดที่ไม่มีการพัฒนาหรือหาไม่พบในโค้ด จะระบุไว้อย่างชัดเจนว่า `NOT FOUND IN CURRENT SOURCE CODE`

---

## 1. Overview (ภาพรวมระบบ Sharing)

ระบบ Sharing ของโปรเจกต์ **Note on Web** ปัจจุบันทำงานในรูปแบบ **Link-based Public Sharing (การแชร์ผ่านลิงก์รหัสเฉพาะ Share Code)** เป็นหลัก

### สิ่งที่ระบบรองรับจริงในปัจจุบัน:
1. **Share Note via Link:** เจ้าของโน้ตสามารถสร้าง Link สาธารณะ (`shareCode`) เพื่อให้ผู้อื่นเปิดอ่านโน้ตได้โดยไม่ต้อง Login
2. **Password Protection for Shared Note:** เจ้าของโน้ตสามารถกำหนดรหัสผ่าน (Password) ป้องกันการเข้าดูโน้ตที่แชร์ได้ โดยระบบจะ Hash ด้วย `bcrypt`
3. **Share Board via Link:** เจ้าของกระดาน (Board) สามารถเปิดแชร์กระดานเป็นสาธารณะ (`isPublic: true`, `shareCode`) เพื่อให้ผู้อื่นดูโน้ตทั้งหมดที่อยู่บนกระดานนั้นได้
4. **Active Collaborators Presence (Real-time):** มีการแสดงสถานะผู้กำลังเปิดดูโน้ตเดียวกันผ่าน Socket.IO (`ActiveCollaboratorsBar`) สำหรับผู้ใช้ที่ Login เข้าสู่ระบบ
5. **Mobile Native Web Share:** รองรับปุ่ม Web Share API (`navigator.share`) เพื่อส่งลิงก์แชร์เข้าแอปในมือถือ (LINE, Messenger, AirDrop ฯลฯ) ทันที

### สิ่งที่ NOT FOUND IN CURRENT SOURCE CODE (ไม่มีอยู่จริงในระบบ):
- `NOT FOUND`: **Direct User-to-User Sharing** (ไม่มีระบบระบุ email / username ของผู้ใช้อื่นเพื่อแชร์ให้เฉพาะบัญชีนั้น)
- `NOT FOUND`: **Notebook Sharing** (สมุดบันทึก Notebook ไม่รองรับการแชร์)
- `NOT FOUND`: **Invitation System** (ไม่มีระบบส่งคำเชิญ หรือแจ้งเตือนการได้รับแชร์)
- `NOT FOUND`: **Public / Recipient Collaborative Editing** (แม้ใน UI จะมีตัวเลือก `edit` / "แก้ไขร่วมกันได้" แต่ใน Controller และหน้ารับแชร์ `/share/[code]` ไม่มีโค้ดหรือ API สำหรับให้ผู้รับแก้ไขโน้ตหรือบอร์ดได้จริง)
- `NOT FOUND`: **Share Link Expiration** (ไม่มีการตั้งเวลาหมดอายุของลิงก์แชร์)

---

## 2. Current Features (ฟีเจอร์ที่มีอยู่จริง)

| ฟีเจอร์ | สถานะในโค้ด | รายละเอียดการทำงาน |
| :--- | :---: | :--- |
| **Share Note by Link** | มีอยู่จริง | สร้าง `shareCode` สุ่ม 10 ตัวอักษร เข้าถึงได้ที่ `/share/[code]` |
| **Password Protected Note** | มีอยู่จริง | ใส่รหัสผ่านเพื่อเข้าอ่านโน้ต ตรวจสอบผ่าน Header `x-share-password` |
| **Share Board by Link** | มีอยู่จริง | สร้าง `shareCode` สุ่ม 16 ตัวอักษร (hex) เข้าถึงได้ที่ `/share/[code]` |
| **Filter E2EE Notes on Shared Board** | มีอยู่จริง | โน้ตที่ติด `isLocked: true` จะถูกกรองออก ไม่แสดงบนกระดานแชร์สาธารณะ |
| **File Attachments in Shared View** | มีอยู่จริง | ผู้รับลิงก์สามารถดาวน์โหลดไฟล์แนบของโน้ตได้ |
| **Active Collaborator Indicator** | มีอยู่จริง | แสดง avatar ผู้กำลังเปิดดูโน้ตเดียวกันแบบ Real-time (`join-note` room) |
| **Shared Note Direct User Table** | Schema Only | โมเดล `SharedNote` มีอยู่ใน Prisma Schema แต่ไม่มี Controller/API ใช้งาน |
| **Direct User Invite / Member** | `NOT FOUND` | ไม่มีระบบค้นหาเพื่อนหรือเพิ่ม Collaborator ตาม User ID |
| **Share Notebook** | `NOT FOUND` | ตาราง `Notebook` ไม่มี field และ controller สำหรับแชร์ |
| **Shared Link Expiry** | `NOT FOUND` | ไม่มี field `expiresAt` สำหรับลิงก์แชร์ |

---

## 3. Frontend Architecture

### 3.1 โครงสร้างไฟล์ Frontend ที่เกี่ยวข้อง

```text
frontend/src/
├── pages/
│   └── share/
│       └── [code].tsx               # หน้าเว็บสำหรับผู้รับเปิดอ่าน Shared Note หรือ Shared Board
├── components/
│   ├── notes/
│   │   ├── ShareNoteModal.tsx       # Modal ตั้งค่าแชร์โน้ต (เปิด/ปิด, ตั้งรหัสผ่าน, เลือกสิทธิ์, คัดลอกลิงก์)
│   │   ├── ActiveCollaboratorsBar.tsx # แถบแสดง Avatar ผู้ที่กำลังเปิดดูโน้ตเดียวกันแบบ Real-time
│   │   ├── NoteCard.tsx             # มีปุ่มเปิด ShareNoteModal
│   │   ├── NoteList.tsx             # มีปุ่มเปิด ShareNoteModal
│   │   ├── NoteEditor.tsx           # มีปุ่มเปิด ShareNoteModal และแสดง ActiveCollaboratorsBar
│   │   └── FullscreenNoteModal.tsx  # มีปุ่มเปิด ShareNoteModal และแสดง ActiveCollaboratorsBar
│   ├── modals/
│   │   └── BoardShareModal.tsx      # Modal ตั้งค่าแชร์กระดาน (เปิด/ปิด สาธารณะ, เลือกสิทธิ์, คัดลอกลิงก์)
│   └── board/
│       ├── StickyBoard.tsx          # มีปุ่มเปิด BoardShareModal บนกระดาน
│       └── StickyNoteItem.tsx       # มีปุ่มเปิด ShareNoteModal บนโพสต์อิท
├── store/
│   └── noteStore.ts                 # Zustand Store (มี action shareBoard)
├── utils/
│   ├── socketClient.ts              # Socket.IO client instance singleton
│   └── api.ts                       # Axios client สำหรับ Authenticated Requests
└── types/
    └── index.ts                     # TypeScript Interfaces: Board, Note, ShareSettings, ActiveCollaborator
```

### 3.2 รายละเอียด Component สำคัญ

#### 1) `frontend/src/components/notes/ShareNoteModal.tsx`
- **หน้าที่:** หน้าต่างตั้งค่าการแชร์ของโน้ตสำหรับเจ้าของโน้ต
- **State ภายใน:**
  - `isShared`: boolean (เปิด/ปิด การแชร์สาธารณะ)
  - `shareCode`: string | null (รหัสแชร์ 10 ตัวอักษร)
  - `permission`: `'read' | 'edit'`
  - `hasPassword`: boolean (สถานะว่ามีการล็อกรหัสผ่านอยู่หรือไม่)
  - `password`: string (รหัสผ่านใหม่ที่ต้องการตั้ง)
  - `isCopied`: boolean
- **API ที่เรียกใช้:**
  - `GET /api/share/${noteId}/settings`: ดึงสถานะการแชร์ปัจจุบัน
  - `POST /api/share/${noteId}`: บันทึกการเปิด/ปิดแชร์, สิทธิ์, รหัสผ่าน

#### 2) `frontend/src/components/modals/BoardShareModal.tsx`
- **หน้าที่:** หน้าต่างตั้งค่าการแชร์ของกระดาน (Board) สำหรับเจ้าของ
- **State ภายใน:**
  - `isPublic`: boolean
  - `permission`: `'read' | 'edit'`
  - `isCopied`: boolean
- **API / Action ที่เรียกใช้:**
  - `useNoteStore().shareBoard(board.id, { isPublic, sharePermission })` -> `POST /api/boards/${id}/share`

#### 3) `frontend/src/pages/share/[code].tsx`
- **หน้าที่:** หน้าแสดงผลสำหรับผู้รับลิงก์ (Public Viewer)
- **การทำงาน:**
  1. ดึง `code` จาก URL query (`/share/[code]`)
  2. ยิงคำขอแรกไปที่ `GET /api/share/public/${code}`
     - หากได้รับ `401` และ `isPasswordRequired: true` -> แสดงกล่องให้กรอก Password
     - หากสำเร็จ -> แสดงผล **Shared Note Viewer** (Title, Author, UpdatedAt, Content ผ่าน `dangerouslySetInnerHTML`, Attachments)
  3. หากไม่พบโน้ต (404) -> ลองยิงคำขอที่สองไปที่ `GET /api/boards/shared/${code}`
     - หากสำเร็จ -> แสดงผล **Shared Board Viewer** (ชื่อบอร์ด, เจ้าของ, การ์ดโน้ตทั้งหมดที่ `!isArchived` และ `!isLocked`)
     - การคลิกการ์ดโน้ตบนบอร์ดจะเปิด Modal อ่านโน้ตแบบ Read-Only
  4. หากไม่พบทั้งคู่ -> แสดง Error "ไม่พบบันทึกหรือกระดานนี้ หรือลิงก์การแชร์ถูกปิดการใช้งานแล้ว"

#### 4) `frontend/src/components/notes/ActiveCollaboratorsBar.tsx`
- **หน้าที่:** แสดงรายชื่อผู้ใช้ที่กำลังเปิดดูโน้ตเดียวกัน
- **การทำงาน:**
  - ทำงานเฉพาะผู้ใช้ที่ Login (`user` จาก `useAuthStore`)
  - เชื่อมต่อ Socket.IO ส่ง `join-note` พร้อม `{ noteId, userId, username }`
  - รอรับ Event `note-presence-updated` เพื่อนำ Array ของ ActiveCollaborator มา Render จุดสีและตัวอักษรย่อ

---

## 4. Backend Architecture

### 4.1 โครงสร้างไฟล์ Backend ที่เกี่ยวข้อง

```text
backend/src/
├── routes/
│   ├── shareRoutes.ts               # Routing เส้นทาง /api/share
│   └── boardRoutes.ts               # Routing เส้นทาง /api/boards (รวม /shared/:shareCode)
├── controllers/
│   ├── shareController.ts           # Business Logic การแชร์โน้ต (updateSettings, getSettings, getPublicNote)
│   ├── boardController.ts           # Business Logic กระดาน (shareBoard, getSharedBoard)
│   ├── noteController.ts            # ตรวจสอบสิทธิ์ Note (getNoteById, updateNote, deleteNote)
│   └── versionController.ts         # ตรวจสอบสิทธิ์ Version (getVersions, createVersion)
├── server.ts                        # กำหนด Socket.IO connection & Presence Map
└── utils/
    ├── socket.ts                    # Helper emitToUser, emitToBoard
    └── database.ts                  # Prisma Client instance
```

---

## 5. Database Architecture (Prisma Schema)

โมเดลที่เกี่ยวข้องกับการแชร์ใน [schema.prisma](file:///c:/Users/AsusF15/Desktop/%28%28_Gemini_ProJect_%29%29/NoteOnWeb/backend/prisma/schema.prisma):

### 5.1 ตาราง `Note` (ฟิลด์ที่เกี่ยวกับการแชร์)

```prisma
model Note {
  id              String       @id @default(cuid())
  title           String?
  content         String
  userId          String
  user            User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  boardId         String?
  board           Board?       @relation(fields: [boardId], references: [id], onDelete: SetNull)
  isArchived      Boolean      @default(false)
  isLocked        Boolean      @default(false)

  // ฟิลด์การแชร์ลิงก์
  shareCode       String?      @unique
  sharePassword   String?      // bcrypt hash
  sharePermission String       @default("read") // 'read' | 'edit'

  shares          SharedNote[] // ความสัมพันธ์ไปยัง SharedNote
  attachments     FileAttachment[]
  ...
}
```

### 5.2 ตาราง `Board` (ฟิลด์ที่เกี่ยวกับการแชร์)

```prisma
model Board {
  id              String       @id @default(cuid())
  name            String
  description     String?
  userId          String
  user            User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // ฟิลด์การแชร์กระดาน
  shareCode       String?      @unique
  isPublic        Boolean      @default(false)
  sharePermission String       @default("read") // 'read' | 'edit'

  notes           Note[]
  connections     NoteConnection[]
  ...
}
```

### 5.3 ตาราง `SharedNote` (ความสัมพันธ์ระดับผู้ใช้)

```prisma
model SharedNote {
  id            String       @id @default(cuid())
  noteId        String
  note          Note         @relation(fields: [noteId], references: [id], onDelete: Cascade)
  sharedWithId  String
  sharedWith    User         @relation(fields: [sharedWithId], references: [id], onDelete: Cascade)
  permission    String       @default("read")
  createdAt     DateTime     @default(now())

  @@unique([noteId, sharedWithId])
}
```

> ⚠️ **ข้อเท็จจริงสำคัญในโค้ด:**
> - แม้ตาราง `SharedNote` จะถูกประกาศไว้ใน Schema แต่ **ไม่มี Controller หรือ API ใดที่ทำการ `prisma.sharedNote.create` หรือจัดการตารางนี้**
> - มีเพียงคำสั่ง Query ใน `noteController.getNoteById` และ `versionController` ที่เขียนเผื่อไว้แบบ:
>   `{ OR: [{ userId }, { shares: { some: { sharedWithId: userId } } }] }`
> - ตาราง `Board` **ไม่มี** ตารางความสัมพันธ์ `SharedBoard`

---

## 6. API Documentation

### 6.1 Note Sharing APIs

#### 1) `GET /api/share/public/:code`
- **Purpose:** ดึงข้อมูลโน้ตที่แชร์ผ่านลิงก์สาธารณะ
- **Authentication:** ไม่ต้อง Login (Public)
- **Request Headers / Query:**
  - Header: `x-share-password: <password>` (กรณีมีรหัสผ่าน)
  - หรือ Query: `?password=<password>`
- **Response (200 OK):**
  ```json
  {
    "id": "cl...",
    "title": "ข้อความบันทึก",
    "content": "<p>เนื้อหา HTML...</p>",
    "color": "#FEF08A",
    "textColor": "#1e293b",
    "permission": "read",
    "updatedAt": "2026-10-01T...",
    "author": "john_doe",
    "attachments": [...]
  }
  ```
- **Response (401 Unauthorized - ติดรหัสผ่าน):**
  ```json
  {
    "isPasswordRequired": true,
    "title": "บันทึกที่ได้รับการป้องกันด้วยรหัสผ่าน",
    "author": "john_doe",
    "updatedAt": "2026-10-01T..."
  }
  ```
- **Permission Check:**
  - ค้นหา `Note` จาก `shareCode: code`
  - หาก `note.sharePassword` มีค่า จะตรวจสอบด้วย `bcrypt.compare`

#### 2) `GET /api/share/:noteId/settings`
- **Purpose:** ให้เจ้าของโน้ตดึงการตั้งค่าการแชร์ปัจจุบัน
- **Authentication:** จำเป็น (`authenticate` JWT)
- **Authorization Check:** `where: { id: noteId, userId: req.userId }` (ต้องเป็นเจ้าของเท่านั้น)
- **Response (200 OK):**
  ```json
  {
    "isShared": true,
    "shareCode": "a1b2c3d4e5",
    "sharePermission": "read",
    "hasPassword": true
  }
  ```

#### 3) `POST /api/share/:noteId`
- **Purpose:** อัปเดตหรือเปิด/ปิดการแชร์ลิงก์ของโน้ต
- **Authentication:** จำเป็น (`authenticate` JWT)
- **Authorization Check:** `where: { id: noteId, userId: req.userId }`
- **Request Body:**
  ```json
  {
    "isShared": true,
    "permission": "read",
    "password": "mySecretPassword"
  }
  ```
- **Database Action:**
  - หาก `isShared: false` -> อัปเดต `shareCode: null, sharePassword: null, sharePermission: 'read'`
  - หาก `isShared: true` -> สร้าง `shareCode = note.shareCode || uuidv4().substring(0, 10)` และ Hash รหัสผ่านด้วย bcrypt (หากมีการส่งมา)

---

### 6.2 Board Sharing APIs

#### 1) `GET /api/boards/shared/:shareCode`
- **Purpose:** ดึงข้อมูลกระดานที่แชร์สาธารณะพร้อมโน้ตทั้งหมดบนกระดาน
- **Authentication:** ไม่ต้อง Login (Public)
- **Permission Check:** ค้นหา `Board` จาก `shareCode` และต้องมี `isPublic === true`
- **Security Filter:** คัดกรองโน้ตด้วยเงื่อนไข `where: { isArchived: false, isLocked: false }` (โน้ตในถังขยะและโน้ต E2EE จะไม่ถูกส่งออกมา)
- **Response (200 OK):**
  ```json
  {
    "id": "cl...",
    "name": "Project Board",
    "description": "...",
    "color": "#F59E0B",
    "theme": "cork",
    "isPublic": true,
    "sharePermission": "read",
    "user": { "id": "...", "username": "owner" },
    "notes": [...],
    "connections": [...]
  }
  ```

#### 2) `POST /api/boards/:id/share`
- **Purpose:** เปิด/ปิดการแชร์กระดาน และตั้งค่าสิทธิ์
- **Authentication:** จำเป็น (`authenticate` JWT)
- **Authorization Check:** `where: { id, userId: req.userId }`
- **Request Body:**
  ```json
  {
    "isPublic": true,
    "sharePermission": "read"
  }
  ```
- **Database Action:**
  - สร้าง `shareCode = board.shareCode || crypto.randomBytes(8).toString('hex')`
  - อัปเดต `isPublic` และ `sharePermission`

---

## 7. Authentication

1. **ผู้รับลิงก์ (Recipient):**
   - **ไม่ต้อง Login** สามารถเปิดดูโน้ตหรือกระดานผ่าน URL `/share/[code]` ได้โดยตรง
   - มีเพียงการยืนยันรหัสผ่านเฉพาะของโน้ต (Note Password) หากเจ้าของตั้งไว้
2. **เจ้าของโน้ต/กระดาน (Owner):**
   - ต้องผ่าน JWT Authentication ผ่าน Middleware `authenticate` (`req.userId`)
   - ระบบตรวจสอบสิทธิ์ความเป็นเจ้าของ (`userId === req.userId`) ทุกครั้งที่มีการเปิด/ปิดแชร์ หรือแก้ไขการตั้งค่า

---

## 8. Authorization & Permission Model

### 8.1 สิทธิ์ที่มีในระบบ (Roles & Permissions)

| สิทธิ์ / บทบาท | ที่มาในโค้ด | สิ่งที่ทำได้จริงในระบบ | สิ่งที่ระบุใน UI แต่ยังทำไม่ได้จริง |
| :--- | :--- | :--- | :--- |
| **Owner** | `note.userId` / `board.userId` | ควบคุมได้ 100% (ดู, แก้ไข, ลบ, เปิด/ปิดแชร์, ตั้งรหัสผ่าน) | - |
| **Viewer (Read Only)** | `sharePermission: 'read'` | เปิดดูเนื้อหาผ่าน `/share/[code]`, ดาวน์โหลดไฟล์แนบ, คัดลอกข้อความ | - |
| **Editor (Collaborative)** | `sharePermission: 'edit'` | เหมือน Viewer ทุกประการ | **ไม่สามารถแก้ไขโน้ตหรือบอร์ดได้จริง** เนื่องจากไม่มี API และ UI ให้แก้ไข |
| **Direct Collaborator** | `SharedNote.permission` | `NOT FOUND IN RUNTIME` (มีเฉพาะ schema และ query เผื่อไว้) | - |

### 8.2 การตรวจสอบสิทธิ์ต่อการดำเนินการต่างๆ (Matrix)

| การดำเนินการ | Owner | Public Viewer (Read) | Public Viewer (Edit) | Other Logged-in User |
| :--- | :---: | :---: | :---: | :---: |
| เปิดดูโน้ตผ่าน `/share/[code]` | ✅ | ✅ (ต้องมีรหัสผ่านถ้าตั้งไว้) | ✅ | ✅ |
| ดึงโน้ตผ่าน `GET /api/notes/:id` | ✅ | ❌ (ต้อง Login) | ❌ | ❌ (เว้นแต่มีชื่อใน SharedNote) |
| แก้ไขโน้ตผ่าน `PUT /api/notes/:id` | ✅ | ❌ | ❌ | ❌ (Backend บังคับ `where: { id, userId }`) |
| ลบโน้ตผ่าน `DELETE /api/notes/:id` | ✅ | ❌ | ❌ | ❌ |
| เปิด/ปิดแชร์ `POST /api/share/:id` | ✅ | ❌ | ❌ | ❌ |

---

## 9. Share Note Flow

```text
[Owner]
   │
   ├─► คลิกปุ่ม "แชร์" บน NoteCard / NoteEditor / StickyNoteItem
   │
   ├─► เปิด ShareNoteModal
   │      │
   │      ├─► GET /api/share/:noteId/settings (ตรวจสอบสถานะปัจจุบัน)
   │      │
   │      ├─► เจ้าของสลับเปิด "แชร์สาธารณะ" / กำหนดรหัสผ่าน
   │      │
   │      └─► POST /api/share/:noteId (ส่ง isShared, permission, password)
   │             │
   │             ▼
   │      [Backend: ShareController.updateShareSettings]
   │             │
   │             ├─► ตรวจสอบสิทธิ์ความเป็นเจ้าของ (where: { id: noteId, userId })
   │             ├─► สร้าง shareCode (uuid v4 ตัดเหลือ 10 ตัวอักษร)
   │             ├─► Hash รหัสผ่านด้วย bcrypt (หากมี)
   │             └─► บันทึกลงตาราง Note ใน Database
   │
   └─► ได้รับลิงก์: https://domain/share/<shareCode>
         │
         ▼
[Recipient]
   │
   ├─► เปิดลิงก์ https://domain/share/<shareCode> ใน Browser
   │
   ├─► Frontend (pages/share/[code].tsx) ยิง GET /api/share/public/<shareCode>
   │      │
   │      ├─► [กรณีติดรหัสผ่าน] Backend ส่ง 401 { isPasswordRequired: true }
   │      │      │
   │      │      └─► ผู้รับกรอกรหัสผ่าน -> ยิงซ้ำพร้อม Header 'x-share-password'
   │      │             │
   │      │             └─► Backend ตรวจสอบ bcrypt.compare
   │      │
   │      └─► [กรณีผ่าน / ไม่มีรหัสผ่าน]
   │             │
   │             └─► Backend ส่งข้อมูล Note (title, content, attachments, author)
   │
   └─► แสดงหน้าอ่านบันทึก (Read-only Viewer) + ดาวน์โหลดไฟล์แนบ
```

---

## 10. Share Board Flow

```text
[Board Owner]
   │
   ├─► คลิกปุ่ม "แชร์กระดาน" บน StickyBoard
   │
   ├─► เปิด BoardShareModal
   │      │
   │      └─► คลิกเปิดการแชร์สาธารณะ -> เรียก shareBoard action
   │             │
   │             ▼
   │         POST /api/boards/:id/share { isPublic: true, sharePermission: 'read' }
   │             │
   │             ▼
   │      [Backend: BoardController.shareBoard]
   │             │
   │             ├─► ตรวจสอบความเป็นเจ้าของ (where: { id, userId })
   │             ├─► สร้าง shareCode (crypto.randomBytes(8).toString('hex'))
   │             └─► บันทึกลงตาราง Board (isPublic: true, shareCode)
   │
   └─► ได้รับลิงก์: https://domain/share/<shareCode>
         │
         ▼
[Recipient]
   │
   ├─► เปิดลิงก์ https://domain/share/<shareCode>
   │
   ├─► Frontend ยิง GET /api/share/public/<code (ไม่พบ) -> ยิง GET /api/boards/shared/<code>
   │      │
   │      ▼
   │   [Backend: BoardController.getSharedBoard]
   │      │
   │      ├─► ค้นหา Board ที่ shareCode ตรงกัน และ isPublic === true
   │      ├─► รวม Notes: where { isArchived: false, isLocked: false }
   │      └─► รวม Connections ระหว่างการ์ด
   │
   └─► แสดงผลกระดานสาธารณะแบบ Grid Card
          │
          └─► ผู้รับคลิกการ์ดโน้ตใดๆ เพื่อเปิดอ่านรายละเอียดใน Modal แบบ Read-only
```

### พฤติกรรมของโน้ตภายใน Board ที่แชร์:
- **โน้ตที่มีอยู่เดิม:** ผู้รับเห็นโน้ตทั้งหมดที่ไม่ได้ถูกลบ (`!isArchived`) และไม่ได้ล็อกรหัสลับ E2EE (`!isLocked`)
- **โน้ตที่สร้างใหม่ภายหลัง:** หากเจ้าของสร้างโน้ตใหม่บนบอร์ดนี้ ผู้รับจะเห็นโน้ตใหม่เมื่อโหลดหน้าเว็บใหม่
- **โน้ตที่ถูกลบ:** หายไปจากหน้าแชร์ทันทีในการโหลดครั้งต่อไป
- **โน้ตที่ติดรหัสลับ E2EE (`isLocked: true`):** ถูกกรองทิ้งที่ระดับ Database Query ใน Backend ไม่ถูกส่งมายัง Frontend เด็ดขาด

---

## 11. Real-time & WebSocket Synchronization

### 11.1 Socket.IO Server (`backend/src/server.ts`)

| Event ที่ Client ส่งขึ้นมา | พารามิเตอร์ | การทำงานบน Server |
| :--- | :--- | :--- |
| `join-user` | `userId` | ให้ Socket เข้าร่วมห้อง `user:${userId}` สำหรับซิงค์ข้ามอุปกรณ์ของตนเอง |
| `join-note` | `{ noteId, userId, username }` | เข้าร่วมห้อง `note:${noteId}` บันทึกตัวตนลง `notePresenceMap` และกระจาย `note-presence-updated` |
| `leave-note` | `noteId` | ออกจากห้อง `note:${noteId}` และอัปเดต Presence |
| `note-cursor` | `{ noteId, username, color, pos }` | กระจาย `remote-note-cursor` ไปยังคนอื่นในห้อง `note:${noteId}` |
| `note-update` | `{ noteId, ... }` | กระจาย `note-updated` ไปยังคนอื่นในห้อง `note:${noteId}` |
| `join-board` | `boardId` | เข้าร่วมห้อง `board:${boardId}` |
| `leave-board` | `boardId` | ออกจากห้อง `board:${boardId}` |
| `board-note-moved` | `{ boardId, noteId, posX, posY }` | กระจาย `remote-note-moved` ไปยังคนอื่นในห้อง `board:${boardId}` |

### 11.2 สถานะการใช้งานจริงใน Frontend
- **ใช้งานจริง:**
  - `join-note` และ `note-presence-updated`: ใช้งานใน `ActiveCollaboratorsBar.tsx` เพื่อแสดง Avatar ของคนที่กำลังเปิดดูโน้ตเดียวกัน
  - `join-user` และ Events ตระกูล `note:created`, `note:updated`, `note:deleted`: ใช้งานใน `useRealtimeNotes.ts` (ซิงค์ระหว่าง Desktop <-> Mobile ของผู้ใช้คนเดียวกัน)
- **NOT USED IN FRONTEND (มีบน Server แต่ Frontend ไม่ได้ต่อใช้งาน):**
  - `note-cursor` / `remote-note-cursor`
  - `note-update` / `note-updated`
  - `join-board` / `leave-board`
  - การแชร์หน้า `/share/[code]` **ไม่ได้เชื่อมต่อ Socket.IO เลย**

---

## 12. Zustand Store Integration

- ใน `frontend/src/store/noteStore.ts`:
  - **มี Action เดียวที่เกี่ยวกับการแชร์:**
    ```ts
    shareBoard: async (id, data) => {
      const res = await api.post(`/boards/${id}/share`, data);
      const updated = res.data;
      set((state) => ({
        boards: state.boards.map((b) => (b.id === id ? { ...b, ...updated } : b)),
      }));
      toast.success('อัปเดตการแชร์บอร์ดแล้ว');
      return updated;
    }
    ```
  - **State ที่ไม่มีใน Store (`NOT FOUND`):**
    - ไม่มี `sharedNotes: []`
    - ไม่มี `sharedBoards: []`
    - ไม่มี `collaborators: []`
    - การจัดการการแชร์โน้ต (`ShareNoteModal`) ยิงผ่าน `api` ตรงจาก Component โดยไม่ผ่าน Zustand

---

## 13. Security & Permission Enforcement Analysis

### 13.1 รายการตรวจสอบความปลอดภัยที่ตรวจพบ (Audit Findings)

#### ⚠️ Issue #1: โน้ตที่ถูกทิ้งลงถังขยะ (`isArchived: true`) ยังคงเปิดอ่านผ่านลิงก์แชร์ได้
- **ไฟล์:** `backend/src/controllers/shareController.ts`
- **ฟังก์ชัน:** `getPublicNote`
- **สาเหตุ:** Query ค้นหาเฉพาะ `where: { shareCode: code }` โดยไม่ได้ใส่เงื่อนไข `isArchived: false`
- **ผลกระทบ:** หากผู้ใช้ย้ายโน้ตไปไว้ในถังขยะ (Soft Delete) แต่ไม่ได้ปิดสิทธิ์การแชร์ ผู้ที่มีลิงก์แชร์เดิมยังคงสามารถเปิดอ่านเนื้อหาโน้ตนั้นได้ตามปกติจนกว่าจะลบถาวร

#### ⚠️ Issue #2: สิทธิ์ "แก้ไขร่วมกันได้ (Collaborative)" ใน UI ไม่มีการรองรับจริงใน Backend
- **ไฟล์:** `backend/src/controllers/noteController.ts`, `frontend/src/components/notes/ShareNoteModal.tsx`
- **สาเหตุ:** หน้าตั้งค่าแชร์มีตัวเลือก `permission: 'edit'` แต่ใน `noteController.updateNote` ตรวจสอบเฉพาะ `where: { id, userId }` (บังคับว่าต้องเป็นเจ้าของเท่านั้น) และไม่มี Endpoint สำหรับแก้ไขโน้ตผ่าน `shareCode`
- **ผลกระทบ:** ผู้ใช้เข้าใจผิดว่าผู้รับลิงก์สามารถช่วยพิมพ์หรือแก้ไขเนื้อหาได้ แต่ในความเป็นจริงผู้รับทำได้เพียงแค่อ่านอย่างเดียว

#### ⚠️ Issue #3: การป้องกัน Brute-force รหัสผ่านของ Shared Note อาศัยเพียง Global Limiter
- **ไฟล์:** `backend/src/controllers/shareController.ts`
- **สาเหตุ:** Endpoint `GET /api/share/public/:code` ตรวจสอบรหัสผ่านผ่าน `bcrypt.compare` แต่ใช้ Rate Limit รวมของทั้งระบบ (5,000 requests / 15 นาที) โดยไม่มี Rate Limit เฉพาะสำหรับการเดารหัสผ่านของโน้ต

#### ⚠️ Issue #4: โน้ตที่เข้ารหัสแบบ E2EE (`isLocked: true`) ไม่สามารถอ่านได้บน Shared Link
- **ไฟล์:** `frontend/src/components/notes/ShareNoteModal.tsx`, `backend/src/controllers/shareController.ts`
- **สาเหตุ:** เนื้อหาของโน้ต E2EE ถูกบันทึกเป็น Ciphertext (AES-GCM) ซึ่งกุญแจถอดรหัส (Master Key) อยู่ในหน่วยความจำของเจ้าของเท่านั้น การเปิดอ่านผ่าน `/share/[code]` โดยไม่มี Master Key จะได้เพียง Ciphertext ที่อ่านไม่ออก (ระบบแสดงคำเตือนไว้ใน Modal)

---

## 14. Revoke & Delete Scenarios

### 14.1 เมื่อเจ้าของกดยกเลิกการแชร์ (Revoke)
1. **Note:**
   - เจ้าของปิด Toggle ใน `ShareNoteModal` -> ยิง `POST /api/share/:noteId` ด้วย `{ isShared: false }`
   - Backend ตั้งค่า `shareCode: null, sharePassword: null, sharePermission: 'read'`
   - ผลลัพธ์: ลิงก์เดิมใช้งานไม่ได้ทันที หากมีคนเปิดลิงก์เดิมจะได้รับ `404 Not Found`
   - *หมายเหตุ:* ผู้รับที่เปิดหน้าค้างไว้อยู่แล้วจะยังเห็นข้อความเดิมบนหน้าจอจนกว่าจะกด Refresh (ไม่มี Socket แจ้งเตือนปิดหน้า)
2. **Board:**
   - เจ้าของปิด Toggle ใน `BoardShareModal` -> ยิง `POST /api/boards/:id/share` ด้วย `{ isPublic: false }`
   - Backend ตั้งค่า `isPublic: false` (แต่ยังเก็บ `shareCode` เดิมไว้)
   - ผลลัพธ์: ผู้รับที่เปิดลิงก์จะได้รับ `404` ทันทีเพราะ `isPublic === false`

### 14.2 เมื่อเจ้าของลบ Note
- **ย้ายไปถังขยะ (`isArchived: true`):**
  - ลิงก์แชร์โน้ตยังคงเปิดอ่านได้ (จาก Issue #1 ข้างต้น)
  - แต่หากเป็นโน้ตบน Shared Board โน้ตนั้นจะหายไปจากหน้ากระดานทันทีเพราะ `BoardController.getSharedBoard` มีเงื่อนไข `where: { isArchived: false }`
- **ลบถาวร (`prisma.note.delete`):**
  - ข้อมูลในตาราง `Note` ถูกลบ ลิงก์แชร์เข้าสู่สถานะ `404 Not Found` ทันที

### 14.3 เมื่อเจ้าของลบ Board
- บอร์ดถูกลบออกจากฐานข้อมูล (`prisma.board.delete`)
- ลิงก์แชร์ของบอร์ดเข้าสู่สถานะ `404 Not Found` ทันที

---

## 15. Multi-device & Multi-user Behavior

```text
[ สถานการณ์: User A (เจ้าของ) และ User B (ผู้รับ) ]

1. User A สร้าง Note บน Desktop -> กดเปิด Share Link
2. User A ส่งลิงก์ให้ User B
3. User B เปิดลิงก์บน Mobile Browser (ไม่ต้อง Login)
   ==> User B เห็นข้อความของ Note

4. User A แก้ไขข้อความใน Note บน Desktop
   ==> มีการบันทึกลง DB
   ==> Socket ของ User A ซิงค์ไปยัง Mobile ของ User A ทันที (ผ่าน user:userId room)
   ==> แต่ Mobile ของ User B (หน้า /share/[code]) จะ "ยังไม่เปลี่ยนทันที"
       จนกว่า User B จะกด Refresh หน้าเว็บ (เนื่องจากหน้ารับแชร์ไม่มี Socket Listener)

5. User A ยกเลิกการแชร์ (Revoke)
   ==> DB ลบ shareCode
   ==> User B กด Refresh บน Mobile -> ได้รับข้อความ "ไม่พบบันทึกนี้ หรือลิงก์การแชร์ถูกปิดไปแล้ว"
```

---

## 16. Current Limitations (สรุปข้อจำกัดของระบบปัจจุบัน)

1. **LIMITATION #1: ขาดระบบบัญชีผู้รับ (No User Account Collaboration)**
   - ไม่สามารถเลือกแชร์ให้ระบุ User หรือ Email ได้ ทำงานได้เฉพาะการส่ง Link สาธารณะเท่านั้น
2. **LIMITATION #2: การแก้ไขร่วมกันยังไม่ทำงานจริง (No Real Collaborative Editing)**
   - แม้จะมีตัวเลือก 'edit' ใน UI แต่ไม่มีระบบบันทึกการแก้ไขสำหรับผู้รับผ่านลิงก์ และ API ป้องกันไม่ให้ผู้ที่ไม่ใช่เจ้าของบันทึกข้อมูล
3. **LIMITATION #3: หน้ารับแชร์ไม่มี Real-time Update**
   - ผู้ที่เปิดหน้า `/share/[code]` จะไม่เห็นการเปลี่ยนแปลงแบบสดเมื่อเจ้าของแก้ข้อความ ต้อง Refresh หน้าเว็บใหม่
4. **LIMITATION #4: ไม่มีกำหนดวันหมดอายุของลิงก์ (No Expiry Date)**
   - ลิงก์จะคงอยู่ตลอดไปจนกว่าเจ้าของจะเข้ามาปิดด้วยตนเอง
5. **LIMITATION #5: ไม่รองรับการแชร์ Notebook (No Notebook Sharing)**
   - การจัดกลุ่มบันทึกแบบ Notebook ไม่สามารถแชร์ทั้งเล่มได้
6. **LIMITATION #6: ข้อจำกัดกับ E2EE Notes**
   - ไม่สามารถแชร์โน้ตที่เปิดการล็อก E2EE ให้ผู้อื่นอ่านรู้เรื่องได้ เนื่องจากไม่มีระบบแบ่งปัน Private/Public Key ระหว่างผู้ใช้

---

## 17. Architecture Diagram

```text
+-----------------------------------------------------------------------------------+
|                                  NOTE ON WEB                                      |
|                            SHARING ARCHITECTURE                                   |
+-----------------------------------------------------------------------------------+

     [ OWNER (Desktop / Mobile) ]
                 │
                 │ 1. Open Share Modal (ShareNoteModal / BoardShareModal)
                 ▼
     [ Authenticated REST API ]
        POST /api/share/:noteId
        POST /api/boards/:id/share
                 │
                 │ 2. Verify Ownership & Generate shareCode
                 ▼
       [ Database (PostgreSQL) ]
          Note (shareCode, sharePassword, sharePermission)
          Board (shareCode, isPublic, sharePermission)
                 │
                 │ 3. Generate Link: https://domain/share/[code]
                 ▼
      [ RECIPIENT (No Auth Required) ]
                 │
                 │ 4. Open URL in Browser
                 ▼
     [ Frontend: /share/[code].tsx ]
                 │
                 ├──────────────────────────────┬──────────────────────────────┐
                 │ 5a. If Note Code             │ 5b. If Board Code            │
                 ▼                              ▼                              │
        GET /api/share/public/:code   GET /api/boards/shared/:shareCode        │
                 │                              │                              │
                 ├─► Password Required?         └─► Filter Active & Non-Locked │
                 │      (401 Prompt)                 Notes                     │
                 ▼                              ▼                              │
         [ Note HTML Viewer ]           [ Board Cards Grid ]                   │
         - Title, Author, Date          - Click Card to open Modal             │
         - Attachments Download         - Read-only View                       │
         - Plaintext Copy                                                      │
+------------------------------------------------------------------------------+
```

---

## 18. AI Handoff Instructions (คำแนะนำสำหรับ AI ที่จะพัฒนาต่อ)

หากคุณเป็น AI ตัวต่อไปที่ได้รับมอบหมายให้แก้ไขหรือพัฒนาระบบ Sharing ต่อ:

1. **อย่ารื้อ Endpoint สาธารณะเดิม:**
   - เส้นทาง `GET /api/share/public/:code` และ `GET /api/boards/shared/:shareCode` รวมถึงหน้า `frontend/src/pages/share/[code].tsx` ต้องรักษาความเข้ากันได้ย้อนหลังไว้
2. **หากต้องการเพิ่มระบบ Direct User Sharing (แชร์ระหว่าง User):**
   - ใน `backend/prisma/schema.prisma` มีโมเดล `SharedNote` และความสัมพันธ์ `shares` / `sharesReceived` อยู่แล้ว
   - สามารถต่อยอดสร้าง Controller เช่น `shareWithUser(noteId, targetEmail, permission)` โดยเชื่อมต่อกับตาราง `SharedNote`
   - ใน `backend/src/controllers/noteController.ts` ที่ฟังก์ชัน `getNotes` ปัจจุบันดึงเฉพาะ `where: { userId }` จะต้องปรับให้รองรับ `where: { OR: [{ userId }, { shares: { some: { sharedWithId: userId } } }] }`
   - ต้องปรับ `updateNote` ให้ยอมรับการแก้ไขหากผู้ใช้มีสิทธิ์ `edit` ใน `SharedNote`
3. **อย่าลืมตรวจสอบความปลอดภัย:**
   - ตรวจสอบ `isArchived: false` ใน `ShareController.getPublicNote` เพื่อไม่ให้โน้ตในถังขยะหลุดไปในหน้าแชร์
   - แยก Rate Limiting สำหรับการป้อน Password ป้องกัน Brute-force
