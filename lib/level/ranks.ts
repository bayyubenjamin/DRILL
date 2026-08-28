import { calculateLevel, getRequiredBalanceForLevel, MAX_LEVEL } from '@/lib/level/calculator';

export const MILESTONE_LEVELS = [1, 10, 25, 50, 75, 100, 150, 200, 250, 300, 400, 500] as const;

const TITLES: Record<number, string> = {
  1: 'INITIATE',
  10: 'SPARK',
  25: 'CORE',
  50: 'OPERATOR',
  75: 'ENGINE',
  100: 'GENESIS',
  150: 'OVERDRIVE',
  200: 'TITAN',
  250: 'APEX',
  300: 'VOID',
  400: 'MYTHIC',
  500: 'DRILL MASTER',
};

export function getLevelTitle(level: number) {
  const milestones = [...MILESTONE_LEVELS].reverse();
  const hit = milestones.find((item) => level >= item) || 1;
  return TITLES[hit] || 'INITIATE';
}

export function getVisibleLevelCards(totalDrill: number) {
  const current = calculateLevel(totalDrill);
  const start = Math.max(1, current - 2);
  const end = Math.min(MAX_LEVEL, current + 4);
  const cards = [];
  for (let level = start; level <= end; level += 1) {
    cards.push({
      level,
      title: getLevelTitle(level),
      required: getRequiredBalanceForLevel(level),
      unlocked: totalDrill >= getRequiredBalanceForLevel(level),
      current: level === current,
    });
  }
  return cards;
}
