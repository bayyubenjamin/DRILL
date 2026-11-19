import { BOT_USERNAME } from '@/lib/referral/constants';

export const TELEGRAM_MINIAPP_URL = `https://t.me/${BOT_USERNAME}/app`;
export const TELEGRAM_MINIAPP_DEEP_LINK = `tg://resolve?domain=${BOT_USERNAME}&appname=app`;

export function isOpenedInsideTelegram() {
  if (typeof window === 'undefined') return false;

  // Telegram appends these query params when it opens a Mini App, even
  // before telegram-web-app.js has finished injecting window.Telegram.
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('tgWebAppData') || params.get('tgWebAppStartParam')) return true;
  } catch {
    // ignore — fall through to the WebApp checks below
  }

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

  // The WebApp object itself only exists inside Telegram (or a page that
  // deliberately mocks it). After the script has loaded, treat its bare
  // presence as a weak signal rather than locking a real Telegram user out.
  return true;
}
