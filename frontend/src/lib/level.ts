// Mirror of backend XP curve. Keep in sync.
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.floor(500 * Math.pow(level - 1, 1.5));
}
export function levelForXp(xp: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level += 1;
  return level;
}
