import React, { useState, useEffect } from 'react'
import { Truck, ClipboardList, Copy, CheckCircle, Loader2, X, AlertTriangle, Phone, Mail, Users, Send } from 'lucide-react'
import type { SavedQuote } from '../services/quoteService'
import { QuoteService } from '../services/quoteService'
import { supabase } from '../lib/supabase'
import { Modal, Button, Badge, Tabs } from './ui'

interface DailyConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
}

const JOB_NUMBER_REGEX = /\b\d{3,5}-\d{2,4}\b/g

const buildEquipmentSummary = (quote: SavedQuote): string => {
  const req = quote.equipment_requirements
  if (!req) return 'gear truck trailer'
  const parts: string[] = ['gear truck trailer']
  if (req.crewSize) parts.push(`${req.crewSize} man crew`)
  const safeArray = (value: unknown) => (Array.isArray(value) ? value : [])
  const allItems = [
    ...safeArray(req.forklifts), ...safeArray(req.tractors),
    ...safeArray(req.trailers), ...safeArray(req.additionalEquipment),
  ].filter((item: { name?: string; quantity?: number }) => item.quantity && item.quantity > 0)
  if (allItems.length > 0) {
    parts.push(allItems.map((item: { name: string; quantity: number }) =>
      item.quantity > 1 ? `${item.quantity} ${item.name}` : item.name
    ).join(', '))
  }
  return parts.join(', ')
}

const buildConfirmationLine = (quote: SavedQuote): string => {
  const nameSection = quote.company_name || quote.contact_name || ''
  const jobNumber = quote.job_number || ''
  const startTimePart = quote.start_time ? `${quote.start_time} start time` : ''
  const equipment = buildEquipmentSummary(quote)
  return [nameSection, jobNumber, startTimePart ? `${startTimePart} ${equipment}` : equipment].filter(Boolean).join(' – ')
}

const inputCls = 'rounded-lg border border-surface-overlay bg-surface-raised px-3 py-2 text-sm text-white placeholder-gray-500 transition focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent'

const DailyConfirmationModal: React.FC<DailyConfirmationModalProps> = ({ isOpen, onClose }) => {
  const [emailInput, setEmailInput] = useState('')
  const [parsedJobNumbers, setParsedJobNumbers] = useState<string[]>([])
  const [matchedQuotes, setMatchedQuotes] = useState<SavedQuote[]>([])
  const [unmatchedNumbers, setUnmatchedNumbers] = useState<string[]>([])
  const [generatedText, setGeneratedText] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [activeTab, setActiveTab] = useState<string>('confirmation')
  const [foremans, setForemans] = useState<Record<string, string>>({})
  const [briefingCopied, setBriefingCopied] = useState(false)
  const [foremanPhones, setForemanPhones] = useState<Record<string, string>>({})
  const [selfEmail, setSelfEmail] = useState('')
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const [showEmailPrompt, setShowEmailPrompt] = useState(false)
  const [emailInputDraft, setEmailInputDraft] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('volt_self_email')
    if (saved) setSelfEmail(saved)
  }, [])

  useEffect(() => {
    if (isOpen) {
      setEmailInput(''); setParsedJobNumbers([]); setMatchedQuotes([]); setUnmatchedNumbers([])
      setGeneratedText(''); setHasSearched(false); setActiveTab('confirmation'); setForemans({})
      setBriefingCopied(false); setToastMsg(null); setShowEmailPrompt(false); setEmailInputDraft('')
      try {
        const saved = localStorage.getItem('volt_foreman_phones')
        setForemanPhones(saved ? JSON.parse(saved) : {})
      } catch { setForemanPhones({}) }
    }
  }, [isOpen])

  useEffect(() => {
    if (Object.keys(foremanPhones).length > 0)
      localStorage.setItem('volt_foreman_phones', JSON.stringify(foremanPhones))
  }, [foremanPhones])

  useEffect(() => {
    const matches = emailInput.match(JOB_NUMBER_REGEX)
    setParsedJobNumbers(matches ? [...new Set(matches)] : [])
  }, [emailInput])

  const handleMatch = async () => {
    if (parsedJobNumbers.length === 0) return
    setLoading(true); setHasSearched(false)
    try {
      const quotes = await QuoteService.getQuotesByJobNumbers(parsedJobNumbers)
      setMatchedQuotes(quotes)
      const matched = new Set(quotes.map(q => (q.job_number || '').toLowerCase()))
      setUnmatchedNumbers(parsedJobNumbers.filter(n => !matched.has(n.toLowerCase())))
      setGeneratedText(quotes.map(buildConfirmationLine).join(',\n'))
      setHasSearched(true)
    } catch (error) { console.error('Failed to match quotes:', error) }
    finally { setLoading(false) }
  }

  const copyToClipboard = async () => {
    if (generatedText) {
      await navigator.clipboard.writeText(generatedText)
      setCopied(true); setTimeout(() => setCopied(false), 2000)
    }
  }

  const launchEmailDraft = () => {
    const jobNums = matchedQuotes.map(q => q.job_number).filter(Boolean).join(', ')
    window.location.href = `mailto:?subject=${encodeURIComponent(`Confirmed: ${jobNums}`)}&body=${encodeURIComponent(generatedText)}`
  }

  const buildBriefingText = (): string => {
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1)
    const dateStr = tomorrow.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    const sections = matchedQuotes.map(quote => {
      const foreman = foremans[quote.id]?.trim() || '[Foreman TBD]'
      const fPhone = foremanPhones[quote.id]?.trim() || ''
      const contact = quote.contact_name || '[Site Contact]'
      const phone = quote.site_phone?.trim() || ''
      const scope = quote.scope_of_work?.trim() || ''
      const startTime = quote.start_time ? `${quote.start_time} start` : ''
      const address = quote.site_address?.trim() || ''
      const header = [quote.company_name || quote.project_name, startTime].filter(Boolean).join(' – ')
      return [
        `-- ${quote.job_number} --`, foreman, ...(fPhone ? [fPhone] : []), '', header,
        ...(address ? [`  Site Address: ${address}`] : []),
        `  Equipment: ${buildEquipmentSummary(quote)}`,
        phone ? `  Site Contact: ${contact} – ${phone}` : `  Site Contact: ${contact}`,
        ...(scope ? ['', `Scope: ${scope}`] : []),
      ].join('\n')
    })
    return `JOBS – ${dateStr.toUpperCase()}\n\n${sections.join('\n\n')}`
  }

  const copyBriefing = async () => {
    await navigator.clipboard.writeText(buildBriefingText())
    setBriefingCopied(true); setTimeout(() => setBriefingCopied(false), 2000)
  }

  const sendBriefingEmail = async (overrideEmail?: string) => {
    const recipient = overrideEmail || selfEmail
    if (!supabase || !recipient) return
    setEmailLoading(true)
    try {
      const body = buildBriefingText()
      const jobNums = matchedQuotes.map(q => q.job_number).filter(Boolean).join(', ')
      const { error } = await supabase.from('email_queue').insert({
        quote_id: matchedQuotes.length === 1 ? matchedQuotes[0].id : null,
        recipient_email: recipient, subject: `Foreman Briefing – ${jobNums}`,
        body, email_type: 'self_briefing', status: 'pending',
      })
      if (error) throw error
      setToastMsg('Briefing queued'); setTimeout(() => setToastMsg(null), 4000)
    } catch (err) {
      console.error('Failed to queue email:', err)
      setToastMsg('Failed to queue email'); setTimeout(() => setToastMsg(null), 4000)
    } finally { setEmailLoading(false) }
  }

  const handleEmailToSelf = async () => {
    if (!selfEmail) { setShowEmailPrompt(true); return }
    await sendBriefingEmail()
  }

  const handleSaveEmail = async () => {
    const trimmed = emailInputDraft.trim()
    if (!trimmed) return
    localStorage.setItem('volt_self_email', trimmed)
    setSelfEmail(trimmed); setShowEmailPrompt(false); setEmailInputDraft('')
    await sendBriefingEmail(trimmed)
  }

  const showTabs = hasSearched && matchedQuotes.length > 0
  const tabItems = [
    { key: 'confirmation', label: 'Confirmation Reply' },
    { key: 'briefing', label: 'Crew Briefing' },
  ]

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Daily Confirmation" size="xl">
      <div className="p-6 space-y-5">
        {/* Input Section */}
        <div>
          <label className="block text-xs font-medium uppercase tracking-wide text-gray-400 mb-1">
            Paste Dispatch Email
          </label>
          <textarea
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder="Paste the dispatch email here... Job numbers like 9237-24 will be detected."
            rows={4}
            className={`w-full ${inputCls} resize-y`}
          />
          {parsedJobNumbers.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="text-xs text-gray-500">Found:</span>
              {parsedJobNumbers.map((num) => (
                <Badge key={num} variant="accent">{num}</Badge>
              ))}
            </div>
          )}
          <Button
            onClick={handleMatch}
            disabled={loading || parsedJobNumbers.length === 0}
            loading={loading}
            icon={Truck}
            className="mt-3"
          >
            Match Quotes ({parsedJobNumbers.length})
          </Button>
        </div>

        {/* Matched Cards */}
        {hasSearched && matchedQuotes.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">
              Matched {matchedQuotes.length} Quote{matchedQuotes.length !== 1 ? 's' : ''}
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {matchedQuotes.map((quote) => (
                <div key={quote.id} className="p-4 rounded-xl border border-surface-overlay/50 bg-surface-raised hover:border-accent/30 transition">
                  <div className="font-mono text-lg font-bold text-accent mb-1">{quote.job_number}</div>
                  <div className="text-sm text-white font-medium">{quote.contact_name || quote.project_name}</div>
                  <div className="text-xs text-gray-400">{quote.company_name}</div>
                  {quote.start_time && <div className="text-xs text-gray-500 mt-1">{quote.start_time} start</div>}
                  <div className="text-xs text-gray-600 mt-1 truncate">{buildEquipmentSummary(quote)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Unmatched */}
        {hasSearched && unmatchedNumbers.length > 0 && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
            <div className="flex items-center gap-2 text-amber-400 text-sm mb-2">
              <AlertTriangle className="h-4 w-4" />
              {unmatchedNumbers.length} not found in Volt
            </div>
            <div className="flex flex-wrap gap-1.5">
              {unmatchedNumbers.map((num) => (
                <Badge key={num} variant="warning">{num}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Tabs + Output */}
        {showTabs && (
          <div>
            <Tabs tabs={tabItems} activeTab={activeTab} onChange={setActiveTab} className="mb-4" />

            {activeTab === 'confirmation' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium uppercase tracking-wide text-gray-400">Reply Text</label>
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm" icon={Mail} onClick={launchEmailDraft}>
                      Draft Email
                    </Button>
                    <Button
                      variant={copied ? 'primary' : 'secondary'}
                      size="sm"
                      icon={copied ? CheckCircle : Copy}
                      onClick={copyToClipboard}
                    >
                      {copied ? 'Copied' : 'Copy'}
                    </Button>
                  </div>
                </div>
                <textarea
                  value={generatedText}
                  onChange={(e) => setGeneratedText(e.target.value)}
                  rows={Math.min(matchedQuotes.length + 2, 10)}
                  className={`w-full ${inputCls} resize-y font-mono text-xs`}
                />
              </div>
            )}

            {activeTab === 'briefing' && (
              <div className="space-y-4">
                {matchedQuotes.map((quote) => (
                  <div key={quote.id} className="p-4 rounded-xl border border-surface-overlay/50 bg-surface-raised space-y-3">
                    <div>
                      <div className="flex items-baseline gap-3">
                        <span className="font-mono text-lg font-bold text-accent">{quote.job_number}</span>
                        {quote.start_time && <span className="text-xs text-gray-400">{quote.start_time} start</span>}
                      </div>
                      <div className="text-sm font-medium text-white">{quote.company_name || quote.project_name}</div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium uppercase tracking-wide text-gray-500 mb-1">Foreman</label>
                      <div className="flex gap-2">
                        <input
                          type="text" placeholder="Name"
                          value={foremans[quote.id] || ''}
                          onChange={(e) => setForemans(prev => ({ ...prev, [quote.id]: e.target.value }))}
                          className={`flex-1 ${inputCls}`}
                        />
                        <input
                          type="tel" placeholder="Phone"
                          value={foremanPhones[quote.id] || ''}
                          onChange={(e) => setForemanPhones(prev => ({ ...prev, [quote.id]: e.target.value }))}
                          className={`w-36 ${inputCls}`}
                        />
                      </div>
                      {foremanPhones[quote.id] && (
                        <a href={`sms:${foremanPhones[quote.id]}`}
                          className="mt-1.5 inline-flex items-center gap-1.5 rounded-lg border border-accent/30 bg-accent-soft px-3 py-1 text-xs font-medium text-accent transition hover:bg-accent-soft"
                        >
                          <Phone className="h-3 w-3" />{foremanPhones[quote.id]}
                        </a>
                      )}
                    </div>

                    <div>
                      <span className="text-xs font-medium uppercase tracking-wide text-gray-500">Equipment</span>
                      <p className="mt-0.5 text-xs text-gray-300">{buildEquipmentSummary(quote)}</p>
                    </div>

                    {(quote.contact_name || quote.site_phone) && (
                      <div>
                        <span className="text-xs font-medium uppercase tracking-wide text-gray-500">Site Contact</span>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          {quote.contact_name && <span className="text-xs font-medium text-white">{quote.contact_name}</span>}
                          {quote.site_phone && (
                            <a href={`tel:${quote.site_phone}`}
                              className="flex items-center gap-1.5 rounded-lg border border-accent/30 bg-accent-soft px-3 py-1 text-xs font-medium text-accent"
                            >
                              <Phone className="h-3 w-3" />{quote.site_phone}
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    {quote.scope_of_work && (
                      <div>
                        <span className="text-xs font-medium uppercase tracking-wide text-gray-500">Scope</span>
                        <p className="mt-0.5 text-xs text-gray-400 line-clamp-3">{quote.scope_of_work}</p>
                      </div>
                    )}
                  </div>
                ))}

                {/* Briefing text + actions */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium uppercase tracking-wide text-gray-400">Briefing Text</label>
                    <div className="flex items-center gap-2">
                      {showEmailPrompt ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="email" placeholder="Your email" value={emailInputDraft}
                            onChange={(e) => setEmailInputDraft(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveEmail()}
                            autoFocus
                            className={`w-48 ${inputCls}`}
                          />
                          <Button size="sm" icon={Send} onClick={handleSaveEmail} disabled={emailLoading || !emailInputDraft.trim()} loading={emailLoading}>
                            Send
                          </Button>
                          <button onClick={() => { setShowEmailPrompt(false); setEmailInputDraft('') }} className="p-1 hover:bg-surface-raised rounded-lg">
                            <X className="h-4 w-4 text-gray-500" />
                          </button>
                        </div>
                      ) : (
                        <Button
                          variant="secondary" size="sm" icon={Send}
                          onClick={handleEmailToSelf}
                          disabled={emailLoading || !supabase}
                          loading={emailLoading}
                        >
                          Email to Self
                        </Button>
                      )}
                      <Button
                        variant={briefingCopied ? 'primary' : 'secondary'}
                        size="sm"
                        icon={briefingCopied ? CheckCircle : Copy}
                        onClick={copyBriefing}
                      >
                        {briefingCopied ? 'Copied' : 'Copy'}
                      </Button>
                    </div>
                  </div>
                  <textarea
                    readOnly
                    value={buildBriefingText()}
                    rows={Math.min(matchedQuotes.length * 8 + 2, 24)}
                    className={`w-full ${inputCls} resize-y text-xs font-mono leading-relaxed`}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 rounded-xl bg-surface-raised border border-surface-overlay px-6 py-3 shadow-modal text-sm font-medium text-white pointer-events-none z-[60]">
          {toastMsg}
        </div>
      )}
    </Modal>
  )
}

export default DailyConfirmationModal
