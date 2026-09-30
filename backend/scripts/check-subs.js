const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const subs = await prisma.pushSubscription.findMany({
    include: { user: { select: { id: true, email: true, username: true } } },
    orderBy: { createdAt: 'desc' },
  });
  console.log('Total subscriptions in DB:', subs.length);
  for (const s of subs) {
    console.log({
      id: s.id,
      email: s.user?.email,
      userId: s.userId,
      deviceType: s.deviceType,
      userAgent: s.userAgent,
      endpoint: s.endpoint.slice(0, 70) + '...',
      createdAt: s.createdAt,
    });
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
