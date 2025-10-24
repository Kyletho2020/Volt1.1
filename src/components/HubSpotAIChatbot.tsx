import React, { useEffect, useMemo, useRef, useState } from 'react'
import { AlertCircle, Loader, MessageCircle, Send, X, Zap } from 'lucide-react'
import { HubSpotContact, HubSpotService } from '../services/hubspotService'

type ChatMessageRole = 'user' | 'assistant'

interface Message {
  id: string
  role: ChatMessageRole
  content: string
  timestamp: Date
}

interface HubSpotAIChatbotProps {
  onContactSelected?: (contact: HubSpotContact) => void
}

const HubSpotAIChatbot: React.FC<HubSpotAIChatbotProps> = ({ onContactSelected }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content:
        "Hi! I'm your HubSpot Assistant. I can help you search contacts, update information, create deals, manage companies, and more. What can I help you with today?",
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY
  const USE_OPENAI = useMemo(() => Boolean(OPENAI_API_KEY), [OPENAI_API_KEY])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }

    return undefined
  }, [isOpen])

  const generateLocalResponse = (userMessage: string): string => {
    const lower = userMessage.toLowerCase()

    if (lower.includes('search') || lower.includes('find')) {
      const nameMatch = userMessage.match(/(?:search|find)\s+(?:for\s+)?(?:contact\s+)?(.+?)(?:\?|$)/i)
      if (nameMatch) {
        return `I'll search for ${nameMatch[1]} in HubSpot. Let me find that contact for you...`
      }
    }

    if (lower.includes('create') || lower.includes('add')) {
      return 'I can help you create a new contact or deal. What information would you like to add?'
    }

    if (lower.includes('update') || lower.includes('change')) {
      return 'I can update contact information for you. Which contact would you like to modify?'
    }

    if (lower.includes('deal')) {
      return 'I can help you manage deals. Would you like to create a new deal or update an existing one?'
    }

    if (lower.includes('company')) {
      return 'I can help with company information. What would you like to do?'
    }

    if (lower.includes('task') || lower.includes('activity')) {
      return 'I can create tasks and activities for you. What would you like to schedule?'
    }

    return `I understand you're asking about ${userMessage.substring(0, 30)}... I can help with contacts, deals, companies, and more. Be specific, and I'll assist!`
  }

  const callAI = async (userMessage: string, conversationHistory: Message[]): Promise<string> => {
    if (!USE_OPENAI) {
      return generateLocalResponse(userMessage)
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are a helpful HubSpot Assistant. You can help users with:
- Searching for contacts (respond with JSON: {"action": "search_contact", "name": "full name"})
- Getting contact details
- Managing deals and companies
- Creating tasks and activities
- Updating contact information
Always be friendly and professional. If the user asks about a contact, respond with the JSON format above and the assistant will search it.
Current HubSpot capabilities available to user.`
            },
            ...conversationHistory.map((msg) => ({
              role: msg.role,
              content: msg.content
            })),
            {
              role: 'user',
              content: userMessage
            }
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error?.message || 'Failed to get AI response')
      }

      const data = await response.json()
      return data.choices?.[0]?.message?.content || 'Sorry, I could not understand that.'
    } catch (err) {
      console.error('AI API error:', err)
      return generateLocalResponse(userMessage)
    }
  }

  const handleSearchContact = async (contactName: string) => {
    try {
      const contacts = await HubSpotService.searchContactsByName(contactName, true)
      if (contacts.length > 0) {
        const contact = contacts[0]
        const contactInfo = `Found: ${contact.firstName} ${contact.lastName}\nEmail: ${contact.email || 'N/A'}\nPhone: ${contact.phone || 'N/A'}\nCompany: ${contact.companyName || 'N/A'}`

        onContactSelected?.(contact)
        return contactInfo
      }
      return `No contacts found for "${contactName}". Try searching with a different name.`
    } catch (err) {
      console.error('Search error:', err)
      return 'Failed to search HubSpot. Please try again.'
    }
  }

  const parseAICommand = async (aiResponse: string, userMessage: string) => {
    try {
      const parsed = JSON.parse(aiResponse) as { action?: string; name?: string }
      if (parsed.action === 'search_contact' && parsed.name) {
        return handleSearchContact(parsed.name)
      }
    } catch {
      const lower = aiResponse.toLowerCase()
      if (lower.includes('search') || lower.includes('find')) {
        const nameMatch = userMessage.match(/(?:search|find)\s+(?:for\s+)?(?:contact\s+)?(.+?)(?:\?|$)/i)
        if (nameMatch) {
          return handleSearchContact(nameMatch[1])
        }
      }
    }

    return aiResponse
  }

  const handleSendMessage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedInput = input.trim()
    if (!trimmedInput || isLoading) {
      return
    }

    setError(null)

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmedInput,
      timestamp: new Date()
    }

    const previousMessages = messages
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const aiResponse = await callAI(trimmedInput, previousMessages)
      const resolvedResponse = await parseAICommand(aiResponse, trimmedInput)

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: resolvedResponse,
        timestamp: new Date()
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      console.error('Chat error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div ref={containerRef} className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
      {isOpen && (
        <div className="w-96 max-h-96 rounded-2xl border border-accent/20 bg-surface shadow-[0_28px_60px_rgba(10,18,35,0.5)] backdrop-blur-xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center justify-between gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-3">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-white" />
              <h3 className="font-semibold text-white">HubSpot AI Assistant</h3>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1 hover:bg-emerald-700 transition"
            >
              <X className="h-4 w-4 text-white" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 p-3">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`rounded-lg px-3 py-2 text-sm max-w-xs ${
                    msg.role === 'user'
                      ? 'bg-accent text-white'
                      : 'bg-surface-highlight text-foreground border border-accent/20'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="rounded-lg px-3 py-2 bg-surface-highlight border border-accent/20 flex items-center gap-2">
                  <Loader className="h-4 w-4 animate-spin text-accent" />
                  <span className="text-xs text-slate-400">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {error && (
            <div className="mx-3 mt-2 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-500">{error}</p>
            </div>
          )}

          <form onSubmit={handleSendMessage} className="border-t border-accent/10 p-3 space-y-2">
            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about contacts, deals..."
              disabled={isLoading}
              className="w-full rounded-lg border border-accent/20 bg-surface-dark px-3 py-2 text-sm text-white placeholder-slate-400 focus:border-accent focus:ring-2 focus:ring-accent/40 focus:outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-black transition hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4" />
              Send
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="rounded-full bg-accent p-4 text-black shadow-lg hover:bg-emerald-400 transition duration-300 hover:scale-110"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    </div>
  )
}

export default HubSpotAIChatbot
