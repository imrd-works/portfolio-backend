// Local development server — runs the same Hono app over plain HTTP so you can
// test against http://localhost:3000 before deploying to Yandex Cloud Functions.
import { serve } from '@hono/node-server'
import app from './app.js'

const port = Number(process.env.PORT ?? 3000)

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`portfolio-backend listening on http://localhost:${info.port}`)
})
