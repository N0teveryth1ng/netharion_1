import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { seedAchievements, checkAndUnlockAchievements } from '@/lib/achievements';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Seed achievements if needed
    await seedAchievements();

    // Check for new achievements
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { statsJson: true },
    });

    const userStats = user?.statsJson ? JSON.parse(user.statsJson) : {};
    const newUnlocks = await checkAndUnlockAchievements(session.user.id, userStats);

    // Get all achievements with user progress
    const achievements = await prisma.$queryRaw`
      SELECT
        a.id,
        a.name,
        a.description,
        a.icon,
        a.category,
        a."xpReward",
        ua."unlockedAt"
      FROM "Achievement" a
      LEFT JOIN "UserAchievement" ua ON a.id = ua."achievementId" AND ua."userId" = ${session.user.id}
      ORDER BY a.category, a."xpReward" DESC
    ` as any[];

    return NextResponse.json(achievements);
  } catch (error) {
    console.error('Achievements API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
