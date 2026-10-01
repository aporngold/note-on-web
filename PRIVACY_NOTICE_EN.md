# Privacy Notice
**Note on Web Project**
*Effective Date: [TODO — INFORMATION REQUIRED FROM SYSTEM OWNER / Specify release date 2026]*
*Document Version: 1.0 (Updated 2026)*

---

**Note on Web** ("we", "us", "our", or the "Platform") values the privacy of its users ("you", "user", or "Data Subject") and is committed to protecting personal data in compliance with the **Thailand Personal Data Protection Act B.E. 2562 (2019) (PDPA)** and related regulatory guidelines enforced as of 2026.

This Privacy Notice outlines how we collect, use, disclose, and manage your personal data, your statutory rights, and our data security practices.

---

## 1. Data Controller Information
* **Data Controller Name:** `[TODO — INFORMATION REQUIRED FROM SYSTEM OWNER: Legal entity name or individual operator]`
* **Contact Address:** `[TODO — INFORMATION REQUIRED FROM SYSTEM OWNER: Physical mailing address]`
* **Electronic Contact:** `[TODO — INFORMATION REQUIRED FROM SYSTEM OWNER: Dedicated privacy email address]`
* **Data Protection Officer (DPO) (if applicable):** `[REQUIRES SYSTEM OWNER INPUT: Contact details of designated DPO, or note contact via Data Controller]`

---

## 2. Personal Data We Collect
We collect only the personal data necessary to provide and secure our application:

### 2.1 Account Information
* Username
* Email address
* Display Name
* Password hash (irreversibly hashed using Bcrypt; plain passwords are never stored)
* Unique User Identifier (UUID) and Profile Avatar URL (if provided)

### 2.2 Authentication & Security Telemetry
* Federated identity identifiers (e.g., Google Subject ID when authenticating via Google OAuth 2.0)
* Last login timestamps
* IP address and User Agent string (processed strictly for rate limiting, DDoS mitigation, and intrusion prevention)
* Session tokens (JSON Web Tokens - JWT)

### 2.3 Note Contents & User Data
* Note titles, rich text body contents, task board items, and column ordering
* Labels, notebooks, and organizational metadata (Pin, Archive, Trash)
* Attachments, images, and audio files uploaded by the user
* **Encrypted Vault Notes:** Stored in ciphertext form, encrypted client-side using user-held master keys (Zero-Knowledge Architecture). The platform operators and server admins cannot read or recover encrypted vault notes.

### 2.4 Collaboration & Sharing Data
* Collaborator email addresses and assigned role privileges (Viewer, Editor, Owner)
* Public share codes and share-protection password hashes

### 2.5 Notification Data
* In-app notification queues
* Web Push subscription metadata (Endpoint URL, P256DH public key, Auth token)

---

## 3. Lawful Bases for Processing (PDPA Section 24)

| Activity & Purpose | Data Categories | Lawful Basis (PDPA 2019) |
| :--- | :--- | :--- |
| **Account provisioning and core note-taking service delivery** | Name, Email, Password Hash, Notes, Boards, Files | **Contractual Necessity (Section 24(3))** |
| **Sharing notes and collaborative workspaces** | Collaborator emails, Access rights, Share codes | **Contractual Necessity (Section 24(3))** |
| **Platform security, DDoS defense, intrusion audit logs** | IP address, User Agent, Transaction timestamps | **Legitimate Interests (Section 24(5))** |
| **Browser Web Push Notifications** | Push subscription tokens, Device info | **Consent (Section 19)** |
| **Service emails & password reset links** | Email address, Verification token | **Contractual Necessity (Section 24(3))** |
| **Compliance with lawful court orders or statutory mandates** | Necessary user transaction records | **Legal Obligation (Section 24(6))** |

---

## 4. Third-Party Data Processors
We do not sell personal data. To provide reliable cloud services, we engage verified third-party data processors operating under strict Data Processing Agreements:

* **Application Hosting & Compute:** Render Services Inc. (USA / Singapore)
* **Edge Delivery & CDN:** Vercel Inc. (USA)
* **Cloud Database Engine:** Neon Inc. (PostgreSQL Serverless) (USA / Singapore)
* **Bot Mitigation & CAPTCHA Alternative:** Cloudflare Inc. (Cloudflare Turnstile) (USA)
* **Identity Provider:** Google LLC (Google OAuth 2.0) (USA)

---

## 5. Cross-Border Data Transfers (PDPA Sections 28 & 29)
Because our infrastructure providers operate globally distributed cloud platforms (primarily in the United States and Singapore), your data may be transferred and stored outside Thailand.

All cross-border transfers are conducted pursuant to:
1. **Section 28 Paragraph 4 (3):** Transfers strictly necessary for the performance of our contract with you, and/or
2. Robust contractual safeguards (Standard Contractual Clauses / Data Processing Addenda) ensuring comparable personal data protection standards.

---

## 6. Retention & Erasure Schedule
* **Active User Data:** Retained for the lifetime of your active account.
* **Account Deletion:** When you request account deletion, your notes, boards, and files are permanently purged. Security audit logs (IP, timestamps) are retained for a maximum of 90 days solely for security verification and forensic audits, after which they are irreversibly destroyed.
* **Trash Retention:** Items placed in the Trash are kept for up to 30 days before permanent automatic purging.

---

## 7. Data Subject Rights (PDPA Sections 30–36)
As a data subject under Thai law, you possess the following rights:
1. **Right of Access (Section 30):** Request access to and obtain copies of your personal data.
2. **Right to Data Portability (Section 31):** Obtain your notes and account data in a structured, machine-readable format (JSON/ZIP).
3. **Right to Object (Section 32):** Object to processing based on legitimate interests.
4. **Right to Erasure / Deletion (Section 33):** Request the deletion or destruction of your personal data.
5. **Right to Restriction of Processing (Section 34):** Request suspension of processing during dispute or verification.
6. **Right to Rectification (Section 35):** Request correction of inaccurate, outdated, or incomplete data.
7. **Right to Withdraw Consent (Section 19):** Withdraw previously granted consent (e.g., Push Notifications) at any time.
8. **Right to Lodge a Complaint (Section 73):** File a complaint with the Personal Data Protection Committee (PDPC) if you believe your statutory rights have been infringed.

### How to Exercise Your Rights:
Submit requests via the in-app **Account Settings > Privacy & Data Rights** section, or contact us at:
* Email: `[TODO — INFORMATION REQUIRED FROM SYSTEM OWNER: Dedicated privacy contact email]`
* We will respond to verified identity requests within thirty (30) calendar days.

---

## 8. Security Safeguards
We implement multi-layered administrative and technical safeguards:
* Network communications are encrypted using **TLS 1.3 / HTTPS**.
* Passwords are salted and hashed via **Bcrypt**.
* Sensitive notes support **End-to-End Encryption (AES-GCM 256-bit)** where only the user possesses the decryption key.
* Role-based access controls and rate-limiting protect against unauthorized access and brute-force attacks.

---

## 9. Updates to this Notice
We may update this Privacy Notice from time to time. Material modifications will be announced through the application interface or direct notification at least 15 days prior to taking effect.
