'use client';

import { useState, useEffect } from 'react';

interface LeaderboardEntry {
  id: string;
  name: string;
  githubLogin: string;
  image?: string;
  level: number;
  xp: number;
  rank: number;
  title?: string;
  stats?: {
    totalCommits?: number;
    totalStars?: number;
    totalPullRequests?: number;
    battleWins?: number;
  };
}

type LeaderboardType = 'level' | 'xp' | 'commits' | 'stars' | 'battles';
type TimeRange = 'all' | 'month' | 'week';

export default function Leaderboards() {
  const [leaderboardType, setLeaderboardType] = useState<LeaderboardType>('level');
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [leaderboardType, timeRange]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/leaderboards?type=${leaderboardType}&range=${timeRange}`);
      const data = await response.json();
      setLeaderboard(data);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const getTypeLabel = (type: LeaderboardType) => {
    const labels = {
      level: 'Level',
      xp: 'Experience Points',
      commits: 'GitHub Commits',
      stars: 'Repository Stars',
      battles: 'Battle Wins',
    };
    return labels[type];
  };

  const getValue = (entry: LeaderboardEntry) => {
    switch (leaderboardType) {
      case 'level': return entry.level;
      case 'xp': return entry.xp;
      case 'commits': return entry.stats?.totalCommits || 0;
      case 'stars': return entry.stats?.totalStars || 0;
      case 'battles': return entry.stats?.battleWins || 0;
      default: return 0;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="font-[family-name:var(--font-cinzel)] text-3xl text-gold-gradient md:text-4xl mb-8">
        Leaderboards
      </h1>

      {/* Controls */}
      <div className="mb-8 flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-[var(--n-text)] mb-2">
            Category
          </label>
          <select
            value={leaderboardType}
            onChange={(e) => setLeaderboardType(e.target.value as LeaderboardType)}
            className="w-full px-4 py-2 bg-[var(--n-surface)] border border-[var(--n-border)] rounded text-[var(--n-text)] focus:outline-none focus:border-[var(--n-accent)]"
          >
            <option value="level">Highest Level</option>
            <option value="xp">Most XP</option>
            <option value="commits">Most Commits</option>
            <option value="stars">Most Stars</option>
            <option value="battles">Battle Wins</option>
          </select>
        </div>

        <div className="min-w-[150px]">
          <label className="block text-sm font-medium text-[var(--n-text)] mb-2">
            Time Range
          </label>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as TimeRange)}
            className="w-full px-4 py-2 bg-[var(--n-surface)] border border-[var(--n-border)] rounded text-[var(--n-text)] focus:outline-none focus:border-[var(--n-accent)]"
          >
            <option value="all">All Time</option>
            <option value="month">This Month</option>
            <option value="week">This Week</option>
          </select>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-[var(--n-surface)] border border-[var(--n-border)] rounded-lg overflow-hidden">
        <div className="p-4 bg-[var(--n-void)] border-b border-[var(--n-border)]">
          <h2 className="text-lg font-semibold text-[var(--n-text)]">
            {getTypeLabel(leaderboardType)} - {timeRange === 'all' ? 'All Time' : timeRange === 'month' ? 'This Month' : 'This Week'}
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--n-accent)]"></div>
          </div>
        ) : (
          <div className="divide-y divide-[var(--n-border)]">
            {leaderboard.map((entry, index) => (
              <div
                key={entry.id}
                className={`p-4 flex items-center justify-between hover:bg-[var(--n-void)]/50 transition-colors ${
                  index < 3 ? 'bg-gradient-to-r from-transparent via-[var(--n-accent)]/5 to-transparent' : ''
                }`}
              >
                <div className="flex items-center flex-1">
                  {/* Rank */}
                  <div className="w-12 text-center font-bold text-lg">
                    {getRankIcon(entry.rank)}
                  </div>

                  {/* User Info */}
                  <div className="flex items-center flex-1 ml-4">
                    <img
                      src={entry.image || '/default-avatar.png'}
                      alt={entry.name}
                      className="w-10 h-10 rounded-full mr-3"
                    />
                    <div>
                      <p className="font-semibold text-[var(--n-text)]">
                        {entry.name || entry.githubLogin}
                      </p>
                      <p className="text-sm text-[var(--n-muted)]">
                        {entry.title || 'Realmwalker'} • Level {entry.level}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Score */}
                <div className="text-right">
                  <p className="text-lg font-bold text-[var(--n-accent)]">
                    {getValue(entry).toLocaleString()}
                  </p>
                  <p className="text-xs text-[var(--n-muted)]">
                    {leaderboardType === 'level' && 'Level'}
                    {leaderboardType === 'xp' && 'XP'}
                    {leaderboardType === 'commits' && 'Commits'}
                    {leaderboardType === 'stars' && 'Stars'}
                    {leaderboardType === 'battles' && 'Wins'}
                  </p>
                </div>
              </div>
            ))}

            {leaderboard.length === 0 && (
              <div className="p-8 text-center text-[var(--n-muted)]">
                No data available for this category and time range.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-8 p-4 bg-[var(--n-surface)] border border-[var(--n-border)] rounded-lg">
        <h3 className="text-sm font-semibold text-[var(--n-text)] mb-2">About Rankings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-[var(--n-muted)]">
          <div>
            <p><strong>Level:</strong> Based on user&apos;s current level</p>
            <p><strong>XP:</strong> Total experience points earned</p>
            <p><strong>Commits:</strong> Total GitHub commits</p>
          </div>
          <div>
            <p><strong>Stars:</strong> Total repository stars received</p>
            <p><strong>Battle Wins:</strong> Total battle victories</p>
            <p><strong>Time Ranges:</strong> Filter by performance period</p>
          </div>
        </div>
      </div>
    </div>
  );
}
