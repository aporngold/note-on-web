# บัญชีรายชื่อผู้ประมวลผลข้อมูลส่วนบุคคลภายนอกและการโอนข้อมูลข้ามพรมแดน
(Third-Party Data Processors & Cross-Border Data Transfer Register)
**โครงการ Note on Web**
*มีผลบังคับใช้ตั้งแต่วันที่: [TODO — INFORMATION REQUIRED FROM SYSTEM OWNER / ระบุวันที่ พ.ศ. 2569]*
*เวอร์ชันเอกสาร: 1.0 (ปรับปรุง พ.ศ. 2569)*

---

## 1. วัตถุประสงค์
เอกสารฉบับนี้จัดทำขึ้นเพื่อระบุและควบคุมการส่งต่อข้อมูลส่วนบุคคลไปยังผู้ให้บริการภายนอก (Data Processors / Sub-processors) และการโอนข้อมูลส่วนบุคคลไปยังต่างประเทศ เพื่อให้สอดคล้องกับ **มาตรา 28, 29 และมาตรา 40 แห่งพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)**

---

## 2. ทะเบียนผู้ให้บริการภายนอก (Data Processor Registry)

| ลำดับ | ชื่อผู้ให้บริการ (Entity Name) | ประเภทบริการ | ข้อมูลส่วนบุคคลที่ส่งต่อ | วัตถุประสงค์การใช้งาน | สถานะทางกฎหมาย | ประเทศที่ตั้งเซิร์ฟเวอร์ | สถานะ DPA / กลไกคุ้มครอง |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **Vercel Inc.** | Web Application Hosting & Edge CDN | IP Address, User Agent, Network Request Logs | โฮสต์ส่วนติดต่อผู้ใช้ (Frontend) และกระจายเนื้อหาผ่าน Edge Network | **Data Processor** | สหรัฐอเมริกา (USA) / เครือข่ายทั่วโลก (Global Anycast) | มี Vercel DPA / Standard Contractual Clauses (SCCs) |
| **2** | **Render Services Inc.** | Cloud Application Compute (Backend API) | ข้อมูลบัญชีผู้ใช้, ข้อมูลบันทึก, หมายเลข IP, Request Payload | โฮสต์ระบบเซิร์ฟเวอร์ Node.js/Express API และระบบ Real-time WebSockets | **Data Processor** | สหรัฐอเมริกา (USA) / สิงคโปร์ (Singapore) | มี Render DPA / SOC 2 Type II Certified |
| **3** | **Neon Inc.** | Serverless PostgreSQL Database | ข้อมูลทั้งหมดในฐานข้อมูล (Users, Notes, Boards, Subscriptions) | จัดเก็บและบริหารจัดการฐานข้อมูลหลักของระบบ | **Data Processor** | สหรัฐอเมริกา (USA) / สิงคโปร์ (AWS Region ap-southeast-1) | มี Neon DPA / SOC 2 Type II / Encryption at Rest (AES-256) |
| **4** | **Cloudflare Inc.** | Bot Mitigation (Turnstile CAPTCHA) | IP Address, Browser Telemetry, Challenge Token | ป้องกันการโจมตีจากบอท ป้องกันการ Spam สมัครสมาชิก และ Brute Force | **Data Processor** | สหรัฐอเมริกา (USA) / Global Edge | มี Cloudflare DPA / ISO 27001 Certified |
| **5** | **Google LLC** | Federated Authentication (Google OAuth 2.0) | Google User ID, Email, Display Name, Profile Photo | ตรวจสอบยืนยันตัวตนเมื่อผู้ใช้เลือก "Sign in with Google" | **Independent Data Controller** (ในการยืนยันตัวตน) | สหรัฐอเมริกา (USA) | Google API Terms of Service & Google Privacy Policy |
| **6** | **Email Delivery Provider**<br>*(Resend / SendGrid / Custom SMTP)* | อีเมลแจ้งเตือนและลิงก์รีเซ็ตรหัสผ่าน | Email Address, ชื่อผู้รับ, Reset Token | ส่งอีเมลบริการทางเทคนิคตามคำขอของผู้ใช้ | **Data Processor** | `[REQUIRES SYSTEM OWNER INPUT: ระบุผู้ให้บริการส่งอีเมลที่ใช้งานจริงและประเทศที่ตั้ง]` | มี DPA จากผู้ให้บริการอีเมล |

---

## 3. การประเมินการโอนข้อมูลไปยังต่างประเทศ (Cross-Border Transfer Assessment)
ตาม **มาตรา 28 และมาตรา 29 แห่ง PDPA** รวมถึงประกาศคณะกรรมการคุ้มครองข้อมูลส่วนบุคคล เรื่อง หลักเกณฑ์การคุ้มครองข้อมูลส่วนบุคคลที่ส่งหรือโอนไปยังต่างประเทศ:

### 3.1 วัตถุประสงค์และความจำเป็น:
การโอนข้อมูลไปยังเซิร์ฟเวอร์ในต่างประเทศ (สหรัฐอเมริกา และสิงคโปร์) เป็นความจำเป็นทางเทคโนโลยีเพื่อการรันระบบคลาวด์คอมพิวติ้งที่ปลอดภัย มีความพร้อมใช้งานสูง (High Availability) และมีระบบป้องกันภัยคุกคามทางไซเบอร์

### 3.2 ฐานความชอบธรรมในการโอนข้อมูล:
1. **มาตรา 28 วรรคสี่ (3):** เป็นการจำเป็นเพื่อการปฏิบัติตามสัญญาซึ่งเจ้าของข้อมูลส่วนบุคคลเป็นคู่สัญญา (การให้บริการ Cloud Note ตามคำขอของผู้ใช้)
2. **มาตรา 29 วรรคสาม:** ผู้ให้บริการคลาวด์ทุกราย (Vercel, Render, Neon, Cloudflare) มีข้อสัญญามาตรฐาน (Standard Contractual Clauses - SCCs) หรือได้รับการรับรองมาตรฐานความมั่นคงปลอดภัยระดับสากล (ISO/IEC 27001, SOC 2 Type II) ที่ให้ความคุ้มครองข้อมูลส่วนบุคคลเทียบเท่ามาตรฐานสากล

### 3.3 มาตรการป้องกันเชิงเทคนิคเพิ่มเติม (Technical Safeguards):
* **Zero-Knowledge Encryption:** สำหรับบันทึกในหมวด Encrypted Vault ข้อมูลจะถูกเข้ารหัสตั้งแต่ฝั่งไคลเอนต์ (Client-Side AES-GCM) ดังนั้นข้อมูลที่โอนไปจัดเก็บบนคลาวด์ของ Neon หรือ Render จึงอยู่ในรูปของ Ciphertext ที่ไม่สามารถอ่านได้ แม้ผู้ให้บริการคลาวด์จะถูกบุกรุกก็ตาม
* **In-Transit Encryption:** การส่งข้อมูลทั้งหมดผ่านอินเทอร์เน็ตระหว่างเครื่องผู้ใช้และเซิร์ฟเวอร์ต่างประเทศถูกเข้ารหัสด้วยโปรโตคอล TLS 1.3
* **Restricted Access:** ปิดการเข้าถึงพอร์ตฐานข้อมูลโดยตรงจากอินเทอร์เน็ตภายนอก (SSL-enforced connections only)

---

## 4. ข้อกำหนดในการจัดทำสัญญาประมวลผลข้อมูล (DPA Requirement)
ทีมงานต้องตรวจสอบว่า:
1. บัญชีผู้ให้บริการคลาวด์ทุกราย (Render, Neon, Vercel, Cloudflare) ได้มีการกดยอมรับหรือลงนามใน **Data Processing Addendum (DPA)**
2. เอกสาร DPA ต้องระบุชัดเจนว่าผู้ให้บริการจะไม่นำข้อมูลของผู้ใช้ไปประมวลผลเพื่อวัตถุประสงค์อื่น หรือนำไปใช้ฝึกโมเดล AI ใด ๆ โดยไม่ได้รับความยินยอม
3. มีการทบทวนรายชื่อผู้ให้บริการเป็นประจำทุกปี หรือเมื่อมีการเปลี่ยนแปลงโครงสร้างพื้นฐานของระบบ
