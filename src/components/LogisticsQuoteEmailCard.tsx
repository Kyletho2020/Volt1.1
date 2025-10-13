import React, { useMemo, useState } from 'react'
import { Mail, Copy, CheckCircle, Truck } from 'lucide-react'
import { generateLogisticsEmail } from './PreviewTemplates'
import type { EquipmentData, LogisticsData } from '../types'

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
    const recipients = RECIPIENTS.join(';')
    return `mailto:${recipients}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }, [body, subject])

  const copyToClipboard = async (value: string, field: 'subject' | 'body') => {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (error) {
      console.error('Failed to copy logistics email text:', error)
    }
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-accent/25 bg-surface/80 p-6 shadow-[0_35px_120px_rgba(10,18,35,0.55)] backdrop-blur-xl">
      <div className="pointer-events-none absolute -top-24 -right-10 h-48 w-48 rounded-full bg-accent/25 blur-[120px] opacity-70" />
      <div className="relative z-10 space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/15 text-accent">
              <Truck className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-2xl font-semibold text-white">Logistics Quote Email</h2>
              <p className="text-sm text-slate-300">
                Share shipment details with the Omega Morgan logistics teams instantly.
              </p>
            </div>
          </div>
          <a
            href={mailtoHref}
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-xs font-semibold text-black shadow-sm transition hover:bg-green-400"
          >
            <Mail className="h-4 w-4" />
            Email Logistics Team
          </a>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.28em] text-slate-400">
              <span>Recipients</span>
              <span>Auto-filled</span>
            </div>
            <p className="mt-2 break-words text-sm text-slate-200">
              {RECIPIENTS.join('; ')}
            </p>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-200">Subject</span>
              <button
                type="button"
                onClick={() => copyToClipboard(subject, 'subject')}
                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[11px] font-semibold transition ${
                  copiedField === 'subject'
                    ? 'border-accent/60 bg-accent-soft/50 text-accent'
                    : 'border-accent/25 bg-surface-highlight/60 text-slate-100 hover:border-accent hover:bg-accent/15 hover:text-white'
                }`}
              >
                {copiedField === 'subject' ? (
                  <>
                    <CheckCircle className="h-3.5 w-3.5" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </>
                )}
              </button>
            </div>
            <div className="rounded-2xl border border-accent/20 bg-surface-highlight/60 p-4 text-sm text-slate-100">
              {subject}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-200">Body</span>
              <button
                type="button"
                onClick={() => copyToClipboard(body, 'body')}
                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[11px] font-semibold transition ${
                  copiedField === 'body'
                    ? 'border-accent/60 bg-accent-soft/50 text-accent'
                    : 'border-accent/25 bg-surface-highlight/60 text-slate-100 hover:border-accent hover:bg-accent/15 hover:text-white'
                }`}
              >
                {copiedField === 'body' ? (
                  <>
                    <CheckCircle className="h-3.5 w-3.5" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </>
                )}
              </button>
            </div>
            <pre className="whitespace-pre-wrap rounded-2xl border border-accent/20 bg-surface-highlight/60 p-4 text-sm text-slate-100">
              {body}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LogisticsQuoteEmailCard
