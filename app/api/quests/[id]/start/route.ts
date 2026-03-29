import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { startQuest } from '@/lib/quests';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: questId } = await params;
    await startQuest(session.user.id, questId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Start quest error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to start quest' },
      { status: 400 }
    );
  }
}
