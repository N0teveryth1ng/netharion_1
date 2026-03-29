'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface QuestRequirement {
  type: 'github_stars' | 'github_commits' | 'github_prs' | 'github_issues' | 'social_friends' | 'battle_wins';
  target?: number;
  repository?: string;
  timeframe?: string;
}

interface Quest {
  id: string;
  title: string;
  description: string;
  type: string;
  requirement: QuestRequirement;
  xpReward: number;
  userProgress?: {
    current: number;
    required: number;
    percentage: number;
  };
  startedAt?: string;
  completedAt?: string;
}

export default function QuestBoard() {
  const { data: session } = useSession();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.id) {
      fetchQuests();
    }
  }, [session]);

  const fetchQuests = async () => {
    try {
      const response = await fetch('/api/quests');
      const data = await response.json();
      setQuests(data);
    } catch (error) {
      console.error('Failed to fetch quests:', error);
    } finally {
      setLoading(false);
    }
  };

  const startQuest = async (questId: string) => {
    try {
      const response = await fetch(`/api/quests/${questId}/start`, {
        method: 'POST',
      });
      
      if (response.ok) {
        fetchQuests(); // Refresh quests
      }
    } catch (error) {
      console.error('Failed to start quest:', error);
    }
  };

  const getQuestIcon = (type: string) => {
    const icons = {
      GITHUB_STARS: '⭐',
      GITHUB_COMMITS: '📝',
      GITHUB_PRS: '🔀',
      GITHUB_ISSUES: '🐛',
      SOCIAL_FRIENDS: '👥',
      BATTLE_WINS: '⚔️',
    };
    return icons[type as keyof typeof icons] || '📜';
  };

  const getQuestTypeLabel = (type: string) => {
    const labels = {
      GITHUB_STARS: 'GitHub',
      GITHUB_COMMITS: 'GitHub',
      GITHUB_PRS: 'GitHub',
      GITHUB_ISSUES: 'GitHub',
      SOCIAL_FRIENDS: 'Social',
      BATTLE_WINS: 'Battle',
    };
    return labels[type as keyof typeof labels] || 'General';
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
        Quest Board
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quests.map((quest) => (
          <div
            key={quest.id}
            className={`relative p-6 rounded-lg border ${
              quest.completedAt
                ? 'bg-green-900/20 border-green-600'
                : quest.userProgress
                ? 'bg-[var(--n-surface)] border-[var(--n-accent)]'
                : 'bg-[var(--n-surface)] border-[var(--n-border)]'
            }`}
          >
            {/* Quest Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="text-3xl">{getQuestIcon(quest.type)}</div>
              <div className="text-right">
                <span className="text-xs bg-[var(--n-accent)] text-white px-2 py-1 rounded-full">
                  {getQuestTypeLabel(quest.type)}
                </span>
                <div className="text-sm text-[var(--n-muted)] mt-1">
                  +{quest.xpReward} XP
                </div>
              </div>
            </div>

            {/* Quest Content */}
            <h3 className="font-semibold text-[var(--n-text)] mb-2">
              {quest.title}
            </h3>

            <p className="text-sm text-[var(--n-muted)] mb-4">
              {quest.description}
            </p>

            {/* Progress */}
            {quest.userProgress && (
              <div className="mb-4">
                <div className="flex justify-between text-sm text-[var(--n-muted)] mb-1">
                  <span>Progress</span>
                  <span>{quest.userProgress.current}/{quest.userProgress.required}</span>
                </div>
                <div className="bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-green-500 h-full transition-all duration-300"
                    style={{ width: `${quest.userProgress.percentage}%` }}
                  />
                </div>
                <div className="text-xs text-[var(--n-muted)] mt-1">
                  {quest.userProgress.percentage}% complete
                </div>
              </div>
            )}

            {/* Status */}
            <div className="flex items-center justify-between">
              {quest.completedAt ? (
                <span className="text-green-500 text-sm font-semibold">✓ Completed</span>
              ) : quest.userProgress ? (
                <span className="text-blue-500 text-sm font-semibold">In Progress</span>
              ) : (
                <span className="text-[var(--n-muted)] text-sm">Not Started</span>
              )}

              {!quest.userProgress && !quest.completedAt && (
                <button
                  onClick={() => startQuest(quest.id)}
                  className="px-4 py-2 bg-[var(--n-accent)] text-white rounded hover:bg-opacity-80 text-sm"
                >
                  Start Quest
                </button>
              )}
            </div>

            {/* Time Info */}
            {quest.startedAt && (
              <div className="text-xs text-[var(--n-muted)] mt-3">
                Started {new Date(quest.startedAt).toLocaleDateString()}
              </div>
            )}
          </div>
        ))}
      </div>

      {quests.length === 0 && (
        <div className="text-center py-12">
          <p className="text-[var(--n-muted)]">No quests available yet.</p>
        </div>
      )}
    </div>
  );
}
