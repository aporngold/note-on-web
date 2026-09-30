const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      username: true,
      sessions: { select: { id: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: 3 },
      pushSubscriptions: { select: { id: true, deviceType: true, userAgent: true, createdAt: true } },
    },
  });
  console.log('Total users in DB:', users.length);
  for (const u of users) {
    if (u.sessions.length > 0 || u.pushSubscriptions.length > 0) {
      console.log({
        email: u.email,
        username: u.username,
        sessionsCount: u.sessions.length,
        pushCount: u.pushSubscriptions.length,
        pushDevices: u.pushSubscriptions.map(p => ({ type: p.deviceType, at: p.createdAt })),
      });
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
