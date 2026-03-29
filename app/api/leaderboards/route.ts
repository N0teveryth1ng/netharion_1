import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'level';
    const range = searchParams.get('range') || 'all';

    let query = '';
    let orderBy = '';

    switch (type) {
      case 'level':
        query = `
          SELECT
            u."_id" as id,
            u.name,
            u.github_login,
            u.image,
            u.level,
            u.xp,
            u.title,
            ROW_NUMBER() OVER (ORDER BY u.level DESC, u.xp DESC)::int as rank,
            NULL::jsonb as stats
          FROM users u
          WHERE u.github_login IS NOT NULL
        `;
        orderBy = 'ORDER BY level DESC, xp DESC';
        break;

      case 'xp':
        query = `
          SELECT
            u."_id" as id,
            u.name,
            u.github_login,
            u.image,
            u.level,
            u.xp,
            u.title,
            ROW_NUMBER() OVER (ORDER BY u.xp DESC, u.level DESC)::int as rank,
            NULL::jsonb as stats
          FROM users u
          WHERE u.github_login IS NOT NULL
        `;
        orderBy = 'ORDER BY xp DESC, level DESC';
        break;

      case 'commits':
        query = `
          SELECT
            u."_id" as id,
            u.name,
            u.github_login,
            u.image,
            u.level,
            u.xp,
            u.title,
            ROW_NUMBER() OVER (ORDER BY (u.stats_json::json->>'contributionsLastYear')::int DESC)::int as rank,
            COALESCE((u.stats_json::json->>'contributionsLastYear')::int, 0) as stats
          FROM users u
          WHERE u.github_login IS NOT NULL
          AND u.stats_json IS NOT NULL
        `;
        orderBy = 'ORDER BY stats DESC, level DESC';
        break;

      case 'stars':
        query = `
          SELECT
            u."_id" as id,
            u.name,
            u.github_login,
            u.image,
            u.level,
            u.xp,
            u.title,
            ROW_NUMBER() OVER (ORDER BY (u.stats_json::json->>'totalStars')::int DESC)::int as rank,
            COALESCE((u.stats_json::json->>'totalStars')::int, 0) as stats
          FROM users u
          WHERE u.github_login IS NOT NULL
          AND u.stats_json IS NOT NULL
        `;
        orderBy = 'ORDER BY stats DESC, level DESC';
        break;

      case 'battles':
        query = `
          SELECT
            u."_id" as id,
            u.name,
            u.github_login,
            u.image,
            u.level,
            u.xp,
            u.title,
            0 as rank,
            0 as stats
          FROM users u
          WHERE u.github_login IS NOT NULL
        `;
        orderBy = 'ORDER BY level DESC, xp DESC';
        break;

      default:
        return NextResponse.json({ error: 'Invalid leaderboard type' }, { status: 400 });
    }

    // Add time range filtering by appending to existing WHERE clause
    if (range === 'month') {
      query = query.replace(
        'WHERE u.github_login IS NOT NULL',
        "WHERE u.github_login IS NOT NULL AND u.updated_at >= NOW() - INTERVAL '30 days'"
      );
    } else if (range === 'week') {
      query = query.replace(
        'WHERE u.github_login IS NOT NULL',
        "WHERE u.github_login IS NOT NULL AND u.updated_at >= NOW() - INTERVAL '7 days'"
      );
    }

    const finalQuery = `
      WITH ranked_users AS (${query})
      SELECT *
      FROM ranked_users
      ${orderBy}
      LIMIT 100
    `;

    const leaderboard = await prisma.$queryRawUnsafe(finalQuery) as any[];

    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error('Leaderboard API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
