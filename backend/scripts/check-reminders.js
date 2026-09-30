const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const reminders = await prisma.reminder.findMany({
    include: { user: { select: { email: true } }, note: { select: { title: true } } },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });
  console.log('Reminders count:', reminders.length);
  for (const r of reminders) {
    console.log({
      id: r.id,
      user: r.user.email,
      note: r.note?.title,
      reminderDateTime: r.reminderDateTime,
      status: r.status,
      repeatRule: r.repeatRule,
      sentAt: r.sentAt,
      createdAt: r.createdAt
    });
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
