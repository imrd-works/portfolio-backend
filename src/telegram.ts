import { config } from './config.js'
import type { CleanPayload } from './validation.js'

// Escape the five characters that are special in Telegram's HTML parse mode.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export function formatMessage(payload: CleanPayload): string {
  const name = escapeHtml(payload.name)
  const contact = escapeHtml(payload.contact)
  const message = escapeHtml(payload.message)

  return [
    '🔔 <b>New portfolio request</b>',
    '',
    `👤 <b>Name:</b> ${name}`,
    `✉️ <b>Contact:</b> ${contact}`,
    '📝 <b>Message:</b>',
    message,
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
