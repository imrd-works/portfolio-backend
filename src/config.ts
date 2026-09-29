// Runtime configuration, read from environment variables.
// In Yandex Cloud Functions these are set in the function's settings.

export const config = {
  botToken: process.env.TELEGRAM_BOT_TOKEN ?? '',
  chatId: process.env.TELEGRAM_CHAT_ID ?? '',
  // Where the Telegram Bot API is reached. api.telegram.org does not answer from Yandex
  // Cloud's Russian data centres, so it can be a relay abroad passing the calls on
  // (a Cloudflare Worker, say), which is let in only with the shared secret.
  telegramApi: (process.env.TELEGRAM_API_BASE ?? 'https://api.telegram.org').replace(/\/+$/, ''),
  relaySecret: process.env.TELEGRAM_RELAY_SECRET ?? '',
  // The letter also goes by mail, over SMTP: Yandex Mail with an app password by default.
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.yandex.ru',
    port: Number(process.env.SMTP_PORT || 465),
    user: process.env.SMTP_USER ?? '',
    pass: process.env.SMTP_PASS ?? '',
    to: process.env.MAIL_TO || process.env.SMTP_USER || '',
  },
  // Comma-separated list of allowed origins, or "*". Trailing slashes are
  // stripped so "https://site/" matches the browser Origin "https://site".
  allowedOrigins: (process.env.ALLOWED_ORIGIN ?? '*')
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean),
  ownerEmail: (process.env.OWNER_EMAIL ?? '').trim().toLowerCase(),
  ownerTelegram: (process.env.OWNER_TELEGRAM ?? '').trim(),
} as const

export const telegramReady = () => Boolean(config.botToken && config.chatId)
export const mailReady = () => Boolean(config.smtp.user && config.smtp.pass && config.smtp.to)

export function assertConfig(): void {
  if (!telegramReady() && !mailReady()) {
    throw new Error(
      'No way to deliver: set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID, or SMTP_USER and SMTP_PASS'
    )
  }
}
