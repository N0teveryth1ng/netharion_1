'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSocket } from './SocketProvider';

interface Battle {
  id: string;
  initiatorId: string;
  receiverId: string;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'DECLINED';
  initiatorHp: number;
  receiverHp: number;
  winnerId?: string;
  initiator?: { id: string; name: string; githubLogin: string; image?: string; level: number };
  receiver?: { id: string; name: string; githubLogin: string; image?: string; level: number };
  startedAt: string;
}

interface User {
  id: string;
  name: string;
  githubLogin: string;
  image?: string;
  level: number;
}

export default function BattleArena() {
  const { data: session } = useSession();
  const { socket } = useSocket();
  const [battles, setBattles] = useState<Battle[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [currentBattle, setCurrentBattle] = useState<Battle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.id) {
      fetchBattles();
      fetchAvailableUsers();
    }
  }, [session]);

  useEffect(() => {
    if (!socket) return;

    // Join user room for notifications
    if (session?.user?.id) {
      socket.emit('join-user-room', session.user.id);
    }

    socket.on('battle-challenge-received', (data: { fromUserId: string; fromUserName: string }) => {
      fetchBattles(); // Refresh battles to show new challenge
    });

    socket.on('battle-updated', (battle: Battle) => {
      setBattles(prev => prev.map(b => b.id === battle.id ? battle : b));
      if (currentBattle?.id === battle.id) {
        setCurrentBattle(battle);
      }
    });

    return () => {
      socket.off('battle-challenge-received');
      socket.off('battle-updated');
    };
  }, [socket, session, currentBattle]);

  const fetchBattles = async () => {
    try {
      const response = await fetch('/api/battles');
      const data = await response.json();
      setBattles(data);
      
      // Set current active battle
      const active = data.find((b: Battle) => 
        (b.initiatorId === session?.user?.id || b.receiverId === session?.user?.id) && 
        b.status === 'ACTIVE'
      );
      setCurrentBattle(active || null);
    } catch (error) {
      console.error('Failed to fetch battles:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      const response = await fetch('/api/users/available');
      const data = await response.json();
      setAvailableUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const challengeUser = async (userId: string) => {
    if (!session?.user?.id) return;
    
    try {
      const response = await fetch('/api/battles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: userId }),
      });
      
      if (response.ok) {
        fetchBattles();
      } else {
        const error = await response.json();
        console.error('Challenge failed:', error);
      }
    } catch (error) {
      console.error('Failed to challenge:', error);
    }
  };

  const acceptBattle = async (battleId: string) => {
    try {
      const response = await fetch(`/api/battles/${battleId}/accept`, {
        method: 'POST',
      });
      if (response.ok) {
        fetchBattles();
      }
    } catch (error) {
      console.error('Failed to accept battle:', error);
    }
  };

  const declineBattle = async (battleId: string) => {
    try {
      const response = await fetch(`/api/battles/${battleId}/decline`, {
        method: 'POST',
      });
      if (response.ok) {
        fetchBattles();
      }
    } catch (error) {
      console.error('Failed to decline battle:', error);
    }
  };

  const performAction = async (action: 'attack' | 'defend' | 'special') => {
    if (!currentBattle) return;

    try {
      const response = await fetch(`/api/battles/${currentBattle.id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      
      if (response.ok) {
        const updatedBattle = await response.json();
        setCurrentBattle(updatedBattle);
        setBattles(prev => prev.map(b => b.id === updatedBattle.id ? updatedBattle : b));
        
        // Emit battle update to other player
        if (socket) {
          socket.emit('battle-action', {
            battleId: currentBattle.id,
            action,
            result: updatedBattle,
          });
        }
      }
    } catch (error) {
      console.error('Failed to perform action:', error);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="font-[family-name:var(--font-cinzel)] text-3xl text-gold-gradient md:text-4xl mb-8">
        Battle Arena
      </h1>

      {/* Current Battle */}
      {currentBattle && (
        <div className="mb-8 p-6 bg-[var(--n-surface)] border border-[var(--n-accent)] rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-[var(--n-text)]">Active Battle</h2>
          
          <div className="grid grid-cols-2 gap-8 mb-6">
            {/* Initiator */}
            <div className={`text-center ${currentBattle.winnerId === currentBattle.initiatorId ? 'ring-2 ring-green-500' : ''}`}>
              <img 
                src={currentBattle.initiator?.image || '/default-avatar.png'} 
                alt={currentBattle.initiator?.name}
                className="w-20 h-20 rounded-full mx-auto mb-2"
              />
              <h3 className="font-semibold">{currentBattle.initiator?.name || currentBattle.initiator?.githubLogin}</h3>
              <p className="text-sm text-[var(--n-muted)]">Level {currentBattle.initiator?.level}</p>
              <div className="mt-2">
                <div className="bg-gray-700 rounded-full h-4 overflow-hidden">
                  <div 
                    className="bg-green-500 h-full transition-all duration-300"
                    style={{ width: `${currentBattle.initiatorHp}%` }}
                  />
                </div>
                <p className="text-sm mt-1">{currentBattle.initiatorHp} HP</p>
              </div>
            </div>

            {/* VS */}
            <div className={`text-center ${currentBattle.winnerId === currentBattle.receiverId ? 'ring-2 ring-green-500' : ''}`}>
              <img 
                src={currentBattle.receiver?.image || '/default-avatar.png'} 
                alt={currentBattle.receiver?.name}
                className="w-20 h-20 rounded-full mx-auto mb-2"
              />
              <h3 className="font-semibold">{currentBattle.receiver?.name || currentBattle.receiver?.githubLogin}</h3>
              <p className="text-sm text-[var(--n-muted)]">Level {currentBattle.receiver?.level}</p>
              <div className="mt-2">
                <div className="bg-gray-700 rounded-full h-4 overflow-hidden">
                  <div 
                    className="bg-green-500 h-full transition-all duration-300"
                    style={{ width: `${currentBattle.receiverHp}%` }}
                  />
                </div>
                <p className="text-sm mt-1">{currentBattle.receiverHp} HP</p>
              </div>
            </div>
          </div>

          {/* Battle Actions */}
          {currentBattle.status === 'ACTIVE' && (
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => performAction('attack')}
                className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                ⚔️ Attack
              </button>
              <button
                onClick={() => performAction('defend')}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                🛡️ Defend
              </button>
              <button
                onClick={() => performAction('special')}
                className="px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                ✨ Special
              </button>
            </div>
          )}

          {currentBattle.winnerId && (
            <div className="text-center mt-4">
              <h3 className="text-2xl font-bold text-green-500">
                {currentBattle.winnerId === session?.user?.id ? 'Victory!' : 'Defeat!'}
              </h3>
            </div>
          )}
        </div>
      )}

      {/* Battle List */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-[var(--n-text)]">Battle Requests</h2>
        
        {battles.filter(b => b.status === 'PENDING').length === 0 ? (
          <p className="text-[var(--n-muted)]">No pending battles.</p>
        ) : (
          <div className="space-y-4">
            {battles.filter(b => b.status === 'PENDING').map((battle) => (
              <div key={battle.id} className="p-4 bg-[var(--n-surface)] border border-[var(--n-border)] rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold">
                      {battle.initiator?.name || battle.initiator?.githubLogin} vs {battle.receiver?.name || battle.receiver?.githubLogin}
                    </p>
                    <p className="text-sm text-[var(--n-muted)]">
                      {battle.receiverId === session?.user?.id ? 'You were challenged!' : 'You challenged them!'}
                    </p>
                  </div>
                  
                  {battle.receiverId === session?.user?.id && (
                    <div className="space-x-2">
                      <button
                        onClick={() => acceptBattle(battle.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => declineBattle(battle.id)}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Challenge Users */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-[var(--n-text)]">Challenge Warriors</h2>
        
        {availableUsers.length === 0 ? (
          <p className="text-[var(--n-muted)]">No available warriors to challenge.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableUsers.map((user) => (
              <div key={user.id} className="p-4 bg-[var(--n-surface)] border border-[var(--n-border)] rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <img 
                      src={user.image || '/default-avatar.png'} 
                      alt={user.name}
                      className="w-12 h-12 rounded-full mr-3"
                    />
                    <div>
                      <p className="font-semibold">{user.name || user.githubLogin}</p>
                      <p className="text-sm text-[var(--n-muted)]">Level {user.level}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => challengeUser(user.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Challenge
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
