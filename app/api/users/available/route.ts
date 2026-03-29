import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get users who are not in active battles with current user
    const availableUsers = await prisma.$queryRaw`
      SELECT DISTINCT u._id as id, u.name, u.github_login, u.image, u.level
      FROM users u
      WHERE u._id != ${session.user.id}
      AND u.github_login IS NOT NULL
      AND u._id NOT IN (
        SELECT CASE
          WHEN b."initiatorId" = ${session.user.id} THEN b."receiverId"
          WHEN b."receiverId" = ${session.user.id} THEN b."initiatorId"
        END
        FROM "Battle" b
        WHERE b.status IN ('PENDING', 'ACTIVE')
        AND (b."initiatorId" = ${session.user.id} OR b."receiverId" = ${session.user.id})
      )
      ORDER BY u.level DESC
    ` as any[];

    const formattedUsers = availableUsers.map((user: any) => ({
      id: user.id,
      name: user.name,
      githubLogin: user.github_login,
      image: user.image,
      level: user.level,
    }));

    return NextResponse.json(formattedUsers);
  } catch (error) {
    console.error('Available users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
