const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const API_URL = 'http://localhost:5000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

async function createTokenForUser(email) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error(`User not found: ${email}`);

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });

  // Create session in DB so auth middleware recognizes it
  await prisma.session.create({
    data: {
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  return { user, token };
}

async function testEndpoint(name, url, options, expectedStatus) {
  try {
    const res = await fetch(url, options);
    const data = await res.json();
    const passed = res.status === expectedStatus;
    console.log(`${passed ? '✅' : '❌'} [${res.status} vs ${expectedStatus}] ${name}`);
    if (!passed) {
      console.log('   Response body:', JSON.stringify(data).slice(0, 200));
    }
    return { passed, data, status: res.status };
  } catch (err) {
    console.log(`❌ [Error] ${name}:`, err.message);
    return { passed: false, error: err.message };
  }
}

async function runTests() {
  console.log('🚀 เริ่มต้นการทดสอบ Admin Backend APIs (Phase 2)...\n');

  // 1. Prepare users
  const regular = await createTokenForUser('test@gmail.com');
  const admin = await createTokenForUser('aporngold@gmail.com');
  const superAdmin = await createTokenForUser('knowman@securenote.test');

  console.log(`👤 Regular User: ${regular.user.email} (Role: ${regular.user.role})`);
  console.log(`🛡️ Admin User: ${admin.user.email} (Role: ${admin.user.role})`);
  console.log(`👑 Super Admin: ${superAdmin.user.email} (Role: ${superAdmin.user.role})\n`);

  // TEST 1: Unauthenticated request should be 401
  await testEndpoint(
    '1. Unauthenticated GET /api/admin/stats -> Expect 401',
    `${API_URL}/admin/stats`,
    { headers: { 'Content-Type': 'application/json' } },
    401
  );

  // TEST 2: Regular user request should be 403 Forbidden
  await testEndpoint(
    '2. Regular User GET /api/admin/stats -> Expect 403 Forbidden',
    `${API_URL}/admin/stats`,
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${regular.token}`,
      },
    },
    403
  );

  // TEST 3: Admin GET /api/admin/stats should be 200
  const statsRes = await testEndpoint(
    '3. Admin GET /api/admin/stats -> Expect 200 OK',
    `${API_URL}/admin/stats`,
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${admin.token}`,
      },
    },
    200
  );
  if (statsRes.passed) {
    console.log('   Stats Summary:', JSON.stringify(statsRes.data.stats.users), 'Notes:', statsRes.data.stats.notes);
  }

  // TEST 4: Admin GET /api/admin/users
  const usersRes = await testEndpoint(
    '4. Admin GET /api/admin/users -> Expect 200 OK',
    `${API_URL}/admin/users?page=1&limit=5`,
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${admin.token}`,
      },
    },
    200
  );
  if (usersRes.passed) {
    console.log(`   Found ${usersRes.data.pagination.total} users, Page 1 has ${usersRes.data.users.length} users`);
    const hasPassword = usersRes.data.users.some(u => u.passwordHash || u.masterPasswordVerifier);
    console.log(`   🔒 Security Check: passwordHash/secrets exposed in users list? ${hasPassword ? '🚨 YES (FAILED)' : '🛡️ NO (PASSED)'}`);
  }

  // TEST 5: Admin GET /api/admin/notes/stats
  await testEndpoint(
    '5. Admin GET /api/admin/notes/stats -> Expect 200 OK',
    `${API_URL}/admin/notes/stats`,
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${admin.token}`,
      },
    },
    200
  );

  // TEST 6: Admin GET /api/admin/boards/stats
  const boardsRes = await testEndpoint(
    '6. Admin GET /api/admin/boards/stats -> Expect 200 OK',
    `${API_URL}/admin/boards/stats`,
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${admin.token}`,
      },
    },
    200
  );
  if (boardsRes.passed) {
    console.log('   Boards summary:', JSON.stringify(boardsRes.data.summary));
  }

  // TEST 7: Admin GET /api/admin/database
  const dbRes = await testEndpoint(
    '7. Admin GET /api/admin/database -> Expect 200 OK',
    `${API_URL}/admin/database`,
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${admin.token}`,
      },
    },
    200
  );
  if (dbRes.passed) {
    console.log(`   DB Size: ${dbRes.data.database.sizeFormatted}, Integrity: ${dbRes.data.database.integrityCheck}`);
  }

  // TEST 8: Regular Admin trying to change user role -> Expect 403 (Requires SUPER_ADMIN)
  await testEndpoint(
    '8. Admin trying PUT /api/admin/users/:id/role -> Expect 403 Forbidden',
    `${API_URL}/admin/users/${regular.user.id}/role`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${admin.token}`,
      },
      body: JSON.stringify({ role: 'ADMIN' }),
    },
    403
  );

  // TEST 9: Super Admin changing user role -> Expect 200 OK
  const changeRoleRes = await testEndpoint(
    '9. Super Admin PUT /api/admin/users/:id/role -> Expect 200 OK',
    `${API_URL}/admin/users/${regular.user.id}/role`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdmin.token}`,
      },
      body: JSON.stringify({ role: 'ADMIN' }),
    },
    200
  );

  // Revert back to USER
  await testEndpoint(
    '   Reverting test user back to USER -> Expect 200 OK',
    `${API_URL}/admin/users/${regular.user.id}/role`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdmin.token}`,
      },
      body: JSON.stringify({ role: 'USER' }),
    },
    200
  );

  // TEST 10: Trigger Backup
  const backupRes = await testEndpoint(
    '10. Admin POST /api/admin/backups/create -> Expect 201 Created',
    `${API_URL}/admin/backups/create`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${admin.token}`,
      },
      body: JSON.stringify({ note: 'Automated test backup' }),
    },
    201
  );

  // TEST 11: GET /api/admin/backups
  await testEndpoint(
    '11. Admin GET /api/admin/backups -> Expect 200 OK',
    `${API_URL}/admin/backups`,
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${admin.token}`,
      },
    },
    200
  );

  // TEST 12: GET /api/admin/audit-logs
  const auditRes = await testEndpoint(
    '12. Admin GET /api/admin/audit-logs -> Expect 200 OK',
    `${API_URL}/admin/audit-logs?page=1&limit=5`,
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${admin.token}`,
      },
    },
    200
  );
  if (auditRes.passed) {
    console.log(`   Found ${auditRes.data.pagination.total} audit log entries.`);
    if (auditRes.data.logs.length > 0) {
      console.log('   Latest log:', auditRes.data.logs[0].action, auditRes.data.logs[0].details);
    }
  }

  // Cleanup test sessions
  await prisma.session.deleteMany({
    where: { token: { in: [regular.token, admin.token, superAdmin.token] } },
  });

  console.log('\n✨ การทดสอบ API ทุกเส้นเสร็จสมบูรณ์!');
}

runTests().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
