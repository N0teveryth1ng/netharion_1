'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface ProfileTheme {
  id: string;
  name: string;
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  banner: string;
}

const DEFAULT_THEMES: ProfileTheme[] = [
  {
    id: 'default',
    name: 'Realm Walker',
    primaryColor: '#f59e0b',
    backgroundColor: '#111827',
    textColor: '#f3f4f6',
    accentColor: '#f59e0b',
    banner: '🌟',
  },
  {
    id: 'shadow',
    name: 'Shadow Assassin',
    primaryColor: '#8b5cf6',
    backgroundColor: '#0f0f23',
    textColor: '#e2e8f0',
    accentColor: '#8b5cf6',
    banner: '🌑',
  },
  {
    id: 'fire',
    name: 'Fire Warrior',
    primaryColor: '#ef4444',
    backgroundColor: '#450a0a',
    textColor: '#fef2f2',
    accentColor: '#ef4444',
    banner: '🔥',
  },
  {
    id: 'frost',
    name: 'Frost Mage',
    primaryColor: '#06b6d4',
    backgroundColor: '#083344',
    textColor: '#ecfeff',
    accentColor: '#06b6d4',
    banner: '❄️',
  },
  {
    id: 'nature',
    name: 'Nature Druid',
    primaryColor: '#10b981',
    backgroundColor: '#052e16',
    textColor: '#ecfdf5',
    accentColor: '#10b981',
    banner: '🌿',
  },
];

const BANNERS = ['🌟', '🔥', '⚔️', '🛡️', '🏆', '👑', '🌙', '⚡', '🌈', '💎'];

export default function ProfileCustomization() {
  const { data: session } = useSession();
  const [selectedTheme, setSelectedTheme] = useState<string>('default');
  const [selectedBanner, setSelectedBanner] = useState<string>('🌟');
  const [customTitle, setCustomTitle] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      fetchProfileSettings();
    }
  }, [session]);

  const fetchProfileSettings = async () => {
    try {
      const response = await fetch('/api/profile/customization');
      const data = await response.json();
      
      if (data.theme) setSelectedTheme(data.theme);
      if (data.banner) setSelectedBanner(data.banner);
      if (data.customTitle) setCustomTitle(data.customTitle);
    } catch (error) {
      console.error('Failed to fetch profile settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/profile/customization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme: selectedTheme,
          banner: selectedBanner,
          customTitle,
        }),
      });

      if (response.ok) {
        // Apply theme immediately
        const theme = DEFAULT_THEMES.find(t => t.id === selectedTheme);
        if (theme) {
          applyTheme(theme);
        }
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const applyTheme = (theme: ProfileTheme) => {
    const root = document.documentElement;
    root.style.setProperty('--theme-primary', theme.primaryColor);
    root.style.setProperty('--theme-background', theme.backgroundColor);
    root.style.setProperty('--theme-text', theme.textColor);
    root.style.setProperty('--theme-accent', theme.accentColor);
  };

  const currentTheme = DEFAULT_THEMES.find(t => t.id === selectedTheme);

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
        Profile Customization
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Theme Selection */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-[var(--n-text)]">Choose Your Theme</h2>
          
          <div className="space-y-4">
            {DEFAULT_THEMES.map((theme) => (
              <div
                key={theme.id}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedTheme === theme.id
                    ? 'border-[var(--n-accent)] bg-[var(--n-surface)]'
                    : 'border-[var(--n-border)] hover:border-[var(--n-accent)]'
                }`}
                onClick={() => setSelectedTheme(theme.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-[var(--n-text)]">{theme.name}</h3>
                    <div className="flex items-center space-x-2 mt-2">
                      <div
                        className="w-6 h-6 rounded-full border border-gray-600"
                        style={{ backgroundColor: theme.primaryColor }}
                      />
                      <div
                        className="w-6 h-6 rounded-full border border-gray-600"
                        style={{ backgroundColor: theme.backgroundColor }}
                      />
                      <div
                        className="w-6 h-6 rounded-full border border-gray-600"
                        style={{ backgroundColor: theme.accentColor }}
                      />
                    </div>
                  </div>
                  <div className="text-2xl">{theme.banner}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Banner and Title */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-[var(--n-text)]">Banner & Title</h2>
          
          {/* Banner Selection */}
          <div>
            <label className="block text-sm font-medium text-[var(--n-text)] mb-3">
              Profile Banner
            </label>
            <div className="grid grid-cols-5 gap-3">
              {BANNERS.map((banner) => (
                <button
                  key={banner}
                  className={`p-4 text-2xl rounded-lg border-2 transition-all ${
                    selectedBanner === banner
                      ? 'border-[var(--n-accent)] bg-[var(--n-surface)]'
                      : 'border-[var(--n-border)] hover:border-[var(--n-accent)]'
                  }`}
                  onClick={() => setSelectedBanner(banner)}
                >
                  {banner}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Title */}
          <div>
            <label className="block text-sm font-medium text-[var(--n-text)] mb-3">
              Custom Title
            </label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="Enter your custom title..."
              maxLength={50}
              className="w-full px-4 py-2 bg-[var(--n-surface)] border border-[var(--n-border)] rounded-lg text-[var(--n-text)] placeholder-[var(--n-muted)] focus:outline-none focus:border-[var(--n-accent)]"
            />
            <p className="text-xs text-[var(--n-muted)] mt-1">
              {customTitle.length}/50 characters
            </p>
          </div>

          {/* Preview */}
          <div>
            <label className="block text-sm font-medium text-[var(--n-text)] mb-3">
              Preview
            </label>
            <div
              className="p-6 rounded-lg border-2 border-[var(--n-border)]"
              style={{
                backgroundColor: currentTheme?.backgroundColor,
                color: currentTheme?.textColor,
              }}
            >
              <div className="text-center">
                <div className="text-4xl mb-2">{selectedBanner}</div>
                <h3
                  className="text-xl font-bold mb-1"
                  style={{ color: currentTheme?.primaryColor }}
                >
                  {session?.user?.name || session?.user?.githubLogin}
                </h3>
                <p className="text-sm opacity-75">
                  {customTitle || 'Realmwalker'}
                </p>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={saveSettings}
            disabled={saving}
            className="w-full px-6 py-3 bg-[var(--n-accent)] text-white rounded-lg hover:bg-opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
