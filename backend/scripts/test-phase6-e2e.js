const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

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

async function runPhase6E2E() {
  console.log('═════════════════════════════════════════════════════════════════');
  console.log('🌟 PHASE 6: FULL END-TO-END APPLICATION & REGRESSION TEST SUITE');
  console.log('═════════════════════════════════════════════════════════════════\n');

  let passed = 0;
  let total = 0;

  function assert(condition, message, details = '') {
    total++;
    if (condition) {
      passed++;
      console.log(`✅ [PASS] ${message}`);
    } else {
      console.error(`❌ [FAIL] ${message}`);
      if (details) console.error(`   Details: ${details}`);
    }
  }

  // 1. Prepare Users
  const regular = await createTokenForUser('test@gmail.com');
  const superAdmin = await createTokenForUser('knowman@securenote.test');

  console.log('--- 1. AUTHENTICATION & PROFILE INTEGRITY ---');

  // Test 1.1: Me endpoint returns role correctly for regular user
  const regularMeRes = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${regular.token}` },
  }).then(r => r.json());
  assert(
    regularMeRes.role === 'USER',
    `Regular user profile returns role: "${regularMeRes.role}"`
  );

  // Test 1.2: Me endpoint returns role correctly for Super Admin
  const superMeRes = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${superAdmin.token}` },
  }).then(r => r.json());
  assert(
    superMeRes.role === 'SUPER_ADMIN',
    `Super Admin profile returns role: "${superMeRes.role}"`
  );

  console.log('\n--- 2. NOTE OPERATIONS (DESKTOP / MOBILE CORE) ---');

  // Test 2.1: Create note
  const createNoteRes = await fetch(`${API_URL}/notes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${regular.token}`,
    },
    body: JSON.stringify({
      title: 'Phase 6 E2E Test Note',
      content: '<p>This is a temporary test note for Phase 6 E2E testing.</p>',
      color: '#FEF08A',
    }),
  }).then(r => r.json());

  assert(
    createNoteRes.id && createNoteRes.title === 'Phase 6 E2E Test Note',
    `Created test note with ID: ${createNoteRes.id}`
  );

  const testNoteId = createNoteRes.id;

  // Test 2.2: Update note
  const updateNoteRes = await fetch(`${API_URL}/notes/${testNoteId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${regular.token}`,
    },
    body: JSON.stringify({
      title: 'Phase 6 E2E Test Note (Updated)',
      isPinned: true,
    }),
  }).then(r => r.json());

  assert(
    updateNoteRes.title === 'Phase 6 E2E Test Note (Updated)' && updateNoteRes.isPinned === true,
    'Updated test note title and pinned status'
  );

  // Test 2.3: Move to trash (Soft Delete)
  const trashNoteRes = await fetch(`${API_URL}/notes/${testNoteId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${regular.token}` },
  }).then(r => r.json());

  assert(
    trashNoteRes.message !== undefined,
    'Deleted note moved to trash'
  );

  // Test 2.4: Clean up test note permanently from DB
  await prisma.note.delete({ where: { id: testNoteId } });
  console.log('🧹 Cleaned up temporary test note');

  console.log('\n--- 3. BOARDS & CAPACITY LIMIT (56 NOTES) ---');

  // Test 3.1: Fetch boards
  const boardsRes = await fetch(`${API_URL}/boards`, {
    headers: { Authorization: `Bearer ${regular.token}` },
  }).then(r => r.json());

  assert(
    Array.isArray(boardsRes),
    `Regular user can fetch boards (Found: ${boardsRes.length} boards)`
  );

  // Test 3.2: Verify board stats limit
  const adminBoardsRes = await fetch(`${API_URL}/admin/boards/stats`, {
    headers: { Authorization: `Bearer ${superAdmin.token}` },
  }).then(r => r.json());

  assert(
    adminBoardsRes.summary.maxNotesLimit === 56,
    'Board notes capacity limit is strictly 56 notes'
  );

  console.log('\n--- 4. ADMIN DASHBOARD & SECURITY AUDIT ---');

  // Test 4.1: Stats overview
  const statsRes = await fetch(`${API_URL}/admin/stats`, {
    headers: { Authorization: `Bearer ${superAdmin.token}` },
  }).then(r => r.json());

  assert(
    statsRes.success === true && statsRes.stats.users.total > 0,
    `Admin stats overview verified (Total Users: ${statsRes.stats.users.total})`
  );

  // Test 4.2: Database integrity check
  const dbInfoRes = await fetch(`${API_URL}/admin/database`, {
    headers: { Authorization: `Bearer ${superAdmin.token}` },
  }).then(r => r.json());

  assert(
    dbInfoRes.database.integrityCheck === 'ok',
    `Database PRAGMA integrity check: "${dbInfoRes.database.integrityCheck}"`
  );

  // Test 4.3: Audit logs retrieval
  const auditRes = await fetch(`${API_URL}/admin/audit-logs?limit=5`, {
    headers: { Authorization: `Bearer ${superAdmin.token}` },
  }).then(r => r.json());

  assert(
    auditRes.success === true && Array.isArray(auditRes.logs),
    `Audit logs system active (Total entries: ${auditRes.pagination.total})`
  );

  console.log('\n--- 5. NOTE REMINDERS & NOTIFICATIONS (DESKTOP & MOBILE INTEGRATION) ---');

  // Test 5.1: VAPID Key available
  const vapidRes = await fetch(`${API_URL}/reminders/vapid-key`).then(r => r.json());
  assert(
    Boolean(vapidRes.publicKey),
    `Web Push VAPID Public Key active: "${vapidRes.publicKey ? vapidRes.publicKey.substring(0, 15) + '...' : 'none'}"`
  );

  // Test 5.2: Create Reminder with repeatRule
  const testRemNote = await prisma.note.create({
    data: {
      userId: regular.user.id,
      title: 'Phase 6 Reminder Test Note',
      content: '<p>Testing Reminder lifecycle in Phase 6 E2E</p>',
    },
  });

  const createRemRes = await fetch(`${API_URL}/reminders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${regular.token}`,
    },
    body: JSON.stringify({
      noteId: testRemNote.id,
      title: testRemNote.title,
      reminderDateTime: new Date(Date.now() + 7200 * 1000).toISOString(),
      repeatRule: 'daily',
    }),
  }).then(r => r.json());

  assert(
    createRemRes.success === true && createRemRes.reminder?.repeatRule === 'daily',
    `Created Note Reminder with repeatRule "daily" for Note ID: ${testRemNote.id}`
  );

  // Test 5.3: Fetch Reminder by noteId
  const getRemByNoteRes = await fetch(`${API_URL}/reminders/note/${testRemNote.id}`, {
    headers: { Authorization: `Bearer ${regular.token}` },
  }).then(r => r.json());

  assert(
    getRemByNoteRes.success === true && getRemByNoteRes.reminder?.id === createRemRes.reminder?.id,
    `Successfully queried Reminder by noteId: ${testRemNote.id}`
  );

  // Test 5.4: In-App Notification Center
  const notif = await prisma.notification.create({
    data: {
      userId: regular.user.id,
      noteId: testRemNote.id,
      title: '⏰ Phase 6 Notification Test',
      message: 'Integration test notification center verification',
    },
  });

  const notifListRes = await fetch(`${API_URL}/notifications`, {
    headers: { Authorization: `Bearer ${regular.token}` },
  }).then(r => r.json());

  assert(
    notifListRes.success === true && notifListRes.notifications.some(n => n.id === notif.id),
    `In-App Notification Center retrieved active notifications (Unread: ${notifListRes.unreadCount})`
  );

  // Test 5.5: Mark notification as read
  const markReadRes = await fetch(`${API_URL}/notifications/${notif.id}/read`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${regular.token}` },
  }).then(r => r.json());

  assert(
    markReadRes.success === true && markReadRes.notification?.isRead === true,
    `Successfully marked notification ID: ${notif.id} as read`
  );

  // Cleanup Reminder & Notification & Test Note
  await prisma.notification.deleteMany({ where: { id: notif.id } });
  if (createRemRes.reminder?.id) {
    await prisma.reminder.deleteMany({ where: { id: createRemRes.reminder.id } });
  }
  await prisma.note.deleteMany({ where: { id: testRemNote.id } });
  console.log('🧹 Cleaned up temporary test reminder & notification data');

  // 6. Clean up test sessions
  await prisma.session.deleteMany({
    where: { token: { in: [regular.token, superAdmin.token] } },
  });
  console.log('\n🧹 Cleaned up temporary test sessions');

  console.log('\n═════════════════════════════════════════════════════════════════');
  console.log(`📊 PHASE 6 E2E SUMMARY: ${passed} / ${total} TESTS PASSED (${((passed/total)*100).toFixed(1)}%)`);
  console.log('═════════════════════════════════════════════════════════════════\n');

  if (passed === total) {
    console.log('🎉 ALL APPLICATION MODULES ARE 100% HEALTHY AND VERIFIED!\n');
  } else {
    process.exit(1);
  }
}

runPhase6E2E().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
