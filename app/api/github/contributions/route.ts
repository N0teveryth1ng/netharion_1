import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.githubLogin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year') || new Date().getFullYear().toString();

    // Get user's GitHub stats from the database
    const user = await prisma.$queryRaw`
      SELECT stats_json FROM users 
      WHERE github_login = ${session.user.githubLogin}
    ` as any[];

    if (user.length === 0 || !user[0].stats_json) {
      return NextResponse.json({
        total: 0,
        contributions: [],
        streak: 0,
        longestStreak: 0,
      });
    }

    const stats = JSON.parse(user[0].stats_json);
    const contributions = stats.contributions || [];

    // Calculate streaks
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const sortedContributions = contributions
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

    for (const contribution of sortedContributions) {
      if (contribution.count > 0) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    // Calculate current streak (from today backwards)
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const contribution = contributions.find((c: any) => c.date === dateStr);
      if (contribution && contribution.count > 0) {
        currentStreak++;
      } else if (i > 0) {
        break;
      }
    }

    // Filter contributions by year
    const yearContributions = contributions.filter((c: any) => 
      c.date.startsWith(year)
    );

    return NextResponse.json({
      total: yearContributions.reduce((sum: number, c: any) => sum + c.count, 0),
      contributions: yearContributions,
      streak: currentStreak,
      longestStreak,
    });
  } catch (error) {
    console.error('GitHub contributions API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
