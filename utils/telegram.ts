import crypto from 'crypto';

export function validateTelegramWebAppData(telegramInitData: string, botToken: string): boolean {
  const initData = new URLSearchParams(telegramInitData);
  const hash = initData.get('hash');
  
  if (!hash) return false;

  initData.delete('hash');
  
  const keys = Array.from(initData.keys());
  keys.sort();

  const dataCheckString = keys.map(key => `${key}=${initData.get(key)}`).join('\n');
  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  return calculatedHash === hash;
}
