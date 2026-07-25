import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const ACHIEVEMENTS = [
  { code: 'first_task', title: 'First Step', description: 'Complete your first task', icon: '🌱', xpReward: 50, coinReward: 10 },
  { code: 'first_week', title: 'One Week In', description: 'Complete tasks 7 days in a row', icon: '📅', xpReward: 100, coinReward: 25 },
  { code: 'hundred_tasks', title: 'Centurion', description: 'Complete 100 tasks', icon: '💯', xpReward: 500, coinReward: 100 },
  { code: 'streak_30', title: '30-Day Streak', description: 'Maintain a 30-day streak', icon: '🔥', xpReward: 1000, coinReward: 250 },
  { code: 'first_friend', title: 'Friendly', description: 'Make your first friend', icon: '🤝', xpReward: 50, coinReward: 10 },
  { code: 'first_post', title: 'Say Hello', description: 'Share your first post', icon: '📣', xpReward: 25, coinReward: 5 },
];

async function main() {
  console.log('🌱 Seeding...');

  const passwordHash = await bcrypt.hash('password', 12);

  const alice = await prisma.user.upsert({
    where: { email: 'alice@focus.app' },
    update: {},
    create: {
      email: 'alice@focus.app',
      name: 'Alice',
      passwordHash,
      bio: 'Building better habits, one day at a time.',
    },
  });
  const bob = await prisma.user.upsert({
    where: { email: 'bob@focus.app' },
    update: {},
    create: { email: 'bob@focus.app', name: 'Bob', passwordHash, bio: 'Productivity nerd.' },
  });

  for (const a of ACHIEVEMENTS) {
    await prisma.achievement.upsert({ where: { code: a.code }, update: a, create: a });
  }

  const sampleTasks = [
    { title: 'Morning run', points: 30, priority: 'HIGH' as const, repeat: 'DAILY' as const },
    { title: 'Read 30 minutes', points: 20, priority: 'MEDIUM' as const, repeat: 'DAILY' as const },
    { title: 'Weekly review', points: 50, priority: 'MEDIUM' as const, repeat: 'WEEKLY' as const },
  ];
  for (const t of sampleTasks) {
    await prisma.task.create({ data: { ...t, userId: alice.id, visibility: 'FRIENDS' } });
  }

  await prisma.habit.createMany({
    data: [
      { userId: alice.id, title: 'Drink 2L of water', currentStreak: 3, bestStreak: 7 },
      { userId: alice.id, title: 'Meditate 10 minutes', currentStreak: 5, bestStreak: 14 },
    ],
  });

  // Auto-accept friendship for demo
  const existing = await prisma.friend.findFirst({
    where: { OR: [{ senderId: alice.id, receiverId: bob.id }, { senderId: bob.id, receiverId: alice.id }] },
  });
  if (!existing) {
    await prisma.friend.create({
      data: { senderId: alice.id, receiverId: bob.id, status: 'ACCEPTED' },
    });
  }

  // Sample challenge
  await prisma.challenge.upsert({
    where: { id: 'seed-challenge-30day' },
    update: {},
    create: {
      id: 'seed-challenge-30day',
      ownerId: alice.id,
      title: '30-Day Reading Challenge',
      description: 'Read at least 20 pages every day for 30 days.',
      goal: '20 pages per day',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 86_400_000),
      members: { create: [{ userId: alice.id }, { userId: bob.id }] },
    },
  });

  console.log('✅ Seed complete');
  console.log('   alice@focus.app / password');
  console.log('   bob@focus.app   / password');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
