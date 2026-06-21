// Server-side validation — mirrors the rules used on the frontend so a crafted
// request can't bypass the browser checks. Never trust the client.
import { config } from './config.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// Telegram username: 5–32 chars, starts with a letter, letters/digits/underscore.
const TELEGRAM_RE = /^[a-zA-Z][a-zA-Z0-9_]{4,31}$/
// Letters (any language), spaces and hyphens.
const NAME_RE = /^[\p{L}\s-]+$/u

const MAX_NAME = 80
const MAX_CONTACT = 120
const MAX_MESSAGE = 4000

export interface CleanPayload {
  name: string
  contact: string
  message: string
}

export type FieldErrors = Partial<Record<keyof CleanPayload, string>>

export interface ValidationResult {
  valid: boolean
  errors: FieldErrors
  value: CleanPayload
}

function toTelegramHandle(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^(?:https?:\/\/)?t\.me\//i, '')
    .replace(/^@/, '')
}

function isEmailOrTelegram(value: string): boolean {
  if (EMAIL_RE.test(value)) return true
  return TELEGRAM_RE.test(toTelegramHandle(value))
}

// Reject pasting the site owner's own contacts.
function isOwnContact(value: string): boolean {
  const normalized = value.trim().toLowerCase()
  if (config.ownerEmail && normalized === config.ownerEmail) return true
  if (config.ownerTelegram && toTelegramHandle(value) === toTelegramHandle(config.ownerTelegram)) {
    return true
  }
  return false
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

export function validateContact(input: unknown): ValidationResult {
  const data = (input ?? {}) as Record<string, unknown>
  const name = asString(data.name).trim()
  const contact = asString(data.contact).trim()
  const message = asString(data.message).trim()

  const errors: FieldErrors = {}

  if (name.length < 3 || name.length > MAX_NAME || !NAME_RE.test(name)) {
    errors.name = 'errorName'
  }

  if (contact.length === 0 || contact.length > MAX_CONTACT) {
    errors.contact = 'errorContact'
  } else if (!isEmailOrTelegram(contact)) {
    errors.contact = 'errorContact'
  } else if (isOwnContact(contact)) {
    errors.contact = 'errorContactOwn'
  }

  if (message.length === 0 || message.length > MAX_MESSAGE) {
    errors.message = 'errorAbout'
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    value: { name, contact, message },
  }
}
