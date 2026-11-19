/**
 * Telegram webhook for @drillengine_bot.
 *
 * POST /api/telegram/webhook — receives updates from Telegram after the
 * webhook is registered (setWebhook). Security: Telegram sends the
 * X-Telegram-Bot-Api-Secret-Token header when a secret_token was set
 * in setWebhook. The route compares it against
 * TELEGRAM_WEBHOOK_SECRET (Vercel env) and rejects everything else.
 * Fail closed: no secret configured = no update is processed.
 *
 * Always answers 200 after processing (even when a single handler
 * fails) so Telegram does not retry a poisoned update. 401 only for
 * a missing/wrong secret header.
 */

import { NextResponse } from 'next/server';
import { handleTelegramUpdate, type TelegramUpdate } from '@/lib/telegram/bot';

export async function POST(request: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const sent = request.headers.get('x-telegram-bot-api-secret-token');
  if (!secret || !sent || sent !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let update: TelegramUpdate;
  try {
    update = (await request.json()) as TelegramUpdate;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  await handleTelegramUpdate(update);
  return NextResponse.json({ ok: true });
}
