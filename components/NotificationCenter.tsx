'use client';

import { useState, useEffect } from 'react';
import { useSocket } from './SocketProvider';
import { useSession } from 'next-auth/react';

interface Notification {
  id: string;
  type: 'friend-request' | 'battle-challenge' | 'achievement';
  message: string;
  fromUserId?: string;
  fromUserName?: string;
  timestamp: Date;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
}

export default function NotificationCenter() {
  const { socket } = useSocket();
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!socket || !session?.user?.id) return;

    // Join user's personal room
    socket.emit('join-user-room', session.user.id);

    // Listen for friend requests
    socket.on('friend-request-received', (data: { fromUserId: string; fromUserName: string }) => {
      const notification: Notification = {
        id: `fr-${Date.now()}`,
        type: 'friend-request',
        message: `${data.fromUserName} wants to be your friend!`,
        fromUserId: data.fromUserId,
        fromUserName: data.fromUserName,
        timestamp: new Date(),
      };
      setNotifications(prev => [notification, ...prev]);
    });

    // Listen for battle challenges
    socket.on('battle-challenge-received', (data: { fromUserId: string; fromUserName: string }) => {
      const notification: Notification = {
        id: `bc-${Date.now()}`,
        type: 'battle-challenge',
        message: `${data.fromUserName} has challenged you to a battle!`,
        fromUserId: data.fromUserId,
        fromUserName: data.fromUserName,
        timestamp: new Date(),
      };
      setNotifications(prev => [notification, ...prev]);
    });

    // Listen for achievements
    socket.on('achievement-unlocked', (achievement: Achievement) => {
      const notification: Notification = {
        id: `ach-${Date.now()}`,
        type: 'achievement',
        message: `🏆 Achievement unlocked: ${achievement.name}`,
        timestamp: new Date(),
      };
      setNotifications(prev => [notification, ...prev]);
    });

    return () => {
      socket.off('friend-request-received');
      socket.off('battle-challenge-received');
      socket.off('achievement-unlocked');
    };
  }, [socket, session]);

  const clearNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className="bg-[var(--n-surface)] border border-[var(--n-border)] rounded-lg p-4 shadow-lg max-w-sm animate-pulse"
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <p className="text-sm text-[var(--n-text)]">{notification.message}</p>
              <p className="text-xs text-[var(--n-muted)] mt-1">
                {new Date(notification.timestamp).toLocaleTimeString()}
              </p>
            </div>
            <button
              onClick={() => clearNotification(notification.id)}
              className="ml-2 text-[var(--n-muted)] hover:text-[var(--n-text)]"
            >
              ×
            </button>
          </div>
          {notification.type === 'friend-request' && (
            <div className="mt-2 flex space-x-2">
              <button className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700">
                Accept
              </button>
              <button className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700">
                Decline
              </button>
            </div>
          )}
          {notification.type === 'battle-challenge' && (
            <div className="mt-2 flex space-x-2">
              <button className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">
                Accept Battle
              </button>
              <button className="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700">
                Decline
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
