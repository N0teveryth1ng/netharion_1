import { NextApiRequest, NextApiResponse } from 'next';
import SocketHandler from '@/lib/socket';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  return SocketHandler(req, res as any);
}
