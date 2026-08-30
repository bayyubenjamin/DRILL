type Impact = 'light' | 'medium' | 'heavy' | 'rigid' | 'soft';

function haptic() {
  return window.Telegram?.WebApp?.HapticFeedback;
}

export function impact(style: Impact = 'medium') {
  try {
    haptic()?.impactOccurred?.(style);
  } catch {}
  try {
    const pattern = style === 'heavy' || style === 'rigid' ? [18, 30, 28] : style === 'medium' ? [12] : [8];
    window.navigator?.vibrate?.(pattern);
  } catch {}
}

export function notify(type: 'error' | 'success' | 'warning' = 'success') {
  try {
    haptic()?.notificationOccurred?.(type);
  } catch {}
  try {
    window.navigator?.vibrate?.(type === 'success' ? [12, 40, 24, 40, 36] : type === 'error' ? [40, 40, 40] : [16, 30, 16]);
  } catch {}
}

export function startClaimPulse() {
  impact('heavy');
  const id = window.setInterval(() => impact('soft'), 180);
  return () => window.clearInterval(id);
}
