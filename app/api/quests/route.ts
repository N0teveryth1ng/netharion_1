import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { seedQuests, getAvailableQuests, updateQuestProgress } from '@/lib/quests';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Seed quests if needed
    await seedQuests();

    // Get available quests for user
    const quests = await getAvailableQuests(session.user.id);

    // Update quest progress based on current stats
    const user = await prisma.$queryRaw`
      SELECT stats_json FROM users WHERE "_id" = ${session.user.id}
    ` as any[];
    
    const userStats = user[0]?.stats_json ? JSON.parse(user[0].stats_json) : {};
    await updateQuestProgress(session.user.id, userStats);

    // Refresh quests after progress update
    const updatedQuests = await getAvailableQuests(session.user.id);

    return NextResponse.json(updatedQuests);
  } catch (error) {
    console.error('Quests API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
