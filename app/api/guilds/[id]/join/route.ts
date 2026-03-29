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

    // Check if user is already in a guild
    const existingMembership = await prisma.guildMember.findFirst({
      where: { userId: session.user.id },
    });

    if (existingMembership) {
      return NextResponse.json({ error: 'Already in a guild' }, { status: 400 });
    }

    // Check if guild exists
    const guild = await prisma.guild.findUnique({ where: { id: guildId } });
    if (!guild) {
      return NextResponse.json({ error: 'Guild not found' }, { status: 404 });
    }

    await prisma.guildMember.create({
      data: {
        userId: session.user.id,
        guildId,
        role: 'MEMBER',
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Join guild error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
