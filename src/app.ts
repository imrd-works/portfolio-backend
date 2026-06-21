import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { config } from './config.js'
import { validateContact } from './validation.js'
import { formatMessage, sendTelegramMessage } from './telegram.js'
import type { Context } from 'hono'

const app = new Hono()

const allowAnyOrigin = config.allowedOrigins.includes('*')

app.use(
  '*',
  cors({
    origin: (origin) => {
      if (allowAnyOrigin) return origin || '*'
      return config.allowedOrigins.includes(origin) ? origin : null
    },
    allowMethods: ['POST', 'OPTIONS'],
    allowHeaders: ['Content-Type'],
    maxAge: 86400,
  })
)

// Health check.
app.get('/', (c) => c.json({ ok: true, service: 'portfolio-backend' }))

async function handleContact(c: Context) {
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ ok: false, error: 'INVALID_JSON' }, 400)
  }

  // Honeypot: real users never fill the hidden "company" field. Pretend success
  // so bots don't learn they've been filtered.
  const company = (body as Record<string, unknown>)?.company
  if (typeof company === 'string' && company.trim() !== '') {
    return c.json({ ok: true })
  }

  const { valid, errors, value } = validateContact(body)
  if (!valid) {
    return c.json({ ok: false, errors }, 422)
  }

  try {
    await sendTelegramMessage(formatMessage(value))
  } catch (error) {
    console.error('[contact] failed to deliver:', error)
    return c.json({ ok: false, error: 'DELIVERY_FAILED' }, 502)
  }

  return c.json({ ok: true })
}

// "/contact" works behind an API Gateway; "/" covers a direct function URL.
app.post('/contact', handleContact)
app.post('/', handleContact)

export default app
