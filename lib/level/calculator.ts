/**
 * DRILL ENGINE Level & Mining Speed Calculator
 * Non-linear progression formulas based on off-chain $DRILL balance.
 */

const BASE_MINING_SPEED = 0.50; // Base speed: 0.50 $DRILL / minute

/**
 * Computes Level based on total $DRILL balance.
 * Formula: Level 1 + floor( sqrt(balance) * 343.8 )
 * 
 * Benchmark:
 * - 0 $DRILL balance => Level 1
 * - 12,482.42 $DRILL balance => Level 38,421
 * - 100,000 $DRILL balance => Level 108,720
 */
export function calculateLevel(balance: number): number {
  if (!balance || balance <= 0) return 1;
  const calculated = 1 + Math.sqrt(balance) * 343.8;
  return Math.floor(calculated);
}

/**
 * Computes Mining Speed ($DRILL / minute) based on Level.
 * Formula: Base Speed + ( sqrt(Level) * 0.022 )
 * 
 * Benchmark:
 * - Level 1 => 0.52 $DRILL / MIN
 * - Level 38,421 => 4.82 $DRILL / MIN
 */
export function calculateMiningSpeed(level: number): number {
  if (!level || level <= 1) return BASE_MINING_SPEED;
  const speed = BASE_MINING_SPEED + Math.sqrt(level) * 0.022;
  return Number(speed.toFixed(4));
}

/**
 * Computes minimum balance required to reach a specific level.
 */
export function getRequiredBalanceForLevel(level: number): number {
  if (level <= 1) return 0;
  const requiredSqrt = (level - 1) / 343.8;
  return Math.pow(requiredSqrt, 2);
}

/**
 * Computes percentage progress (0 to 100%) towards the next level.
 */
export function getLevelProgress(balance: number): {
  currentLevel: number;
  nextLevel: number;
  progressPercent: number;
  currentLevelMinBalance: number;
  nextLevelMinBalance: number;
} {
  const currentLevel = calculateLevel(balance);
  const nextLevel = currentLevel + 1;
  const currentLevelMinBalance = getRequiredBalanceForLevel(currentLevel);
  const nextLevelMinBalance = getRequiredBalanceForLevel(nextLevel);

  const range = nextLevelMinBalance - currentLevelMinBalance;
  const progress = range > 0 ? ((balance - currentLevelMinBalance) / range) * 100 : 0;

  return {
    currentLevel,
    nextLevel,
    progressPercent: Math.min(100, Math.max(0, Number(progress.toFixed(2)))),
    currentLevelMinBalance: Number(currentLevelMinBalance.toFixed(2)),
    nextLevelMinBalance: Number(nextLevelMinBalance.toFixed(2)),
  };
}
