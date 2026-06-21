// Entry point for Yandex Cloud Functions.
// Function settings: runtime nodejs18 (or newer), entrypoint "index.handler".
import app from './app.js'
import { handleYandexEvent, type YandexHttpEvent, type YandexHttpResponse } from './yandex.js'

export async function handler(event: YandexHttpEvent): Promise<YandexHttpResponse> {
  return handleYandexEvent(app, event)
}
