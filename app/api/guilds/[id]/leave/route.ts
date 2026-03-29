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

    const { id: guildId } = await params;

    const membership = await prisma.guildMember.findUnique({
      where: { userId_guildId: { userId: session.user.id, guildId } },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Not in this guild' }, { status: 404 });
    }

    if (membership.role === 'LEADER') {
      return NextResponse.json(
        { error: 'Leaders cannot leave. Transfer leadership or disband guild.' },
        { status: 400 }
      );
    }

    await prisma.guildMember.delete({
      where: { userId_guildId: { userId: session.user.id, guildId } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Leave guild error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
