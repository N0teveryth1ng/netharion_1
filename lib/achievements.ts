import { prisma } from './prisma';

export const DEFAULT_ACHIEVEMENTS = [
  // GitHub Achievements
  {
    name: 'First Commit',
    description: 'Make your first GitHub commit',
    icon: '🎯',
    category: 'github',
    requirement: { type: 'commits', count: 1 },
    xpReward: 10,
  },
  {
    name: 'Code Warrior',
    description: 'Reach 100 total commits',
    icon: '⚔️',
    category: 'github',
    requirement: { type: 'commits', count: 100 },
    xpReward: 100,
  },
  {
    name: 'Star Gazer',
    description: 'Receive 10 stars on your repositories',
    icon: '⭐',
    category: 'github',
    requirement: { type: 'stars', count: 10 },
    xpReward: 50,
  },
  {
    name: 'Pull Master',
    description: 'Create 10 pull requests',
    icon: '🔀',
    category: 'github',
    requirement: { type: 'pull_requests', count: 10 },
    xpReward: 75,
  },
  {
    name: 'Issue Hunter',
    description: 'Open 5 issues',
    icon: '🐛',
    category: 'github',
    requirement: { type: 'issues', count: 5 },
    xpReward: 25,
  },
  
  // Social Achievements
  {
    name: 'First Friend',
    description: 'Make your first friend',
    icon: '🤝',
    category: 'social',
    requirement: { type: 'friends', count: 1 },
    xpReward: 20,
  },
  {
    name: 'Popular',
    description: 'Have 10 friends',
    icon: '👥',
    category: 'social',
    requirement: { type: 'friends', count: 10 },
    xpReward: 100,
  },
  {
    name: 'Socialite',
    description: 'Have your profile viewed 50 times',
    icon: '👀',
    category: 'social',
    requirement: { type: 'profile_views', count: 50 },
    xpReward: 50,
  },
  
  // Battle Achievements
  {
    name: 'First Blood',
    description: 'Win your first battle',
    icon: '🩸',
    category: 'battle',
    requirement: { type: 'battle_wins', count: 1 },
    xpReward: 30,
  },
  {
    name: 'Battle Hardened',
    description: 'Win 10 battles',
    icon: '🛡️',
    category: 'battle',
    requirement: { type: 'battle_wins', count: 10 },
    xpReward: 150,
  },
  {
    name: 'Unstoppable',
    description: 'Win 5 battles in a row',
    icon: '🔥',
    category: 'battle',
    requirement: { type: 'win_streak', count: 5 },
    xpReward: 200,
  },
];

export async function seedAchievements() {
  for (const achievement of DEFAULT_ACHIEVEMENTS) {
    await prisma.achievement.upsert({
      where: { name: achievement.name },
      update: {},
      create: achievement,
    });
  }
}

interface UserStats {
  totalCommits?: number;
  totalStars?: number;
  totalPullRequests?: number;
  totalIssues?: number;
  [key: string]: any;
}

interface AchievementRequirement {
  type: 'commits' | 'stars' | 'pull_requests' | 'issues' | 'friends' | 'profile_views' | 'battle_wins' | 'win_streak';
  count: number;
}

export async function checkAndUnlockAchievements(userId: string, userStats: UserStats) {
  const achievements = await prisma.achievement.findMany();
  const userAchievements = await prisma.userAchievement.findMany({
    where: { userId },
    include: { achievement: true },
  });

  const unlockedIds = new Set(userAchievements.map((ua: any) => ua.achievementId));
  const newUnlocks = [];

  for (const achievement of achievements) {
    if (unlockedIds.has(achievement.id)) continue;

    const { type, count } = achievement.requirement as unknown as AchievementRequirement;
    let userCount = 0;

    switch (type) {
      case 'commits':
        userCount = userStats.totalCommits || 0;
        break;
      case 'stars':
        userCount = userStats.totalStars || 0;
        break;
      case 'pull_requests':
        userCount = userStats.totalPullRequests || 0;
        break;
      case 'issues':
        userCount = userStats.totalIssues || 0;
        break;
      case 'friends':
        const friendCount = await prisma.friendship.count({
          where: {
            OR: [{ requesterId: userId }, { addresseeId: userId }],
            status: 'ACCEPTED',
          },
        });
        userCount = friendCount;
        break;
      case 'profile_views':
        const viewCount = await prisma.profileView.count({
          where: { subjectId: userId },
        });
        userCount = viewCount;
        break;
      case 'battle_wins':
        const winCount = await prisma.battle.count({
          where: { winnerId: userId },
        });
        userCount = winCount;
        break;
      case 'win_streak':
        // Complex: calculate current win streak
        userCount = 0; // Simplified for now
        break;
    }

    if (userCount >= count) {
      const userAchievement = await prisma.userAchievement.create({
        data: {
          userId,
          achievementId: achievement.id,
        },
        include: { achievement: true },
      });

      newUnlocks.push(userAchievement);

      // Grant XP reward
      await prisma.user.update({
        where: { id: userId },
        data: {
          xp: { increment: achievement.xpReward },
        },
      });
    }
  }

  return newUnlocks;
}
