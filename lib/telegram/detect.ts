import { BOT_USERNAME } from '@/lib/referral/constants';

export const TELEGRAM_MINIAPP_URL = `https://t.me/${BOT_USERNAME}/app`;
export const TELEGRAM_MINIAPP_DEEP_LINK = `tg://resolve?domain=${BOT_USERNAME}&appname=app`;
export const TELEGRAM_BOT_URL = `https://t.me/${BOT_USERNAME}`;

/**
 * True only when the page is really running inside Telegram.
 *
 * Strong signals only:
 * - Telegram appends tgWebAppData / tgWebAppStartParam to the Mini App URL
 * - WebApp.initData is a non-empty signed payload
 * - WebApp.initDataUnsafe.user.id is present
 *
 * Deliberately NOT used as proof:
 * - window.Telegram.WebApp existing at all — telegram-web-app.js defines
 *   the object even in a regular browser, with empty initData.
 * - WebApp.version — the script sets a version string outside Telegram too.
 * - WebApp.platform — it is "unknown" outside Telegram, and a non-empty
 *   platform alone does not prove a signed Telegram session.
 *
 * The old code returned true on version / bare WebApp presence, which
 * let a regular browser slip past the gate and land on a broken app
 * (no initData, so every authed API call fails) instead of the
 * "Open in Telegram" screen.
 */
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

  return false;
}

/** True once telegram-web-app.js has loaded (inside or outside Telegram). */
export function isTelegramScriptLoaded() {
  if (typeof window === 'undefined') return false;
  return Boolean(window.Telegram?.WebApp);
}
