import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.$queryRaw`
      SELECT custom_theme, custom_banner, title FROM users
      WHERE "_id" = ${session.user.id}
    ` as any[];

    if (user.length === 0) {
      return NextResponse.json({});
    }

    return NextResponse.json({
      theme: user[0].custom_theme,
      banner: user[0].custom_banner,
      customTitle: user[0].title,
    });
  } catch (error) {
    console.error('Get customization error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { theme, banner, customTitle } = await request.json();

    await prisma.$queryRaw`
      UPDATE users
      SET
        custom_theme = ${theme || null},
        custom_banner = ${banner || null},
        title = ${customTitle || null},
        updated_at = NOW()
      WHERE "_id" = ${session.user.id}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Save customization error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
