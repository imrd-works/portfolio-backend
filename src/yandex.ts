import type { Hono } from 'hono'

// Shape of the event Yandex Cloud Functions passes for an HTTP invocation
// (public function URL or behind API Gateway). Modeled on the AWS proxy format.
export interface YandexHttpEvent {
  httpMethod?: string
  headers?: Record<string, string>
  queryStringParameters?: Record<string, string> | null
  body?: string
  isBase64Encoded?: boolean
  requestContext?: {
    http?: { path?: string }
  }
  path?: string
}

export interface YandexHttpResponse {
  statusCode: number
  headers: Record<string, string>
  body: string
  isBase64Encoded: boolean
}

function resolvePath(event: YandexHttpEvent): string {
  return event.requestContext?.http?.path ?? event.path ?? '/'
}

function buildRequest(event: YandexHttpEvent): Request {
  const method = (event.httpMethod ?? 'GET').toUpperCase()
  const path = resolvePath(event)

  const params = event.queryStringParameters ?? undefined
  const query = params ? new URLSearchParams(params).toString() : ''
  const url = `https://function.invoke${path}${query ? `?${query}` : ''}`

  const headers = new Headers()
  for (const [key, value] of Object.entries(event.headers ?? {})) {
    if (value != null) headers.set(key, String(value))
  }

  let requestBody: Buffer | undefined
  if (event.body != null && method !== 'GET' && method !== 'HEAD') {
    requestBody = event.isBase64Encoded
      ? Buffer.from(event.body, 'base64')
      : Buffer.from(event.body, 'utf-8')
  }

  return new Request(url, { method, headers, body: requestBody })
}

// Run a Hono app against a Yandex Cloud Functions event and return the
// proxy-format response the runtime expects.
export async function handleYandexEvent(
  app: Hono,
  event: YandexHttpEvent
): Promise<YandexHttpResponse> {
  const response = await app.fetch(buildRequest(event))

  const headers: Record<string, string> = {}
  response.headers.forEach((value, key) => {
    headers[key] = value
  })

  const buffer = Buffer.from(await response.arrayBuffer())

  return {
    statusCode: response.status,
    headers,
    // Always base64 — safe for both text and binary payloads.
    body: buffer.toString('base64'),
    isBase64Encoded: true,
  }
}
