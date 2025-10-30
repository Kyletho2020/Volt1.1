import express from 'express'
import { createServer } from 'http'
import { env } from './env.js'
import chatRoutes from './routes/chatRoutes.js'
import hubspotRoutes from './routes/hubspotRoutes.js'
import crmRoutes from './routes/crmRoutes.js'
import { registerChatGateway } from './services/chatGateway.js'

const app = express()

app.use(express.json({ limit: '2mb' }))

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/chat', chatRoutes)
app.use('/api/hubspot', hubspotRoutes)
app.use('/api/crm', crmRoutes)

app.use(
  // eslint-disable-next-line no-unused-vars
  (err, _req, res, _next) => {
    console.error(err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    res.status(500).json({ error: message })
  }
)

const server = createServer(app)

registerChatGateway(server)

if (env.NODE_ENV !== 'test') {
  server.listen(env.PORT, () => {
    console.log(`Service listening on port ${env.PORT}`)
  })
}

export { server }
export default app
