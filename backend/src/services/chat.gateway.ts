import { WebSocketServer, WebSocket } from 'ws';
import type { IncomingMessage, Server } from 'http';
import { z } from 'zod';
import { verifyAccess } from '../utils/jwt.js';
import { prisma } from '../config/prisma.js';

const clients = new Map<string, Set<WebSocket>>();

// Parse the access token from a `?token=` query string or `Authorization` header.
function extractToken(req: IncomingMessage): string | null {
  const url = new URL(req.url ?? '/', `http://${req.headers.host}`);
  const fromQuery = url.searchParams.get('token');
  if (fromQuery) return fromQuery;
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) return auth.slice(7);
  return null;
}

const incomingSchema = z.object({
  type: z.literal('message'),
  to: z.string().cuid(),
  content: z.string().min(1).max(2000),
});

const typingSchema = z.object({
  type: z.literal('typing'),
  to: z.string().cuid(),
});

export function attachChatServer(httpServer: Server) {
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on('upgrade', (req, socket, head) => {
    if (!req.url?.startsWith('/ws')) {
      socket.destroy();
      return;
    }
    const token = extractToken(req);
    if (!token) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }
    let userId: string;
    try {
      userId = verifyAccess(token).sub;
    } catch {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }
    wss.handleUpgrade(req, socket, head, (ws) => {
      registerClient(userId, ws);
      ws.on('close', () => unregisterClient(userId, ws));
    });
  });

  wss.on('connection', (ws: WebSocket) => {
    ws.send(JSON.stringify({ type: 'hello', ts: Date.now() }));
  });

  return wss;
}

function registerClient(userId: string, ws: WebSocket) {
  const set = clients.get(userId) ?? new Set<WebSocket>();
  set.add(ws);
  clients.set(userId, set);

  ws.on('message', async (raw) => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw.toString());
    } catch {
      ws.send(JSON.stringify({ type: 'error', error: 'Invalid JSON' }));
      return;
    }

    const asMessage = incomingSchema.safeParse(parsed);
    if (asMessage.success) {
      const { to, content } = asMessage.data;
      const fromUserId = findUserIdBySocket(ws);
      if (!fromUserId) return;

      const recipient = await prisma.user.findUnique({ where: { id: to } });
      if (!recipient) {
        ws.send(JSON.stringify({ type: 'error', error: 'Recipient not found' }));
        return;
      }

      const message = await prisma.message.create({
        data: { senderId: fromUserId, receiverId: to, content },
        include: { sender: { select: { id: true, name: true, avatar: true } } },
      });

      const payload = JSON.stringify({ type: 'message', message });
      broadcastTo(to, payload);
      broadcastTo(fromUserId, payload, ws);
      return;
    }

    const asTyping = typingSchema.safeParse(parsed);
    if (asTyping.success) {
      const { to } = asTyping.data;
      broadcastTo(to, JSON.stringify({ type: 'typing', from: userId }));
      return;
    }

    ws.send(JSON.stringify({ type: 'error', error: 'Unknown message type' }));
  });
}

function unregisterClient(userId: string, ws: WebSocket) {
  const set = clients.get(userId);
  if (!set) return;
  set.delete(ws);
  if (set.size === 0) clients.delete(userId);
}

function findUserIdBySocket(ws: WebSocket): string | null {
  for (const [uid, set] of clients.entries()) {
    if (set.has(ws)) return uid;
  }
  return null;
}

function broadcastTo(userId: string, payload: string, except?: WebSocket) {
  const set = clients.get(userId);
  if (!set) return;
  for (const ws of set) {
    if (ws === except) continue;
    if (ws.readyState === WebSocket.OPEN) ws.send(payload);
  }
}

/**
 * Send a payload to all of `authorId`'s accepted friends AND the author themselves.
 * - `excludeUserId`: skip one user (e.g., don't echo to the author if you're handling their UI separately)
 * - Returns the number of recipients the payload was sent to.
 */
export async function broadcastToFriends(
  authorId: string,
  payload: unknown,
  excludeUserId?: string,
): Promise<number> {
  const friends = await prisma.friend.findMany({
    where: {
      status: 'ACCEPTED',
      OR: [{ senderId: authorId }, { receiverId: authorId }],
    },
    select: { senderId: true, receiverId: true },
  });
  const recipientIds = new Set<string>([authorId]);
  for (const f of friends) {
    recipientIds.add(f.senderId === authorId ? f.receiverId : f.senderId);
  }
  if (excludeUserId) recipientIds.delete(excludeUserId);

  const text = JSON.stringify(payload);
  let count = 0;
  for (const id of recipientIds) {
    const set = clients.get(id);
    if (!set) continue;
    for (const ws of set) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(text);
        count += 1;
      }
    }
  }
  return count;
}

/** Test-only: clear the in-memory connection map. */
export function _resetClientsForTests() {
  clients.clear();
}
