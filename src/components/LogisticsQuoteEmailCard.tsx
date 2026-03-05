import React, { useMemo, useState } from 'react'
import { Mail, Copy, CheckCircle, Truck } from 'lucide-react'
import { generateLogisticsEmail } from './PreviewTemplates'
import type { EquipmentData, LogisticsData } from '../types'
import { Button, Card, IconButton } from './ui'

interface LogisticsQuoteEmailCardProps {
  equipmentData: EquipmentData
  logisticsData: LogisticsData
}

const RECIPIENTS = [
  'Logistics@omegamorgan.com',
  'MachineryLogistics@omegamorgan.com'
]

const LogisticsQuoteEmailCard: React.FC<LogisticsQuoteEmailCardProps> = ({
  equipmentData,
  logisticsData
}) => {
  const [copiedField, setCopiedField] = useState<'subject' | 'body' | null>(null)

  const { subject, body } = useMemo(
    () => generateLogisticsEmail(equipmentData, logisticsData),
    [equipmentData, logisticsData]
  )

  const mailtoHref = useMemo(() => {
    const recipients = RECIPIENTS.join('; ')
    return `mailto:${encodeURIComponent(recipients)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }, [subject, body])

  const copyToClipboard = async (value: string, field: 'subject' | 'body') => {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  return (
    <Card padding="md">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent shrink-0">
            <Truck className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-white">Logistics Quote Email</h3>
            <p className="text-xs text-gray-400">Share details with logistics teams.</p>
          </div>
        </div>
        <a
          href={mailtoHref}
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white transition hover:bg-accent-hover"
        >
          <Mail className="h-3.5 w-3.5" />
          Email Team
        </a>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-xs text-gray-500 mb-1">Recipients</p>
          <p className="text-xs text-gray-400">{RECIPIENTS.join('; ')}</p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-400">Subject</span>
            <IconButton
              icon={copiedField === 'subject' ? CheckCircle : Copy}
              size="sm"
              variant={copiedField === 'subject' ? 'accent' : 'default'}
              onClick={() => copyToClipboard(subject, 'subject')}
              tooltip="Copy subject"
            />
          </div>
          <div className="rounded-lg border border-surface-overlay/50 bg-surface-raised p-3 text-sm text-gray-300">
            {subject}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-400">Body</span>
            <IconButton
              icon={copiedField === 'body' ? CheckCircle : Copy}
              size="sm"
              variant={copiedField === 'body' ? 'accent' : 'default'}
              onClick={() => copyToClipboard(body, 'body')}
              tooltip="Copy body"
            />
          </div>
          <pre className="whitespace-pre-wrap rounded-lg border border-surface-overlay/50 bg-surface-raised p-3 text-xs font-mono text-gray-300">
            {body}
          </pre>
        </div>
      </div>
    </Card>
  )
}

export default LogisticsQuoteEmailCard
