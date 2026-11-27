/**
 * Telegram Bot API client + command handlers for @drillengine_bot.
 *
 * Transport: Telegram webhook -> POST /api/telegram/webhook (Next.js).
 * The route verifies the X-Telegram-Bot-Api-Secret-Token header before
 * calling handleTelegramUpdate, so `from.id` in an update is genuine
 * Telegram-authenticated data — safe to use for the /balance lookup.
 *
 * No new dependency: plain fetch to api.telegram.org.
 * Language: English (matches the Mini App since 19 Nov 2026).
 *
 * NOTE: the X button is deliberately absent from the keyboards until
 * the @drillprotocol handle exists (x.com/drillprotocol is 404 as of
 * 19 Nov 2026). Do not ship a dead link — add it back once the
 * account is created.
 */

import { supabaseAdmin } from '@/lib/supabase/server';
import { CANONICAL_URL } from '@/lib/site';

const TELEGRAM_API = 'https://api.telegram.org';
const APP_URL = CANONICAL_URL;
const CHANNEL_URL = 'https://t.me/drillprotocol';
// /start card photo — the DRILL ENGINE banner (27 Nov 2026, Bayu).
// NOT drill-pass.png: that file is the NFT Pass artwork and stays as
// the image/cover in public/drill-pass.json.
const CARD_PHOTO_URL = `${CANONICAL_URL}/drill-banner.png`;

// ---------------------------------------------------------------------------
// Minimal Telegram types (only what we use)
// ---------------------------------------------------------------------------

export interface TelegramUser {
  id: number;
  first_name?: string;
  username?: string;
}

export interface TelegramMessage {
  message_id: number;
  chat: { id: number; type?: string };
  from?: TelegramUser;
  text?: string;
  caption?: string;
  photo?: { file_id: string }[];
  entities?: { type: string; offset: number; length: number }[];
}

export interface TelegramCallbackQuery {
  id: string;
  from: TelegramUser;
  message?: TelegramMessage;
  data?: string;
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
}

// ---------------------------------------------------------------------------
// Bot API calls (never throw: a failed send must not make the webhook
// return non-200, or Telegram retries the same update forever)
// ---------------------------------------------------------------------------

function botToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not set');
  return token;
}

type InlineButton =
  | { text: string; web_app: { url: string } }
  | { text: string; url: string }
  | { text: string; callback_data: string };

async function callTelegram(
  method: string,
  payload: Record<string, unknown>,
): Promise<unknown | null> {
  try {
    const res = await fetch(`${TELEGRAM_API}/bot${botToken()}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = (await res.json()) as { ok?: boolean; result?: unknown; description?: string };
    if (!res.ok || !json.ok) {
      console.error(`Telegram ${method} failed:`, json.description || res.status);
      return null;
    }
    return json.result ?? null;
  } catch (error) {
    console.error(`Telegram ${method} error:`, error);
    return null;
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function mainKeyboard(): { inline_keyboard: InlineButton[][] } {
  return {
    inline_keyboard: [
      [{ text: '⛏️ Open DRILL App', web_app: { url: APP_URL } }],
      [
        { text: '📢 Channel', url: CHANNEL_URL },
        { text: '❓ Help', callback_data: 'help' },
      ],
      [{ text: '💰 My Balance', callback_data: 'balance' }],
    ],
  };
}

function helpKeyboard(): { inline_keyboard: InlineButton[][] } {
  return {
    inline_keyboard: [
      [{ text: '⛏️ Open DRILL App', web_app: { url: APP_URL } }],
      [{ text: '◀️ Back to Start', callback_data: 'start' }],
    ],
  };
}

async function sendPhotoCard(
  chatId: number,
  caption: string,
  replyMarkup: { inline_keyboard: InlineButton[][] },
): Promise<void> {
  await callTelegram('sendPhoto', {
    chat_id: chatId,
    photo: CARD_PHOTO_URL,
    caption,
    parse_mode: 'HTML',
    reply_markup: replyMarkup,
  });
}

async function sendText(
  chatId: number,
  text: string,
  replyMarkup?: { inline_keyboard: InlineButton[][] },
): Promise<void> {
  await callTelegram('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    reply_markup: replyMarkup,
  });
}

// ---------------------------------------------------------------------------
// Copy (English, production tone, honest about testnet status)
// ---------------------------------------------------------------------------

function startCaption(firstName: string): string {
  const name = escapeHtml(firstName || 'Miner');
  return (
    `<b>⛏️ Welcome to DRILL ENGINE, ${name}</b>\n\n` +
    `Mine <b>$DRILL</b> with your own rig, level up, and withdraw real DRILL.\n\n` +
    `<b>How it works</b>\n` +
    `1️⃣ Open the app and connect your TON wallet\n` +
    `2️⃣ Mint the Drill Pass — <b>1 TON</b>\n` +
    `3️⃣ Mine, level up, and withdraw from <b>500 DRILL</b> (fee 70)\n\n` +
    `<b>Token</b> — Hard cap 10,000,000,000 DRILL · Mining reserve 200,000,000\n` +
    `<b>Status</b> — Testnet live now, mainnet coming soon.`
  );
}

const HELP_TEXT =
  `<b>❓ DRILL ENGINE — Commands</b>\n\n` +
  `<b>/start</b> — Welcome card &amp; open the app\n` +
  `<b>/app</b> — Open the DRILL miner\n` +
  `<b>/balance</b> — Your DRILL balance, level &amp; mining status\n` +
  `<b>/about</b> — What DRILL is\n` +
  `<b>/channel</b> — Official Telegram channel\n` +
  `<b>/help</b> — This list\n\n` +
  `Everything happens inside the Mini App — tap <b>Open DRILL App</b> below to start mining.`;

const ABOUT_TEXT =
  `<b>⛏️ About DRILL ENGINE</b>\n\n` +
  `DRILL is a Telegram Mini App on TON. You run a virtual drilling rig that mines <b>$DRILL</b> over time. Level up your rig to mine faster.\n\n` +
  `<b>Pass</b> — Drill Pass (Soulbound, 1 per wallet): 1 TON\n` +
  `<b>Withdraw</b> — Minimum 500 DRILL, fee 70 DRILL\n` +
  `<b>Supply</b> — Hard cap 10,000,000,000 DRILL; mining emission 200,000,000, halving every 90 days\n\n` +
  `Testnet is live now. Mainnet launches after withdrawals are proven end-to-end.`;

// ---------------------------------------------------------------------------
// /balance — read-only lookup, no initData needed: the webhook itself is
// authenticated by Telegram (secret-token header, checked in the route)
// ---------------------------------------------------------------------------

async function balanceText(tgId: number): Promise<string> {
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('telegram_user_id', tgId)
    .maybeSingle();
  if (!user) {
    return (
      `<b>💰 My Balance</b>\n\n` +
      `You have no miner yet. Open the app once to create your account, then check back here.`
    );
  }

  const [accountRes, withdrawalRes] = await Promise.all([
    supabaseAdmin
      .from('mining_accounts')
      .select('balance, level, mining_speed, mining_active')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabaseAdmin
      .from('withdrawals')
      .select('amount, status, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const account = accountRes.data;
  const balance = Number(account?.balance || 0).toLocaleString('en-US', {
    maximumFractionDigits: 4,
  });
  const level = account?.level ?? 1;
  const speed = Number(account?.mining_speed || 0);
  const active = Boolean(account?.mining_active);
  const last = withdrawalRes.data;

  let text =
    `<b>💰 My Balance</b>\n\n` +
    `<b>${balance} DRILL</b>\n` +
    `Level ${level} · Speed ${speed}/min · Mining ${active ? 'active ✅' : 'paused ⏸️'}\n`;
  if (last) {
    text += `\nLast withdrawal: ${Number(last.amount).toLocaleString('en-US')} DRILL — ${escapeHtml(String(last.status))}`;
  }
  return text;
}

// ---------------------------------------------------------------------------
// Command + callback handlers
// ---------------------------------------------------------------------------

async function handleCommand(chatId: number, from: TelegramUser, rawText: string): Promise<void> {
  const command = rawText.split(' ')[0].split('@')[0].toLowerCase();
  switch (command) {
    case '/start':
      await sendPhotoCard(chatId, startCaption(from.first_name || ''), mainKeyboard());
      break;
    case '/help':
      await sendText(chatId, HELP_TEXT, helpKeyboard());
      break;
    case '/app':
      await sendText(
        chatId,
        `<b>⛏️ DRILL ENGINE</b>\n\nTap below to open the miner.`,
        mainKeyboard(),
      );
      break;
    case '/about':
      await sendText(chatId, ABOUT_TEXT, mainKeyboard());
      break;
    case '/balance': {
      const text = await balanceText(from.id);
      await sendText(chatId, text, mainKeyboard());
      break;
    }
    case '/channel':
      await sendText(
        chatId,
        `<b>📢 Official channel</b>\n\nAnnouncements, updates and mainnet news:`,
        {
          inline_keyboard: [[{ text: '📢 Open Channel', url: CHANNEL_URL }]],
        },
      );
      break;
    default:
      await sendText(
        chatId,
        `Unknown command <b>${escapeHtml(command)}</b>. Try /help for the full list.`,
        helpKeyboard(),
      );
      break;
  }
}

async function handleCallback(query: TelegramCallbackQuery): Promise<void> {
  const chatId = query.message?.chat.id;
  const messageId = query.message?.message_id;
  if (!chatId || !messageId) {
    await callTelegram('answerCallbackQuery', { callback_query_id: query.id });
    return;
  }

  // Always acknowledge first so the loading spinner clears.
  await callTelegram('answerCallbackQuery', { callback_query_id: query.id });

  // A photo message (the /start card) has a caption, not text — it must
  // be edited with editMessageCaption, or Telegram answers
  // "there is no text in the message to edit" and the button looks dead.
  const isPhoto = Boolean(query.message?.photo?.length);
  const editMethod = isPhoto ? 'editMessageCaption' : 'editMessageText';
  const textKey = isPhoto ? 'caption' : 'text';

  if (query.data === 'help') {
    await callTelegram(editMethod, {
      chat_id: chatId,
      message_id: messageId,
      [textKey]: HELP_TEXT,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      reply_markup: helpKeyboard(),
    });
  } else if (query.data === 'start') {
    await callTelegram(editMethod, {
      chat_id: chatId,
      message_id: messageId,
      [textKey]: startCaption(query.from.first_name || ''),
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      reply_markup: mainKeyboard(),
    });
  } else if (query.data === 'balance') {
    const text = await balanceText(query.from.id);
    await callTelegram(editMethod, {
      chat_id: chatId,
      message_id: messageId,
      [textKey]: text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      reply_markup: mainKeyboard(),
    });
  }
}

// ---------------------------------------------------------------------------
// Entry point (called by the webhook route after secret verification)
// ---------------------------------------------------------------------------

export async function handleTelegramUpdate(update: TelegramUpdate): Promise<void> {
  try {
    if (update.callback_query) {
      await handleCallback(update.callback_query);
      return;
    }
    const message = update.message;
    if (!message?.text || !message.from) return;
    // Only respond in private chats; group mentions are out of scope.
    if (message.chat.type && message.chat.type !== 'private') return;

    const text = message.text.trim();
    if (text.startsWith('/')) {
      await handleCommand(message.chat.id, message.from, text);
    } else {
      await sendText(
        message.chat.id,
        `Tap <b>Open DRILL App</b> to start mining, or send /help for commands.`,
        mainKeyboard(),
      );
    }
  } catch (error) {
    // Never let a handler error propagate: the route must answer 200.
    console.error('handleTelegramUpdate error:', error);
  }
}
