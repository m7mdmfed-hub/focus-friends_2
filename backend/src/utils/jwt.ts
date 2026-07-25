import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.js';

export type AccessPayload = { sub: string; type: 'access' };
export type RefreshPayload = { sub: string; type: 'refresh' };

export function signAccess(userId: string): string {
  const opts: SignOptions = { expiresIn: env.JWT_ACCESS_TTL as SignOptions['expiresIn'] };
  return jwt.sign({ sub: userId, type: 'access' } satisfies AccessPayload, env.JWT_ACCESS_SECRET, opts);
}

export function signRefresh(userId: string): string {
  const opts: SignOptions = { expiresIn: env.JWT_REFRESH_TTL as SignOptions['expiresIn'] };
  return jwt.sign({ sub: userId, type: 'refresh' } satisfies RefreshPayload, env.JWT_REFRESH_SECRET, opts);
}

export function verifyAccess(token: string): AccessPayload {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessPayload;
  if (decoded.type !== 'access') throw new Error('Wrong token type');
  return decoded;
}

export function verifyRefresh(token: string): RefreshPayload {
  const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshPayload;
  if (decoded.type !== 'refresh') throw new Error('Wrong token type');
  return decoded;
}
