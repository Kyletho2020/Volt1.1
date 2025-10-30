import fetch from 'node-fetch'
import { env } from '../env.js'

export async function runChatCompletion(messages) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL,
      messages: messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
      temperature: 0.2,
    }),
  })

  if (!response.ok) {
    const errorPayload = await response.text()
    throw new Error(
      `OpenAI chat completion failed (${response.status} ${response.statusText}): ${errorPayload}`
    )
  }

  const data = await response.json()
  const choice = data.choices?.[0]?.message?.content ?? ''
  const usage = data.usage
    ? {
        promptTokens: data.usage.prompt_tokens ?? undefined,
        completionTokens: data.usage.completion_tokens ?? undefined,
        totalTokens: data.usage.total_tokens ?? undefined,
      }
    : undefined

  return { content: choice.trim(), usage }
}
