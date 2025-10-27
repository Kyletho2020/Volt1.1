import React, { useEffect, useMemo, useRef, useState } from 'react'
import { AlertCircle, Loader, MessageCircle, Send, X, Zap } from 'lucide-react'
import { HubSpotContact, HubSpotService } from '../services/hubspotService'
import { useApiKey } from '../hooks/useApiKey'

type ChatMessageRole = 'user' | 'assistant'

interface Message {
  id: string
  role: ChatMessageRole
  content: string
  timestamp: Date
}

interface HubSpotAIChatbotProps {
  onContactSelected?: (contact: HubSpotContact) => void
  sessionId: string
}

const HubSpotAIChatbot: React.FC<HubSpotAIChatbotProps> = ({ onContactSelected, sessionId }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: 'Hi! I am your HubSpot AI Assistant. Ask me to search contacts, get details, create or update contact information. What would you like to do?',
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const { hasApiKey } = useApiKey()
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

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

  const callHubSpotAI = async (
    userMessage: string,
    conversationHistory: Message[]
  ): Promise<string> => {
    try {
      if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        return 'System error: Supabase not configured. Please check your environment variables.'
      }

      if (!sessionId) {
        return 'Session not ready. Please try again.'
      }

      if (!hasApiKey) {
        return 'API key not configured. Please set up your OpenAI API key first.'
      }

      // Call the Supabase edge function for HubSpot AI
      const simplifiedHistory = conversationHistory.slice(-5).map(({ role, content }) => ({
        role,
        content
      }))

      const response = await fetch(`${SUPABASE_URL}/functions/v1/hubspot-chat-ai`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.trim(),
          sessionId: sessionId,
          conversationHistory: simplifiedHistory
        }),
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Network error')
        console.error('AI function error:', errorText)
        try {
          const errorData = JSON.parse(errorText)
          throw new Error(errorData.error || `HTTP ${response.status}`)
        } catch {
          throw new Error(errorText || `HTTP ${response.status}: ${response.statusText}`)
        }
      }

      const result = await response.json()
      console.log('AI response:', result)

      if (!result.success) {
        throw new Error(result.error || 'AI request failed')
      }

      return result.response || 'No response received'
    } catch (err) {
      console.error('Chat error:', err)
      const errorMsg = err instanceof Error ? err.message : 'An error occurred'
      throw new Error(errorMsg)
    }
  }

  const handleSearchContact = async (name: string): Promise<void> => {
    try {
      setIsLoading(true)
      const contacts = await HubSpotService.searchContactsByName(name, true)

      if (contacts.length === 0) {
        const msg: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `I could not find any contacts named "${name}". Try searching with a different name or part of the name.`,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, msg])
        return
      }

      if (contacts.length === 1) {
        const contact = contacts[0]
        onContactSelected?.(contact)
        const details = [contact.firstName, contact.lastName].filter(Boolean).join(' ')
        const msg: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `Found contact: ${details}\nEmail: ${contact.email || 'N/A'}\nPhone: ${contact.phone || 'N/A'}${contact.companyName ? `\nCompany: ${contact.companyName}` : ''}`,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, msg])
        return
      }

      const list = contacts
        .slice(0, 5)
        .map((c, i) => `${i + 1}. ${[c.firstName, c.lastName].filter(Boolean).join(' ')} (${c.email || 'no email'})`)
        .join('\n')

      const msg: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Found ${contacts.length} contacts:\n${list}${contacts.length > 5 ? `\n\nShowing first 5. Which one would you like?` : ''}`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, msg])
    } catch (err) {
      console.error('Search error:', err)
      const msg: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Error searching contacts: ${err instanceof Error ? err.message : 'Unknown error'}`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, msg])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    setError(null)
    const userMessage = input.trim()
    setInput('')

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    }
    const nextMessages = [...messages, userMsg]
    setMessages(nextMessages)
    setIsLoading(true)

    try {
      const lowerMsg = userMessage.toLowerCase()

      if (lowerMsg.includes('search') || lowerMsg.includes('find')) {
        const match = userMessage.match(/(?:search|find)\s+(?:for\s+)?(.+?)(?:\?|$)/i)
        if (match) {
          await handleSearchContact(match[1].trim())
          return
        }
      }

      const aiResponse = await callHubSpotAI(userMessage, nextMessages)

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, assistantMsg])
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMsg)
      const errMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${errorMsg}`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div ref={containerRef} className="fixed bottom-4 right-4 z-50">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105"
          title="Open HubSpot AI Assistant"
        >
          <Zap size={20} />
          <span className="font-semibold">HubSpot AI</span>
        </button>
      ) : (
        <div className="flex flex-col h-96 w-96 bg-white rounded-lg shadow-2xl border border-gray-200">
          <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 rounded-t-lg">
            <div className="flex items-center gap-2">
              <MessageCircle size={20} />
              <span className="font-semibold">HubSpot AI</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-blue-800 p-1 rounded">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg whitespace-pre-wrap text-sm ${
                    msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-200 text-gray-900 rounded-bl-none'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-200 text-gray-900 px-3 py-2 rounded-lg flex items-center gap-2">
                  <Loader size={16} className="animate-spin" />
                  <span className="text-sm">Processing...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {error && (
            <div className="px-4 py-2 bg-red-50 border-t border-red-200 flex items-start gap-2">
              <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="border-t border-gray-200 p-3 bg-white rounded-b-lg">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything..."
                disabled={isLoading}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-gray-100"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                <Send size={18} />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default HubSpotAIChatbot
