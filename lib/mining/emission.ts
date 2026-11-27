const QUARTER_DURATION_SEC = 7776000; // 90 hari
const INITIAL_QUARTER_EMISSION = 100_000_000; // 100 Juta $DRILL

/**
 * Menghitung batas emisi global saat ini berdasarkan halving formula.
 * Genesis = tanggal deploy Jetton mainnet (00:00 UTC), BUKAN 1 Sep 2024.
 * Lihat Spesifikasi Ekonomi DRILL Frozen v1.0 §1-§3 (genesis + kuota kuartal).
 * Nilai genesis dibaca dari config saat deploy, bukan hardcode di sini.
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

// Frozen v1.0 §1: akumulasi offline berhenti setelah 24 jam tanpa klaim.
// Cap ini berlaku di SEMUA tempat yang menghitung menit sejak klaim terakhir
// (claim route, state route, assets route, ticker di halaman Mine) — kalau
// satu tempat lupa, user bisa klaim menit di luar 24 jam dari jalur itu.
export const OFFLINE_CAP_MINUTES = 24 * 60; // 1440

/** Menit sejak lastClaimAt, dipotong di cap offline 24 jam. */
export function capElapsedMinutes(lastClaimAt: string | Date, nowMs: number = Date.now()): number {
    const elapsed = Math.max(0, (nowMs - new Date(lastClaimAt).getTime()) / 60000);
    return Math.min(elapsed, OFFLINE_CAP_MINUTES);
}

/**
 * Awal kuartal saat ini. Genesis = app_config.genesis_timestamp (di-set
 * saat deploy Jetton mainnet, 00:00 UTC hari deploy). Sebelum mainnet
 * (genesis null) kuartal jatuh ke kuartal kalender, supaya cap per kuartal
 * (mis. friend share) tetap punya jendela yang jelas di testnet.
 */
export function getCurrentQuarterStart(genesisTimestampSec: number | null): Date {
    const now = new Date();
    if (genesisTimestampSec && genesisTimestampSec > 0) {
        const genesisMs = genesisTimestampSec * 1000;
        const elapsed = now.getTime() - genesisMs;
        if (elapsed < 0) return new Date(genesisMs);
        const q = Math.floor(elapsed / (QUARTER_DURATION_SEC * 1000));
        return new Date(genesisMs + q * QUARTER_DURATION_SEC * 1000);
    }
    const month = now.getUTCMonth();
    return new Date(Date.UTC(now.getUTCFullYear(), Math.floor(month / 3) * 3, 1, 0, 0, 0));
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
