import React, { useEffect, useMemo, useState } from 'react'
import { Bot, Send, Loader, X, AlertCircle, CheckCircle } from 'lucide-react'
import { useApiKey } from '../hooks/useApiKey'
import { AIExtractionService } from '../services/aiExtractionService'
import { EquipmentData, LogisticsData } from '../types'

interface Message {
  id: string
  type: 'user' | 'ai' | 'system' | 'error'
  content: string
  timestamp: Date
}

interface AIExtractorModalProps {
  isOpen: boolean
  onClose: () => void
  onExtract: (
    equipmentData: Partial<EquipmentData>,
    logisticsData: Partial<LogisticsData>
  ) => void
  sessionId: string
  mode?: 'all' | 'logistics' | 'scope'
}

const MODE_CONFIG = {
  all: {
    title: 'AI Project Extractor',
    intro:
      "Hi! I can help extract project information from emails, work orders, or any text. I'll automatically fill out both the equipment and logistics quote forms with the extracted data.",
    placeholder: 'Paste your email, work order, or project description here...',
    noDataMessage:
      "I couldn't find any project information in that text. Try including details like project name, company, address, contact info, or work description."
  },
  logistics: {
    title: 'AI Logistics Extractor',
    intro:
      'Hi! Share shipment details and I will pull out the items to transport plus pickup and delivery addresses. Only the logistics section will be updated.',
    placeholder: 'Paste text with logistics details (items, pickup and delivery addresses)...',
    noDataMessage:
      "I couldn't find logistics items or pickup/delivery addresses in that text. Try including item descriptions and pickup/delivery details."
  },
  scope: {
    title: 'AI Scope Extractor',
    intro: 'Hi! Provide the project description and I will capture just the scope of work for you.',
    placeholder: 'Paste text that describes the scope of work for this project...',
    noDataMessage:
      "I couldn't find a scope of work in that text. Try including sentences that describe the work to be performed."
  }
} as const

const AIExtractorModal: React.FC<AIExtractorModalProps> = ({
  isOpen,
  onClose,
  onExtract,
  sessionId,
  mode = 'all'
}) => {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])

  const { hasApiKey, loading: apiKeyLoading, error: apiKeyError } = useApiKey()

  const addMessage = (type: Message['type'], content: string) => {
    setMessages(prev => [...prev, { id: Date.now().toString(), type, content, timestamp: new Date() }])
  }

  const modeConfig = useMemo(() => MODE_CONFIG[mode], [mode])

  useEffect(() => {
    if (isOpen) {
      setMessages([
        {
          id: Date.now().toString(),
          type: 'system',
          content: modeConfig.intro,
          timestamp: new Date()
        }
      ])
      setInput('')
    }
  }, [isOpen, modeConfig])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    if (!sessionId) {
      addMessage('error', 'Session not ready. Please wait a moment and try again.')
      return
    }

    if (!hasApiKey) {
      addMessage('error', 'OpenAI API key not configured. Please set up your API key first.')
      return
    }

    const userInput = input.trim()
    setInput('')
    setLoading(true)
    addMessage('user', userInput)
    
    console.log('Starting AI extraction...', { sessionId, inputLength: userInput.length })

    try {
      const result = await AIExtractionService.extractProjectInfo(userInput, sessionId)
      console.log('AI extraction result:', result)

      if (result.success) {
        let { equipmentData = {}, logisticsData = {} } = result

        if (mode === 'logistics') {
          const allowedFields: (keyof LogisticsData)[] = [
            'pieces',
            'pickupAddress',
            'pickupCity',
            'pickupState',
            'pickupZip',
            'deliveryAddress',
            'deliveryCity',
            'deliveryState',
            'deliveryZip'
          ]
          const filteredLogisticsData: Partial<LogisticsData> = {}
          allowedFields.forEach(field => {
            const value = logisticsData?.[field]
            if (value && (!(Array.isArray(value)) || value.length > 0)) {
              filteredLogisticsData[field] = value
            }
            if (Array.isArray(value) && value.length === 0) {
              // Ensure empty arrays don't get passed through
              delete filteredLogisticsData[field]
            }
          })
          logisticsData = filteredLogisticsData
          equipmentData = {}
        } else if (mode === 'scope') {
          const scopeOnly: Partial<EquipmentData> = {}
          if (equipmentData?.scopeOfWork) {
            scopeOnly.scopeOfWork = equipmentData.scopeOfWork
          }
          equipmentData = scopeOnly
          logisticsData = {}
        }

        const hasEquipmentData = equipmentData && Object.keys(equipmentData).length > 0
        const hasLogisticsData = logisticsData && Object.keys(logisticsData).length > 0

        if (hasEquipmentData || hasLogisticsData) {
          onExtract(equipmentData, logisticsData)

          let successMessage = ''
          if (mode === 'scope') {
            successMessage = 'Great! I captured the scope of work and updated the form.'
          } else if (mode === 'logistics') {
            const logisticsFieldLabels: Record<string, string> = {
              pieces: 'Items to Transport',
              pickupAddress: 'Pickup Address',
              pickupCity: 'Pickup City',
              pickupState: 'Pickup State',
              pickupZip: 'Pickup ZIP',
              deliveryAddress: 'Delivery Address',
              deliveryCity: 'Delivery City',
              deliveryState: 'Delivery State',
              deliveryZip: 'Delivery ZIP'
            }
            const logisticsFields = Object.keys(logisticsData || {}).map(
              field => logisticsFieldLabels[field] || field
            )
            successMessage = `Great! I updated logistics details: ${logisticsFields.join(', ')}.`
          } else {
            const fields: string[] = []
            if (hasEquipmentData) {
              fields.push(`Equipment: ${Object.keys(equipmentData).join(', ')}`)
            }
            if (hasLogisticsData) {
              fields.push(`Logistics: ${Object.keys(logisticsData).join(', ')}`)
            }
            successMessage = `Great! I extracted information for: ${fields.join(' | ')}. Both forms have been updated with the extracted data.`
          }

          addMessage('ai', successMessage)
        } else {
          addMessage('ai', modeConfig.noDataMessage)
        }
      } else {
        addMessage('error', result.error || 'Extraction failed')
      }
    } catch (error: unknown) {
      console.error('Extraction error:', error)
      addMessage('error', `Sorry, there was an error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const isReady = !apiKeyLoading && hasApiKey && sessionId

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border-2 border-accent rounded-2xl shadow-2xl w-full max-w-2xl h-[600px] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b-2 border-accent">
          <div className="flex items-center">
            <Bot className="w-6 h-6 text-white mr-2" />
            <h3 className="text-xl font-bold text-white">{modeConfig.title}</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-black rounded-lg transition-colors">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
        <div className="px-6 py-3 border-b-2 border-accent">
          {apiKeyLoading && (
            <div className="flex items-center text-white">
              <Loader className="w-4 h-4 animate-spin mr-2" />
              <span className="text-sm">Checking API key...</span>
            </div>
          )}
          {!apiKeyLoading && !hasApiKey && (
            <div className="flex items-center text-white">
              <AlertCircle className="w-4 h-4 mr-2" />
              <span className="text-sm">API key not configured</span>
            </div>
          )}
          {!sessionId && (
            <div className="flex items-center text-white">
              <Loader className="w-4 h-4 animate-spin mr-2" />
              <span className="text-sm">Initializing session...</span>
            </div>
          )}
          {apiKeyError && (
            <div className="flex items-center text-white">
              <AlertCircle className="w-4 h-4 mr-2" />
              <span className="text-sm">Error: {apiKeyError}</span>
            </div>
          )}
          {isReady && (
            <div className="flex items-center text-black">
              <CheckCircle className="w-4 h-4 mr-2" />
              <span className="text-sm">Ready to extract</span>
            </div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map(message => (
            <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-white text-black'
                    : message.type === 'system'
                    ? 'bg-black text-white'
                    : message.type === 'error'
                    ? 'bg-black text-white border border-accent'
                    : 'bg-black text-white'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-black text-white p-3 rounded-lg flex items-center">
                <Loader className="w-4 h-4 animate-spin mr-2" />
                <span className="text-sm">Analyzing text...</span>
              </div>
            </div>
          )}
        </div>
        <div className="p-6 border-t-2 border-accent">
          <form onSubmit={handleSubmit} className="space-y-4">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={isReady ? modeConfig.placeholder : 'Please wait for system to be ready...'}
              className="w-full px-4 py-3 bg-black border border-accent rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent resize-none disabled:bg-black disabled:text-white text-white placeholder-white"
              rows={3}
              disabled={loading || !isReady}
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading || !input.trim() || !isReady}
                className="flex items-center px-6 py-2 bg-white text-black rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin mr-2" />
                    Analyzing...
                  </>
                ) : !isReady ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin mr-2" />
                    Not Ready
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Extract Info
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AIExtractorModal

