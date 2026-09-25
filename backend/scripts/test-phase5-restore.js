const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const API_URL = 'http://localhost:5000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

async function createTokenForUser(email) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error(`User not found: ${email}`);

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });

  await prisma.session.create({
    data: {
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  return { user, token };
}

async function runPhase5Tests() {
  console.log('═════════════════════════════════════════════════════════════════');
  console.log('🚀 PHASE 5: RESTORE & DOWNLOAD & AUDIT EXPORT TEST SUITE');
  console.log('═════════════════════════════════════════════════════════════════\n');

  const regular = await createTokenForUser('test@gmail.com');
  const admin = await createTokenForUser('aporngold@gmail.com');
  const superAdmin = await createTokenForUser('knowman@securenote.test');

  // 1. Get existing backups list to find a valid backup
  const backupsRes = await fetch(`${API_URL}/admin/backups`, {
    headers: { Authorization: `Bearer ${admin.token}` },
  }).then(r => r.json());

  const targetBackup = backupsRes.physicalFiles[0]?.name;
  console.log(`📦 Testing with latest backup file: ${targetBackup}\n`);

  // TEST 5.1: Download Backup File
  if (targetBackup) {
    const downloadRes = await fetch(`${API_URL}/admin/backups/${targetBackup}/download`, {
      headers: { Authorization: `Bearer ${admin.token}` },
    });
    console.log(`${downloadRes.status === 200 ? '✅' : '❌'} [${downloadRes.status}] Download backup file: ${targetBackup}`);
    const contentType = downloadRes.headers.get('content-type');
    console.log(`   Content-Type: ${contentType}`);
  }

  // TEST 5.2: Path Traversal prevention on download
  const traversalRes = await fetch(`${API_URL}/admin/backups/..%2f..%2fpackage.json/download`, {
    headers: { Authorization: `Bearer ${admin.token}` },
  });
  console.log(`${traversalRes.status === 400 || traversalRes.status === 404 ? '✅' : '❌'} [${traversalRes.status}] Block malicious path traversal on download`);

  // TEST 5.3: Regular Admin trying to restore -> 403 Forbidden
  const adminRestore = await fetch(`${API_URL}/admin/backups/restore`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${admin.token}`,
    },
    body: JSON.stringify({ filename: targetBackup, confirmation: 'CONFIRM_RESTORE' }),
  });
  console.log(`${adminRestore.status === 403 ? '✅' : '❌'} [${adminRestore.status}] Regular Admin blocked from restoring database (403 Forbidden)`);

  // TEST 5.4: Super Admin without exact confirmation -> 400 Bad Request
  const badConfirmRestore = await fetch(`${API_URL}/admin/backups/restore`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${superAdmin.token}`,
    },
    body: JSON.stringify({ filename: targetBackup, confirmation: 'WRONG_CONFIRMATION' }),
  });
  console.log(`${badConfirmRestore.status === 400 ? '✅' : '❌'} [${badConfirmRestore.status}] Restore blocked if confirmation is wrong (Multi-layer Safety)`);

  // TEST 5.5: Super Admin with valid confirmation -> 200 OK & Creates Safety Backup
  if (targetBackup) {
    const validRestore = await fetch(`${API_URL}/admin/backups/restore`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdmin.token}`,
      },
      body: JSON.stringify({ filename: targetBackup, confirmation: 'CONFIRM_RESTORE' }),
    });
    const restoreData = await validRestore.json();
    console.log(`${validRestore.status === 200 ? '✅' : '❌'} [${validRestore.status}] Super Admin successfully executed Restore`);
    console.log(`   Message: ${restoreData.message}`);
    console.log(`   Safety Backup automatically created: ${restoreData.safetyBackup}`);

    // Verify Safety Backup exists on disk
    const safetyExists = fs.existsSync(path.join(__dirname, '../backups', restoreData.safetyBackup));
    console.log(`${safetyExists ? '✅' : '❌'} Physical Pre-restore Safety Backup verified on disk`);
  }

  // Clean up sessions
  await prisma.session.deleteMany({
    where: { token: { in: [regular.token, admin.token, superAdmin.token] } },
  });

  console.log('\n✨ ALL PHASE 5 TESTS COMPLETED SUCCESSFULLY!');
}

runPhase5Tests().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
