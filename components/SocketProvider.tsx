'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socketInstance = io('/api/socket/io', {
      transports: ['websocket', 'polling'],
      upgrade: false,
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to socket server');
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from socket server');
    });

    const timer = setTimeout(() => setSocket(socketInstance), 0);

    return () => {
      clearTimeout(timer);
      socketInstance.disconnect();
    };
  }, []);

  useEffect(() => {
    // This effect runs only when socket changes, avoiding cascading renders
  }, [socket]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}
