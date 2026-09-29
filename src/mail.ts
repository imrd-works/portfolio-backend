import nodemailer from 'nodemailer'
import { config } from './config.js'
import { isEmail, type CleanPayload } from './validation.js'

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** The letter as mail: answering it replies straight to the visitor when they left an address. */
export function formatMail(payload: CleanPayload) {
  const lines = [`Имя: ${payload.name}`, `Контакт: ${payload.contact}`, '', payload.message]
  return {
    subject: `Письмо с портфолио — ${payload.name}`,
    text: lines.join('\n'),
    html: [
      '<p><b>Новое письмо с портфолио</b></p>',
      `<p><b>Имя:</b> ${escapeHtml(payload.name)}<br>`,
      `<b>Контакт:</b> ${escapeHtml(payload.contact)}</p>`,
      `<p style="white-space:pre-wrap">${escapeHtml(payload.message)}</p>`,
    ].join(''),
    replyTo: isEmail(payload.contact) ? payload.contact : undefined,
  }
}

let transport: nodemailer.Transporter | null = null

export async function sendMail(payload: CleanPayload): Promise<void> {
  transport ??= nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.port === 465,
    auth: { user: config.smtp.user, pass: config.smtp.pass },
    // within the function's 10 s, with the Telegram attempt running alongside
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 7000,
  })
  await transport.sendMail({
    from: { name: 'Портфолио', address: config.smtp.user },
    to: config.smtp.to,
    ...formatMail(payload),
  })
}
