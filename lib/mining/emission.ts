const QUARTER_DURATION_SEC = 7776000; // 90 hari
const INITIAL_QUARTER_EMISSION = 100_000_000; // 100 Juta $DRILL

/**
 * Menghitung batas emisi global saat ini berdasarkan halving formula.
 * Parameter GENESIS_TIMESTAMP harus sama persis dengan yang ada di DrillCore.tact
 */
export function calculateGlobalQuarterlyEmission(genesisTimestampSec: number): number {
    const nowSec = Math.floor(Date.now() / 1000);
    const timePassed = nowSec - genesisTimestampSec;
    
    if (timePassed < 0) return INITIAL_QUARTER_EMISSION;
    
    const currentQuarter = Math.floor(timePassed / QUARTER_DURATION_SEC);
    
    // Halving formula: Initial Emission / (2 ^ Quarter)
    // Q1 = 100M, Q2 = 50M, Q3 = 25M, Q4 = 12.5M
    const currentEmission = INITIAL_QUARTER_EMISSION / Math.pow(2, currentQuarter);
    
    return currentEmission;
}

/**
 * Menyesuaikan Mining Speed pengguna (Multiplier) jika Global Emission berkurang.
 * Ini memastikan inflasi off-chain sejalan dengan supply on-chain.
 */
export function applyHalvingPenaltyToSpeed(
    baseSpeed: number, 
    genesisTimestampSec: number
): number {
    const nowSec = Math.floor(Date.now() / 1000);
    const timePassed = Math.max(0, nowSec - genesisTimestampSec);
    const currentQuarter = Math.floor(timePassed / QUARTER_DURATION_SEC);

    if (currentQuarter === 0) return baseSpeed;

    // Kecepatan mining individu juga dipotong setengah setiap kuartal
    return baseSpeed / Math.pow(2, currentQuarter);
}
