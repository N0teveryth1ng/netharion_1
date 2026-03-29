// Socket.io is handled by the pages router at pages/api/socket/io.ts
// The App Router does not support the persistent HTTP upgrade needed for WebSockets
// via the standard route handler API.
export const dynamic = 'force-dynamic';

export async function GET() {
  return new Response('Socket.io endpoint — connect via WebSocket', { status: 200 });
}
