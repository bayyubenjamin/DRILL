export const MAX_LEVEL = 500;
const MAX_BALANCE = 80_000;
const POWER = 2.2;
const BASE_MINING_SPEED = 0.01;
const MAX_MINING_SPEED = 6;

export function getRequiredBalanceForLevel(level: number): number {
  if (level <= 1) return 0;
  const capped = Math.min(level, MAX_LEVEL);
  const t = (capped - 1) / (MAX_LEVEL - 1);
  return Number((MAX_BALANCE * Math.pow(t, POWER)).toFixed(4));
}

export function calculateLevel(totalDrill: number): number {
  if (!totalDrill || totalDrill <= 0) return 1;
  if (totalDrill >= MAX_BALANCE) return MAX_LEVEL;
  const t = Math.pow(totalDrill / MAX_BALANCE, 1 / POWER);
  return Math.min(MAX_LEVEL, 1 + Math.floor(t * (MAX_LEVEL - 1)));
}

export function calculateMiningSpeed(level: number): number {
  const capped = Math.max(1, Math.min(level || 1, MAX_LEVEL));
  const t = (capped - 1) / (MAX_LEVEL - 1);
  const speed = BASE_MINING_SPEED + (MAX_MINING_SPEED - BASE_MINING_SPEED) * Math.pow(t, 1.15);
  return Number(speed.toFixed(4));
}

export function getLevelProgress(totalDrill: number): {
  currentLevel: number;
  nextLevel: number;
  progressPercent: number;
  currentLevelMinBalance: number;
  nextLevelMinBalance: number;
} {
  const currentLevel = calculateLevel(totalDrill);
  const nextLevel = Math.min(MAX_LEVEL, currentLevel + 1);
  const currentLevelMinBalance = getRequiredBalanceForLevel(currentLevel);
  const nextLevelMinBalance = getRequiredBalanceForLevel(nextLevel);
  const range = nextLevelMinBalance - currentLevelMinBalance;
  const progress =
    currentLevel >= MAX_LEVEL ? 100 : range > 0 ? ((totalDrill - currentLevelMinBalance) / range) * 100 : 0;

  return {
    currentLevel,
    nextLevel,
    progressPercent: Math.min(100, Math.max(0, Number(progress.toFixed(2)))),
    currentLevelMinBalance,
    nextLevelMinBalance,
  };
}
