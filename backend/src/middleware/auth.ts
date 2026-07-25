import type { Request, Response, NextFunction } from 'express';
import { verifyAccess } from '../utils/jwt.js';
import { unauthorized } from '../utils/errors.js';

export interface AuthedRequest extends Request {
  userId?: string;
}

export function requireAuth(req: AuthedRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) throw unauthorized('Missing bearer token');
  const token = header.slice('Bearer '.length);
  try {
    const payload = verifyAccess(token);
    req.userId = payload.sub;
    next();
  } catch {
    throw unauthorized('Invalid or expired token');
  }
}

export function optionalAuth(req: AuthedRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return next();
  try {
    const payload = verifyAccess(header.slice('Bearer '.length));
    req.userId = payload.sub;
  } catch {
    // ignore — anonymous request continues
  }
  next();
}
