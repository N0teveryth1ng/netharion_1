import { prisma } from "@/lib/prisma";

export async function getGitHubAccessToken(userId: string): Promise<string | null> {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "github" },
  });
  return account?.access_token ?? null;
}
