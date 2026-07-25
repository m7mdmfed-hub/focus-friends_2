import { describe, it, expect } from 'vitest';
import { xpForLevel, levelForXp } from '../src/services/xp.service';

describe('xp.service', () => {
  describe('xpForLevel', () => {
    it('returns 0 for level 1', () => {
      expect(xpForLevel(1)).toBe(0);
    });
    it('returns 500 for level 2', () => {
      expect(xpForLevel(2)).toBe(500);
    });
    it('is monotonically increasing', () => {
      let prev = -1;
      for (let l = 1; l <= 30; l++) {
        const xp = xpForLevel(l);
        expect(xp).toBeGreaterThan(prev);
        prev = xp;
      }
    });
    it('grows but slower than quadratic', () => {
      // xpForLevel(L) = 500 * (L-1)^1.5
      // The 1.5 exponent should keep the curve well under quadratic (L-1)^2 growth.
      const l2 = xpForLevel(2);    // 500 * 1^1.5 = 500
      const l20 = xpForLevel(20);  // 500 * 19^1.5 ≈ 41,418
      // Quadratic would be 19^2 = 361x; we expect much less.
      const ratio = l20 / l2;
      expect(ratio).toBeGreaterThan(10);
      expect(ratio).toBeLessThan(150); // well under 361x
    });
  });

  describe('levelForXp', () => {
    it('returns 1 for 0 xp', () => {
      expect(levelForXp(0)).toBe(1);
    });
    it('returns 2 at exactly 500 xp', () => {
      expect(levelForXp(500)).toBe(2);
    });
    it('does not level up before threshold', () => {
      expect(levelForXp(499)).toBe(1);
    });
    it('round-trips with xpForLevel', () => {
      for (let l = 1; l < 20; l++) {
        const xp = xpForLevel(l);
        expect(levelForXp(xp)).toBe(l);
      }
    });
  });
});
