import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { fetchGitHubStats } from "@/lib/github-stats";
import {
  computeXp,
  titleForLevel,
  xpToLevel,
  type GitHubStatsSnapshot,
} from "@/lib/game";
import { getGitHubAccessToken } from "@/lib/github-token";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id || !session.user.githubLogin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = await getGitHubAccessToken(session.user.id);
  if (!token) {
    return NextResponse.json({ error: "No GitHub token — sign out and sign in again." }, { status: 400 });
  }

  let stats: GitHubStatsSnapshot;
  try {
    stats = await fetchGitHubStats(token, session.user.githubLogin);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "GitHub sync failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  const xp = computeXp(stats);
  const level = xpToLevel(xp);
  const title = titleForLevel(level);

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      statsJson: JSON.stringify(stats),
      xp,
      level,
      title,
    },
  });

  const name = session.user.name ?? session.user.githubLogin;
  const topLine = stats.topRepo
    ? `${name} forged a legendary relic: ${stats.topRepo.name} — ${stats.topRepo.stars} stars.`
    : `${name} attuned the abyss — ${xp} essence gathered.`;

  await prisma.battleLog.create({
    data: {
      userId: session.user.id,
      message: topLine,
    },
  });

  return NextResponse.json({ ok: true, xp, level, title, stats });
}
