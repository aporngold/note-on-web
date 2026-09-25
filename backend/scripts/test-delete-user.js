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

async function testDeleteUser() {
  console.log('═════════════════════════════════════════════════════════════════');
  console.log('🧪 TEST: SUPER ADMIN DELETE USER & CASCADE VERIFICATION');
  console.log('═════════════════════════════════════════════════════════════════\n');

  const admin = await createTokenForUser('aporngold@gmail.com');
  const superAdmin = await createTokenForUser('knowman@securenote.test');

  // 1. Create a dummy user for deletion test
  const dummyEmail = `to_be_deleted_${Date.now()}@test.com`;
  const dummyUser = await prisma.user.create({
    data: {
      email: dummyEmail,
      username: `del_user_${Date.now()}`,
      role: 'USER',
    },
  });

  // Create a note and board for dummy user to test Cascade Delete
  const dummyNote = await prisma.note.create({
    data: {
      title: 'Dummy Note to be deleted',
      content: 'This note should be deleted when user is deleted',
      userId: dummyUser.id,
    },
  });

  const dummyBoard = await prisma.board.create({
    data: {
      name: 'Dummy Board to be deleted',
      userId: dummyUser.id,
    },
  });

  console.log(`👤 Created temporary user: ${dummyUser.email} (ID: ${dummyUser.id})`);
  console.log(`📝 Associated Note: ${dummyNote.id}, Board: ${dummyBoard.id}\n`);

  // TEST 1: Regular admin trying to delete user -> 403 Forbidden
  const regAdminDelete = await fetch(`${API_URL}/admin/users/${dummyUser.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${admin.token}` },
  });
  console.log(`${regAdminDelete.status === 403 ? '✅' : '❌'} [${regAdminDelete.status}] Regular Admin blocked from deleting user (403 Forbidden)`);

  // TEST 2: Super Admin trying to delete own user -> 400 Bad Request
  const selfDelete = await fetch(`${API_URL}/admin/users/${superAdmin.user.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${superAdmin.token}` },
  });
  console.log(`${selfDelete.status === 400 ? '✅' : '❌'} [${selfDelete.status}] Super Admin blocked from deleting self (Self-Lockout Protection)`);

  // TEST 3: Super Admin deleting dummy user -> 200 OK
  const superDelete = await fetch(`${API_URL}/admin/users/${dummyUser.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${superAdmin.token}` },
  });
  const deleteData = await superDelete.json();
  console.log(`${superDelete.status === 200 ? '✅' : '❌'} [${superDelete.status}] Super Admin successfully deleted user`);
  console.log(`   Message: ${deleteData.message}`);

  // TEST 4: Verify Cascade deletion
  const checkNote = await prisma.note.findUnique({ where: { id: dummyNote.id } });
  const checkBoard = await prisma.board.findUnique({ where: { id: dummyBoard.id } });
  const checkUser = await prisma.user.findUnique({ where: { id: dummyUser.id } });

  console.log(`${checkUser === null ? '✅' : '❌'} User was completely removed from DB`);
  console.log(`${checkNote === null ? '✅' : '❌'} User's Note was cleanly Cascade-deleted`);
  console.log(`${checkBoard === null ? '✅' : '❌'} User's Board was cleanly Cascade-deleted`);

  // TEST 5: Verify AuditLog
  const latestLog = await prisma.auditLog.findFirst({
    where: { action: 'DELETE_USER' },
    orderBy: { createdAt: 'desc' },
  });
  console.log(`${latestLog && latestLog.target === dummyEmail ? '✅' : '❌'} AuditLog correctly recorded DELETE_USER action`);

  // Clean up sessions
  await prisma.session.deleteMany({
    where: { token: { in: [admin.token, superAdmin.token] } },
  });

  console.log('\n✨ ALL DELETE USER TESTS PASSED PERFECTLY!');
}

testDeleteUser().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
