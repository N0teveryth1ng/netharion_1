import { prisma } from "@/lib/prisma";

export async function getLastProfileViewers(subjectId: string) {
  const rows = await prisma.profileView.findMany({
    where: { subjectId },
    orderBy: { viewedAt: "desc" },
    take: 48,
    include: {
      viewer: {
        select: {
          id: true,
          name: true,
          image: true,
          githubLogin: true,
          level: true,
          title: true,
        },
      },
    },
  });

  const seen = new Set<string>();
  const unique: typeof rows = [];
  for (const r of rows) {
    if (seen.has(r.viewerId)) continue;
    seen.add(r.viewerId);
    unique.push(r);
    if (unique.length >= 3) break;
  }
  return unique;
}
