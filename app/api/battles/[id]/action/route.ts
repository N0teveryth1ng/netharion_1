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
    const { action } = await request.json();

    if (!['attack', 'defend', 'special'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Get current battle state
    const currentBattle = await prisma.$queryRaw`
      SELECT * FROM "Battle"
      WHERE id = ${battleId}
      AND status = 'ACTIVE'
      AND ("initiatorId" = ${session.user.id} OR "receiverId" = ${session.user.id})
    ` as any[];

    if (currentBattle.length === 0) {
      return NextResponse.json({ error: 'Battle not found or not active' }, { status: 404 });
    }

    const battle = currentBattle[0];
    const isInitiator = battle.initiatorId === session.user.id;

    // Calculate damage
    let damage = 0;
    switch (action) {
      case 'attack':
        damage = Math.floor(Math.random() * 20) + 10; // 10-30 damage
        break;
      case 'defend':
        damage = Math.floor(Math.random() * 10) + 5; // 5-15 damage
        break;
      case 'special':
        damage = Math.floor(Math.random() * 30) + 15; // 15-45 damage
        break;
    }

    // Apply damage to opponent
    const updatedHp = isInitiator
      ? Math.max(0, battle.receiverHp - damage)
      : Math.max(0, battle.initiatorHp - damage);

    const newInitiatorHp: number | null = isInitiator ? null : updatedHp;
    const newReceiverHp: number | null = isInitiator ? updatedHp : null;

    // Check for winner
    let winnerId: string | null = null;
    let status = 'ACTIVE';

    if (updatedHp <= 0) {
      winnerId = session.user.id;
      status = 'COMPLETED';
    }

    // Update battle
    const updatedBattle = await prisma.$queryRaw`
      UPDATE "Battle"
      SET
        "initiatorHp" = COALESCE(${newInitiatorHp}, "initiatorHp"),
        "receiverHp" = COALESCE(${newReceiverHp}, "receiverHp"),
        "winnerId" = ${winnerId},
        status = ${status}::"BattleStatus",
        "completedAt" = CASE WHEN ${status} = 'COMPLETED' THEN NOW() ELSE "completedAt" END
      WHERE id = ${battleId}
      RETURNING *
    ` as any[];

    // Create battle log
    await prisma.battleLog.create({
      data: {
        userId: session.user.id,
        message: `${session.user.name || session.user.githubLogin} used ${action} for ${damage} damage!`,
      },
    });

    // Grant XP for winning
    if (winnerId === session.user.id) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { xp: { increment: 50 } },
      });
    }

    return NextResponse.json(updatedBattle[0]);
  } catch (error) {
    console.error('Battle action error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
