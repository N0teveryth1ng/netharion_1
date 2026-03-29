import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const uid = session.user.id;

  const [incoming, outgoing, friends] = await Promise.all([
    prisma.friendship.findMany({
      where: { addresseeId: uid, status: 'PENDING' },
      include: {
        requester: { select: { id: true, name: true, githubLogin: true, image: true, level: true } },
      },
    }),
    prisma.friendship.findMany({
      where: { requesterId: uid, status: 'PENDING' },
      include: {
        addressee: { select: { id: true, name: true, githubLogin: true, image: true, level: true } },
      },
    }),
    prisma.friendship.findMany({
      where: {
        OR: [{ requesterId: uid }, { addresseeId: uid }],
        status: 'ACCEPTED',
      },
      include: {
        requester: { select: { id: true, name: true, githubLogin: true, image: true, level: true } },
        addressee: { select: { id: true, name: true, githubLogin: true, image: true, level: true } },
      },
    }),
  ]);

  const incomingFormatted = incoming.map(req => ({
    id: req.id,
    requester: req.requester,
  }));

  const outgoingFormatted = outgoing.map(req => ({
    id: req.id,
    addressee: req.addressee,
  }));

  const friendsFormatted = friends.map(friendship => {
    return friendship.requesterId === uid ? friendship.addressee : friendship.requester;
  });

  return NextResponse.json({
    incoming: incomingFormatted,
    outgoing: outgoingFormatted,
    friends: friendsFormatted,
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId } = await request.json();
  const currentUserId = session.user.id;

  if (currentUserId === userId) {
    return NextResponse.json({ error: "Cannot send friend request to yourself" }, { status: 400 });
  }

  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: currentUserId, addresseeId: userId },
        { requesterId: userId, addresseeId: currentUserId },
      ],
    },
  });

  if (existing) {
    return NextResponse.json({ error: "Friendship already exists or pending" }, { status: 400 });
  }

  const friendship = await prisma.friendship.create({
    data: {
      requesterId: currentUserId,
      addresseeId: userId,
      status: 'PENDING',
    },
  });

  return NextResponse.json({ message: "Friend request sent", friendship });
}
