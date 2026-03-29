'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  xpReward: number;
  unlockedAt?: string;
}

export default function Achievements() {
  const { data: session } = useSession();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.id) {
      fetchAchievements();
    }
  }, [session]);

  const fetchAchievements = async () => {
    try {
      const response = await fetch('/api/achievements');
      const data = await response.json();
      setAchievements(data);
    } catch (error) {
      console.error('Failed to fetch achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['github', 'social', 'battle'];
  const categoryIcons = {
    github: '🐙',
    social: '👥',
    battle: '⚔️',
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--n-accent)]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="font-[family-name:var(--font-cinzel)] text-3xl text-gold-gradient md:text-4xl mb-8">
        Achievements
      </h1>

      {categories.map((category) => (
        <div key={category} className="mb-12">
          <div className="flex items-center mb-6">
            <span className="text-2xl mr-3">{categoryIcons[category as keyof typeof categoryIcons]}</span>
            <h2 className="text-xl font-semibold text-[var(--n-text)] capitalize">
              {category} Achievements
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements
              .filter((achievement) => achievement.category === category)
              .map((achievement) => (
                <div
                  key={achievement.id}
                  className={`relative p-6 rounded-lg border ${
                    achievement.unlockedAt
                      ? 'bg-[var(--n-surface)] border-[var(--n-accent)]'
                      : 'bg-[var(--n-surface)] border-[var(--n-border)] opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-3xl">{achievement.icon}</div>
                    {achievement.unlockedAt && (
                      <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full">
                        +{achievement.xpReward} XP
                      </span>
                    )}
                  </div>

                  <h3 className="font-semibold text-[var(--n-text)] mb-2">
                    {achievement.name}
                  </h3>

                  <p className="text-sm text-[var(--n-muted)] mb-3">
                    {achievement.description}
                  </p>

                  {achievement.unlockedAt && (
                    <div className="text-xs text-[var(--n-muted)]">
                      Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                    </div>
                  )}

                  {!achievement.unlockedAt && (
                    <div className="text-xs text-[var(--n-muted)]">
                      Reward: {achievement.xpReward} XP
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      ))}

      {achievements.length === 0 && (
        <div className="text-center py-12">
          <p className="text-[var(--n-muted)]">No achievements available yet.</p>
        </div>
      )}
    </div>
  );
}
