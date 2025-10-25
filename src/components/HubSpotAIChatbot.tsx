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

type AssistantTool = 'search_contact' | 'get_contact' | 'create_contact' | 'update_contact'

type AssistantCommand =
  | { type: 'response'; message: string }
  | { type: 'tool'; tool: AssistantTool; message?: string; parameters?: Record<string, unknown> }

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

  const generateLocalResponse = (userMessage: string): AssistantCommand => {
    const lower = userMessage.toLowerCase()

    if (lower.includes('search') || lower.includes('find')) {
      const nameMatch = userMessage.match(/(?:search|find)\s+(?:for\s+)?(?:contact\s+)?(.+?)(?:\?|$)/i)
      if (nameMatch) {
        return {
          type: 'tool',
          tool: 'search_contact',
          message: `I'll search HubSpot for ${nameMatch[1].trim()}.`,
          parameters: { query: nameMatch[1].trim() }
        }
      }
      return { type: 'response', message: "I can search HubSpot contacts for you. Let me know the person's name." }
    }

    if (lower.includes('create') || lower.includes('add')) {
      return {
        type: 'response',
        message: 'Sure—share the contact details (name, email, phone, company) and I can add them to HubSpot.'
      }
    }

    if (lower.includes('update') || lower.includes('change')) {
      return {
        type: 'response',
        message: 'Happy to help update a contact. Tell me which contact and the fields you want changed.'
      }
    }

    return {
      type: 'response',
      message:
        "I'm here to help with HubSpot contacts—searching, viewing details, creating new records, or updating existing ones."
    }
  }

  const parseAssistantCommand = (raw: unknown): AssistantCommand | null => {
    if (!raw || typeof raw !== 'object') {
      return null
    }

    const maybeType = (raw as { type?: unknown }).type
    const maybeMessage = (raw as { message?: unknown }).message
    const maybeParameters = (raw as { parameters?: unknown }).parameters

    if (maybeType === 'tool') {
      const tool = (raw as { tool?: unknown }).tool
      if (typeof tool === 'string' && ['search_contact', 'get_contact', 'create_contact', 'update_contact'].includes(tool)) {
        return {
          type: 'tool',
          tool: tool as AssistantTool,
          message: typeof maybeMessage === 'string' ? maybeMessage : undefined,
          parameters:
            maybeParameters && typeof maybeParameters === 'object'
              ? (maybeParameters as Record<string, unknown>)
              : undefined
        }
      }
    }

    if (maybeType === 'response' && typeof maybeMessage === 'string') {
      return { type: 'response', message: maybeMessage }
    }

    if (typeof maybeMessage === 'string') {
      return { type: 'response', message: maybeMessage }
    }

    return null
  }

  const callAI = async (userMessage: string, conversationHistory: Message[]): Promise<AssistantCommand> => {
    if (!USE_OPENAI) {
      return generateLocalResponse(userMessage)
    }

    const systemPrompt = `You are an embedded HubSpot assistant inside a quoting application. Always respond with a pure JSON object matching this schema:
{
  "type": "response" | "tool",
  "message": string (optional but recommended),
  "tool": "search_contact" | "get_contact" | "create_contact" | "update_contact" (required when type is "tool"),
  "parameters": object with the inputs for the tool (optional).
}
Never include markdown or additional commentary outside of the JSON. Available actions:
- search_contact: parameters { "query": string } to find contacts by name. Use partial matching if needed.
- get_contact: parameters { "id"?: string, "email"?: string } to retrieve full details.
- create_contact: parameters may include "name", "firstName", "lastName", "email", "phone", "companyName", and address fields. Ask for missing required details before calling.
- update_contact: parameters should specify "id" or "email" along with "updates" (object of fields such as firstName, lastName, email, phone, address info). Request clarification if details are missing.
If a direct answer is more appropriate, return {"type":"response","message":"..."}.`

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
            { role: 'system', content: systemPrompt },
            ...conversationHistory.map((msg) => ({
              role: msg.role,
              content: msg.content
            })),
            {
              role: 'user',
              content: userMessage
            }
          ],
          temperature: 0.4,
          max_tokens: 700
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error?.message || 'Failed to get AI response')
      }

      const data = await response.json()
      const rawContent = data.choices?.[0]?.message?.content
      if (!rawContent) {
        return generateLocalResponse(userMessage)
      }

      try {
        const parsed = JSON.parse(rawContent)
        const command = parseAssistantCommand(parsed)
        if (command) {
          return command
        }
      } catch (err) {
        console.warn('Failed to parse AI JSON response:', err)
      }

      if (typeof rawContent === 'string') {
        return { type: 'response', message: rawContent }
      }

      return generateLocalResponse(userMessage)
    } catch (err) {
      console.error('AI API error:', err)
      return generateLocalResponse(userMessage)
    }
  }

  const formatContact = (contact: HubSpotContact): string => {
    const name = [contact.firstName, contact.lastName].filter(Boolean).join(' ') || 'Unnamed contact'
    const details = [`Name: ${name}`, `Email: ${contact.email || 'N/A'}`, `Phone: ${contact.phone || 'N/A'}`]
    if (contact.companyName) {
      details.push(`Company: ${contact.companyName}`)
    }
    if (contact.contactAddress) {
      details.push(`Address: ${contact.contactAddress}`)
    }
    return details.join('\n')
  }

  const getStringParam = (source: Record<string, unknown> | undefined, keys: string[]): string => {
    if (!source) return ''
    for (const key of keys) {
      const value = source[key]
      if (typeof value === 'string' && value.trim()) {
        return value.trim()
      }
    }
    return ''
  }

  const splitName = (value: string): { firstName?: string; lastName?: string } => {
    const parts = value.trim().split(/\s+/).filter(Boolean)
    if (parts.length === 0) {
      return {}
    }
    if (parts.length === 1) {
      return { firstName: parts[0] }
    }
    const firstName = parts.shift() ?? ''
    const lastName = parts.join(' ')
    return { firstName, lastName }
  }

  const executeSearchContact = async (query: string): Promise<string> => {
    try {
      const contacts = await HubSpotService.searchContactsByName(query, true)
      if (contacts.length === 0) {
        return `I couldn't find any contacts that match "${query}".`
      }

      if (contacts.length === 1) {
        const [contact] = contacts
        onContactSelected?.(contact)
        return `Here's what I found for "${query}":\n\n${formatContact(contact)}`
      }

      const summary = contacts
        .slice(0, 3)
        .map((contact, index) => `${index + 1}. ${formatContact(contact)}`)
        .join('\n\n')

      const additional = contacts.length > 3 ? `\n\nShowing the first 3 of ${contacts.length} matches.` : ''
      return `I found ${contacts.length} contacts that might match "${query}":\n\n${summary}${additional}\n\nLet me know which contact you'd like to load or update.`
    } catch (err) {
      console.error('Search error:', err)
      return 'I ran into an issue searching HubSpot. Please try again.'
    }
  }

  const executeGetContactDetails = async (parameters: Record<string, unknown> | undefined): Promise<string> => {
    const id = getStringParam(parameters, ['id', 'contactId'])
    const email = getStringParam(parameters, ['email'])

    if (!id && !email) {
      return 'Please share a HubSpot contact ID or email so I can look it up.'
    }

    try {
      const contact = await HubSpotService.getContactDetails({ id, email })
      if (!contact) {
        return "I couldn't find a matching contact in HubSpot."
      }
      onContactSelected?.(contact)
      return `Here are the latest details:\n\n${formatContact(contact)}`
    } catch (err) {
      console.error('Contact lookup error:', err)
      return 'I ran into an issue retrieving that contact.'
    }
  }

  const executeCreateContact = async (parameters: Record<string, unknown> | undefined): Promise<string> => {
    if (!parameters) {
      return 'Please provide the new contact\'s name and any other details, and I\'ll add them to HubSpot.'
    }

    let firstName = getStringParam(parameters, ['firstName', 'firstname'])
    let lastName = getStringParam(parameters, ['lastName', 'lastname'])
    const fullName = getStringParam(parameters, ['name', 'fullName'])

    if (fullName) {
      const parts = splitName(fullName)
      if (!firstName && parts.firstName) {
        firstName = parts.firstName
      }
      if (!lastName && parts.lastName) {
        lastName = parts.lastName
      }
    }

    if (!firstName && !lastName) {
      return 'I need at least a first or last name to create the contact.'
    }

    const payload: Record<string, unknown> = {}
    if (firstName) payload.firstName = firstName
    if (lastName) payload.lastName = lastName

    const email = getStringParam(parameters, ['email'])
    if (email) payload.email = email

    const phone = getStringParam(parameters, ['phone'])
    if (phone) payload.phone = phone

    const companyName = getStringParam(parameters, ['companyName', 'company'])
    if (companyName) payload.companyName = companyName

    const street = getStringParam(parameters, ['street', 'address', 'contactAddress'])
    if (street) payload.contactAddress1 = street

    const city = getStringParam(parameters, ['city', 'contactCity'])
    if (city) payload.contactCity = city

    const state = getStringParam(parameters, ['state', 'contactState'])
    if (state) payload.contactState = state

    const zip = getStringParam(parameters, ['zip', 'postalCode', 'contactZip'])
    if (zip) payload.contactZip = zip

    try {
      const contact = await HubSpotService.createContact(payload)
      onContactSelected?.(contact)
      return `Contact created successfully!\n\n${formatContact(contact)}`
    } catch (err) {
      console.error('Create contact error:', err)
      const message = err instanceof Error ? err.message : 'Failed to create contact.'
      return `I couldn't create that contact: ${message}`
    }
  }

  const executeUpdateContact = async (parameters: Record<string, unknown> | undefined): Promise<string> => {
    if (!parameters) {
      return 'Let me know which contact you want to update and the new details.'
    }

    const id = getStringParam(parameters, ['id', 'contactId'])
    const email = getStringParam(parameters, ['email'])

    let contactId = id
    if (!contactId && email) {
      try {
        const contact = await HubSpotService.getContactDetails({ email })
        if (!contact) {
          return `I couldn't find a contact with the email ${email}.`
        }
        contactId = contact.id
        onContactSelected?.(contact)
      } catch (err) {
        console.error('Lookup before update failed:', err)
        return 'I was unable to load that contact before updating it.'
      }
    }

    if (!contactId) {
      return 'Please provide a contact email or HubSpot ID so I know which record to update.'
    }

    const updates: Record<string, unknown> = {}
    const updatesParam = parameters.updates
    if (updatesParam && typeof updatesParam === 'object') {
      Object.assign(updates, updatesParam as Record<string, unknown>)
    }

    const inlineKeys = [
      'firstName',
      'lastName',
      'phone',
      'email',
      'address',
      'contactAddress',
      'contactAddress1',
      'city',
      'state',
      'zip',
      'contactCity',
      'contactState',
      'contactZip',
      'companyName'
    ]

    for (const key of inlineKeys) {
      if (key in updates) continue
      const value = getStringParam(parameters, [key])
      if (value) {
        updates[key] = value
      }
    }

    const street = getStringParam(parameters, ['street'])
    if (street && !('contactAddress1' in updates)) {
      updates.contactAddress1 = street
    }

    if (Object.keys(updates).length === 0) {
      return 'I need the new information you want to apply before I can update the contact.'
    }

    try {
      await HubSpotService.updateContact(contactId, updates)
      const updated = await HubSpotService.getContactDetails({ id: contactId }).catch(() => null)
      if (updated) {
        onContactSelected?.(updated)
        return `Contact updated successfully.\n\n${formatContact(updated)}`
      }
      return 'Contact updated successfully.'
    } catch (err) {
      console.error('Update contact error:', err)
      const message = err instanceof Error ? err.message : 'Failed to update contact.'
      return `I wasn't able to update that contact: ${message}`
    }
  }

  const handleAssistantCommand = async (command: AssistantCommand): Promise<string> => {
    if (command.type === 'response') {
      return command.message || "I'm here to help with HubSpot contacts."
    }

    const prefix = command.message ? `${command.message.trim()}\n\n` : ''
    const parameters = command.parameters

    try {
      switch (command.tool) {
        case 'search_contact': {
          const query = getStringParam(parameters, ['query', 'name', 'contact'])
          if (!query) {
            return `${prefix}I need a name to search for in HubSpot.`
          }
          const result = await executeSearchContact(query)
          return `${prefix}${result}`.trim()
        }
        case 'get_contact': {
          const result = await executeGetContactDetails(parameters)
          return `${prefix}${result}`.trim()
        }
        case 'create_contact': {
          const result = await executeCreateContact(parameters)
          return `${prefix}${result}`.trim()
        }
        case 'update_contact': {
          const result = await executeUpdateContact(parameters)
          return `${prefix}${result}`.trim()
        }
        default:
          return `${prefix}I don't have a way to handle that action yet.`.trim()
      }
    } catch (err) {
      console.error('Assistant command error:', err)
      return `${prefix}Something went wrong while completing that HubSpot task.`.trim()
    }
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
      const assistantCommand = await callAI(trimmedInput, previousMessages)
      const resolvedResponse = await handleAssistantCommand(assistantCommand)

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
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
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
        className="rounded-full bg-accent p-4 text-slate-950 shadow-lg hover:bg-emerald-400 hover:text-slate-900 transition duration-300 hover:scale-110"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    </div>
  )
}

export default HubSpotAIChatbot
