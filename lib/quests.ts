import { prisma } from './prisma';
import { QuestType } from '@prisma/client';

export const DEFAULT_QUESTS = [
  // GitHub Quests
  {
    title: 'Star Collector',
    description: 'Receive 5 stars on your repositories',
    type: 'GITHUB_STARS',
    requirement: { type: 'stars', count: 5 },
    xpReward: 25,
  },
  {
    title: 'Commit Warrior',
    description: 'Make 50 commits in a month',
    type: 'GITHUB_COMMITS',
    requirement: { type: 'commits', count: 50, timeframe: 'month' },
    xpReward: 75,
  },
  {
    title: 'Pull Request Master',
    description: 'Create 10 pull requests',
    type: 'GITHUB_PRS',
    requirement: { type: 'pull_requests', count: 10 },
    xpReward: 50,
  },
  {
    title: 'Bug Hunter',
    description: 'Open 5 issues on GitHub',
    type: 'GITHUB_ISSUES',
    requirement: { type: 'issues', count: 5 },
    xpReward: 30,
  },

  // Social Quests
  {
    title: 'Make Friends',
    description: 'Make 3 friends in Netharion',
    type: 'SOCIAL_FRIENDS',
    requirement: { type: 'friends', count: 3 },
    xpReward: 40,
  },
  {
    title: 'Popular Presence',
    description: 'Have your profile viewed 25 times',
    type: 'SOCIAL_FRIENDS',
    requirement: { type: 'profile_views', count: 25 },
    xpReward: 35,
  },

  // Battle Quests
  {
    title: 'First Victory',
    description: 'Win your first battle',
    type: 'BATTLE_WINS',
    requirement: { type: 'battle_wins', count: 1 },
    xpReward: 45,
  },
  {
    title: 'Battle Champion',
    description: 'Win 5 battles',
    type: 'BATTLE_WINS',
    requirement: { type: 'battle_wins', count: 5 },
    xpReward: 100,
  },
];

export async function seedQuests() {
  for (const quest of DEFAULT_QUESTS) {
    const existing = await prisma.quest.findFirst({ where: { title: quest.title } });
    if (!existing) {
      await prisma.quest.create({ data: { ...quest, type: quest.type as QuestType } });
    }
  }
}

export async function getAvailableQuests(userId: string) {
  const allQuests = await prisma.quest.findMany();

  const userQuests = await prisma.userQuest.findMany({
    where: { userId },
    select: { questId: true, status: true, progress: true, startedAt: true, completedAt: true },
  });

  const userQuestMap = new Map(userQuests.map(uq => [uq.questId, uq]));

  const availableQuests = allQuests.filter(quest => {
    const userQuest = userQuestMap.get(quest.id);
    return !userQuest || userQuest.status === 'ACTIVE';
  });

  return availableQuests.map(quest => ({
    ...quest,
    userProgress: userQuestMap.get(quest.id) || null,
  }));
}

interface QuestRequirement {
  type: 'stars' | 'commits' | 'pull_requests' | 'issues' | 'friends' | 'profile_views' | 'battle_wins';
  count: number;
}

interface UserStats {
  totalStars?: number;
  totalCommits?: number;
  totalPullRequests?: number;
  totalIssues?: number;
  [key: string]: any;
}

export async function updateQuestProgress(userId: string, userStats: UserStats) {
  const activeUserQuests = await prisma.userQuest.findMany({
    where: { userId, status: 'ACTIVE' },
    include: { quest: true },
  });

  const completedQuests = [];

  for (const userQuest of activeUserQuests) {
    const quest = userQuest.quest;
    const { type, count } = quest.requirement as unknown as QuestRequirement;
    let currentProgress = 0;

    switch (type) {
      case 'stars':
        currentProgress = userStats.totalStars || 0;
        break;
      case 'commits':
        currentProgress = userStats.totalCommits || 0;
        break;
      case 'pull_requests':
        currentProgress = userStats.totalPullRequests || 0;
        break;
      case 'issues':
        currentProgress = userStats.totalIssues || 0;
        break;
      case 'friends':
        currentProgress = await prisma.friendship.count({
          where: {
            OR: [{ requesterId: userId }, { addresseeId: userId }],
            status: 'ACCEPTED',
          },
        });
        break;
      case 'profile_views':
        currentProgress = await prisma.profileView.count({
          where: { subjectId: userId },
        });
        break;
      case 'battle_wins':
        currentProgress = await prisma.battle.count({
          where: { winnerId: userId },
        });
        break;
    }

    const progressData = {
      current: currentProgress,
      required: count,
      percentage: Math.min(100, Math.floor((currentProgress / count) * 100)),
    };

    if (currentProgress >= count) {
      await prisma.userQuest.update({
        where: { id: userQuest.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          progress: progressData,
        },
      });

      await prisma.user.update({
        where: { id: userId },
        data: { xp: { increment: quest.xpReward } },
      });

      completedQuests.push({
        questId: quest.id,
        title: quest.title,
        xpReward: quest.xpReward,
      });
    } else {
      await prisma.userQuest.update({
        where: { id: userQuest.id },
        data: { progress: progressData },
      });
    }
  }

  return completedQuests;
}

export async function startQuest(userId: string, questId: string) {
  const existing = await prisma.userQuest.findUnique({
    where: { userId_questId: { userId, questId } },
  });

  if (existing) {
    throw new Error('Quest already started or completed');
  }

  await prisma.userQuest.create({
    data: { userId, questId, status: 'ACTIVE' },
  });
}
