'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastContributionDate: string;
  streakHistory: {
    date: string;
    count: number;
    streak: number;
  }[];
  milestones: {
    streak: number;
    date: string;
    achievement: string;
  }[];
}

export default function StreakTracker() {
  const { data: session } = useSession();
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.githubLogin) {
      fetchStreakData();
    }
  }, [session]);

  const fetchStreakData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/streaks');
      const data = await response.json();
      setStreakData(data);
    } catch (error) {
      console.error('Failed to fetch streak data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStreakColor = (streak: number) => {
    if (streak >= 100) return 'text-purple-500';
    if (streak >= 50) return 'text-red-500';
    if (streak >= 30) return 'text-orange-500';
    if (streak >= 14) return 'text-yellow-500';
    if (streak >= 7) return 'text-green-500';
    if (streak >= 3) return 'text-blue-500';
    return 'text-gray-500';
  };

  const getStreakIcon = (streak: number) => {
    if (streak >= 100) return '🔥';
    if (streak >= 50) return '💎';
    if (streak >= 30) return '⚡';
    if (streak >= 14) return '🌟';
    if (streak >= 7) return '🎯';
    if (streak >= 3) return '📈';
    return '🌱';
  };

  const getMilestoneReward = (streak: number) => {
    const milestones = [
      { streak: 3, reward: '🏅 Bronze Committer', xp: 10 },
      { streak: 7, reward: '🥈 Silver Streaker', xp: 25 },
      { streak: 14, reward: '🥉 Gold Warrior', xp: 50 },
      { streak: 30, reward: '💎 Diamond Legend', xp: 100 },
      { streak: 50, reward: '👑 Eternal Coder', xp: 200 },
      { streak: 100, reward: '🌟 Mythic Developer', xp: 500 },
    ];

    return milestones.filter(m => streak >= m.streak).pop();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--n-accent)]"></div>
      </div>
    );
  }

  if (!streakData) {
    return (
      <div className="text-center py-12 text-[var(--n-muted)]">
        Failed to load streak data.
      </div>
    );
  }

  const currentMilestone = getMilestoneReward(streakData.currentStreak);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="font-[family-name:var(--font-cinzel)] text-3xl text-gold-gradient md:text-4xl mb-8">
        Code Streak Tracker
      </h1>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-[var(--n-surface)] border border-[var(--n-border)] rounded-lg p-6 text-center">
          <div className="text-6xl mb-2">{getStreakIcon(streakData.currentStreak)}</div>
          <h3 className="text-sm font-medium text-[var(--n-muted)] mb-2">Current Streak</h3>
          <p className={`text-4xl font-bold ${getStreakColor(streakData.currentStreak)}`}>
            {streakData.currentStreak} days
          </p>
          {streakData.lastContributionDate && (
            <p className="text-sm text-[var(--n-muted)] mt-2">
              Last: {new Date(streakData.lastContributionDate).toLocaleDateString()}
            </p>
          )}
        </div>

        <div className="bg-[var(--n-surface)] border border-[var(--n-border)] rounded-lg p-6 text-center">
          <div className="text-6xl mb-2">🏆</div>
          <h3 className="text-sm font-medium text-[var(--n-muted)] mb-2">Longest Streak</h3>
          <p className="text-4xl font-bold text-blue-500">
            {streakData.longestStreak} days
          </p>
        </div>

        <div className="bg-[var(--n-surface)] border border-[var(--n-border)] rounded-lg p-6 text-center">
          <div className="text-6xl mb-2">🎁</div>
          <h3 className="text-sm font-medium text-[var(--n-muted)] mb-2">Current Milestone</h3>
          <p className="text-xl font-bold text-[var(--n-accent)] mb-2">
            {currentMilestone?.reward || 'Keep going!'}
          </p>
          {currentMilestone && (
            <p className="text-sm text-[var(--n-muted)]">
              {currentMilestone.xp} XP Reward
            </p>
          )}
        </div>
      </div>

      {/* Milestone Progress */}
      <div className="bg-[var(--n-surface)] border border-[var(--n-border)] rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold text-[var(--n-text)] mb-4">Milestone Progress</h2>
        
        <div className="space-y-4">
          {[3, 7, 14, 30, 50, 100].map(milestone => {
            const achieved = streakData.currentStreak >= milestone;
            const nextMilestone = [3, 7, 14, 30, 50, 100].find(m => m > streakData.currentStreak);
            const isNext = milestone === nextMilestone;
            
            return (
              <div key={milestone} className={`flex items-center justify-between p-3 rounded-lg ${
                achieved ? 'bg-green-900/20 border border-green-600' : 
                isNext ? 'bg-blue-900/20 border border-blue-600' : 
                'bg-[var(--n-void)] border border-[var(--n-border)]'
              }`}>
                <div className="flex items-center">
                  <span className="text-2xl mr-3">
                    {achieved ? '✅' : isNext ? '🎯' : '⭕'}
                  </span>
                  <div>
                    <p className="font-medium text-[var(--n-text)]">{milestone} Day Streak</p>
                    <p className="text-sm text-[var(--n-muted)]">
                      {getMilestoneReward(milestone)?.reward}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {achieved && (
                    <p className="text-sm text-green-500">Achieved!</p>
                  )}
                  {isNext && !achieved && (
                    <p className="text-sm text-blue-500">
                      {milestone - streakData.currentStreak} days to go
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Streak History */}
      <div className="bg-[var(--n-surface)] border border-[var(--n-border)] rounded-lg p-6">
        <h2 className="text-lg font-semibold text-[var(--n-text)] mb-4">Recent Activity</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {streakData.streakHistory.slice(0, 12).map((entry, index) => (
            <div key={index} className="p-3 bg-[var(--n-void)] rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-[var(--n-text)]">
                    {new Date(entry.date).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-[var(--n-muted)]">
                    {entry.count} contributions
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${getStreakColor(entry.streak)}`}>
                    {entry.streak} 🔥
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {streakData.streakHistory.length === 0 && (
          <div className="text-center py-8 text-[var(--n-muted)]">
            No recent activity found. Start contributing to build your streak!
          </div>
        )}
      </div>

      {/* Streak Tips */}
      <div className="mt-8 p-6 bg-[var(--n-surface)] border border-[var(--n-border)] rounded-lg">
        <h2 className="text-lg font-semibold text-[var(--n-text)] mb-4">Streak Tips</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-[var(--n-muted)]">
          <div>
            <p><strong>Consistency is key:</strong> Even one contribution per day maintains your streak.</p>
            <p><strong>Set reminders:</strong> Daily notifications help you remember to contribute.</p>
            <p><strong>Start small:</strong> Fix a typo or update documentation on busy days.</p>
          </div>
          <div>
            <p><strong>Weekend matters:</strong> Don&apos;t break your streak on Saturday or Sunday.</p>
            <p><strong>Plan ahead:</strong> Schedule contributions for busy periods.</p>
            <p><strong>Track progress:</strong> Monitor your streak to stay motivated.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
