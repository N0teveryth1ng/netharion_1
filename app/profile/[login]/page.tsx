import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import RecordProfileView from "@/components/RecordProfileView";
import { rankLabelFromLevel, type GitHubStatsSnapshot } from "@/lib/game";
import { getLastProfileViewers } from "@/lib/profile-viewers";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ login: string }>;
}) {
  const { login } = await params;

  const user = await prisma.user.findFirst({
    where: { githubLogin: login },
  });
  if (!user?.githubLogin) notFound();

  const viewers = await getLastProfileViewers(user.id);

  let stats: GitHubStatsSnapshot | null = null;
  if (user.statsJson) {
    try {
      stats = JSON.parse(user.statsJson) as GitHubStatsSnapshot;
    } catch {
      stats = null;
    }
  }

  const rank = rankLabelFromLevel(user.level);

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <RecordProfileView subjectLogin={login} />

      <div className="relative overflow-hidden rounded-3xl border border-[var(--n-border)] bg-gradient-to-br from-[#14101f]/95 to-[var(--n-void)] p-8 shadow-[0_0_60px_rgba(0,0,0,0.45)]">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.12),transparent_65%)]" />
        <div className="relative flex flex-col gap-8 md:flex-row md:items-start">
          <div className="flex flex-col items-center md:items-start">
            {user.image && (
              <div className="relative">
                <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-[var(--n-gold)] to-[var(--n-ember)] opacity-60 blur-md" />
                <Image
                  src={user.image}
                  alt=""
                  width={120}
                  height={120}
                  className="relative rounded-full border-2 border-[var(--n-gold-dim)]"
                />
              </div>
            )}
            <p className="mt-4 font-[family-name:var(--font-cinzel)] text-2xl text-[var(--n-gold)]">
              {user.name ?? user.githubLogin}
            </p>
            <p className="text-sm text-[var(--n-muted)]">@{user.githubLogin}</p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-[var(--n-gold-dim)]/60 bg-[var(--n-surface)] px-3 py-1 text-xs text-[var(--n-gold)]">
                Lv. {user.level}
              </span>
              <span className="rounded-full border border-[var(--n-border)] px-3 py-1 text-xs text-[var(--n-ice)]">
                {rank}
              </span>
              {user.title && (
                <span className="rounded-full border border-[var(--n-border)] px-3 py-1 text-xs text-[var(--n-foreground)]">
                  {user.title}
                </span>
              )}
            </div>
            <p className="mt-2 text-xs text-[var(--n-muted)]">
              {user.updatedAt
                ? `Last attuned ${user.updatedAt.toLocaleString()}`
                : "Not yet attuned — visit the hall to sync."}
            </p>
          </div>

          <div className="flex-1 space-y-6">
            <div>
              <h2 className="font-[family-name:var(--font-cinzel)] text-sm tracking-widest text-[var(--n-gold-dim)]">
                Essence
              </h2>
              <p className="mt-1 text-3xl font-semibold text-[var(--n-foreground)]">{user.xp.toLocaleString()} XP</p>
            </div>

            {stats && (
              <div className="grid gap-3 sm:grid-cols-2">
                <Stat label="Stars across relics" value={stats.totalStars.toLocaleString()} />
                <Stat label="Contributions (year)" value={stats.contributionsLastYear.toLocaleString()} />
                <Stat label="Public repos" value={stats.publicRepos.toLocaleString()} />
                <Stat label="Followers" value={stats.followers.toLocaleString()} />
                <Stat label="Merged pull requests" value={stats.mergedPullRequests.toLocaleString()} />
                <Stat label="Following" value={stats.following.toLocaleString()} />
              </div>
            )}

            {stats?.topRepo && (
              <div className="rounded-2xl border border-[var(--n-gold-dim)]/30 bg-[var(--n-surface)]/50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--n-gold-dim)]">Brightest relic</p>
                <p className="mt-1 font-[family-name:var(--font-cinzel)] text-lg text-[var(--n-gold)]">
                  {stats.topRepo.name}
                </p>
                <p className="text-sm text-[var(--n-muted)]">{stats.topRepo.stars} stars</p>
                {stats.topRepo.description && (
                  <p className="mt-2 text-sm text-[var(--n-muted)]">{stats.topRepo.description}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <section className="mt-10 rounded-2xl border border-[var(--n-border)] bg-[var(--n-surface)]/40 p-6">
        <h3 className="font-[family-name:var(--font-cinzel)] text-sm text-[var(--n-gold)]">Recent witnesses</h3>
        <p className="mt-1 text-xs text-[var(--n-muted)]">
          Last adventurers who gazed upon this presence.
        </p>
        <ul className="mt-4 flex flex-wrap gap-4">
          {viewers.length === 0 && (
            <li className="text-sm text-[var(--n-muted)]">No witnesses yet — the void keeps its secrets.</li>
          )}
          {viewers.map((v) => (
            <li key={v.viewerId} className="flex items-center gap-2 rounded-xl border border-[var(--n-border)] px-3 py-2">
              {v.viewer.image && (
                <Image src={v.viewer.image} alt="" width={32} height={32} className="rounded-full" />
              )}
              <div>
                <Link href={`/profile/${v.viewer.githubLogin ?? ""}`} className="text-sm text-[var(--n-ice)] hover:underline">
                  {v.viewer.githubLogin}
                </Link>
                <p className="text-[10px] text-[var(--n-muted)]">
                  Lv.{v.viewer.level} · {v.viewedAt.toLocaleString()}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-8 text-center">
        <Link href="/hall" className="text-sm text-[var(--n-ice)] hover:underline">
          ← Back to the hall
        </Link>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--n-border)] bg-[var(--n-void)]/60 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-[var(--n-muted)]">{label}</p>
      <p className="text-lg font-semibold text-[var(--n-foreground)]">{value}</p>
    </div>
  );
}
