/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react'
import { Save, History, Search, Trash2, Edit3, Copy, Calendar, Building, User, FileText, X, Plus } from 'lucide-react'
import { QuoteService, QuoteListItem } from '../services/quoteService'
import { generateEmailTemplate, generateScopeTemplate } from './PreviewTemplates'

interface QuoteSaveManagerProps {
  equipmentData: any
  logisticsData: any
  equipmentRequirements: any
  onLoadQuote: (
    equipmentData: any,
    logisticsData: any,
    equipmentRequirements: any,
    emailTemplate: string,
    scopeTemplate: string
  ) => void
  isOpen: boolean
  onClose: () => void
}

const QuoteSaveManager: React.FC<QuoteSaveManagerProps> = ({
  equipmentData,
  logisticsData,
  equipmentRequirements,
  onLoadQuote,
  isOpen,
  onClose
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
    if (isOpen) {
      loadQuotes()
      generateNewQuoteNumber()
    }
  }, [isOpen])

  useEffect(() => {
    if (searchTerm.trim()) {
      searchQuotes()
    } else {
      loadQuotes()
    }
  }, [searchTerm])

  const generateNewQuoteNumber = () => {
    const newNumber = QuoteService.generateQuoteNumber(
      equipmentData.projectName,
      equipmentData.companyName
    )
    setQuoteNumber(newNumber)
  }

  const loadQuotes = async () => {
    setLoading(true)
    try {
      const quoteList = await QuoteService.listQuotes()
      setQuotes(quoteList)
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
      const results = await QuoteService.searchQuotes(searchTerm)
      setQuotes(results)
    } catch (error) {
      console.error('Error searching quotes:', error)
      setMessage({ type: 'error', text: 'Failed to search quotes' })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveQuote = async (overwriteId?: string) => {
    if (!quoteNumber.trim()) {
      setMessage({ type: 'error', text: 'Quote number is required' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const emailTemplate = generateEmailTemplate(
        equipmentData,
        logisticsData,
        equipmentRequirements
      )
      const scopeTemplate = generateScopeTemplate(
        equipmentData,
        logisticsData,
        equipmentRequirements
      )

      const result = await QuoteService.saveQuote(
        quoteNumber,
        equipmentData,
        logisticsData,
        equipmentRequirements,
        emailTemplate,
        scopeTemplate,
        overwriteId
      )

      if (result.success) {
        setMessage({ 
          type: 'success', 
          text: overwriteId ? 'Quote updated successfully!' : 'Quote saved successfully!' 
        })
        loadQuotes()
        setSelectedQuote(null)
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
        // Load the quote data into the forms
        const loadedEquipmentData = {
          projectName: quote.project_name || '',
          companyName: quote.company_name || '',
          contactName: quote.contact_name || '',
          sitePhone: quote.site_phone || '',
          shopLocation: quote.shop_location || 'Shop',
          siteAddress: quote.site_address || '',
          scopeOfWork: quote.scope_of_work || '',
          email: '',
        }

        const defaultRequirements = {
          crewSize: '',
          forklifts: [],
          tractors: [],
          trailers: [],
          additionalEquipment: []
        }

        const loadedRequirements = quote.equipment_requirements
          ? { ...defaultRequirements, ...quote.equipment_requirements }
          : defaultRequirements

        const loadedLogisticsData = {
          ...(quote.logistics_data || {}),
          ...(quote.logistics_shipment ? { shipment: quote.logistics_shipment } : {}),
          ...(quote.logistics_storage ? { storage: quote.logistics_storage } : {})
        }

        onLoadQuote(
          loadedEquipmentData,
          loadedLogisticsData,
          loadedRequirements,
          quote.email_template || '',
          quote.scope_template || ''
        )
        setMessage({ type: 'success', text: 'Quote loaded successfully!' })
        setShowHistory(false)
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to load quote' })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteQuote = async (id: string) => {
    if (!confirm('Are you sure you want to delete this quote?')) return

    setLoading(true)
    try {
      const success = await QuoteService.deleteQuote(id)
      if (success) {
        setMessage({ type: 'success', text: 'Quote deleted successfully!' })
        loadQuotes()
        setSelectedQuote(null)
      } else {
        setMessage({ type: 'error', text: 'Failed to delete quote' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to delete quote' })
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border-2 border-accent rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2 border-accent">
          <div className="flex items-center">
            <Save className="w-6 h-6 text-white mr-2" />
            <h3 className="text-xl font-bold text-white">Quote Manager</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {usingLocalStorage && (
          <div className="mx-6 mt-4 rounded-lg border border-yellow-500/40 bg-yellow-500/10 p-3 text-sm text-yellow-100">
            Supabase isn't configured in this environment. Quotes will be stored locally in this browser only.
          </div>
        )}

        {/* Message */}
        {message && (
          <div className={`mx-6 mt-4 p-3 rounded-lg flex items-center ${
            message.type === 'success'
              ? 'bg-gray-900 text-white border border-accent'
              : 'bg-gray-900 text-white border border-red-500'
          }`}>
            {message.text}
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Save Section */}
          <div className="w-1/2 p-6 border-r-2 border-accent">
            <h4 className="text-lg font-semibold text-white mb-4">Save Quote</h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Quote Number
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={quoteNumber}
                    onChange={(e) => setQuoteNumber(e.target.value)}
                    className="flex-1 px-3 py-2 bg-black border border-accent rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-white"
                    placeholder="Enter quote number"
                  />
                  <button
                    onClick={generateNewQuoteNumber}
                    className="px-3 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    title="Generate new number"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="bg-black rounded-lg p-4 border border-accent">
                <h5 className="text-sm font-medium text-white mb-2">Current Quote Info</h5>
                <div className="space-y-1 text-sm text-gray-300">
                  <div className="flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    <span>{equipmentData.projectName || 'No project name'}</span>
                  </div>
                  <div className="flex items-center">
                    <Building className="w-4 h-4 mr-2" />
                    <span>{equipmentData.companyName || 'No company'}</span>
                  </div>
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    <span>{equipmentData.contactName || 'No contact'}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleSaveQuote()}
                  disabled={loading || !quoteNumber.trim()}
                  className="flex-1 flex items-center justify-center px-4 py-2 bg-accent text-black rounded-lg hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save New
                </button>
                
                {selectedQuote && (
                  <button
                    onClick={() => handleSaveQuote(selectedQuote)}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Overwrite
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* History Section */}
          <div className="w-1/2 flex flex-col">
            <div className="p-6 border-b-2 border-accent">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-white">Quote History</h4>
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="flex items-center px-3 py-1 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <History className="w-4 h-4 mr-1" />
                  {showHistory ? 'Hide' : 'Show'}
                </button>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search quotes..."
                  className="w-full pl-10 pr-4 py-2 bg-black border border-accent rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-white placeholder-gray-400"
                />
              </div>
            </div>

            {showHistory && (
              <div className="flex-1 overflow-y-auto p-6">
                {loading ? (
                  <div className="text-center text-white py-8">Loading...</div>
                ) : quotes.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    {searchTerm ? 'No quotes found' : 'No saved quotes'}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {quotes.map((quote) => (
                      <div
                        key={quote.id}
                        className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                          selectedQuote === quote.id
                            ? 'border-accent bg-gray-800'
                            : 'border-gray-600 bg-black hover:border-accent hover:bg-gray-800'
                        }`}
                        onClick={() => setSelectedQuote(selectedQuote === quote.id ? null : quote.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center mb-1">
                              <FileText className="w-4 h-4 text-accent mr-2 flex-shrink-0" />
                              <span className="font-medium text-white truncate">
                                {quote.quote_number}
                              </span>
                            </div>
                            
                            {quote.project_name && (
                              <div className="flex items-center mb-1">
                                <Building className="w-3 h-3 text-gray-400 mr-2 flex-shrink-0" />
                                <span className="text-sm text-gray-300 truncate">
                                  {quote.project_name}
                                </span>
                              </div>
                            )}
                            
                            {quote.company_name && (
                              <div className="flex items-center mb-1">
                                <User className="w-3 h-3 text-gray-400 mr-2 flex-shrink-0" />
                                <span className="text-sm text-gray-300 truncate">
                                  {quote.company_name}
                                </span>
                              </div>
                            )}
                            
                            <div className="flex items-center">
                              <Calendar className="w-3 h-3 text-gray-400 mr-2 flex-shrink-0" />
                              <span className="text-xs text-gray-400">
                                {formatDate(quote.updated_at)}
                              </span>
                            </div>
                          </div>

                          {selectedQuote === quote.id && (
                            <div className="flex gap-1 ml-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleLoadQuote(quote.id)
                                }}
                                className="p-1 bg-accent text-black rounded hover:bg-green-400 transition-colors"
                                title="Load quote"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteQuote(quote.id)
                                }}
                                className="p-1 bg-red-600 text-white rounded hover:bg-red-500 transition-colors"
                                title="Delete quote"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
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

        {/* Footer */}
        <div className="p-6 border-t-2 border-accent bg-gray-900">
          <p className="text-sm text-gray-400">
            Quote numbers are automatically generated based on project/company name and timestamp. 
            Click on a quote in history to select it for overwriting or loading.
          </p>
        </div>
      </div>
    </div>
  )
}

export default QuoteSaveManager
