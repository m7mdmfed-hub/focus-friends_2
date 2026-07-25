import { describe, it, expect } from 'vitest';
import { hashPassword, comparePassword } from '../src/utils/password';

describe('password utils', () => {
  it('hashes and verifies a password', async () => {
    const hash = await hashPassword('hunter2');
    expect(hash).not.toBe('hunter2');
    expect(await comparePassword('hunter2', hash)).toBe(true);
  });

  it('rejects the wrong password', async () => {
    const hash = await hashPassword('hunter2');
    expect(await comparePassword('hunter3', hash)).toBe(false);
  });

  it('produces different hashes for the same input (salted)', async () => {
    const a = await hashPassword('same');
    const b = await hashPassword('same');
    expect(a).not.toBe(b);
  });
});
