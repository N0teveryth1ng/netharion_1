import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const membership = await prisma.guildMember.findFirst({
      where: { userId: session.user.id },
      include: {
        guild: {
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
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Not in a guild' }, { status: 404 });
    }

    const g = membership.guild;

    // Sort members: LEADER first, then OFFICER, then MEMBER
    const roleOrder = { LEADER: 1, OFFICER: 2, MEMBER: 3 };
    const sortedMembers = [...g.members].sort(
      (a, b) => roleOrder[a.role] - roleOrder[b.role]
    );

    return NextResponse.json({
      id: g.id,
      name: g.name,
      description: g.description,
      emblem: g.emblem,
      createdAt: g.createdAt,
      memberCount: g._count.members,
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
    console.error('My guild API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
