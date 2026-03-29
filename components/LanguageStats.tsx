'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface LanguageData {
  language: string;
  bytes: number;
  percentage: number;
  color: string;
  files?: number;
  experience?: number;
  level?: number;
}

interface StatsOverview {
  totalLanguages: number;
  totalBytes: number;
  primaryLanguage: string;
  languageDiversity: number;
  topLanguages: LanguageData[];
  monthlyStats: {
    month: string;
    languages: LanguageData[];
  }[];
}

export default function LanguageStats() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<StatsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | 'year' | 'month'>('all');

  useEffect(() => {
    if (session?.user?.githubLogin) {
      fetchLanguageStats();
    }
  }, [session, selectedPeriod]);

  const fetchLanguageStats = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/stats/languages?period=${selectedPeriod}`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch language stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLanguageIcon = (language: string) => {
    const icons: { [key: string]: string } = {
      JavaScript: '🟨',
      TypeScript: '🔷',
      Python: '🐍',
      Java: '☕',
      'C++': '⚙️',
      'C#': '💜',
      Ruby: '💎',
      Go: '🐹',
      Rust: '🦀',
      PHP: '🐘',
      Swift: '🍎',
      Kotlin: '🎯',
      HTML: '🌐',
      CSS: '🎨',
      Shell: '🐚',
      Vue: '💚',
      React: '⚛️',
      Angular: '🅰️',
      Dockerfile: '🐳',
      SQL: '🗃️',
    };
    return icons[language] || '📄';
  };

  const getLanguageLevel = (experience: number) => {
    if (experience >= 10000) return { level: 'Master', color: 'text-purple-500' };
    if (experience >= 5000) return { level: 'Expert', color: 'text-red-500' };
    if (experience >= 2000) return { level: 'Advanced', color: 'text-orange-500' };
    if (experience >= 500) return { level: 'Intermediate', color: 'text-blue-500' };
    if (experience >= 100) return { level: 'Junior', color: 'text-green-500' };
    return { level: 'Beginner', color: 'text-gray-500' };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--n-accent)]"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12 text-[var(--n-muted)]">
        Failed to load language statistics.
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="font-[family-name:var(--font-cinzel)] text-3xl text-gold-gradient md:text-4xl mb-8">
        Language Statistics
      </h1>

      {/* Period Selector */}
      <div className="mb-8">
        <div className="flex space-x-4">
          {(['all', 'year', 'month'] as const).map(period => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedPeriod === period
                  ? 'bg-[var(--n-accent)] text-white'
                  : 'bg-[var(--n-surface)] border border-[var(--n-border)] text-[var(--n-text)] hover:bg-[var(--n-void)]'
              }`}
            >
              {period === 'all' ? 'All Time' : period === 'year' ? 'This Year' : 'This Month'}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-[var(--n-surface)] border border-[var(--n-border)] rounded-lg p-6">
          <h3 className="text-sm font-medium text-[var(--n-muted)] mb-2">Total Languages</h3>
          <p className="text-3xl font-bold text-[var(--n-accent)]">{stats.totalLanguages}</p>
        </div>
        <div className="bg-[var(--n-surface)] border border-[var(--n-border)] rounded-lg p-6">
          <h3 className="text-sm font-medium text-[var(--n-muted)] mb-2">Primary Language</h3>
          <div className="flex items-center">
            <span className="text-2xl mr-2">{getLanguageIcon(stats.primaryLanguage)}</span>
            <p className="text-xl font-bold text-[var(--n-text)]">{stats.primaryLanguage}</p>
          </div>
        </div>
        <div className="bg-[var(--n-surface)] border border-[var(--n-border)] rounded-lg p-6">
          <h3 className="text-sm font-medium text-[var(--n-muted)] mb-2">Total Code Written</h3>
          <p className="text-3xl font-bold text-blue-500">
            {(stats.totalBytes / 1024 / 1024).toFixed(1)} MB
          </p>
        </div>
        <div className="bg-[var(--n-surface)] border border-[var(--n-border)] rounded-lg p-6">
          <h3 className="text-sm font-medium text-[var(--n-muted)] mb-2">Language Diversity</h3>
          <p className="text-3xl font-bold text-green-500">
            {(stats.languageDiversity * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Top Languages Chart */}
      <div className="bg-[var(--n-surface)] border border-[var(--n-border)] rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold text-[var(--n-text)] mb-6">Top Languages</h2>
        
        <div className="space-y-4">
          {stats.topLanguages.map((lang, index) => {
            const levelInfo = lang.experience ? getLanguageLevel(lang.experience) : null;
            
            return (
              <div key={lang.language} className="flex items-center justify-between">
                <div className="flex items-center flex-1">
                  <div className="flex items-center w-32">
                    <span className="text-xl mr-2">{getLanguageIcon(lang.language)}</span>
                    <span className="font-medium text-[var(--n-text)]">{lang.language}</span>
                  </div>
                  
                  <div className="flex-1 mx-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-[var(--n-muted)]">
                        {lang.percentage.toFixed(1)}% • {(lang.bytes / 1024 / 1024).toFixed(1)} MB
                      </span>
                      {levelInfo && (
                        <span className={`text-sm font-medium ${levelInfo.color}`}>
                          {levelInfo.level}
                        </span>
                      )}
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full transition-all duration-500"
                        style={{
                          width: `${lang.percentage}%`,
                          backgroundColor: lang.color || '#10b981'
                        }}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="text-right ml-4">
                  <p className="text-lg font-bold text-[var(--n-text)]">#{index + 1}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Language Skills Matrix */}
      <div className="bg-[var(--n-surface)] border border-[var(--n-border)] rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold text-[var(--n-text)] mb-6">Language Proficiency</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.topLanguages.slice(0, 9).map(lang => {
            const levelInfo = lang.experience ? getLanguageLevel(lang.experience) : null;
            
            return (
              <div key={lang.language} className="p-4 bg-[var(--n-void)] rounded-lg">
                <div className="flex items-center mb-2">
                  <span className="text-2xl mr-2">{getLanguageIcon(lang.language)}</span>
                  <div>
                    <p className="font-medium text-[var(--n-text)]">{lang.language}</p>
                    {levelInfo && (
                      <p className={`text-sm font-medium ${levelInfo.color}`}>
                        {levelInfo.level}
                      </p>
                    )}
                  </div>
                </div>
                
                {lang.experience && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--n-muted)]">Experience</span>
                      <span className="text-[var(--n-text)]">{lang.experience.toLocaleString()} XP</span>
                    </div>
                    {lang.level && (
                      <div className="flex justify-between text-sm">
                        <span className="text-[var(--n-muted)]">Level</span>
                        <span className="text-[var(--n-text)]">{lang.level}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Monthly Trends */}
      {stats.monthlyStats && stats.monthlyStats.length > 0 && (
        <div className="bg-[var(--n-surface)] border border-[var(--n-border)] rounded-lg p-6">
          <h2 className="text-lg font-semibold text-[var(--n-text)] mb-6">Monthly Trends</h2>
          
          <div className="space-y-6">
            {stats.monthlyStats.slice(0, 6).map(month => (
              <div key={month.month} className="border-b border-[var(--n-border)] pb-4 last:border-0">
                <h3 className="font-medium text-[var(--n-text)] mb-3">{month.month}</h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {month.languages.slice(0, 8).map(lang => (
                    <div key={lang.language} className="flex items-center text-sm">
                      <span className="text-lg mr-2">{getLanguageIcon(lang.language)}</span>
                      <div className="flex-1">
                        <p className="font-medium text-[var(--n-text)]">{lang.language}</p>
                        <p className="text-[var(--n-muted)]">
                          {lang.percentage.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Language Insights */}
      <div className="mt-8 p-6 bg-[var(--n-surface)] border border-[var(--n-border)] rounded-lg">
        <h2 className="text-lg font-semibold text-[var(--n-text)] mb-4">Insights & Tips</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-[var(--n-muted)]">
          <div>
            <p><strong>Focus on strengths:</strong> Double down on your primary language to reach mastery.</p>
            <p><strong>Explore diversity:</strong> Learning new languages increases your versatility.</p>
            <p><strong>Track progress:</strong> Monitor monthly changes to spot trends.</p>
          </div>
          <div>
            <p><strong>Project-based learning:</strong> Build projects in different languages.</p>
            <p><strong>Contribute consistently:</strong> Regular coding builds experience faster.</p>
            <p><strong>Join communities:</strong> Language-specific communities offer great learning.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
