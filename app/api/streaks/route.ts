import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.githubLogin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's GitHub stats from the database
    const user = await prisma.$queryRaw`
      SELECT stats_json FROM users 
      WHERE github_login = ${session.user.githubLogin}
    ` as any[];

    if (user.length === 0 || !user[0].stats_json) {
      return NextResponse.json({
        currentStreak: 0,
        longestStreak: 0,
        lastContributionDate: null,
        streakHistory: [],
        milestones: [],
      });
    }

    const stats = JSON.parse(user[0].stats_json);
    const contributions = stats.contributions || [];

    // Calculate streaks
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let lastContributionDate = null;

    const sortedContributions = contributions
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate current streak (from today backwards)
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const contribution = contributions.find((c: any) => c.date === dateStr);
      if (contribution && contribution.count > 0) {
        currentStreak++;
        if (!lastContributionDate) {
          lastContributionDate = dateStr;
        }
      } else if (i > 0) {
        break;
      }
    }

    // Calculate longest streak
    for (const contribution of sortedContributions) {
      if (contribution.count > 0) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    // Generate streak history (last 30 days)
    const streakHistory = [];
    let runningStreak = 0;
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const contribution = contributions.find((c: any) => c.date === dateStr);
      const count = contribution?.count || 0;
      
      if (count > 0) {
        runningStreak++;
      } else {
        runningStreak = 0;
      }
      
      streakHistory.push({
        date: dateStr,
        count,
        streak: runningStreak,
      });
    }

    // Calculate milestones
    const milestones: { streak: number; date: string; achievement: string }[] = [];
    const milestoneValues = [3, 7, 14, 30, 50, 100];
    
    for (const milestone of milestoneValues) {
      if (longestStreak >= milestone) {
        // Find when this milestone was first achieved
        for (const entry of streakHistory) {
          if (entry.streak >= milestone) {
            const existingMilestone = milestones.find(m => m.streak === milestone);
            if (!existingMilestone) {
              milestones.push({
                streak: milestone,
                date: entry.date,
                achievement: getMilestoneName(milestone),
              });
            }
            break;
          }
        }
      }
    }

    return NextResponse.json({
      currentStreak,
      longestStreak,
      lastContributionDate,
      streakHistory,
      milestones,
    });
  } catch (error) {
    console.error('Streaks API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function getMilestoneName(streak: number): string {
  const milestones = {
    3: '🏅 Bronze Committer',
    7: '🥈 Silver Streaker',
    14: '🥉 Gold Warrior',
    30: '💎 Diamond Legend',
    50: '👑 Eternal Coder',
    100: '🌟 Mythic Developer',
  };
  return milestones[streak as keyof typeof milestones] || `${streak} Day Streak`;
}
