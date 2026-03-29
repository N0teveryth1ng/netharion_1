import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: guildId } = await params;

    const guild = await prisma.guild.findUnique({
      where: { id: guildId },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, githubLogin: true, image: true, level: true },
            },
          },
          orderBy: { joinedAt: 'asc' },
        },
        _count: { select: { members: true } },
      },
    });

    if (!guild) {
      return NextResponse.json({ error: 'Guild not found' }, { status: 404 });
    }

    const roleOrder = { LEADER: 1, OFFICER: 2, MEMBER: 3 };
    const sortedMembers = [...guild.members].sort(
      (a, b) => roleOrder[a.role] - roleOrder[b.role]
    );

    return NextResponse.json({
      id: guild.id,
      name: guild.name,
      description: guild.description,
      emblem: guild.emblem,
      createdAt: guild.createdAt,
      memberCount: guild._count.members,
      members: sortedMembers.map(m => ({
        id: m.id,
        userId: m.userId,
        guildId: m.guildId,
        role: m.role,
        joinedAt: m.joinedAt,
        user: m.user,
      })),
    });
  } catch (error) {
    console.error('Guild details API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
