import { Router } from 'express'
import {
  getSessionMessages,
  handleChatRequest,
  listSessions,
} from '../services/chatService.js'

const router = Router()

router.get('/sessions', async (_req, res, next) => {
  try {
    const sessions = await listSessions()
    res.json({ sessions })
  } catch (error) {
    next(error)
  }
})

router.get('/sessions/:id', async (req, res, next) => {
  try {
    const messages = await getSessionMessages(req.params.id)
    res.json({ sessionId: req.params.id, messages })
  } catch (error) {
    next(error)
  }
})

router.post('/sessions', async (req, res, next) => {
  try {
    const { sessionId, message, metadata, title } = req.body ?? {}
    const metadataRecord =
      metadata && typeof metadata === 'object' ? metadata : undefined
    const response = await handleChatRequest({
      sessionId,
      message,
      metadata: metadataRecord,
      title,
    })
    res.json(response)
  } catch (error) {
    next(error)
  }
})

export default router
