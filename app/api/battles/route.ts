import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    const battles = await prisma.battle.findMany({
      where: {
        OR: [{ initiatorId: userId }, { receiverId: userId }],
      },
      include: {
        initiator: {
          select: { id: true, name: true, githubLogin: true, image: true, level: true },
        },
        receiver: {
          select: { id: true, name: true, githubLogin: true, image: true, level: true },
        },
      },
      orderBy: { startedAt: 'desc' },
    });

    const formattedBattles = battles.map(battle => ({
      id: battle.id,
      initiatorId: battle.initiatorId,
      receiverId: battle.receiverId,
      status: battle.status,
      initiatorHp: battle.initiatorHp,
      receiverHp: battle.receiverHp,
      winnerId: battle.winnerId,
      startedAt: battle.startedAt,
      completedAt: battle.completedAt,
      initiatorName: battle.initiator.name || 'Unknown',
      initiatorGithubLogin: battle.initiator.githubLogin || '',
      initiatorImage: battle.initiator.image || '',
      initiatorLevel: battle.initiator.level,
      receiverName: battle.receiver.name || 'Unknown',
      receiverGithubLogin: battle.receiver.githubLogin || '',
      receiverImage: battle.receiver.image || '',
      receiverLevel: battle.receiver.level,
    }));

    return NextResponse.json(formattedBattles);
  } catch (error) {
    console.error('Battles fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { receiverId } = await request.json();
    const initiatorId = session.user.id;

    if (initiatorId === receiverId) {
      return NextResponse.json({ error: 'Cannot challenge yourself' }, { status: 400 });
    }

    // Check if active battle already exists between these users
    const existingBattle = await prisma.battle.findFirst({
      where: {
        OR: [
          { initiatorId, receiverId },
          { initiatorId: receiverId, receiverId: initiatorId },
        ],
        status: { notIn: ['COMPLETED', 'DECLINED'] },
      },
    });

    if (existingBattle) {
      return NextResponse.json({ error: 'Battle already exists' }, { status: 400 });
    }

    const battle = await prisma.battle.create({
      data: {
        initiatorId,
        receiverId,
        status: 'PENDING',
        initiatorHp: 100,
        receiverHp: 100,
      },
    });

    // Log battle creation
    await prisma.battleLog.create({
      data: {
        userId: initiatorId,
        message: `Battle initiated against ${receiverId}`,
      },
    });

    return NextResponse.json({ success: true, battle });
  } catch (error) {
    console.error('Battle creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
