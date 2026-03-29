'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface ContributionDay {
  date: string;
  count: number;
  level: number; // 0-4 for coloring
}

interface ContributionData {
  total: number;
  contributions: ContributionDay[];
  streak: number;
  longestStreak: number;
}

export default function ContributionGraph() {
  const { data: session } = useSession();
  const [contributionData, setContributionData] = useState<ContributionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  useEffect(() => {
    if (session?.user?.githubLogin) {
      fetchContributions();
    }
  }, [session, selectedYear]);

  const fetchContributions = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/github/contributions?year=${selectedYear}`);
      const data = await response.json();
      setContributionData(data);
    } catch (error) {
      console.error('Failed to fetch contributions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getContributionColor = (level: number) => {
    const colors = [
      'bg-gray-800', // No contributions
      'bg-green-900', // 1-3 contributions
      'bg-green-700', // 4-6 contributions
      'bg-green-500', // 7-9 contributions
      'bg-green-300', // 10+ contributions
    ];
    return colors[level] || colors[0];
  };

  const getMonthDays = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const getContributionForDate = (day: number, month: number) => {
    if (!contributionData || !day) return null;
    
    const dateStr = `${selectedYear}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return contributionData.contributions.find(c => c.date === dateStr);
  };

  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString());

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--n-accent)]"></div>
      </div>
    );
  }

  if (!contributionData) {
    return (
      <div className="text-center py-12 text-[var(--n-muted)]">
        Failed to load contribution data.
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="font-[family-name:var(--font-cinzel)] text-3xl text-gold-gradient md:text-4xl mb-8">
        GitHub Contributions
      </h1>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-[var(--n-surface)] border border-[var(--n-border)] rounded-lg p-6">
          <h3 className="text-sm font-medium text-[var(--n-muted)] mb-2">Total Contributions</h3>
          <p className="text-3xl font-bold text-[var(--n-accent)]">{contributionData.total}</p>
        </div>
        <div className="bg-[var(--n-surface)] border border-[var(--n-border)] rounded-lg p-6">
          <h3 className="text-sm font-medium text-[var(--n-muted)] mb-2">Current Streak</h3>
          <p className="text-3xl font-bold text-green-500">{contributionData.streak} days</p>
        </div>
        <div className="bg-[var(--n-surface)] border border-[var(--n-border)] rounded-lg p-6">
          <h3 className="text-sm font-medium text-[var(--n-muted)] mb-2">Longest Streak</h3>
          <p className="text-3xl font-bold text-blue-500">{contributionData.longestStreak} days</p>
        </div>
        <div className="bg-[var(--n-surface)] border border-[var(--n-border)] rounded-lg p-6">
          <h3 className="text-sm font-medium text-[var(--n-muted)] mb-2">Year</h3>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="w-full px-3 py-2 bg-[var(--n-void)] border border-[var(--n-border)] rounded text-[var(--n-text)] focus:outline-none focus:border-[var(--n-accent)]"
          >
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Contribution Graph */}
      <div className="bg-[var(--n-surface)] border border-[var(--n-border)] rounded-lg p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-[var(--n-text)] mb-2">Contribution Activity</h2>
          <div className="flex items-center space-x-4 text-sm text-[var(--n-muted)]">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-gray-800 rounded-sm mr-2"></div>
              <span>No contributions</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-900 rounded-sm mr-2"></div>
              <span>1-3</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-700 rounded-sm mr-2"></div>
              <span>4-6</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-sm mr-2"></div>
              <span>7-9</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-300 rounded-sm mr-2"></div>
              <span>10+</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {/* Month headers */}
          <div className="grid grid-cols-53 gap-1 mb-2 text-xs text-[var(--n-muted)]">
            <div></div> {/* Empty corner */}
            {months.map(month => (
              <div key={month} className="col-span-4 text-center">
                {month}
              </div>
            ))}
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-53 gap-1 mb-1">
            <div className="text-xs text-[var(--n-muted)]">W</div>
            {Array.from({ length: 52 }, (_, i) => (
              <div key={i} className="text-xs text-center text-[var(--n-muted)]">
                {i + 1}
              </div>
            ))}
          </div>

          {/* Contribution grid */}
          <div className="space-y-1">
            {Array.from({ length: 7 }, (_, weekDay) => (
              <div key={weekDay} className="grid grid-cols-53 gap-1">
                <div className="text-xs text-[var(--n-muted)] pr-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][weekDay]}
                </div>
                {Array.from({ length: 52 }, (_, week) => {
                  const dayNumber = week * 7 + weekDay - new Date(parseInt(selectedYear), 0, 1).getDay() + 1;
                  const date = new Date(parseInt(selectedYear), 0, dayNumber);
                  
                  if (date.getFullYear() !== parseInt(selectedYear) || date.getMonth() !== 0 || dayNumber < 1 || dayNumber > 31) {
                    return <div key={`${week}-${weekDay}`} className="w-3 h-3"></div>;
                  }

                  const contribution = getContributionForDate(date.getDate(), 0);
                  const level = contribution?.level || 0;
                  
                  return (
                    <div
                      key={`${week}-${weekDay}`}
                      className={`w-3 h-3 rounded-sm ${getContributionColor(level)} cursor-pointer hover:ring-2 hover:ring-[var(--n-accent)]`}
                      title={contribution ? `${contribution.date}: ${contribution.count} contributions` : 'No contributions'}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Monthly View */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-[var(--n-text)] mb-4">Monthly Breakdown</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {months.map((month, monthIndex) => (
            <div key={month} className="bg-[var(--n-surface)] border border-[var(--n-border)] rounded-lg p-4">
              <h3 className="font-medium text-[var(--n-text)] mb-3">{month} {selectedYear}</h3>
              <div className="grid grid-cols-7 gap-1 text-xs">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                  <div key={day} className="text-center text-[var(--n-muted)] font-medium">
                    {day}
                  </div>
                ))}
                {getMonthDays(parseInt(selectedYear), monthIndex).map((day, dayIndex) => {
                  const contribution = day ? getContributionForDate(day, monthIndex) : null;
                  const level = contribution?.level || 0;
                  
                  return (
                    <div
                      key={dayIndex}
                      className={`w-6 h-6 rounded-sm flex items-center justify-center text-xs ${
                        day ? getContributionColor(level) : ''
                      } ${day ? 'cursor-pointer hover:ring-1 hover:ring-[var(--n-accent)]' : ''}`}
                      title={contribution ? `${contribution.date}: ${contribution.count} contributions` : ''}
                    >
                      {day && (
                        <span className={level > 0 ? 'text-white font-bold' : 'text-[var(--n-muted)]'}>
                          {day}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
