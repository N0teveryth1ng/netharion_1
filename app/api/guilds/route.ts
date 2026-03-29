import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const guilds = await prisma.guild.findMany({
      include: {
        _count: { select: { members: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(
      guilds.map(g => ({
        id: g.id,
        name: g.name,
        description: g.description,
        emblem: g.emblem,
        createdAt: g.createdAt,
        memberCount: g._count.members,
      }))
    );
  } catch (error) {
    console.error('Guilds API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, description, emblem } = await request.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Guild name required' }, { status: 400 });
    }

    // Check if user is already in a guild
    const existingMembership = await prisma.guildMember.findFirst({
      where: { userId: session.user.id },
    });

    if (existingMembership) {
      return NextResponse.json({ error: 'Already in a guild' }, { status: 400 });
    }

    const guild = await prisma.guild.create({
      data: {
        name,
        description: description || null,
        emblem: emblem || '⚔️',
        members: {
          create: {
            userId: session.user.id,
            role: 'LEADER',
          },
        },
      },
    });

    return NextResponse.json({ success: true, guildId: guild.id });
  } catch (error) {
    console.error('Create guild error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
