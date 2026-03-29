import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const logs = await prisma.battleLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 24,
    include: {
      user: {
        select: { name: true, githubLogin: true, image: true },
      },
    },
  });

  return NextResponse.json({ logs });
}
