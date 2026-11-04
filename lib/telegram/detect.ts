import { BOT_USERNAME } from '@/lib/referral/constants';

export const TELEGRAM_MINIAPP_URL = `https://t.me/${BOT_USERNAME}/app`;
export const TELEGRAM_MINIAPP_DEEP_LINK = `tg://resolve?domain=${BOT_USERNAME}&appname=app`;

export function isOpenedInsideTelegram() {
  if (typeof window === 'undefined') return false;

  const webApp = window.Telegram?.WebApp;
  if (!webApp) return false;

  // Strong signals from Telegram WebApp
  if (webApp.initData && webApp.initData.length > 0) return true;
  if (webApp.initDataUnsafe?.user?.id) return true;

  // Fallback: platform is set by Telegram client (not "unknown")
  const platform = (webApp as { platform?: string }).platform;
  if (platform && platform !== 'unknown' && platform !== '') return true;

  // Last resort: version exists only when script was injected by Telegram
  const version = (webApp as { version?: string }).version;
  if (version && version.length > 0) return true;

  return false;
}
