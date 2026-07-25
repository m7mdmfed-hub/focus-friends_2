import { describe, it, expect } from 'vitest';
import { MockProvider } from '../src/services/llm.provider';

describe('llm.provider.MockProvider', () => {
  it('returns a deterministic mock string', async () => {
    const p = new MockProvider();
    const res = await p.complete({ system: 'you are X', user: 'hello' });
    expect(res.provider).toBe('mock');
    expect(res.text).toContain('hello');
    expect(res.text).toContain('you are X');
  });
});
