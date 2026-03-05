/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react'
import { Save, History, Search, Trash2, Edit3, Copy, Calendar, Building, User, FileText, Plus, Mail } from 'lucide-react'
import { QuoteService, QuoteListItem } from '../services/quoteService'
import { generateEmailTemplate, generateScopeTemplate } from './PreviewTemplates'
import { ensureJobFolders } from '../lib/projectFolders'
import { Modal, Button, IconButton } from './ui'

interface QuoteSaveManagerProps {
  equipmentData: any
  logisticsData: any
  equipmentRequirements: any
  onLoadQuote: (
    equipmentData: any,
    logisticsData: any,
    equipmentRequirements: any,
    quoteId?: string,
    quoteNumber?: string
  ) => void
  isOpen: boolean
  onClose: () => void
  onQuoteSaved?: (quoteId: string, quoteNumber: string) => void
  onQuoteLoaded?: (quoteId: string, quoteNumber: string) => void
}

const QuoteSaveManager: React.FC<QuoteSaveManagerProps> = ({
  equipmentData,
  logisticsData,
  equipmentRequirements,
  onLoadQuote,
  isOpen,
  onClose,
  onQuoteSaved,
  onQuoteLoaded
}) => {
  const usingLocalStorage = !QuoteService.isRemoteEnabled()
  const [quoteNumber, setQuoteNumber] = useState('')
  const [quotes, setQuotes] = useState<QuoteListItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedQuote, setSelectedQuote] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    if (isOpen) { loadQuotes(); generateNewQuoteNumber() }
  }, [isOpen])

  useEffect(() => {
    if (searchTerm.trim()) searchQuotes()
    else loadQuotes()
  }, [searchTerm])

  const generateNewQuoteNumber = () => {
    setQuoteNumber(QuoteService.generateQuoteNumber(equipmentData.projectName, equipmentData.companyName))
  }

  const loadQuotes = async () => {
    setLoading(true)
    try {
      setQuotes(await QuoteService.listQuotes())
    } catch (error) {
      console.error('Error loading quotes:', error)
      setMessage({ type: 'error', text: 'Failed to load quote history' })
    } finally {
      setLoading(false)
    }
  }

  const searchQuotes = async () => {
    if (!searchTerm.trim()) return
    setLoading(true)
    try {
      setQuotes(await QuoteService.searchQuotes(searchTerm))
    } catch (error) {
      console.error('Error searching quotes:', error)
      setMessage({ type: 'error', text: 'Failed to search quotes' })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveQuote = async (overwriteId?: string) => {
    if (!quoteNumber.trim()) { setMessage({ type: 'error', text: 'Quote number is required' }); return }
    setLoading(true)
    setMessage(null)
    try {
      const emailTemplate = generateEmailTemplate(equipmentData, logisticsData, equipmentRequirements)
      const scopeTemplate = generateScopeTemplate(equipmentData, logisticsData, equipmentRequirements)
      const result = await QuoteService.saveQuote(quoteNumber, equipmentData, logisticsData, equipmentRequirements, emailTemplate, scopeTemplate, overwriteId)
      if (result.success) {
        let folderNote = ''
        if (equipmentData.companyName) {
          const folders = await ensureJobFolders(equipmentData.companyName, equipmentData.jobNumber || undefined, equipmentData.projectName || undefined)
          if (folders.created) folderNote = `  |  Folder: ${folders.path}`
          else if (folders.error && folders.supported) folderNote = `  |  ${folders.error}`
        }
        setMessage({ type: 'success', text: (overwriteId ? 'Quote updated!' : 'Quote saved!') + folderNote })
        loadQuotes()
        const resultingId = result.id || overwriteId || null
        setSelectedQuote(resultingId)
        if (resultingId) onQuoteSaved?.(resultingId, quoteNumber)
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to save quote' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to save quote' })
    } finally {
      setLoading(false)
    }
  }

  const handleLoadQuote = async (id: string) => {
    setLoading(true)
    try {
      const quote = await QuoteService.getQuote(id)
      if (quote) {
        const loadedEquipmentData = {
          jobNumber: quote.job_number || '', startTime: quote.start_time || '',
          projectName: quote.project_name || '', companyName: quote.company_name || '',
          contactName: quote.contact_name || '', sitePhone: quote.site_phone || '',
          shopLocation: quote.shop_location || 'Shop', siteAddress: quote.site_address || '',
          scopeOfWork: quote.scope_of_work || '', email: quote.email || ''
        }
        const defaultReq = { crewSize: '', forklifts: [], tractors: [], trailers: [], additionalEquipment: [] }
        const loadedReq = quote.equipment_requirements ? { ...defaultReq, ...quote.equipment_requirements } : defaultReq
        const loadedLogistics = {
          ...(quote.logistics_data || {}),
          ...(quote.logistics_shipment ? { shipment: quote.logistics_shipment } : {}),
          ...(quote.logistics_storage ? { storage: quote.logistics_storage } : {})
        }
        setQuoteNumber(quote.quote_number || quoteNumber)
        setSelectedQuote(id)
        onLoadQuote(loadedEquipmentData, loadedLogistics, loadedReq, id, quote.quote_number || quoteNumber)
        setMessage({ type: 'success', text: 'Quote loaded!' })
        setShowHistory(false)
        onQuoteLoaded?.(id, quote.quote_number || quoteNumber)
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to load quote' })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteQuote = async (id: string) => {
    if (!confirm('Delete this quote?')) return
    setLoading(true)
    try {
      const success = await QuoteService.deleteQuote(id)
      if (success) { setMessage({ type: 'success', text: 'Quote deleted!' }); loadQuotes(); setSelectedQuote(null) }
      else setMessage({ type: 'error', text: 'Failed to delete quote' })
    } catch {
      setMessage({ type: 'error', text: 'Failed to delete quote' })
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Quote Manager" size="xl">
      {usingLocalStorage && (
        <div className="mx-6 mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-300">
          Supabase not configured. Quotes stored locally.
        </div>
      )}

      {message && (
        <div className={`mx-6 mt-3 p-3 rounded-lg text-sm ${
          message.type === 'success' ? 'bg-accent-soft text-accent border border-accent/30' : 'bg-red-500/10 text-red-300 border border-red-500/30'
        }`}>
          {message.text}
        </div>
      )}

      <div className="flex-1 overflow-hidden flex min-h-[400px]">
        {/* Save Section */}
        <div className="w-1/2 p-6 border-r border-surface-overlay/50">
          <h4 className="text-sm font-semibold text-white mb-4">Save Quote</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-gray-400 mb-1">Quote Number</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={quoteNumber}
                  onChange={(e) => setQuoteNumber(e.target.value)}
                  className="flex-1 rounded-lg border border-surface-overlay bg-surface-raised px-3 py-2 text-sm text-white focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  placeholder="Enter quote number"
                />
                <IconButton icon={Plus} onClick={generateNewQuoteNumber} tooltip="Generate new number" />
              </div>
            </div>

            <div className="rounded-lg border border-surface-overlay/50 bg-surface-raised p-3">
              <h5 className="text-xs font-semibold text-white mb-2">Current Quote</h5>
              <div className="space-y-1 text-xs text-gray-400">
                <div className="flex items-center gap-2"><FileText className="w-3.5 h-3.5" />{equipmentData.projectName || 'No project name'}</div>
                <div className="flex items-center gap-2"><Building className="w-3.5 h-3.5" />{equipmentData.companyName || 'No company'}</div>
                <div className="flex items-center gap-2"><User className="w-3.5 h-3.5" />{equipmentData.contactName || 'No contact'}</div>
                <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" />{equipmentData.email || 'No email'}</div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => handleSaveQuote()}
                disabled={loading || !quoteNumber.trim()}
                icon={Save}
                className="flex-1"
              >
                Save New
              </Button>
              {selectedQuote && (
                <Button
                  variant="secondary"
                  onClick={() => handleSaveQuote(selectedQuote)}
                  disabled={loading}
                  icon={Edit3}
                  className="flex-1"
                >
                  Overwrite
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* History Section */}
        <div className="w-1/2 flex flex-col">
          <div className="p-6 border-b border-surface-overlay/50">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-white">Quote History</h4>
              <Button variant="ghost" size="sm" icon={History} onClick={() => setShowHistory(!showHistory)}>
                {showHistory ? 'Hide' : 'Show'}
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search quotes..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-surface-overlay bg-surface-raised text-sm text-white placeholder-gray-500 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>

          {showHistory && (
            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="text-center text-gray-500 py-8 text-sm">Loading...</div>
              ) : quotes.length === 0 ? (
                <div className="text-center text-gray-500 py-8 text-sm">
                  {searchTerm ? 'No quotes found' : 'No saved quotes'}
                </div>
              ) : (
                <div className="space-y-2">
                  {quotes.map((quote) => (
                    <div
                      key={quote.id}
                      className={`p-3 rounded-lg border cursor-pointer transition ${
                        selectedQuote === quote.id
                          ? 'border-accent/40 bg-accent-soft'
                          : 'border-surface-overlay/50 bg-surface-raised hover:border-accent/20'
                      }`}
                      onClick={() => {
                        const isCurrent = selectedQuote === quote.id
                        setSelectedQuote(isCurrent ? null : quote.id)
                        if (!isCurrent) setQuoteNumber(quote.quote_number || '')
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <FileText className="w-3.5 h-3.5 text-accent shrink-0" />
                            <span className="text-sm font-medium text-white truncate">{quote.quote_number}</span>
                          </div>
                          {quote.project_name && (
                            <div className="flex items-center gap-2 text-xs text-gray-400 truncate">
                              <Building className="w-3 h-3 shrink-0" />{quote.project_name}
                            </div>
                          )}
                          {quote.company_name && (
                            <div className="flex items-center gap-2 text-xs text-gray-400 truncate">
                              <User className="w-3 h-3 shrink-0" />{quote.company_name}
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                            <Calendar className="w-3 h-3 shrink-0" />{formatDate(quote.updated_at)}
                          </div>
                        </div>

                        {selectedQuote === quote.id && (
                          <div className="flex gap-1 ml-2">
                            <IconButton
                              icon={Copy}
                              size="sm"
                              variant="accent"
                              tooltip="Load quote"
                              onClick={(e) => { e.stopPropagation(); handleLoadQuote(quote.id) }}
                            />
                            <IconButton
                              icon={Trash2}
                              size="sm"
                              variant="danger"
                              tooltip="Delete quote"
                              onClick={(e) => { e.stopPropagation(); handleDeleteQuote(quote.id) }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="px-6 py-3 border-t border-surface-overlay/50">
        <p className="text-xs text-gray-500">
          Click a quote in history to select it for overwriting or loading.
        </p>
      </div>
    </Modal>
  )
}

export default QuoteSaveManager
