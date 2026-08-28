export const DRILL_RANKS = [
  { id: 1, name: 'INITIATE', minTotal: 0, bonus: 'Base access' },
  { id: 2, name: 'SPARK', minTotal: 100, bonus: '+2% engine speed' },
  { id: 3, name: 'CORE', minTotal: 500, bonus: 'Withdraw unlocked tier' },
  { id: 4, name: 'ENGINE', minTotal: 2_000, bonus: '+8% engine speed' },
  { id: 5, name: 'GENESIS', minTotal: 5_000, bonus: 'Genesis badge' },
  { id: 6, name: 'OVERDRIVE', minTotal: 15_000, bonus: '+15% engine speed' },
  { id: 7, name: 'APEX', minTotal: 50_000, bonus: 'Apex operator card' },
  { id: 8, name: 'MYTHIC', minTotal: 100_000, bonus: 'Max visible rank' },
] as const;

export function getRankIndex(totalDrill: number) {
  let current = 0;
  DRILL_RANKS.forEach((rank, index) => {
    if (totalDrill >= rank.minTotal) current = index;
  });
  return current;
}
