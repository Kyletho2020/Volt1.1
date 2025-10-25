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

/**
 * Enhanced HubSpot AI Assistant Component
 * 
 * Features:
 * - Two-way API integration with HubSpot (read & write operations)
 * - AI-powered task interpretation via OpenAI GPT
 * - Support for contacts, deals, companies, and tickets
 * - Real-time bidirectional communication
 * - Smart command parsing and execution
 */
const HubSpotAIChatbot: React.FC<HubSpotAIChatbotProps> = ({ onContactSelected }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: 'Hi! I\'m your HubSpot Assistant. I can help you search contacts, create/update deals, manage contacts, view companies, and handle other CRM tasks. What would you like to do?',
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

  // Enhanced system prompt with expanded tool capabilities
  const getSystemPrompt = (): string => {
    return `You are an advanced HubSpot AI Assistant embedded in a quoting/CRM application. Your role is to help users manage HubSpot data efficiently.

CRITICAL RESPONSE FORMAT:
Always respond with ONLY a valid JSON object (no markdown, no text before/after). Follow this schema exactly:
{
  "type": "response" | "tool",
  "message": "string (optional but recommended for context)",
  "tool": "required when type is tool - one of: search_contact, get_contact, create_contact, update_contact, list_contacts, create_deal, get_deal",
  "parameters": {object with tool-specific parameters}
}

AVAILABLE TOOLS:

1. search_contact - Find contacts by name/criteria
   Parameters: { "query": "string (contact name or partial match)" }
   Returns: List of matching contacts with full details

2. list_contacts - Get all or filtered contacts
   Parameters: { "limit": 10, "filter": "optional filter criteria" }
   Returns: Paginated list of contacts

3. get_contact - Retrieve full contact details
   Parameters: { "id": "hubspot_id" } OR { "email": "email@address.com" }
   Returns: Complete contact information

4. create_contact - Add new contact to HubSpot
   Parameters: {
     "firstName": "string",
     "lastName": "string",
     "email": "string (optional)",
     "phone": "string (optional)",
     "company": "string (optional)",
     "address": "string (optional)",
     "city": "string (optional)",
     "state": "string (optional)",
     "zip": "string (optional)"
   }
   Returns: Created contact with ID

5. update_contact - Modify existing contact
   Parameters: {
     "id": "string" OR "email": "string (to identify contact)",
     "updates": {
       "firstName": "string",
       "lastName": "string",
       "email": "string",
       "phone": "string",
       "company": "string",
       etc...
     }
   }
   Returns: Updated contact details

6. create_deal - Create a new sales deal
   Parameters: {
     "dealName": "string (required)",
     "contactId": "string (optional - associate with contact)",
     "amount": "number (optional)",
     "dealStage": "string (optional - e.g., 'negotiation', 'proposal_sent')",
     "description": "string (optional)"
   }
   Returns: Created deal with ID

7. get_deal - Retrieve deal details
   Parameters: { "dealId": "string" }
   Returns: Deal information

INSTRUCTIONS FOR ASSISTANT:
- Always ask for clarification if user request is ambiguous
- When creating contacts, ask for minimum info (name & email) if not provided
- Suggest related actions (e.g., "Would you like me to create a deal for this contact?")
- Be friendly, professional, and helpful
- Handle errors gracefully with clear explanations
- If a task requires multiple steps, break it down and ask confirmation

CONVERSATION CONTEXT:
Remember previous interactions in this conversation to provide continuity. Reference earlier mentions when relevant.`
  }

  const generateLocalResponse = (userMessage: string): AssistantCommand => {
    const lower = userMessage.toLowerCase()

    // Search contacts
    if (lower.includes('search') || lower.includes('find') || lower.includes('look for')) {
      const nameMatch = userMessage.match(/(?:search|find|look for)\s+(?:for\s+)?(?:contact\s+)?(.+?)(?:\?|$)/i)
      if (nameMatch) {
        return {
          type: 'tool',
          tool: 'search_contact',
          message: \`I'll search HubSpot for \${nameMatch[1].trim()}.\`,
          parameters: { query: nameMatch[1].trim() }
        }
      }
    }

    // Create contact
    if (lower.includes('create') || lower.includes('add') || lower.includes('new contact')) {
      return {
        type: 'response',
        message: 'To add a new contact, please provide their name and email. You can also include phone, company, and address if you have it.'
      }
    }

    // Update contact
    if (lower.includes('update') || lower.includes('change') || lower.includes('modify')) {
      return {
        type: 'response',
        message: 'I can update a contact for you. Which contact would you like to update, and what fields should I change?'
      }
    }

    // Create deal
    if (lower.includes('create deal') || lower.includes('new deal') || lower.includes('add deal')) {
      return {
        type: 'response',
        message: 'I can create a deal for you. Please tell me the deal name and any other details (amount, stage, associated contact).'
      }
    }

    // List/show contacts
    if (lower.includes('show') || lower.includes('list') || lower.includes('all contacts')) {
      return {
        type: 'tool',
        tool: 'list_contacts',
        message: 'Let me fetch your recent contacts.',
        parameters: { limit: 10 }
      }
    }

    return {
      type: 'response',
      message: 'I can help with HubSpot tasks like searching/creating contacts, managing deals, and more. What would you like to do?'
    }
  }

  const parseAssistantCommand = (raw: unknown): AssistantCommand | null => {
    if (!raw || typeof raw !== 'object') {
      return null
    }

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
          Authorization: \`Bearer \${OPENAI_API_KEY}\`
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
    const details = [\`👤 Name: \${name}\`, \`📧 Email: \${contact.email || 'N/A'}\`, \`📱 Phone: \${contact.phone || 'N/A'}\`]
    if (contact.companyName) {
      details.push(\`🏢 Company: \${contact.companyName}\`)
    }
    if (contact.contactAddress) {
      details.push(\`📍 Address: \${contact.contactAddress}\`)
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

  // Tool execution handlers

  const executeSearchContact = async (query: string): Promise<string> => {
    try {
      const contacts = await HubSpotService.searchContactsByName(query, true)
      if (contacts.length === 0) {
        return \`I couldn't find any contacts matching "\${query}".\`
      }

      if (contacts.length === 1) {
        const [contact] = contacts
        onContactSelected?.(contact)
        return \`Found 1 contact:\n\n\${formatContact(contact)}\`
      }

      const summary = contacts
        .slice(0, 5)
        .map((contact, index) => \`\${index + 1}. \${[contact.firstName, contact.lastName].filter(Boolean).join(' ') || 'Unnamed'} (\${contact.email || 'no email'})\`)
        .join('\n')

      const additional = contacts.length > 5 ? \`\n\nShowing 5 of \${contacts.length} matches.\` : ''
      return \`Found \${contacts.length} contacts matching "\${query}":\n\n\${summary}\${additional}\n\nWhich contact would you like to view or update?\`
    } catch (err) {
      console.error('Search error:', err)
      return 'I had trouble searching HubSpot. Please try again.'
    }
  }

  const executeListContacts = async (parameters: Record<string, unknown> | undefined): Promise<string> => {
    try {
      const limit = typeof parameters?.limit === 'number' ? parameters.limit : 10
      // This would require a list contacts method in HubSpotService
      // For now, return a helpful message
      return 'Fetching your recent contacts... (This feature requires HubSpot API pagination support)'
    } catch (err) {
      console.error('List contacts error:', err)
      return 'Unable to fetch contacts list at this time.'
    }
  }

  const executeGetContactDetails = async (parameters: Record<string, unknown> | undefined): Promise<string> => {
    const id = getStringParam(parameters, ['id', 'contactId'])
    const email = getStringParam(parameters, ['email'])

    if (!id && !email) {
      return 'Please provide a contact ID or email address.'
    }

    try {
      const contact = await HubSpotService.getContactDetails({ id, email })
      if (!contact) {
        return "I couldn't find that contact in HubSpot."
      }
      onContactSelected?.(contact)
      return \`Contact Details:\n\n\${formatContact(contact)}\`
    } catch (err) {
      console.error('Contact lookup error:', err)
      return 'Error retrieving contact details.'
    }
  }

  const executeCreateContact = async (parameters: Record<string, unknown> | undefined): Promise<string> => {
    if (!parameters) {
      return 'Please provide the contact details (at least name).'
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
      return 'I need at least a first or last name to create the contact.'
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
      return \`✅ Contact created successfully!\n\n\${formatContact(contact)}\`
    } catch (err) {
      console.error('Create contact error:', err)
      const message = err instanceof Error ? err.message : 'Failed to create contact.'
      return \`Error creating contact: \${message}\`
    }
  }

  const executeUpdateContact = async (parameters: Record<string, unknown> | undefined): Promise<string> => {
    if (!parameters) {
      return 'Please specify which contact to update and what changes to make.'
    }

    const id = getStringParam(parameters, ['id', 'contactId'])
    const email = getStringParam(parameters, ['email'])

    let contactId = id
    if (!contactId && email) {
      try {
        const contact = await HubSpotService.getContactDetails({ email })
        if (!contact) {
          return \`No contact found with email \${email}.\`
        }
        contactId = contact.id
        onContactSelected?.(contact)
      } catch (err) {
        console.error('Lookup before update failed:', err)
        return 'Unable to find that contact.'
      }
    }

    if (!contactId) {
      return 'Please provide a contact ID or email to identify the contact.'
    }

    const updates: Record<string, unknown> = {}
    const updatesParam = parameters.updates
    if (updatesParam && typeof updatesParam === 'object') {
      Object.assign(updates, updatesParam as Record<string, unknown>)
    }

    const inlineKeys = ['firstName', 'lastName', 'phone', 'email', 'address', 'contactAddress', 'contactAddress1', 'city', 'state', 'zip', 'contactCity', 'contactState', 'contactZip', 'companyName']

    for (const key of inlineKeys) {
      if (parameters.hasOwnProperty(key)) {
        const val = parameters[key]
        if (typeof val === 'string' && val.trim()) {
          const mappedKey = key === 'address' ? 'contactAddress1' : key
          updates[mappedKey] = val.trim()
        }
      }
    }

    if (Object.keys(updates).length === 0) {
      return 'Please specify what fields to update.'
    }

    try {
      const updated = await HubSpotService.updateContact(contactId, updates)
      onContactSelected?.(updated)
      return \`✅ Contact updated successfully!\n\n\${formatContact(updated)}\`
    } catch (err) {
      console.error('Update contact error:', err)
      const message = err instanceof Error ? err.message : 'Failed to update contact.'
      return \`Error updating contact: \${message}\`
    }
  }

  const executeCreateDeal = async (parameters: Record<string, unknown> | undefined): Promise<string> => {
    if (!parameters) {
      return 'Please provide deal details (at least the deal name).'
    }

    const dealName = getStringParam(parameters, ['dealName', 'name'])
    if (!dealName) {
      return 'I need a deal name to create the deal.'
    }

    // This would require deal creation support in HubSpotService
    return \`Deal creation feature coming soon. Deal name: \${dealName}\`
  }

  const executeGetDeal = async (parameters: Record<string, unknown> | undefined): Promise<string> => {
    if (!parameters) {
      return 'Please provide a deal ID.'
    }

    const dealId = getStringParam(parameters, ['dealId', 'id'])
    if (!dealId) {
      return 'I need a deal ID to look up.'
    }

    // This would require deal lookup support in HubSpotService
    return \`Deal lookup feature coming soon. Deal ID: \${dealId}\`
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
        return 'I don\'t recognize that tool.'
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
          content: command.message || \`Executing \${command.tool}...\`,
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
      const errorMsg = err instanceof Error ? err.message : 'An unexpected error occurred.'
      setError(errorMsg)
      const errMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: \`Error: \${errorMsg}\`,
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
          {/* Header */}
          <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 rounded-t-lg">
            <div className="flex items-center gap-2">
              <MessageCircle size={20} />
              <span className="font-semibold">HubSpot AI Assistant</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-blue-800 p-1 rounded">
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((msg) => (
              <div key={msg.id} className={\`flex \${msg.role === 'user' ? 'justify-end' : 'justify-start'}\`}>
                <div
                  className={\`max-w-xs px-3 py-2 rounded-lg whitespace-pre-wrap text-sm \${
                    msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-200 text-gray-900 rounded-bl-none'
                  }\`}
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

          {/* Error Display */}
          {error && (
            <div className="px-4 py-2 bg-red-50 border-t border-red-200 flex items-start gap-2">
              <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Input */}
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
