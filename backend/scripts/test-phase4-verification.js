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

async function runPhase4Audit() {
  console.log('═════════════════════════════════════════════════════════════════');
  console.log('🛡️  PHASE 4: COMPREHENSIVE SECURITY & REGRESSION AUDIT SUITE');
  console.log('═════════════════════════════════════════════════════════════════\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message, details = '') {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`✅ [PASS] ${message}`);
    } else {
      console.error(`❌ [FAIL] ${message}`);
      if (details) console.error(`   Details: ${details}`);
    }
  }

  // 1. Prepare test accounts
  const regular = await createTokenForUser('test@gmail.com');
  const admin = await createTokenForUser('aporngold@gmail.com');
  const superAdmin = await createTokenForUser('knowman@securenote.test');

  console.log('--- 1. SECURITY & PRIVACY AUDIT ---');

  // Test 1.1: PasswordHash and masterPasswordVerifier never exposed in Users list
  const usersRes = await fetch(`${API_URL}/admin/users?limit=50`, {
    headers: { Authorization: `Bearer ${admin.token}` },
  }).then(r => r.json());

  assert(
    usersRes.success === true,
    'Admin can fetch users list'
  );

  const leakedPasswords = usersRes.users.filter(u => u.passwordHash || u.masterPasswordVerifier || u.masterPasswordSalt);
  assert(
    leakedPasswords.length === 0,
    'Zero password hashes, salts, or verifiers exposed in user list'
  );

  // Test 1.2: Notes Stats does NOT expose plaintext content
  const notesStatsRes = await fetch(`${API_URL}/admin/notes/stats`, {
    headers: { Authorization: `Bearer ${admin.token}` },
  }).then(r => r.json());

  assert(
    notesStatsRes.success === true,
    'Admin can fetch notes stats'
  );
  assert(
    notesStatsRes.stats.notesContent === undefined && notesStatsRes.stats.notesList === undefined,
    'Zero note text content or titles leaked in notes stats'
  );

  // Test 1.3: Regular user blocked from all admin endpoints (403 Forbidden)
  const regEndpoints = [
    '/admin/stats',
    '/admin/users',
    '/admin/notes/stats',
    '/admin/boards/stats',
    '/admin/database',
    '/admin/backups',
    '/admin/audit-logs',
  ];

  let regBlockedCount = 0;
  for (const ep of regEndpoints) {
    const res = await fetch(`${API_URL}${ep}`, {
      headers: { Authorization: `Bearer ${regular.token}` },
    });
    if (res.status === 403) regBlockedCount++;
  }

  assert(
    regBlockedCount === regEndpoints.length,
    `Regular user blocked with 403 Forbidden on all ${regEndpoints.length} admin endpoints`
  );

  // Test 1.4: Unauthenticated access blocked (401 Unauthorized)
  const unauthRes = await fetch(`${API_URL}/admin/stats`);
  assert(
    unauthRes.status === 401,
    'Unauthenticated access rejected with 401 Unauthorized'
  );

  // Test 1.5: Admin user blocked from changing roles (requires SUPER_ADMIN)
  const adminTryChangeRole = await fetch(`${API_URL}/admin/users/${regular.user.id}/role`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${admin.token}`,
    },
    body: JSON.stringify({ role: 'ADMIN' }),
  });
  assert(
    adminTryChangeRole.status === 403,
    'Regular Admin blocked from changing user roles (403 Forbidden)'
  );

  // Test 1.6: Super Admin self-demotion protection
  const superAdminSelfDemote = await fetch(`${API_URL}/admin/users/${superAdmin.user.id}/role`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${superAdmin.token}`,
    },
    body: JSON.stringify({ role: 'USER' }),
  });
  assert(
    superAdminSelfDemote.status === 400,
    'Super Admin cannot accidentally demote self (Self-Lockout Protection)'
  );

  console.log('\n--- 2. BOARD 56 NOTES CAPACITY LIMIT AUDIT ---');

  // Test 2.1: Board limit rule
  const boardsRes = await fetch(`${API_URL}/admin/boards/stats`, {
    headers: { Authorization: `Bearer ${admin.token}` },
  }).then(r => r.json());

  assert(
    boardsRes.summary.maxNotesLimit === 56,
    'Maximum notes per board is strictly enforced as 56 (MAX_NOTES_PER_BOARD = 56)'
  );

  const allBoardsValidCapacity = boardsRes.boards.every(
    b => b.maxCapacity === 56 && b.remainingCapacity === Math.max(0, 56 - b.notesCount)
  );
  assert(
    allBoardsValidCapacity,
    'All board records correctly calculate remaining capacity against 56 notes'
  );

  console.log('\n--- 3. DATABASE & BACKUP INTEGRITY AUDIT ---');

  // Test 3.1: SQLite PRAGMA integrity_check
  const dbInfoRes = await fetch(`${API_URL}/admin/database`, {
    headers: { Authorization: `Bearer ${admin.token}` },
  }).then(r => r.json());

  assert(
    dbInfoRes.database.integrityCheck === 'ok',
    'SQLite PRAGMA integrity_check returned "ok"'
  );
  assert(
    dbInfoRes.database.sizeBytes > 0,
    `Database file exists on disk (Size: ${dbInfoRes.database.sizeFormatted})`
  );

  // Test 3.2: Trigger manual snapshot backup & verify AuditLog
  const backupRes = await fetch(`${API_URL}/admin/backups/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${superAdmin.token}`,
    },
    body: JSON.stringify({ note: 'Phase 4 Automated Verification Snapshot' }),
  }).then(r => r.json());

  assert(
    backupRes.success === true && backupRes.backup && backupRes.backup.filename.startsWith('dev_backup_'),
    `Created snapshot backup: ${backupRes.backup?.filename}`
  );

  // Verify physical file was created in backups/
  const backupFilePath = path.join(__dirname, '../backups', backupRes.backup.filename);
  assert(
    fs.existsSync(backupFilePath) && fs.statSync(backupFilePath).size > 0,
    'Physical backup file exists and has non-zero size'
  );

  // Verify AuditLog recorded the backup action
  const auditLogsRes = await fetch(`${API_URL}/admin/audit-logs?limit=5`, {
    headers: { Authorization: `Bearer ${admin.token}` },
  }).then(r => r.json());

  const latestLog = auditLogsRes.logs[0];
  assert(
    latestLog && latestLog.action === 'CREATE_BACKUP',
    `AuditLog captured action: ${latestLog?.action} (${latestLog?.details})`
  );

  console.log('\n--- 4. DESKTOP EXISTING FUNCTIONALITY REGRESSION AUDIT ---');

  // Test 4.1: Regular user can fetch notes
  const notesRes = await fetch(`${API_URL}/notes`, {
    headers: { Authorization: `Bearer ${regular.token}` },
  });
  assert(
    notesRes.status === 200,
    'Regular user can fetch notes normally (/api/notes -> 200 OK)'
  );

  // Test 4.2: Regular user can fetch boards
  const userBoardsRes = await fetch(`${API_URL}/boards`, {
    headers: { Authorization: `Bearer ${regular.token}` },
  });
  assert(
    userBoardsRes.status === 200,
    'Regular user can fetch boards normally (/api/boards -> 200 OK)'
  );

  // Test 4.3: Health check endpoint
  const healthRes = await fetch('http://localhost:5000/health').then(r => r.json());
  assert(
    healthRes.status === 'ok',
    'Backend health endpoint remains healthy (/health -> status: "ok")'
  );

  // Clean up sessions
  await prisma.session.deleteMany({
    where: { token: { in: [regular.token, admin.token, superAdmin.token] } },
  });

  console.log('\n═════════════════════════════════════════════════════════════════');
  console.log(`📊 AUDIT SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED (${((passedTests/totalTests)*100).toFixed(1)}%)`);
  console.log('═════════════════════════════════════════════════════════════════\n');

  if (passedTests === totalTests) {
    console.log('🎉 ALL SECURITY & REGRESSION CHECKS PASSED PERFECTLY!\n');
  } else {
    process.exit(1);
  }
}

runPhase4Audit().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
