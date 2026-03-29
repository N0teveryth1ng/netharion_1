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
    const period = searchParams.get('period') || 'all';

    // Get user's GitHub stats from the database
    const user = await prisma.$queryRaw`
      SELECT stats_json FROM users 
      WHERE github_login = ${session.user.githubLogin}
    ` as any[];

    if (user.length === 0 || !user[0].stats_json) {
      return NextResponse.json({
        totalLanguages: 0,
        totalBytes: 0,
        primaryLanguage: 'Unknown',
        languageDiversity: 0,
        topLanguages: [],
        monthlyStats: [],
      });
    }

    const stats = JSON.parse(user[0].stats_json);
    const languages = stats.languages || [];

    // Calculate total bytes and primary language
    const totalBytes = languages.reduce((sum: number, lang: any) => sum + lang.bytes, 0);
    const primaryLanguage = languages.length > 0 ? 
      languages.reduce((max: any, lang: any) => lang.bytes > max.bytes ? lang : max).language : 
      'Unknown';

    // Calculate language diversity (entropy-based)
    let languageDiversity = 0;
    if (languages.length > 0 && totalBytes > 0) {
      for (const lang of languages) {
        const proportion = lang.bytes / totalBytes;
        if (proportion > 0) {
          languageDiversity -= proportion * Math.log2(proportion);
        }
      }
      languageDiversity = languageDiversity / Math.log2(languages.length);
    }

    // Add experience and level calculations
    const languagesWithExperience = languages.map((lang: any) => {
      const experience = Math.floor(lang.bytes / 1024); // 1 XP per KB
      const level = Math.floor(experience / 1000) + 1; // Level every 1000 XP
      
      return {
        ...lang,
        experience,
        level,
      };
    });

    // Sort by bytes (most used first)
    const topLanguages = languagesWithExperience
      .sort((a: any, b: any) => b.bytes - a.bytes)
      .map((lang: any) => ({
        ...lang,
        percentage: totalBytes > 0 ? (lang.bytes / totalBytes) * 100 : 0,
      }));

    // Generate monthly stats (mock data for demonstration)
    const monthlyStats = generateMonthlyStats(languages, period);

    return NextResponse.json({
      totalLanguages: languages.length,
      totalBytes,
      primaryLanguage,
      languageDiversity,
      topLanguages,
      monthlyStats,
    });
  } catch (error) {
    console.error('Language stats API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function generateMonthlyStats(languages: any[], period: string) {
  const monthlyStats = [];
  const now = new Date();
  
  let monthsToGenerate = 12;
  if (period === 'year') monthsToGenerate = 12;
  else if (period === 'month') monthsToGenerate = 1;
  else if (period === 'all') monthsToGenerate = 12;

  for (let i = 0; i < monthsToGenerate; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    // Generate some variation in monthly data
    const monthlyLanguages = languages.map((lang: any) => ({
      ...lang,
      bytes: Math.floor(lang.bytes * (0.8 + Math.random() * 0.4)), // 80-120% of normal
    }));
    
    const totalMonthlyBytes = monthlyLanguages.reduce((sum: number, lang: any) => sum + lang.bytes, 0);
    
    monthlyStats.push({
      month: monthName,
      languages: monthlyLanguages.map((lang: any) => ({
        ...lang,
        percentage: totalMonthlyBytes > 0 ? (lang.bytes / totalMonthlyBytes) * 100 : 0,
      })),
    });
  }
  
  return monthlyStats.reverse();
}
