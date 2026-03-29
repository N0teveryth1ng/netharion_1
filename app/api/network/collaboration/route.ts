import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user's data
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, githubLogin: true, image: true, level: true, statsJson: true },
    });

    // Get friends (accepted friendships) with their data
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [{ requesterId: session.user.id }, { addresseeId: session.user.id }],
        status: 'ACCEPTED',
      },
      include: {
        requester: { select: { id: true, name: true, githubLogin: true, image: true, level: true } },
        addressee: { select: { id: true, name: true, githubLogin: true, image: true, level: true } },
      },
    });

    const friends = friendships.map(f =>
      f.requesterId === session.user.id ? f.addressee : f.requester
    );

    // Build nodes
    const nodes = [
      {
        id: currentUser?.id ?? session.user.id,
        name: currentUser?.name ?? session.user.name,
        githubLogin: currentUser?.githubLogin ?? session.user.githubLogin,
        image: currentUser?.image ?? session.user.image,
        level: currentUser?.level ?? 1,
      },
      ...friends.map(friend => ({
        id: friend.id,
        name: friend.name,
        githubLogin: friend.githubLogin,
        image: friend.image,
        level: friend.level,
      })),
    ];

    // Build edges from friendships
    const edges = friends.map(friend => ({
      source: session.user.id,
      target: friend.id,
      weight: 1,
      type: 'friendship' as const,
    }));

    const totalNodes = nodes.length;
    const totalEdges = edges.length;
    const maxPossibleEdges = (totalNodes * (totalNodes - 1)) / 2;
    const networkDensity = maxPossibleEdges > 0 ? totalEdges / maxPossibleEdges : 0;
    const averageConnections = totalNodes > 0 ? (totalEdges * 2) / totalNodes : 0;

    // Parse GitHub stats for extra info
    const stats = currentUser?.statsJson ? JSON.parse(currentUser.statsJson) : {};

    return NextResponse.json({
      nodes,
      edges,
      stats: {
        totalCollaborators: friends.length,
        totalOrganizations: 0,
        networkDensity,
        averageConnections,
        strongestConnection: edges[0] ?? { source: '', target: '', weight: 0 },
        githubFollowers: stats.followers ?? 0,
        githubFollowing: stats.following ?? 0,
        publicRepos: stats.publicRepos ?? 0,
      },
    });
  } catch (error) {
    console.error('Collaboration network API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
