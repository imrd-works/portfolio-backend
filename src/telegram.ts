import { config } from './config.js'
import { isEmail, toTelegramHandle, type CleanPayload } from './validation.js'

// Escape the characters that are special in Telegram's HTML parse mode (outside
// attributes these three are all of them).
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/** The contact as a link to answer with in one tap: a mail, or a Telegram chat. */
function contactLink(contact: string): string {
  if (isEmail(contact)) return `<a href="mailto:${escapeHtml(contact)}">${escapeHtml(contact)}</a>`
  const handle = toTelegramHandle(contact)
  return `<a href="https://t.me/${escapeHtml(handle)}">@${escapeHtml(handle)}</a>`
}

export function formatMessage(payload: CleanPayload): string {
  return [
    '🔔 <b>Новое письмо с портфолио</b>',
    '',
    `👤 <b>Имя:</b> ${escapeHtml(payload.name)}`,
    `✉️ <b>Контакт:</b> ${contactLink(payload.contact)}`,
    '',
    escapeHtml(payload.message),
  ].join('\n')
}

export async function sendTelegramMessage(text: string): Promise<void> {
  const url = `https://api.telegram.org/bot${config.botToken}/sendMessage`

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 7000)

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: config.chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      const detail = await response.text().catch(() => '')
      throw new Error(`Telegram API error ${response.status}: ${detail}`)
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(
        'Telegram request timed out — the function likely has no internet egress (check its network / NAT settings)'
      )
    }
    throw error
  } finally {
    clearTimeout(timer)
  }
}
