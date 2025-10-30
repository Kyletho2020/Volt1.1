import { WebSocketServer } from 'ws'
import { handleChatRequest } from './chatService.js'

export function registerChatGateway(server) {
  const wss = new WebSocketServer({ server, path: '/ws/chat' })

  wss.on('connection', (socket) => {
    socket.on('message', async (data) => {
      let payload
      try {
        payload = JSON.parse(data.toString())
      } catch (error) {
        socket.send(
          JSON.stringify({
            type: 'error',
            message: 'Invalid JSON payload',
          })
        )
        return
      }

      if (!payload || payload.type !== 'prompt') {
        socket.send(
          JSON.stringify({
            type: 'error',
            message: 'Unsupported message type',
            nonce: payload?.nonce ?? null,
          })
        )
        return
      }

      const { sessionId, message, metadata, title, nonce } = payload

      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        socket.send(
          JSON.stringify({
            type: 'error',
            message: 'Message content is required',
            nonce,
          })
        )
        return
      }

      socket.send(
        JSON.stringify({
          type: 'ack',
          sessionId: sessionId ?? null,
          nonce,
        })
      )

      try {
        const response = await handleChatRequest({
          sessionId,
          message,
          metadata,
          title,
        })
        socket.send(
          JSON.stringify({
            type: 'response',
            ...response,
            nonce,
          })
        )
      } catch (error) {
        const messageText = error instanceof Error ? error.message : 'Chat processing failed'
        socket.send(
          JSON.stringify({
            type: 'error',
            message: messageText,
            nonce,
          })
        )
      }
    })
  })

  return wss
}
