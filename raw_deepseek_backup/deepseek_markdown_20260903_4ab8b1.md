# 🔒 SecureNote

> เว็บแอปพลิเคชันจดบันทึกที่ปลอดภัย ใช้งานง่าย และมีฟีเจอร์ครบครัน

## ✨ Features

- 🔐 End-to-End Encryption
- 📝 Rich Text Editor
- 🏷️ Labels & Notebooks
- 🔒 Vault (Password Protected Notes)
- 🌙 Dark/Light Mode
- 📱 Responsive Design
- 🔄 Real-time Sync
- 🤝 Collaboration
- 📤 Export to PDF/Markdown

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL
- Redis (optional)

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/secure-note.git
cd secure-note

# Install dependencies
cd frontend && npm install
cd ../backend && npm install

# Setup database
cd backend
npx prisma migrate dev
npx prisma generate

# Run development servers
npm run dev  # Frontend: http://localhost:3000
npm run dev  # Backend: http://localhost:5000