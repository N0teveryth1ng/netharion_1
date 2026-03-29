// Local storage system to replace database functionality

export interface User {
  id: string;
  name: string;
  email: string;
  image: string;
  githubLogin: string;
  level: number;
  xp: number;
  title: string;
  customTheme: string;
  customBanner: string;
  createdAt: string;
  updatedAt: string;
}

export interface Friendship {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  createdAt: string;
}

export interface Battle {
  id: string;
  initiatorId: string;
  receiverId: string;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'DECLINED';
  initiatorHp: number;
  receiverHp: number;
  winnerId?: string;
  startedAt: string;
  completedAt?: string;
}

export interface BattleLog {
  id: string;
  userId: string;
  message: string;
  createdAt: string;
}

export interface Guild {
  id: string;
  name: string;
  description?: string;
  emblem?: string;
  createdAt: string;
}

export interface GuildMember {
  id: string;
  userId: string;
  guildId: string;
  role: 'LEADER' | 'OFFICER' | 'MEMBER';
  joinedAt: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  requirement: any;
  xpReward: number;
  createdAt: string;
}

export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  unlockedAt: string;
  progress?: any;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  type: string;
  requirement: any;
  xpReward: number;
  createdAt: string;
}

export interface UserQuest {
  id: string;
  userId: string;
  questId: string;
  status: 'ACTIVE' | 'COMPLETED' | 'ABANDONED';
  progress?: any;
  startedAt: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

class LocalStorage {
  private keys = {
    users: 'enchanter_users',
    friendships: 'enchanter_friendships',
    battles: 'enchanter_battles',
    battleLogs: 'enchanter_battle_logs',
    guilds: 'enchanter_guilds',
    guildMembers: 'enchanter_guild_members',
    achievements: 'enchanter_achievements',
    userAchievements: 'enchanter_user_achievements',
    quests: 'enchanter_quests',
    userQuests: 'enchanter_user_quests',
  };

  // Generic methods
  private get<T>(key: string): T[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = window.localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private set<T>(key: string, data: T[]): void {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(key, JSON.stringify(data));
    } catch {
      // Silently fail if localStorage is full
    }
  }

  // User methods
  getUsers(): User[] {
    return this.get<User>(this.keys.users);
  }

  saveUser(user: User): void {
    const users = this.getUsers();
    const existingIndex = users.findIndex(u => u.id === user.id);
    if (existingIndex >= 0) {
      users[existingIndex] = { ...user, updatedAt: new Date().toISOString() };
    } else {
      users.push(user);
    }
    this.set(this.keys.users, users);
  }

  getUserById(id: string): User | null {
    const users = this.getUsers();
    return users.find(u => u.id === id) || null;
  }

  // Friendship methods
  getFriendships(): Friendship[] {
    return this.get<Friendship>(this.keys.friendships);
  }

  saveFriendship(friendship: Friendship): void {
    const friendships = this.getFriendships();
    const existingIndex = friendships.findIndex(f => f.id === friendship.id);
    if (existingIndex >= 0) {
      friendships[existingIndex] = friendship;
    } else {
      friendships.push(friendship);
    }
    this.set(this.keys.friendships, friendships);
  }

  // Battle methods
  getBattles(): Battle[] {
    return this.get<Battle>(this.keys.battles);
  }

  saveBattle(battle: Battle): void {
    const battles = this.getBattles();
    const existingIndex = battles.findIndex(b => b.id === battle.id);
    if (existingIndex >= 0) {
      battles[existingIndex] = battle;
    } else {
      battles.push(battle);
    }
    this.set(this.keys.battles, battles);
  }

  getBattleLogs(): BattleLog[] {
    return this.get<BattleLog>(this.keys.battleLogs);
  }

  saveBattleLog(log: BattleLog): void {
    const logs = this.getBattleLogs();
    logs.push(log);
    // Keep only last 100 logs
    if (logs.length > 100) {
      logs.splice(0, logs.length - 100);
    }
    this.set(this.keys.battleLogs, logs);
  }

  // Guild methods
  getGuilds(): Guild[] {
    return this.get<Guild>(this.keys.guilds);
  }

  saveGuild(guild: Guild): void {
    const guilds = this.getGuilds();
    const existingIndex = guilds.findIndex(g => g.id === guild.id);
    if (existingIndex >= 0) {
      guilds[existingIndex] = guild;
    } else {
      guilds.push(guild);
    }
    this.set(this.keys.guilds, guilds);
  }

  getGuildMembers(): GuildMember[] {
    return this.get<GuildMember>(this.keys.guildMembers);
  }

  saveGuildMember(member: GuildMember): void {
    const members = this.getGuildMembers();
    const existingIndex = members.findIndex(m => m.id === member.id);
    if (existingIndex >= 0) {
      members[existingIndex] = member;
    } else {
      members.push(member);
    }
    this.set(this.keys.guildMembers, members);
  }

  // Achievement methods
  getAchievements(): Achievement[] {
    return this.get<Achievement>(this.keys.achievements);
  }

  saveAchievement(achievement: Achievement): void {
    const achievements = this.getAchievements();
    const existingIndex = achievements.findIndex(a => a.id === achievement.id);
    if (existingIndex >= 0) {
      achievements[existingIndex] = achievement;
    } else {
      achievements.push(achievement);
    }
    this.set(this.keys.achievements, achievements);
  }

  getUserAchievements(): UserAchievement[] {
    return this.get<UserAchievement>(this.keys.userAchievements);
  }

  saveUserAchievement(userAchievement: UserAchievement): void {
    const userAchievements = this.getUserAchievements();
    const existingIndex = userAchievements.findIndex(ua => ua.id === userAchievement.id);
    if (existingIndex >= 0) {
      userAchievements[existingIndex] = userAchievement;
    } else {
      userAchievements.push(userAchievement);
    }
    this.set(this.keys.userAchievements, userAchievements);
  }

  // Quest methods
  getQuests(): Quest[] {
    return this.get<Quest>(this.keys.quests);
  }

  saveQuest(quest: Quest): void {
    const quests = this.getQuests();
    const existingIndex = quests.findIndex(q => q.id === quest.id);
    if (existingIndex >= 0) {
      quests[existingIndex] = quest;
    } else {
      quests.push(quest);
    }
    this.set(this.keys.quests, quests);
  }

  getUserQuests(): UserQuest[] {
    return this.get<UserQuest>(this.keys.userQuests);
  }

  saveUserQuest(userQuest: UserQuest): void {
    const userQuests = this.getUserQuests();
    const existingIndex = userQuests.findIndex(uq => uq.id === userQuest.id);
    if (existingIndex >= 0) {
      userQuests[existingIndex] = userQuest;
    } else {
      userQuests.push(userQuest);
    }
    this.set(this.keys.userQuests, userQuests);
  }

  // Initialize with default data
  initializeDefaults(): void {
    // Initialize default achievements
    const achievements = this.getAchievements();
    if (achievements.length === 0) {
      const defaultAchievements: Achievement[] = [
        {
          id: '1',
          name: 'First Steps',
          description: 'Complete your first quest',
          icon: '👣',
          category: 'quest',
          requirement: { type: 'quests', count: 1 },
          xpReward: 10,
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Social Butterfly',
          description: 'Make 5 friends',
          icon: '🦋',
          category: 'social',
          requirement: { type: 'friends', count: 5 },
          xpReward: 25,
          createdAt: new Date().toISOString(),
        },
        {
          id: '3',
          name: 'Warrior',
          description: 'Win 3 battles',
          icon: '⚔️',
          category: 'battle',
          requirement: { type: 'battle_wins', count: 3 },
          xpReward: 50,
          createdAt: new Date().toISOString(),
        },
      ];
      defaultAchievements.forEach(a => this.saveAchievement(a));
    }

    // Initialize default quests
    const quests = this.getQuests();
    if (quests.length === 0) {
      const defaultQuests: Quest[] = [
        {
          id: '1',
          title: 'GitHub Explorer',
          description: 'Make your first GitHub commit',
          type: 'GITHUB_COMMITS',
          requirement: { type: 'commits', count: 1 },
          xpReward: 10,
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          title: 'Code Warrior',
          description: 'Make 10 GitHub commits',
          type: 'GITHUB_COMMITS',
          requirement: { type: 'commits', count: 10 },
          xpReward: 50,
          createdAt: new Date().toISOString(),
        },
        {
          id: '3',
          title: 'Friendly Face',
          description: 'Make your first friend',
          type: 'SOCIAL_FRIENDS',
          requirement: { type: 'friends', count: 1 },
          xpReward: 15,
          createdAt: new Date().toISOString(),
        },
      ];
      defaultQuests.forEach(q => this.saveQuest(q));
    }
  }
}

export const localDataStore = new LocalStorage();
