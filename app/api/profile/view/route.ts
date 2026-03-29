import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { subjectLogin } = (await req.json()) as { subjectLogin?: string };
  if (!subjectLogin) {
    return NextResponse.json({ error: "subjectLogin required" }, { status: 400 });
  }

  const subject = await prisma.user.findFirst({
    where: { githubLogin: subjectLogin },
  });
  if (!subject) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (subject.id === session.user.id) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  await prisma.profileView.create({
    data: {
      viewerId: session.user.id,
      subjectId: subject.id,
    },
  });

  return NextResponse.json({ ok: true });
}
