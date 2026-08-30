import { BOT_USERNAME } from '@/lib/referral/constants';

export const TELEGRAM_MINIAPP_URL = `https://t.me/${BOT_USERNAME}/app`;
export const TELEGRAM_MINIAPP_DEEP_LINK = `tg://resolve?domain=${BOT_USERNAME}&appname=app`;

export function isOpenedInsideTelegram() {
  if (typeof window === 'undefined') return false;
  const webApp = window.Telegram?.WebApp;
  if (!webApp) return false;
  if (webApp.initData && webApp.initData.length > 0) return true;
  if (webApp.initDataUnsafe?.user?.id) return true;
  return false;
}
