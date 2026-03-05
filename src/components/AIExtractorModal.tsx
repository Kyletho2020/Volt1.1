import React, { useEffect, useMemo, useState } from 'react'
import { Bot, Send, Loader, AlertCircle, CheckCircle } from 'lucide-react'
import { useApiKey } from '../hooks/useApiKey'
import { AIExtractionService } from '../services/aiExtractionService'
import { EquipmentData, LogisticsData } from '../types'
import { Modal, Button } from './ui'

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
      "Hi! I can help extract project information from emails, work orders, or any text. I'll automatically fill out both the equipment and logistics quote forms.",
    placeholder: 'Paste your email, work order, or project description here...',
    noDataMessage:
      "I couldn't find any project information in that text. Try including details like project name, company, address, contact info, or work description."
  },
  logistics: {
    title: 'AI Logistics Extractor',
    intro:
      'Hi! Share shipment details and I will pull out the items to transport plus pickup and delivery addresses.',
    placeholder: 'Paste text with logistics details (items, pickup and delivery addresses)...',
    noDataMessage:
      "I couldn't find logistics items or addresses in that text. Try including item descriptions and pickup/delivery details."
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
      setMessages([{
        id: Date.now().toString(), type: 'system', content: modeConfig.intro, timestamp: new Date()
      }])
      setInput('')
    }
  }, [isOpen, modeConfig])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    if (!sessionId) { addMessage('error', 'Session not ready. Please wait and try again.'); return }
    if (!hasApiKey) { addMessage('error', 'OpenAI API key not configured.'); return }

    const userInput = input.trim()
    setInput('')
    setLoading(true)
    addMessage('user', userInput)

    try {
      const result = await AIExtractionService.extractProjectInfo(userInput, sessionId)

      if (result.success) {
        let { equipmentData = {}, logisticsData = {} } = result

        if (mode === 'logistics') {
          const allowedFields: (keyof LogisticsData)[] = [
            'pieces', 'pickupAddress', 'pickupCity', 'pickupState', 'pickupZip',
            'deliveryAddress', 'deliveryCity', 'deliveryState', 'deliveryZip'
          ]
          const filtered: Partial<LogisticsData> = {}
          allowedFields.forEach(field => {
            const value = logisticsData?.[field]
            if (value && (!(Array.isArray(value)) || value.length > 0)) {
              filtered[field] = value
            }
          })
          logisticsData = filtered
          equipmentData = {}
        } else if (mode === 'scope') {
          const scopeOnly: Partial<EquipmentData> = {}
          if (equipmentData?.scopeOfWork) scopeOnly.scopeOfWork = equipmentData.scopeOfWork
          equipmentData = scopeOnly
          logisticsData = {}
        }

        const hasEq = equipmentData && Object.keys(equipmentData).length > 0
        const hasLog = logisticsData && Object.keys(logisticsData).length > 0

        if (hasEq || hasLog) {
          onExtract(equipmentData, logisticsData)
          let msg = ''
          if (mode === 'scope') {
            msg = 'Captured the scope of work and updated the form.'
          } else if (mode === 'logistics') {
            const labels: Record<string, string> = {
              pieces: 'Items', pickupAddress: 'Pickup Address', deliveryAddress: 'Delivery Address'
            }
            const fields = Object.keys(logisticsData || {}).map(f => labels[f] || f)
            msg = `Updated logistics: ${fields.join(', ')}.`
          } else {
            const parts: string[] = []
            if (hasEq) parts.push(`Equipment: ${Object.keys(equipmentData).join(', ')}`)
            if (hasLog) parts.push(`Logistics: ${Object.keys(logisticsData).join(', ')}`)
            msg = `Extracted: ${parts.join(' | ')}.`
          }
          addMessage('ai', msg)
        } else {
          addMessage('ai', modeConfig.noDataMessage)
        }
      } else {
        addMessage('error', result.error || 'Extraction failed')
      }
    } catch (error: unknown) {
      console.error('Extraction error:', error)
      addMessage('error', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const isReady = !apiKeyLoading && hasApiKey && sessionId

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modeConfig.title} size="lg">
      {/* Status bar */}
      <div className="px-6 py-2 border-b border-surface-overlay/50">
        {apiKeyLoading && (
          <div className="flex items-center text-gray-400 text-sm">
            <Loader className="w-4 h-4 animate-spin mr-2" />Checking API key...
          </div>
        )}
        {!apiKeyLoading && !hasApiKey && (
          <div className="flex items-center text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 mr-2" />API key not configured
          </div>
        )}
        {apiKeyError && (
          <div className="flex items-center text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 mr-2" />Error: {apiKeyError}
          </div>
        )}
        {isReady && (
          <div className="flex items-center text-accent text-sm">
            <CheckCircle className="w-4 h-4 mr-2" />Ready to extract
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-3 min-h-[300px]">
        {messages.map(message => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] px-4 py-2.5 rounded-xl text-sm ${
                message.type === 'user'
                  ? 'bg-accent text-white'
                  : message.type === 'error'
                  ? 'bg-red-500/10 border border-red-500/30 text-red-300'
                  : 'bg-surface-raised text-gray-300'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-surface-raised text-gray-400 px-4 py-2.5 rounded-xl flex items-center text-sm">
              <Loader className="w-4 h-4 animate-spin mr-2" />Analyzing...
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-6 border-t border-surface-overlay/50">
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={isReady ? modeConfig.placeholder : 'Please wait...'}
            className="w-full rounded-lg border border-surface-overlay bg-surface-raised px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent resize-none disabled:opacity-50"
            rows={3}
            disabled={loading || !isReady}
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={loading || !input.trim() || !isReady}
              loading={loading}
              icon={!loading ? Send : undefined}
            >
              {loading ? 'Analyzing...' : !isReady ? 'Not Ready' : 'Extract Info'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  )
}

export default AIExtractorModal
