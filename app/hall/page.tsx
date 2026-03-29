import { prisma } from "@/lib/prisma";
import HallClient from "@/components/HallClient";

export const dynamic = "force-dynamic";

export default async function HallPage() {
  const [logsRaw, champions] = await Promise.all([
    prisma.battleLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 24,
      include: {
        user: { select: { name: true, githubLogin: true, image: true } },
      },
    }),
    prisma.user.findMany({
      where: { githubLogin: { not: null } },
      orderBy: [{ level: "desc" }, { xp: "desc" }],
      take: 12,
      select: {
        id: true,
        name: true,
        githubLogin: true,
        image: true,
        level: true,
        title: true,
        xp: true,
      },
    }),
  ]);

  const initialLogs = logsRaw.map((l) => ({
    id: l.id,
    message: l.message,
    createdAt: l.createdAt.toISOString(),
    user: l.user,
  }));

  return (
    <div>
      <div className="mx-auto max-w-6xl px-4 pt-10">
        <h1 className="font-[family-name:var(--font-cinzel)] text-3xl text-gold-gradient md:text-4xl">
          The Great Hall
        </h1>
        <p className="mt-2 max-w-2xl text-[var(--n-muted)]">
          Where deeds become tales — sync your GitHub, raise your level, and walk with companions.
        </p>
      </div>
      <HallClient initialLogs={initialLogs} champions={champions} />
    </div>
  );
}
