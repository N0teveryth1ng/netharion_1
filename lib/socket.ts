import { Server as NetServer } from 'http';
import { Socket } from 'net';
import { NextApiRequest, NextApiResponse } from 'next';
import { Server as ServerIO } from 'socket.io';

export const config = {
  api: {
    bodyParser: false,
  },
};

interface SocketWithIO extends NextApiResponse {
  socket: Socket & {
    server: NetServer & {
      io?: ServerIO;
    };
  };
}

interface BattleAction {
  battleId: string;
  action: string;
  result: {
    damage?: number;
    winner?: string;
    [key: string]: any;
  };
}

interface AchievementData {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
}

interface AchievementUnlockData {
  userId: string;
  achievement: AchievementData;
}

const SocketHandler = (req: NextApiRequest, res: SocketWithIO) => {
  if (res.socket.server.io) {
    console.log('Socket is already running');
  } else {
    console.log('Socket is initializing');
    const httpServer: NetServer = res.socket.server;
    const io = new ServerIO(httpServer, {
      path: '/api/socket/io',
      addTrailingSlash: false,
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
      transports: ['websocket', 'polling'],
    });

    res.socket.server.io = io;

    io.on('connection', (socket) => {
      console.log('User connected:', socket.id);

      socket.on('join-user-room', (userId: string) => {
        socket.join(`user-${userId}`);
        console.log(`User ${userId} joined their room`);
      });

      socket.on('friend-request', (data: { fromUserId: string; toUserId: string; fromUserName: string }) => {
        socket.to(`user-${data.toUserId}`).emit('friend-request-received', {
          fromUserId: data.fromUserId,
          fromUserName: data.fromUserName,
        });
      });

      socket.on('battle-challenge', (data: { fromUserId: string; toUserId: string; fromUserName: string }) => {
        socket.to(`user-${data.toUserId}`).emit('battle-challenge-received', {
          fromUserId: data.fromUserId,
          fromUserName: data.fromUserName,
        });
      });

      socket.on('battle-action', (data: BattleAction) => {
        socket.to(`battle-${data.battleId}`).emit('battle-updated', data);
      });

      socket.on('achievement-unlocked', (data: AchievementUnlockData) => {
        socket.to(`user-${data.userId}`).emit('achievement-unlocked', data.achievement);
      });

      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
      });
    });
  }
  res.end();
};

export default SocketHandler;
