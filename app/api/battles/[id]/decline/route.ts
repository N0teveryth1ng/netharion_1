import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: battleId } = await params;

    // Update battle to declined status
    const battle = await prisma.$queryRaw`
      UPDATE "Battle"
      SET status = 'DECLINED', "completedAt" = NOW()
      WHERE id = ${battleId}
      AND "receiverId" = ${session.user.id}
      AND status = 'PENDING'
      RETURNING *
    ` as any[];

    if (battle.length === 0) {
      return NextResponse.json({ error: 'Battle not found or cannot be declined' }, { status: 404 });
    }

    return NextResponse.json(battle[0]);
  } catch (error) {
    console.error('Decline battle error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
