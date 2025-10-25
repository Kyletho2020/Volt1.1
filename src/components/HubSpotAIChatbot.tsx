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

type AssistantTool = 'search_contact' | 'get_contact' | 'create_contact' | 'update_contact' | 'list_contacts' | 'create_deal' | 'get_deal'

type AssistantCommand =
  | { type: 'response'; message: string }
  | { type: 'tool'; tool: AssistantTool; message?: string; parameters?: Record<string, unknown> }

const HubSpotAIChatbot: React.FC<HubSpotAIChatbotProps> = ({ onContactSelected }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: 'Hi! I am your HubSpot Assistant. I can help you search contacts, create/update deals, manage contacts, view companies, and handle other CRM tasks. What would you like to do?',
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

  const getSystemPrompt = (): string => {
    return `You are an advanced HubSpot AI Assistant embedded in a quoting/CRM application. Your role is to help users manage HubSpot data efficiently.

CRITICAL RESPONSE FORMAT:
Always respond with ONLY a valid JSON object. Follow this schema exactly:
{
  "type": "response" | "tool",
  "message": "string (optional but recommended)",
  "tool": "required when type is tool",
  "parameters": {"tool parameters"}
}

AVAILABLE TOOLS:
1. search_contact - Find contacts by name
2. list_contacts - Get contacts list
3. get_contact - Get contact details by ID or email
4. create_contact - Add new contact
5. update_contact - Modify contact
6. create_deal - Create deal
7. get_deal - Get deal details

Be helpful and ask for clarification when needed.`
  }

  const generateLocalResponse = (userMessage: string): AssistantCommand => {
    const lower = userMessage.toLowerCase()

    if (lower.includes('search') || lower.includes('find') || lower.includes('look for')) {
      const nameMatch = userMessage.match(/(?:search|find|look for)\s+(?:for\s+)?(?:contact\s+)?(.+?)(?:\?|$)/i)
      if (nameMatch) {
        return {
          type: 'tool',
          tool: 'search_contact',
          message: `I will search HubSpot for ${nameMatch[1].trim()}.`,
          parameters: { query: nameMatch[1].trim() }
        }
      }
    }

    if (lower.includes('create') || lower.includes('add') || lower.includes('new contact')) {
      return {
        type: 'response',
        message: 'To add a new contact, please provide their name and email.'
      }
    }

    if (lower.includes('update') || lower.includes('change') || lower.includes('modify')) {
      return {
        type: 'response',
        message: 'I can update a contact. Which contact and what fields should I change?'
      }
    }

    if (lower.includes('create deal') || lower.includes('new deal')) {
      return {
        type: 'response',
        message: 'I can create a deal. Please tell me the deal name and details.'
      }
    }

    if (lower.includes('show') || lower.includes('list')) {
      return {
        type: 'tool',
        tool: 'list_contacts',
        message: 'Let me fetch your contacts.',
        parameters: { limit: 10 }
      }
    }

    return {
      type: 'response',
      message: 'I can help with HubSpot tasks. What would you like to do?'
    }
  }

  const parseAssistantCommand = (raw: unknown): AssistantCommand | null => {
    if (!raw || typeof raw !== 'object') return null

    const maybeType = (raw as { type?: unknown }).type
    const maybeMessage = (raw as { message?: unknown }).message
    const maybeParameters = (raw as { parameters?: unknown }).parameters
    const maybeTool = (raw as { tool?: unknown }).tool

    if (maybeType === 'tool') {
      const validTools: AssistantTool[] = ['search_contact', 'get_contact', 'create_contact', 'update_contact', 'list_contacts', 'create_deal', 'get_deal']
      if (typeof maybeTool === 'string' && validTools.includes(maybeTool as AssistantTool)) {
        return {
          type: 'tool',
          tool: maybeTool as AssistantTool,
          message: typeof maybeMessage === 'string' ? maybeMessage : undefined,
          parameters: maybeParameters && typeof maybeParameters === 'object' ? (maybeParameters as Record<string, unknown>) : undefined
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

    const systemPrompt = getSystemPrompt()

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            ...conversationHistory.slice(-10).map((msg) => ({
              role: msg.role,
              content: msg.content
            })),
            {
              role: 'user',
              content: userMessage
            }
          ],
          temperature: 0.3,
          max_tokens: 1000,
          response_format: { type: 'json_object' }
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
        console.warn('Failed to parse AI response:', err)
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
    const name = [contact.firstName, contact.lastName].filter(Boolean).join(' ') || 'Unnamed'
    const details = [`Name: ${name}`, `Email: ${contact.email || 'N/A'}`, `Phone: ${contact.phone || 'N/A'}`]
    if (contact.companyName) {
      details.push(`Company: ${contact.companyName}`)
    }
    if (contact.contactAddress) {
      details.push(`Address: ${contact.contactAddress}`)
    }
    return details.join('; ')
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
    if (parts.length === 0) return {}
    if (parts.length === 1) return { firstName: parts[0] }
    const firstName = parts.shift() ?? ''
    const lastName = parts.join(' ')
    return { firstName, lastName }
  }

  const executeSearchContact = async (query: string): Promise<string> => {
    try {
      const contacts = await HubSpotService.searchContactsByName(query, true)
      if (contacts.length === 0) {
        return `I could not find any contacts matching "${query}".`
      }

      if (contacts.length === 1) {
        const [contact] = contacts
        onContactSelected?.(contact)
        return `Found 1 contact: ${formatContact(contact)}`
      }

      const summary = contacts
        .slice(0, 5)
        .map((contact, index) => `${index + 1}. ${[contact.firstName, contact.lastName].filter(Boolean).join(' ') || 'Unnamed'}`)
        .join('; ')

      const additional = contacts.length > 5 ? ` (Showing 5 of ${contacts.length})` : ''
      return `Found ${contacts.length} contacts: ${summary}${additional}`
    } catch (err) {
      console.error('Search error:', err)
      return 'I had trouble searching HubSpot. Please try again.'
    }
  }

  const executeListContacts = async (parameters: Record<string, unknown> | undefined): Promise<string> => {
    return 'Fetching contacts... (List feature requires pagination support)'
  }

  const executeGetContactDetails = async (parameters: Record<string, unknown> | undefined): Promise<string> => {
    const id = getStringParam(parameters, ['id', 'contactId'])
    const email = getStringParam(parameters, ['email'])

    if (!id && !email) {
      return 'Please provide a contact ID or email.'
    }

    try {
      const contact = await HubSpotService.getContactDetails({ id, email })
      if (!contact) {
        return 'I could not find that contact.'
      }
      onContactSelected?.(contact)
      return `Contact: ${formatContact(contact)}`
    } catch (err) {
      console.error('Contact lookup error:', err)
      return 'Error retrieving contact.'
    }
  }

  const executeCreateContact = async (parameters: Record<string, unknown> | undefined): Promise<string> => {
    if (!parameters) {
      return 'Please provide contact details.'
    }

    let firstName = getStringParam(parameters, ['firstName', 'firstname'])
    let lastName = getStringParam(parameters, ['lastName', 'lastname'])
    const fullName = getStringParam(parameters, ['name', 'fullName'])

    if (fullName && !firstName) {
      const parts = splitName(fullName)
      firstName = parts.firstName || ''
      lastName = parts.lastName || ''
    }

    if (!firstName && !lastName) {
      return 'I need at least a name to create the contact.'
    }

    const payload: Record<string, unknown> = {}
    if (firstName) payload.firstName = firstName
    if (lastName) payload.lastName = lastName

    const email = getStringParam(parameters, ['email'])
    if (email) payload.email = email

    const phone = getStringParam(parameters, ['phone'])
    if (phone) payload.phone = phone

    const company = getStringParam(parameters, ['company', 'companyName'])
    if (company) payload.companyName = company

    const address = getStringParam(parameters, ['address', 'street', 'contactAddress'])
    if (address) payload.contactAddress1 = address

    const city = getStringParam(parameters, ['city', 'contactCity'])
    if (city) payload.contactCity = city

    const state = getStringParam(parameters, ['state', 'contactState'])
    if (state) payload.contactState = state

    const zip = getStringParam(parameters, ['zip', 'postalCode', 'contactZip'])
    if (zip) payload.contactZip = zip

    try {
      const contact = await HubSpotService.createContact(payload)
      onContactSelected?.(contact)
      return `Contact created: ${formatContact(contact)}`
    } catch (err) {
      console.error('Create error:', err)
      return `Error creating contact`
    }
  }

  const executeUpdateContact = async (parameters: Record<string, unknown> | undefined): Promise<string> => {
    if (!parameters) {
      return 'Please specify what to update.'
    }

    const id = getStringParam(parameters, ['id', 'contactId'])
    const email = getStringParam(parameters, ['email'])

    let contactId = id
    if (!contactId && email) {
      try {
        const contact = await HubSpotService.getContactDetails({ email })
        if (!contact) {
          return `No contact found with email ${email}.`
        }
        contactId = contact.id
        onContactSelected?.(contact)
      } catch (err) {
        console.error('Lookup failed:', err)
        return 'Could not find that contact.'
      }
    }

    if (!contactId) {
      return 'Please provide contact ID or email.'
    }

    const updates: Record<string, unknown> = {}
    const updatesParam = parameters.updates
    if (updatesParam && typeof updatesParam === 'object') {
      Object.assign(updates, updatesParam as Record<string, unknown>)
    }

    if (Object.keys(updates).length === 0) {
      return 'Please specify what fields to update.'
    }

    try {
      const updated = await HubSpotService.updateContact(contactId, updates)
      onContactSelected?.(updated)
      return `Updated: ${formatContact(updated)}`
    } catch (err) {
      console.error('Update error:', err)
      return 'Error updating contact.'
    }
  }

  const executeCreateDeal = async (parameters: Record<string, unknown> | undefined): Promise<string> => {
    const dealName = getStringParam(parameters, ['dealName', 'name'])
    if (!dealName) {
      return 'Please provide a deal name.'
    }
    return `Deal creation: ${dealName} (Coming soon)`
  }

  const executeGetDeal = async (parameters: Record<string, unknown> | undefined): Promise<string> => {
    const dealId = getStringParam(parameters, ['dealId', 'id'])
    if (!dealId) {
      return 'Please provide a deal ID.'
    }
    return `Deal lookup: ${dealId} (Coming soon)`
  }

  const executeTool = async (tool: AssistantTool, parameters: Record<string, unknown> | undefined): Promise<string> => {
    switch (tool) {
      case 'search_contact':
        return executeSearchContact(getStringParam(parameters, ['query']))
      case 'list_contacts':
        return executeListContacts(parameters)
      case 'get_contact':
        return executeGetContactDetails(parameters)
      case 'create_contact':
        return executeCreateContact(parameters)
      case 'update_contact':
        return executeUpdateContact(parameters)
      case 'create_deal':
        return executeCreateDeal(parameters)
      case 'get_deal':
        return executeGetDeal(parameters)
      default:
        return 'Unknown tool.'
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
    setMessages((prev) => [...prev, userMsg])
    setIsLoading(true)

    try {
      const command = await callAI(userMessage, [...messages, userMsg])

      if (command.type === 'response') {
        const assistantMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: command.message,
          timestamp: new Date()
        }
        setMessages((prev) => [...prev, assistantMsg])
      } else if (command.type === 'tool') {
        const contextMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: command.message || `Executing ${command.tool}...`,
          timestamp: new Date()
        }
        setMessages((prev) => [...prev, contextMsg])

        const toolResult = await executeTool(command.tool, command.parameters)

        const resultMsg: Message = {
          id: (Date.now() + 2).toString(),
          role: 'assistant',
          content: toolResult,
          timestamp: new Date()
        }
        setMessages((prev) => [...prev, resultMsg])
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred.'
      setError(errorMsg)
      const errMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${errorMsg}`,
        timestamp: new Date()
      }
      setMessages((prev) => [...prev, errMessage])
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
              <span className="font-semibold">HubSpot AI Assistant</span>
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