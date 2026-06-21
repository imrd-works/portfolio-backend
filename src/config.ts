// Runtime configuration, read from environment variables.
// In Yandex Cloud Functions these are set in the function's settings.

export const config = {
  botToken: process.env.TELEGRAM_BOT_TOKEN ?? '',
  chatId: process.env.TELEGRAM_CHAT_ID ?? '',
  // Comma-separated list of allowed origins, or "*". Trailing slashes are
  // stripped so "https://site/" matches the browser Origin "https://site".
  allowedOrigins: (process.env.ALLOWED_ORIGIN ?? '*')
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean),
  ownerEmail: (process.env.OWNER_EMAIL ?? '').trim().toLowerCase(),
  ownerTelegram: (process.env.OWNER_TELEGRAM ?? '').trim(),
} as const

export function assertConfig(): void {
  if (!config.botToken || !config.chatId) {
    throw new Error('Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID environment variables')
  }
}
