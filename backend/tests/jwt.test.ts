import { describe, it, expect } from 'vitest';
import { signAccess, signRefresh, verifyAccess, verifyRefresh } from '../src/utils/jwt';

describe('jwt utils', () => {
  const userId = 'user_abc';

  it('signs and verifies an access token', () => {
    const token = signAccess(userId);
    const payload = verifyAccess(token);
    expect(payload.sub).toBe(userId);
    expect(payload.type).toBe('access');
  });

  it('signs and verifies a refresh token', () => {
    const token = signRefresh(userId);
    const payload = verifyRefresh(token);
    expect(payload.sub).toBe(userId);
    expect(payload.type).toBe('refresh');
  });

  it('rejects an access token when verified as refresh', () => {
    const token = signAccess(userId);
    expect(() => verifyRefresh(token)).toThrow();
  });

  it('rejects garbage', () => {
    expect(() => verifyAccess('not-a-token')).toThrow();
  });
});
