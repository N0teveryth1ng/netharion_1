'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface Guild {
  id: string;
  name: string;
  description?: string;
  emblem?: string;
  createdAt: string;
  memberCount: number;
  members?: GuildMember[];
}

interface GuildMember {
  id: string;
  userId: string;
  guildId: string;
  role: 'LEADER' | 'OFFICER' | 'MEMBER';
  joinedAt: string;
  user: {
    id: string;
    name: string;
    githubLogin: string;
    image?: string;
    level: number;
  };
}

export default function GuildSystem() {
  const { data: session } = useSession();
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [userGuild, setUserGuild] = useState<Guild | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [newGuildName, setNewGuildName] = useState('');
  const [newGuildDescription, setNewGuildDescription] = useState('');
  const [newGuildEmblem, setNewGuildEmblem] = useState('⚔️');
  const [selectedGuild, setSelectedGuild] = useState<Guild | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.id) {
      fetchGuilds();
      fetchUserGuild();
    }
  }, [session]);

  const fetchGuilds = async () => {
    try {
      const response = await fetch('/api/guilds');
      const data = await response.json();
      setGuilds(data);
    } catch (error) {
      console.error('Failed to fetch guilds:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserGuild = async () => {
    try {
      const response = await fetch('/api/guilds/my-guild');
      if (response.ok) {
        const data = await response.json();
        setUserGuild(data);
      }
    } catch (error) {
      console.error('Failed to fetch user guild:', error);
    }
  };

  const createGuild = async () => {
    if (!newGuildName.trim()) return;

    try {
      const response = await fetch('/api/guilds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newGuildName,
          description: newGuildDescription,
          emblem: newGuildEmblem,
        }),
      });

      if (response.ok) {
        setShowCreateForm(false);
        setNewGuildName('');
        setNewGuildDescription('');
        setNewGuildEmblem('⚔️');
        fetchGuilds();
        fetchUserGuild();
      }
    } catch (error) {
      console.error('Failed to create guild:', error);
    }
  };

  const joinGuild = async (guildId: string) => {
    try {
      const response = await fetch(`/api/guilds/${guildId}/join`, {
        method: 'POST',
      });

      if (response.ok) {
        setShowJoinForm(false);
        fetchUserGuild();
        fetchGuilds();
      }
    } catch (error) {
      console.error('Failed to join guild:', error);
    }
  };

  const leaveGuild = async () => {
    if (!userGuild) return;

    try {
      const response = await fetch(`/api/guilds/${userGuild.id}/leave`, {
        method: 'POST',
      });

      if (response.ok) {
        setUserGuild(null);
        fetchGuilds();
      }
    } catch (error) {
      console.error('Failed to leave guild:', error);
    }
  };

  const viewGuild = async (guildId: string) => {
    try {
      const response = await fetch(`/api/guilds/${guildId}`);
      const data = await response.json();
      setSelectedGuild(data);
    } catch (error) {
      console.error('Failed to fetch guild details:', error);
    }
  };

  const emblems = ['⚔️', '🛡️', '🏰', '👑', '🐉', '🦅', '🌟', '⚡', '🔥', '❄️'];

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
        Guilds & Clans
      </h1>

      {/* User Guild */}
      {userGuild ? (
        <div className="mb-8 p-6 bg-[var(--n-surface)] border border-[var(--n-accent)] rounded-lg">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center">
              <span className="text-4xl mr-4">{userGuild.emblem || '⚔️'}</span>
              <div>
                <h2 className="text-2xl font-bold text-[var(--n-text)]">{userGuild.name}</h2>
                <p className="text-[var(--n-muted)]">{userGuild.description}</p>
                <p className="text-sm text-[var(--n-muted)] mt-1">
                  {userGuild.memberCount} members • Founded {new Date(userGuild.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <button
              onClick={leaveGuild}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Leave Guild
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userGuild.members?.map((member) => (
              <div key={member.id} className="p-3 bg-[var(--n-void)] rounded-lg">
                <div className="flex items-center">
                  <img 
                    src={member.user.image || '/default-avatar.png'} 
                    alt={member.user.name}
                    className="w-10 h-10 rounded-full mr-3"
                  />
                  <div>
                    <p className="font-semibold text-[var(--n-text)]">
                      {member.user.name || member.user.githubLogin}
                    </p>
                    <p className="text-sm text-[var(--n-muted)]">
                      {member.role} • Level {member.user.level}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mb-8 flex space-x-4">
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-6 py-3 bg-[var(--n-accent)] text-white rounded hover:bg-opacity-80"
          >
            Create Guild
          </button>
          <button
            onClick={() => setShowJoinForm(true)}
            className="px-6 py-3 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Join Guild
          </button>
        </div>
      )}

      {/* Create Guild Form */}
      {showCreateForm && (
        <div className="mb-8 p-6 bg-[var(--n-surface)] border border-[var(--n-border)] rounded-lg">
          <h3 className="text-xl font-semibold mb-4 text-[var(--n-text)]">Create New Guild</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--n-text)] mb-2">
                Guild Name
              </label>
              <input
                type="text"
                value={newGuildName}
                onChange={(e) => setNewGuildName(e.target.value)}
                placeholder="Enter guild name..."
                maxLength={50}
                className="w-full px-4 py-2 bg-[var(--n-void)] border border-[var(--n-border)] rounded text-[var(--n-text)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--n-text)] mb-2">
                Description
              </label>
              <textarea
                value={newGuildDescription}
                onChange={(e) => setNewGuildDescription(e.target.value)}
                placeholder="Describe your guild..."
                maxLength={200}
                rows={3}
                className="w-full px-4 py-2 bg-[var(--n-void)] border border-[var(--n-border)] rounded text-[var(--n-text)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--n-text)] mb-2">
                Guild Emblem
              </label>
              <div className="grid grid-cols-5 gap-2">
                {emblems.map((emblem) => (
                  <button
                    key={emblem}
                    className={`p-3 text-2xl rounded border-2 ${
                      newGuildEmblem === emblem
                        ? 'border-[var(--n-accent)]'
                        : 'border-[var(--n-border)] hover:border-[var(--n-accent)]'
                    }`}
                    onClick={() => setNewGuildEmblem(emblem)}
                  >
                    {emblem}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={createGuild}
                className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Create Guild
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join Guild Form */}
      {showJoinForm && (
        <div className="mb-8 p-6 bg-[var(--n-surface)] border border-[var(--n-border)] rounded-lg">
          <h3 className="text-xl font-semibold mb-4 text-[var(--n-text)]">Join a Guild</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {guilds.map((guild) => (
              <div key={guild.id} className="p-4 bg-[var(--n-void)] rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{guild.emblem || '⚔️'}</span>
                    <div>
                      <h4 className="font-semibold text-[var(--n-text)]">{guild.name}</h4>
                      <p className="text-sm text-[var(--n-muted)]">{guild.memberCount} members</p>
                    </div>
                  </div>
                  <div className="space-x-2">
                    <button
                      onClick={() => viewGuild(guild.id)}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      View
                    </button>
                    <button
                      onClick={() => joinGuild(guild.id)}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                    >
                      Join
                    </button>
                  </div>
                </div>
                {guild.description && (
                  <p className="text-sm text-[var(--n-muted)]">{guild.description}</p>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={() => setShowJoinForm(false)}
            className="mt-4 px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Guild Details Modal */}
      {selectedGuild && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[var(--n-surface)] border border-[var(--n-border)] rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center">
                <span className="text-4xl mr-4">{selectedGuild.emblem || '⚔️'}</span>
                <div>
                  <h3 className="text-2xl font-bold text-[var(--n-text)]">{selectedGuild.name}</h3>
                  <p className="text-[var(--n-muted)]">{selectedGuild.description}</p>
                  <p className="text-sm text-[var(--n-muted)] mt-1">
                    {selectedGuild.memberCount} members • Founded {new Date(selectedGuild.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedGuild(null)}
                className="text-[var(--n-muted)] hover:text-[var(--n-text)]"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedGuild.members?.map((member) => (
                <div key={member.id} className="p-3 bg-[var(--n-void)] rounded-lg">
                  <div className="flex items-center">
                    <img 
                      src={member.user.image || '/default-avatar.png'} 
                      alt={member.user.name}
                      className="w-10 h-10 rounded-full mr-3"
                    />
                    <div>
                      <p className="font-semibold text-[var(--n-text)]">
                        {member.user.name || member.user.githubLogin}
                      </p>
                      <p className="text-sm text-[var(--n-muted)]">
                        {member.role} • Level {member.user.level}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {!userGuild && (
              <button
                onClick={() => {
                  joinGuild(selectedGuild.id);
                  setSelectedGuild(null);
                }}
                className="mt-4 w-full px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Join Guild
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
