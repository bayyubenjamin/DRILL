export const TASK_WAIT_MS = 60_000;
export const TASK_REWARD = 5;

export function jakartaDayKey(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function isDailyTask(type?: string | null) {
  return String(type || '').toLowerCase() === 'daily';
}

export function isClaimedToday(claimedAt?: string | null, type?: string | null) {
  if (!claimedAt) return false;
  if (!isDailyTask(type)) return true;
  return jakartaDayKey(new Date(claimedAt)) === jakartaDayKey();
}
