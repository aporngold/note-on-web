# Note on Web — Realtime Architecture & System Audit Report

รายงานการตรวจสอบและพิสูจน์การทำงานของระบบ **Realtime Synchronization** ทั้งหมดในโปรเจกต์ **Note on Web (SecureNote)** โดยวิเคราะห์จาก Source Code จริงที่มีอยู่ใน Frontend, Zustand Store, REST API, Backend Controller, Database (Prisma) และ WebSocket (Socket.IO)

> **เกณฑ์การตรวจสอบ:**
> - ตรวจสอบโค้ดจริงโดยไม่อ้างอิงเพียงชื่อตัวแปรหรือ Type
> - แยกการตรวจสอบออกเป็น 3 ระบบอิสระ:
>   1. **Single-User Multi-Device Realtime** (การซิงค์ระหว่างเครื่องของเจ้าของคนเดียวกัน เช่น PC <-> Mobile)
>   2. **Public Share Read-only** (การเปิดดูผ่านลิงก์สาธารณะ `/share/[code]`)
>   3. **Collaborative Editing** (การแก้ไขเนื้อหาร่วมกันระหว่างผู้ใช้ต่างคน)
> - ไม่มีการแก้ไขหรือแตะต้อง Source Code ใดๆ ทั้งสิ้น

---

## 1. Executive Summary (บทสรุปสำหรับผู้บริหาร)

| ขอบเขตระบบ | ผลการตรวจสอบ | สถานะสรุป |
| :--- | :---: | :--- |
| **1. Same-User Cross-Device Realtime (PC <-> Mobile)** | **PARTIAL** | ทำงานได้สองทาง (Bidirectional) ระหว่างอุปกรณ์ที่ล็อกอินบัญชีเดียวกัน แต่มี **Bug การนับจำนวนการ์ดเบิ้ล (Double Counting)** และ **Race Condition ในช่วง Fetch** |
| **2. Public Share Read-only (`/share/[code]`)** | **FAIL** | **PUBLIC SHARE IS NOT REALTIME** (ไม่มีการเชื่อมต่อ Socket.IO, ผู้รับต้องกด Refresh เท่านั้น) |
| **3. Collaborative Editing ("แก้ไขร่วมกันได้")** | **NOT IMPLEMENTED** | **UI EXISTS / COLLABORATIVE EDITING NOT IMPLEMENTED** (UI มีให้เลือกสิทธิ์ แต่ Backend ไม่มี API รองรับและไม่มี Realtime Editor Sync) |
| **4. User Presence (`ActiveCollaboratorsBar`)** | **PASS** | แสดง Avatar ของผู้ใช้ที่กำลังเปิดดูโน้ตเดียวกันแบบ Realtime แยกจากการ Sync เนื้อหา |

---

## 2. Current Architecture (สถาปัตยกรรม Realtime ปัจจุบัน)

```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             REALTIME ARCHITECTURE                                │
└──────────────────────────────────────────────────────────────────────────────────┘

               [ Device A: PC (User A) ]            [ Device B: Mobile (User A) ]
                           │                                      │
                           │  HTTP Mutation                       │
                           ▼                                      │
                 [ REST API Controller ]                          │
                  (NoteController.ts)                             │
                           │                                      │
                           ├─► Database Write (Prisma)            │
                           │                                      │
                           ▼                                      │
                     emitToUser()                                 │
                           │                                      │
                           ▼                                      │
                   [ Socket.IO Server ]                           │
                    Room: "user:userA" ───────────────────────────┘
                                        Socket Event:
                                        note:created / note:updated / note:deleted
                                                 │
                                                 ▼
                                        useRealtimeNotes Hook
                                                 │
                                                 ▼
                                           Zustand Store
                                                 │
                                                 ▼
                                            React UI

────────────────────────────────────────────────────────────────────────────────────
[ เส้นทางที่ขาดหายไป (NOT IMPLEMENTED / NO CONNECTION) ]:

   [ Device A: Owner ]                  [ Device C: Public Viewer /share/[code] ]
            │                                             │
      Update Note                                    Read-only Page
            │                                             │
      REST Controller                               (No Socket Client)
            │                                             │
    emitToUser(ownerId) ─────────── ❌ ───────────────────┘
    (ไม่มีการส่งไปยัง Viewer)
```

---

## 3. Note Realtime (การซิงค์โน้ตปกติ)

### 3.1 การสร้างโน้ต (Create Note Flow)
1. **Device A (PC):**
   - ผู้ใช้กดบันทึกโน้ต -> เรียก `noteStore.createNote(data)`
   - ยิง `POST /api/notes`
2. **Backend:**
   - [backend/src/controllers/noteController.ts](file:///c:/Users/AsusF15/Desktop/%28%28_Gemini_ProJect_%29%29/NoteOnWeb/backend/src/controllers/noteController.ts#L408-L411):
     ```ts
     emitToUser(userId, 'note:created', formatted);
     if (formatted.boardId) {
       emitToUser(userId, 'board:note-count-updated', { boardId: formatted.boardId, delta: 1 });
     }
     ```
3. **Device B (Mobile):**
   - Socket Client อยู่ในห้อง `user:${userId}` ได้รับ Event `note:created`
   - [frontend/src/hooks/useRealtimeNotes.ts](file:///c:/Users/AsusF15/Desktop/%28%28_Gemini_ProJect_%29%29/NoteOnWeb/frontend/src/hooks/useRealtimeNotes.ts#L75-L85) เรียก `setRemoteNoteCreated(newNote)`
   - [frontend/src/store/noteStore.ts](file:///c:/Users/AsusF15/Desktop/%28%28_Gemini_ProJect_%29%29/NoteOnWeb/frontend/src/store/noteStore.ts#L742-L761):
     - ป้องกันโน้ตถังขยะ: `if (newNote.isArchived || state.trashNotes.some(...))`
     - ตรวจสอบ Deduplication: `if (state.notes.some(n => n.id === newNote.id))`
     - เพิ่มโน้ตใหม่เข้า `notes: [newNote, ...state.notes]`
     - เพิ่ม `board.noteCount`: `(b.noteCount || 0) + 1`
4. **ความผิดปกติที่ตรวจพบ (Bug):**
   - ใน `setRemoteNoteCreated` มีการบวก `noteCount` ให้บอร์ดไปแล้ว 1 ครั้ง
   - แต่ Backend ยังส่ง Event `board:note-count-updated` ตามมาอีก 1 Event
   - ฟังก์ชัน `setRemoteBoardCountUpdated` ใน `noteStore.ts` บวก `delta: 1` ซ้ำอีก 1 ครั้ง
   - **ผลลัพธ์:** บน Device B จำนวนนับโน้ตบนบอร์ดจะกระโดดเพิ่มขึ้นทีละ 2 ใบต่อการสร้าง 1 ครั้ง (Double Increment Bug)

### 3.2 การแก้ไขโน้ต (Update Note Flow)
1. **Device A:**
   - เรียก `noteStore.updateNote(id, data)`
   - ทำ Optimistic Update ทันทีใน Zustand ฝั่งตนเอง
   - ยิง `PUT /api/notes/:id`
2. **Backend:**
   - อัปเดต Prisma DB และเรียก [emitToUser(userId, 'note:updated', formatted)](file:///c:/Users/AsusF15/Desktop/%28%28_Gemini_ProJect_%29%29/NoteOnWeb/backend/src/controllers/noteController.ts#L545)
3. **Device B:**
   - ได้รับ `note:updated` -> เรียก `setRemoteNoteUpdated`
   - แทนที่ข้อมูลโน้ตตาม `id` ทันทีโดยไม่มีการเด้งกลับ (UI Sync ถูกต้อง)

### 3.3 การลบโน้ต (Delete Note Flow)
1. **Device A:**
   - ยิง `DELETE /api/notes/:id`
2. **Backend:**
   - Soft Delete: `emitToUser(userId, 'note:deleted', { id, isPermanent: false, boardId, note })`
   - พร้อมส่ง `board:note-count-updated` ด้วย `delta: -1`
3. **Device B:**
   - ได้รับ `note:deleted` -> ตัดโน้ตออกจาก `notes` และย้ายลง `trashNotes`
   - เกิด **Double Decrement Bug** ซ้ำรอยเดิม (ลด `noteCount` ใน `setRemoteNoteDeleted` แล้วลดซ้ำอีกครั้งใน `setRemoteBoardCountUpdated`)

---

## 4. Board Realtime (การซิงค์กระดานบอร์ด)

1. **การย้ายตำแหน่งโน้ตบนกระดาน (Drag & Drop):**
   - ใน [frontend/src/components/board/StickyBoard.tsx](file:///c:/Users/AsusF15/Desktop/%28%28_Gemini_ProJect_%29%29/NoteOnWeb/frontend/src/components/board/StickyBoard.tsx#L816) เมื่อลากการ์ด จะเรียก `updateNote(id, { posX, posY })`
   - ยิง `PUT /api/notes/:id` ไปบันทึกพิกัด และกระจายผ่าน `note:updated` ไปยังอุปกรณ์อื่น
   - **ข้อตรวจพบ:** ใน `server.ts` มีการประกาศ Event `board-note-moved` แต่ **Frontend ไม่ได้ใช้งาน Event นี้** การขยับตำแหน่งจึงพึ่งพา REST API + `note:updated` เท่านั้น
2. **การล้างกระดาน / ลบบอร์ด:**
   - Backend ยิง `board:changed`, `notes:board-cleared`
   - Client ได้รับและล้างการ์ดในบอร์ดนั้นทิ้งทันที

---

## 5. Public Share Realtime (การแชร์ผ่านลิงก์สาธารณะ)

### คำตัดสิน: **`PUBLIC SHARE IS NOT REALTIME`**

### การตรวจสอบ Source Code จริง:
1. ไฟล์ [frontend/src/pages/share/[code].tsx](file:///c:/Users/AsusF15/Desktop/%28%28_Gemini_ProJect_%29%29/NoteOnWeb/frontend/src/pages/share/%5Bcode%5D.tsx):
   - ไม่มีการ Import `socket.io-client`, `getSharedSocket`, หรือ `useRealtimeNotes`
   - ไม่มีคำสั่ง `io(...)` หรือการสร้าง WebSocket Connection
   - ดึงข้อมูลผ่าน `axios.get` ครั้งเดียวตอนโหลดหน้าเว็บ
2. ไฟล์ [backend/src/controllers/shareController.ts](file:///c:/Users/AsusF15/Desktop/%28%28_Gemini_ProJect_%29%29/NoteOnWeb/backend/src/controllers/shareController.ts):
   - ใน `updateShareSettings` ไม่มีการเรียก `emitToUser` หรือ Broadcast ใดๆ
3. ไฟล์ [backend/src/controllers/noteController.ts](file:///c:/Users/AsusF15/Desktop/%28%28_Gemini_ProJect_%29%29/NoteOnWeb/backend/src/controllers/noteController.ts):
   - ทุกครั้งที่เจ้าของแก้โน้ต ระบบยิง `emitToUser(userId, 'note:updated', ...)` ไปยังห้องของเจ้าของคนเดียว ไม่มีการส่งไปยังห้องสาธารณะหรือผู้ถือลิงก์แชร์
4. **สรุปพฤติกรรมจริง:**
   - เจ้าของแก้โน้ตบน PC -> หน้าเว็บของผู้รับลิงก์แชร์ **ไม่มีการเปลี่ยนแปลงใดๆ** จนกว่าผู้รับจะกด F5 / Refresh หน้าจอด้วยตนเอง

---

## 6. Collaborative Editing (การแก้ไขร่วมกัน)

### คำตัดสิน: **`UI EXISTS / COLLABORATIVE EDITING NOT IMPLEMENTED`**

### การตรวจสอบ Source Code จริง:
1. **ตัวเลือกสิทธิ์ใน UI:**
   - ใน [ShareNoteModal.tsx](file:///c:/Users/AsusF15/Desktop/%28%28_Gemini_ProJect_%29%29/NoteOnWeb/frontend/src/components/notes/ShareNoteModal.tsx#L283-L293) มีปุ่มเลือก:
     - `permission: 'read'` (อ่านอย่างเดียว)
     - `permission: 'edit'` ("แก้ไขร่วมกันได้ (Collaborative)")
2. **การบังคับใช้ใน Backend:**
   - ใน [NoteController.updateNote](file:///c:/Users/AsusF15/Desktop/%28%28_Gemini_ProJect_%29%29/NoteOnWeb/backend/src/controllers/noteController.ts#L430-L436):
     ```ts
     const note = await prisma.note.findFirst({
       where: { id, userId },
     });
     if (!note) {
       return res.status(404).json({ error: 'Note not found' });
     }
     ```
   - **Backend บังคับอย่างเด็ดขาดว่าผู้ส่งคำขอต้องเป็นเจ้าของ (`userId === req.userId`)**
   - ไม่มี API สำหรับให้ผู้รับลิงก์แชร์ส่งเนื้อหาที่แก้ไขกลับมา (`NOT FOUND`)
3. **ไม่มีกลไก Collaborative Realtime Editor:**
   - ไม่มี CRDT (Yjs, Automerge)
   - ไม่มี OT (Operational Transformation)
   - ไม่มีการผูก TipTap Collaborative Extension
   - ไม่มีการล็อกย่อหน้า หรือการส่ง Patch ข้อความแบบ Realtime
4. **หากผู้ใช้เดียวกันเปิดพิมพ์พร้อมกันสองเครื่อง:**
   - ระบบทำงานแบบ **Last Write Wins** ระดับทั้งฉบับ (Full HTML string overwrite) ใครกด Save หรือ Autosave ช้ากว่าจะทับเนื้อหาของอีกเครื่องทั้งหมดทันที

---

## 7. Socket.IO Event Map

### ตารางแมป Socket.IO Events ทั้งหมดในระบบ

| Event Name | Direction | Payload | หน้าที่ในระบบ | สถานะการทำงานจริง |
| :--- | :---: | :--- | :--- | :---: |
| `join-user` | Client ➔ Server | `userId` | ให้ Client เข้าห้อง `user:${userId}` | **ใช้งานจริง** |
| `note:created` | Server ➔ Client | `Note Object` | แจ้งเตือนสร้างโน้ตใหม่ | **ใช้งานจริง** |
| `note:updated` | Server ➔ Client | `Note Object` | แจ้งเตือนแก้ไขโน้ต | **ใช้งานจริง** |
| `note:deleted` | Server ➔ Client | `{ id, isPermanent, boardId, note }` | แจ้งเตือนลบโน้ต | **ใช้งานจริง** |
| `note:restored` | Server ➔ Client | `Note Object` | แจ้งเตือนกู้คืนโน้ต | **ใช้งานจริง** |
| `board:note-count-updated`| Server ➔ Client | `{ boardId, delta, noteCount }` | ปรับยอดตัวเลขนับโน้ต | **มี Bug นับเบิ้ล** |
| `notes:board-cleared` | Server ➔ Client | `{ boardId, isDefault }` | ล้างโน้ตบนบอร์ด | **ใช้งานจริง** |
| `notes:trash-emptied` | Server ➔ Client | `{}` | ล้างถังขยะถาวร | **ใช้งานจริง** |
| `board:changed` | Server ➔ Client | `{ action, boardId }` | กระดานถูกสร้าง/แก้/ลบ | **ใช้งานจริง** |
| `connection:changed` | Server ➔ Client | `{}` | เส้นเชื่อมบนบอร์ดเปลี่ยน | **ใช้งานจริง** |
| `join-note` | Client ➔ Server | `{ noteId, userId, username }` | เข้าห้องดูโน้ต (Presence) | **ใช้งานจริง** |
| `leave-note` | Client ➔ Server | `noteId` | ออกจากห้องดูโน้ต | **ใช้งานจริง** |
| `note-presence-updated` | Server ➔ Client | `ActiveCollaborator[]` | ส่งรายชื่อคนกำลังดู | **ใช้งานจริง** |
| `board-note-moved` | Client ➔ Server | `{ boardId, noteId, posX, posY }` | ย้ายการ์ดบนบอร์ด | **Dead Code (ไม่ได้ใช้)** |
| `remote-note-moved` | Server ➔ Client | `{ boardId, noteId, posX, posY }` | รับพิกัดการ์ด | **Dead Code (ไม่ได้ใช้)** |
| `note-cursor` | Client ➔ Server | `{ noteId, username, pos }` | ตำแหน่ง Cursor | **Dead Code (ไม่ได้ใช้)** |
| `note-update` | Client ➔ Server | `{ noteId, ... }` | แก้ไขข้อความในห้อง | **Dead Code (ไม่ได้ใช้)** |

---

## 8. Zustand State Flow

```text
[ Incoming WebSocket Event ]
           │
           ▼
[ useRealtimeNotes Hook ]
           │
           ├── note:created  ──► setRemoteNoteCreated(newNote)
           │                        ├── Deduplicate Check (id)
           │                        ├── Prepend to state.notes
           │                        └── Increment board.noteCount (+1) [Bug #1]
           │
           ├── note:updated  ──► setRemoteNoteUpdated(note)
           │                        └── Replace note by id in state.notes
           │
           ├── note:deleted  ──► setRemoteNoteDeleted(data)
           │                        ├── Filter out from state.notes
           │                        ├── Move to state.trashNotes (if not permanent)
           │                        └── Decrement board.noteCount (-1) [Bug #2]
           │
           └── board:note-count-updated ──► setRemoteBoardCountUpdated(data)
                                               └── Adjust board.noteCount again (+1 / -1) [Double Count]
```

---

## 9. Database Synchronization

- การบันทึกข้อมูลหลักเกิดขึ้นผ่าน REST API ก่อนเสมอ (`Prisma -> PostgreSQL/SQLite`)
- เมื่อ Database บันทึกสำเร็จ Backend จึงยิง Socket Event ผ่าน `emitToUser()`
- หาก Database พัง หรือ Request Failed:
  - ฝั่งส่ง: Zustand Optimistic Rollback จะดึง State เดิมกลับมา
  - ฝั่งรับ: จะไม่มีการปล่อย Socket Event ทำให้ข้อมูลระหว่าง DB และ Client อื่นไม่ผิดเพี้ยน

---

## 10. Race Conditions (ภาวะแย่งชิงข้อมูล)

### ⚠️ Race Condition #1: Initial Fetch Overwrite (วิกฤติ)
- **ตำแหน่ง:** [frontend/src/store/noteStore.ts บรรทัด 137](file:///c:/Users/AsusF15/Desktop/%28%28_Gemini_ProJect_%29%29/NoteOnWeb/frontend/src/store/noteStore.ts#L137)
- **ลำดับเหตุการณ์:**
  1. Client B เปิดแอป -> เรียก `fetchNotes()` (ส่ง HTTP GET ไปยังเซิร์ฟเวอร์แบบ Asynchronous)
  2. ขณะที่รอ Response ฝั่ง Client A สร้างโน้ตใหม่ -> Socket ส่ง `note:created` มาถึง Client B ทันที
  3. `setRemoteNoteCreated` นำโน้ตใหม่ใส่ใน `state.notes` เรียบร้อย
  4. Response ของ HTTP GET (ซึ่งเป็นข้อมูลเก่ายังไม่มีโน้ตใหม่) ส่งกลับมาถึง
  5. ฟังก์ชันสั่ง: `set({ notes: activeOnly, isLoading: false })`
  6. **ผลลัพธ์:** ข้อมูลชุดเก่าที่ได้จาก HTTP GET เข้าไป **เขียนทับ (Overwrite) ทั้ง Array** ส่งผลให้โน้ตใหม่ที่เพิ่งได้จาก Socket **หายวับไปจากหน้าจอทันที**

---

## 11. Duplicate Event Risks

1. **การป้องกัน Duplicate Note ใน Store:**
   - มีการป้องกันไว้ดีมากทั้งใน `createNote` (บรรทัด 375) และ `setRemoteNoteCreated` (บรรทัด 749) โดยตรวจ `state.notes.some(n => n.id === newNote.id)` หากพบไอดีซ้ำจะใช้วิธีอัปเดตแทนการแทรกซ้ำ
2. **Listener Duplication:**
   - ใน `useRealtimeNotes.ts` มีการ Return Cleanup Function: `socket.off(...)` ครบทุก Event ทำให้ไม่เกิด Event Listener สะสมเมื่อ React Re-render

---

## 12. Reconnect Behavior (เมื่อเน็ตหลุดแล้วกลับมาต่อใหม่)

- **กลไกที่มี:**
  - Socket.IO มี Auto Reconnect ในตัว (`reconnectionAttempts: Infinity`)
  - ใน `useRealtimeNotes.ts` มีการดัก `socket.on('connect', handleConnect)`:
    - ยิง `join-user` ซ้ำ
    - เรียก Refetch ข้อมูลใหม่อัตโนมัติ: `fetchNotes`, `fetchBoards`, `fetchNotebooks`, `fetchLabels`, `fetchReminders`
  - มีการดัก `visibilitychange` (เมื่อมือถือปลดล็อกหน้าจอ หรือสลับแท็บกลับมา) เพื่อ Refetch ทันที
- **จุดที่ยังบกพร่อง:**
  - ไม่มีการ Refetch `trashNotes` ทำให้ถังขยะอาจค้างข้อมูลเก่าหากมีการลบโน้ตจากเครื่องอื่นช่วงที่ออฟไลน์

---

## 13. Multi-device Behavior

| การดำเนินการ | บนเครื่อง A (ผู้ทำ) | บนเครื่อง B (เครื่องอื่นของตนเอง) | บนเครื่อง C (ผู้เปิดลิงก์แชร์) |
| :--- | :---: | :---: | :---: |
| **Create Note** | ทันที (0ms) | ทันที (Realtime Socket) | ไม่เห็น (ต้อง Refresh) |
| **Update Note** | ทันที (Optimistic) | ทันที (Realtime Socket) | ไม่เห็น (ต้อง Refresh) |
| **Delete Note** | ทันที (Optimistic) | ทันที (Realtime Socket) | ไม่เห็น (ต้อง Refresh) |
| **Move Note on Board**| ทันที (Optimistic) | ทันที (ผ่าน REST + note:updated) | ไม่เห็น (ต้อง Refresh) |
| **Archive / Restore** | ทันที | ทันที (Realtime Socket) | ไม่เห็น (ต้อง Refresh) |

---

## 14. Security & Permission Enforcement

1. **Socket Room Spoofing Risk:**
   - ใน [server.ts](file:///c:/Users/AsusF15/Desktop/%28%28_Gemini_ProJect_%29%29/NoteOnWeb/backend/src/server.ts#L162-L166):
     ```ts
     socket.on('join-user', (userId: string) => {
       if (userId) {
         socket.join(`user:${userId}`);
       }
     });
     ```
   - **ไม่มีการตรวจสอบ JWT บน Handshake หรือ Event `join-user`** ไคลเอนต์ใดๆ สามารถส่ง `join-user` พร้อมไอดีของผู้อื่นเพื่อดักฟัง Socket Events ของโน้ตคนอื่นได้
2. **Collaborative Permission Bypass Prevention:**
   - แม้หน้าเว็บแชร์จะมีตัวเลือก Edit แต่ Backend ใน `NoteController.updateNote` ปิดกั้นด้วย `where: { id, userId }` ป้องกันไม่ให้บุคคลภายนอกแก้ไขโน้ตได้

---

## 15. Realtime Test Matrix

| Test Case | Device A | Device B | Expected Behavior | Actual Behavior | Realtime Status | Result |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| **Create Note** | PC (User A) | Mobile (User A) | โน้ตขึ้นทันที ตัวเลขบอร์ด +1 | โน้ตขึ้นทันที แต่ตัวเลขบอร์ด +2 | มี Realtime แต่ติด Bug นับเบิ้ล | **PARTIAL** |
| **Update Note** | PC (User A) | Mobile (User A) | ข้อความเปลี่ยนทันที | ข้อความเปลี่ยนทันที ถูกต้อง | ทำงานสมบูรณ์ | **PASS** |
| **Delete Note** | PC (User A) | Mobile (User A) | โน้ตหายทันที ตัวเลขบอร์ด -1 | โน้ตหายทันที แต่ตัวเลขบอร์ด -2 | มี Realtime แต่ติด Bug นับเบิ้ล | **PARTIAL** |
| **Create Note** | Mobile (User A) | PC (User A) | โน้ตขึ้นทันที สองทาง | โน้ตขึ้นทันที สองทาง | ทำงานสองทาง | **PARTIAL** |
| **Public Share View**| Owner | Public Viewer | ผู้รับเห็นข้อความเปลี่ยนทันที | ผู้รับไม่เห็นอะไรเปลี่ยนเลย | ไม่มี Socket Connection | **FAIL** |
| **Collaborative Edit**| User A | User B | สองคนพิมพ์แก้โน้ตพร้อมกันได้ | ทำไม่ได้ (ไม่มีระบบรองรับ) | ระบบยังไม่ถูกสร้าง | **NOT IMPLEMENTED** |
| **Presence Avatar** | User A | User B (Logged in)| เห็น Avatar คนเปิดดูโน้ต | เห็น Avatar ปรากฏทันที | ทำงานสมบูรณ์ | **PASS** |
| **Reconnect Sync** | PC | Mobile (Wake up)| ซิงค์โน้ตล่าสุดเมื่อเปิดจอ | ซิงค์โน้ตล่าสุดครบถ้วน | ทำงานสมบูรณ์ | **PASS** |

---

## 16. สรุปผลการประเมินแยกตามระบบ

1. **Note / Board Cross-device Realtime (Same User):** **`PARTIAL`**
   - ข้อความและการแสดงผลการ์ดเป็น Realtime จริงสองทาง แต่ตัวเลขนับจำนวนการ์ด (Note Count) เพี้ยนเนื่องจาก Event ซ้ำซ้อน
2. **Public Share System (`/share/[code]`):** **`FAIL`**
   - **`PUBLIC SHARE IS NOT REALTIME`** ต้องกดรีเฟรชเท่านั้น
3. **Collaborative Editing System:** **`NOT IMPLEMENTED`**
   - **`UI EXISTS / COLLABORATIVE EDITING NOT IMPLEMENTED`** หน้าบ้านมีตัวเลือก แต่หลังบ้านไม่มีฟังก์ชันรองรับ

---

## 17. Root Cause ของปัญหาที่พบ

1. **ปัญหา Double Counting (นับการ์ดเบิ้ล 2 ครั้ง):**
   - เกิดจากการที่ทั้ง `setRemoteNoteCreated` / `setRemoteNoteDeleted` ทำการคำนวณ `b.noteCount` เองในฝั่ง Store อยู่แล้ว แต่ Backend ดันส่ง `board:note-count-updated` ซ้ำมาอีกชุดหนึ่ง
2. **ปัญหา Race Condition ตอนโหลดหน้า:**
   - เกิดจาก `fetchNotes` นำ `res.data` มาเขียนทับ `state.notes` แบบยกแผงโดยไม่ได้ทำ Reconcile/Merge กับโน้ตที่เข้ามาทาง WebSocket ขณะรอคำขอ HTTP
3. **ปัญหา Public Share ไม่ Realtime:**
   - หน้า `/share/[code].tsx` ถูกออกแบบเป็น Static Read-Only Component โดยไม่มีการ Mount Socket Client หรือเข้าร่วม Room ใดๆ
4. **ปัญหา Collaborative Edit ใช้งานไม่ได้:**
   - ขาด API Controller สำหรับการรับข้อความจากบุคคลอื่นที่ไม่ใช่ Owner และสถาปัตยกรรมยังเป็น REST Full Document Overwrite

---

## 18. ไฟล์และบรรทัดที่เกี่ยวข้องโดยตรง

- **Double Count Bug:**
  - [frontend/src/store/noteStore.ts:758](file:///c:/Users/AsusF15/Desktop/%28%28_Gemini_ProJect_%29%29/NoteOnWeb/frontend/src/store/noteStore.ts#L758) (บวกครั้งแรก)
  - [backend/src/controllers/noteController.ts:410](file:///c:/Users/AsusF15/Desktop/%28%28_Gemini_ProJect_%29%29/NoteOnWeb/backend/src/controllers/noteController.ts#L410) (ส่ง Event บวกซ้ำ)
  - [frontend/src/store/noteStore.ts:830](file:///c:/Users/AsusF15/Desktop/%28%28_Gemini_ProJect_%29%29/NoteOnWeb/frontend/src/store/noteStore.ts#L830) (บวกครั้งที่สอง)
- **Race Condition Overwrite:**
  - [frontend/src/store/noteStore.ts:137](file:///c:/Users/AsusF15/Desktop/%28%28_Gemini_ProJect_%29%29/NoteOnWeb/frontend/src/store/noteStore.ts#L137) (`set({ notes: activeOnly })`)
- **Missing Socket on Public Share:**
  - [frontend/src/pages/share/[code].tsx:1-530](file:///c:/Users/AsusF15/Desktop/%28%28_Gemini_ProJect_%29%29/NoteOnWeb/frontend/src/pages/share/%5Bcode%5D.tsx#L1) (ไม่มี socket client)
- **Unauthorized Edit Block in Backend:**
  - [backend/src/controllers/noteController.ts:431](file:///c:/Users/AsusF15/Desktop/%28%28_Gemini_ProJect_%29%29/NoteOnWeb/backend/src/controllers/noteController.ts#L431) (`where: { id, userId }`)

---

## 19. สิ่งที่ต้องแก้ไข (เมื่อได้รับอนุญาตให้แก้โค้ด)

1. **แก้ปัญหา Double Counting:**
   - ตัดการส่ง `board:note-count-updated` ออกจาก Backend ในจุดที่ส่ง `note:created` และ `note:deleted` อยู่แล้ว หรือตัดการคำนวณใน Store ให้รอรับเฉพาะจาก Server เพียงทางเดียว
2. **แก้ Race Condition ใน `fetchNotes`:**
   - เปลี่ยนจาก `set({ notes: activeOnly })` เป็นการ Merge Map โดยรักษาโน้ตที่มี `updatedAt` ใหม่กว่าไว้
3. **รักษาความปลอดภัย Socket.IO:**
   - เพิ่ม Middleware ถอดรหัส JWT ใน Handshake ก่อนอนุญาตให้เข้าห้อง `user:${userId}`
4. **ปรับ UI ตัวเลือกการแชร์:**
   - ปิดหรือซ่อนตัวเลือก "แก้ไขร่วมกันได้" ชั่วคราว หรือระบุว่าเป็น (Coming Soon) เพื่อไม่ให้ผู้ใช้งานสับสน จนกว่าจะมีการพัฒนาระบบ Collaborative Editing จริง

---

## 20. ข้อเสนอแนะสำหรับขั้นตอนถัดไป

1. **หากต้องการให้ Public Share เป็น Realtime:**
   - ใน `share/[code].tsx` ต้องสร้าง Socket Client เข้าร่วมห้อง `share:${shareCode}`
   - ใน Backend เมื่อ Note ถูกแก้ ต้องยิง `io.to('share:' + note.shareCode).emit('shared-note:updated', ...)`
2. **หากต้องการ Collaborative Editing จริง:**
   - ต้องเปลี่ยนโมเดลการบันทึกจาก REST Full Overwrite ไปใช้ CRDT หรือ TipTap Collaboration (Yjs ผ่าน Hocuspocus หรือ Socket Provider)
   - ปรับ Authorization ใน Backend ให้รองรับสิทธิ์ `edit` จากตาราง `SharedNote`
