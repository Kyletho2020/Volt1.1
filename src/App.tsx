import React, { useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import {
  FileText,
  Bot,
  Plus,
  Copy,
  CheckCircle,
  Mail,
  Save,
  RefreshCcw,
  Truck
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useSessionId } from './hooks/useSessionId'
import { useApiKey } from './hooks/useApiKey'
import AIExtractorModal from './components/AIExtractorModal'
import { generateEmailTemplate, generateScopeTemplate } from './components/PreviewTemplates'
import QuoteSaveManager from './components/QuoteSaveManager'
import ClarificationsSection from './components/ClarificationsSection'
import EquipmentForm from './components/EquipmentForm'
import LogisticsForm from './components/LogisticsForm'
import LogisticsQuoteEmailCard from './components/LogisticsQuoteEmailCard'
import useEquipmentForm from './hooks/useEquipmentForm'
import useLogisticsForm from './hooks/useLogisticsForm'
import useModals from './hooks/useModals'
import { EquipmentRequirements } from './components/EquipmentRequired'
import { EquipmentData, LogisticsData } from './types'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { equipmentSchema, logisticsSchema } from './lib/validation'
import { createLogisticsPiece } from './lib/logisticsPieces'
import { parseAddressParts } from './lib/address'
import { HubSpotContact } from './services/hubspotService'
import { QuoteService } from './services/quoteService'

type TemplateType = 'email' | 'scope' | 'logistics'

const App: React.FC = () => {
  const {
    equipmentData,
    setEquipmentData,
    initialEquipmentData,
    handleEquipmentChange,
    handleEquipmentRequirementsChange,
    handleSelectHubSpotContact: baseHandleSelectHubSpotContact
  } = useEquipmentForm()

  const {
    logisticsData,
    setLogisticsData,
    selectedPieces,
    setSelectedPieces,
    initialLogisticsData,
    handleLogisticsChange,
    handlePieceChange,
    addPiece,
    removePiece,
    togglePieceSelection,
    deleteSelectedPieces,
    movePiece
  } = useLogisticsForm()

  const equipmentForm = useForm<EquipmentData>({
    resolver: yupResolver(equipmentSchema),
    defaultValues: equipmentData,
    mode: 'onBlur'
  })

  const logisticsForm = useForm<LogisticsData>({
    resolver: yupResolver(logisticsSchema),
    defaultValues: logisticsData,
    mode: 'onBlur'
  })

  useEffect(() => {
    equipmentForm.reset(equipmentData)
  }, [equipmentData])

  useEffect(() => {
    logisticsForm.reset(logisticsData)
  }, [logisticsData])


  const {
    showAIExtractor,
    openAIExtractor,
    closeAIExtractor,
    showHistory,
    openHistory,
    closeHistory
  } = useModals()

  const [extractorMode, setExtractorMode] = useState<'all' | 'logistics' | 'scope'>('all')
  const [activeWorkspace, setActiveWorkspace] = useState<'equipment' | 'logistics'>('equipment')
  const [activeQuoteId, setActiveQuoteId] = useState<string | null>(null)
  const [activeQuoteNumber, setActiveQuoteNumber] = useState<string | null>(null)
  const [isQuickSaving, setIsQuickSaving] = useState(false)
  const [quickSaveMessage, setQuickSaveMessage] = useState<string | null>(null)
  const [quickSaveState, setQuickSaveState] = useState<'idle' | 'success' | 'error'>('idle')

  const handleOpenExtractor = (mode: 'all' | 'logistics' | 'scope') => {
    setExtractorMode(mode)
    openAIExtractor()
  }

  // Hooks
  const sessionId = useSessionId()
  const { hasApiKey } = useApiKey()

  // Auto-populate pickup address from project address
  useEffect(() => {
    if (equipmentData.siteAddress && !logisticsData.pickupAddress) {
      setLogisticsData(prev => ({
        ...prev,
        pickupAddress: equipmentData.siteAddress
      }))
    }
  }, [equipmentData.siteAddress])

  const copySiteAddressToPickup = () => {
    const siteAddress = equipmentData.siteAddress?.trim()
    if (!siteAddress) {
      return false
    }

    const { street, city, state, zip } = parseAddressParts(siteAddress)

    setLogisticsData(prev => ({
      ...prev,
      pickupAddress: street || siteAddress,
      pickupCity: city,
      pickupState: state,
      pickupZip: zip
    }))

    return true
  }

  const handleSelectHubSpotContact = (contact: HubSpotContact) => {
    baseHandleSelectHubSpotContact(contact)
    setLogisticsData(prev => ({
      ...prev,
      pickupAddress: contact.contactAddress1 || contact.companyAddress1 || prev.pickupAddress,
      pickupCity: contact.contactCity || contact.companyCity || prev.pickupCity,
      pickupState: contact.contactState || contact.companyState || prev.pickupState,
      pickupZip: contact.contactZip || contact.companyZip || prev.pickupZip
    }))
  }

  const handleAIExtraction = (
    extractedEquipmentData: Partial<EquipmentData>,
    extractedLogisticsData: Partial<LogisticsData>
  ) => {
    console.log('handleAIExtraction called with:', { extractedEquipmentData, extractedLogisticsData })

    if (extractedEquipmentData) {
      const mappedEquipmentData: Partial<EquipmentData> = {}

      if (extractedEquipmentData.projectName) {
        mappedEquipmentData.projectName = extractedEquipmentData.projectName
      }

      if (extractedEquipmentData.companyName) {
        mappedEquipmentData.companyName = extractedEquipmentData.companyName
      }

      if (extractedEquipmentData.contactName) {
        mappedEquipmentData.contactName = extractedEquipmentData.contactName
      }

      const siteAddress = extractedEquipmentData.projectAddress || extractedEquipmentData.siteAddress
      if (siteAddress) {
        mappedEquipmentData.siteAddress = siteAddress
      }

      const sitePhone = extractedEquipmentData.phone || extractedEquipmentData.sitePhone
      if (sitePhone) {
        mappedEquipmentData.sitePhone = sitePhone
      }

      if (extractedEquipmentData.email) {
        mappedEquipmentData.email = extractedEquipmentData.email
      }

      if (extractedEquipmentData.scopeOfWork) {
        mappedEquipmentData.scopeOfWork = extractedEquipmentData.scopeOfWork
      }

      if (Object.keys(mappedEquipmentData).length > 0) {
        console.log('Updating equipment data with:', mappedEquipmentData)
        setEquipmentData(prev => ({ ...prev, ...mappedEquipmentData }))
      }
    }

    if (extractedLogisticsData) {
      const mappedLogisticsData: Partial<LogisticsData> = {}
      
      // Map pieces data
      if (extractedLogisticsData.pieces && Array.isArray(extractedLogisticsData.pieces)) {
        mappedLogisticsData.pieces = extractedLogisticsData.pieces.map(piece =>
          createLogisticsPiece({
            id: piece.id,
            description: piece.description || '',
            quantity: piece.quantity || 1,
            length: piece.length?.toString() || '',
            width: piece.width?.toString() || '',
            height: piece.height?.toString() || '',
            weight: piece.weight?.toString() || ''
          })
        )
      }
      
      // Map address data
      if (extractedLogisticsData.pickupAddress) mappedLogisticsData.pickupAddress = extractedLogisticsData.pickupAddress
      if (extractedLogisticsData.pickupCity) mappedLogisticsData.pickupCity = extractedLogisticsData.pickupCity
      if (extractedLogisticsData.pickupState) mappedLogisticsData.pickupState = extractedLogisticsData.pickupState
      if (extractedLogisticsData.pickupZip) mappedLogisticsData.pickupZip = extractedLogisticsData.pickupZip
      if (extractedLogisticsData.deliveryAddress) mappedLogisticsData.deliveryAddress = extractedLogisticsData.deliveryAddress
      if (extractedLogisticsData.deliveryCity) mappedLogisticsData.deliveryCity = extractedLogisticsData.deliveryCity
      if (extractedLogisticsData.deliveryState) mappedLogisticsData.deliveryState = extractedLogisticsData.deliveryState
      if (extractedLogisticsData.deliveryZip) mappedLogisticsData.deliveryZip = extractedLogisticsData.deliveryZip
      if (extractedLogisticsData.truckType) mappedLogisticsData.truckType = extractedLogisticsData.truckType
      
      console.log('Updating logistics data with:', mappedLogisticsData)
      setLogisticsData(prev => ({ ...prev, ...mappedLogisticsData }))
    }
  }

  const handleLoadQuote = (
    loadedEquipmentData: EquipmentData,
    loadedLogisticsData: LogisticsData,
    loadedEquipmentRequirements?: EquipmentRequirements,
    quoteId?: string,
    quoteNumber?: string
  ) => {
    setEquipmentData({
      ...loadedEquipmentData,
      equipmentRequirements:
        loadedEquipmentRequirements || initialEquipmentData.equipmentRequirements
    })
    const legacyStorageType = (loadedLogisticsData as Record<string, unknown>)
      .storageType as string | undefined
    const normalizedStorageLocation =
      loadedLogisticsData.storageLocation || legacyStorageType || ''

    setLogisticsData({
      ...initialLogisticsData,
      ...loadedLogisticsData,
      truckType: loadedLogisticsData.truckType || '',
      shipmentType: loadedLogisticsData.shipmentType || '',
      includeStorage:
        loadedLogisticsData.includeStorage ??
        Boolean(normalizedStorageLocation),
      storageLocation: normalizedStorageLocation,
      storageSqFt: loadedLogisticsData.storageSqFt || '',
      pieces: loadedLogisticsData.pieces
        ? loadedLogisticsData.pieces.map(piece => createLogisticsPiece(piece))
        : initialLogisticsData.pieces
    })

    if (quoteId) {
      setActiveQuoteId(quoteId)
    }
    if (quoteNumber) {
      setActiveQuoteNumber(quoteNumber)
    }
    setQuickSaveMessage(null)
    setQuickSaveState('idle')
  }

  const handleNewQuote = () => {
    setEquipmentData(initialEquipmentData)
    setLogisticsData(initialLogisticsData)
    setSelectedPieces([])
    setActiveQuoteId(null)
    setActiveQuoteNumber(null)
    setQuickSaveMessage(null)
    setQuickSaveState('idle')
  }

  const [copiedTemplate, setCopiedTemplate] = useState<TemplateType | null>(null)

  const emailTemplate = generateEmailTemplate(
    equipmentData,
    logisticsData,
    equipmentData.equipmentRequirements
  )

  const scopeTemplate = generateScopeTemplate(
    equipmentData,
    logisticsData,
    equipmentData.equipmentRequirements
  )

  const projectNameDisplay =
    equipmentData.projectName?.trim() || 'Untitled project'
  const companyDisplay = equipmentData.companyName?.trim() || 'Awaiting client'
  const contactDisplay = equipmentData.contactName?.trim() || 'No contact set'
  const shipmentDisplay =
    logisticsData.shipmentType?.trim() || 'Shipment not set'
  const piecesCount = logisticsData.pieces?.length ?? 0
  const hasScopeContent = Boolean(equipmentData.scopeOfWork?.trim())
  const aiStatusLabel = hasApiKey ? 'AI Connected' : 'AI Locked'

  const workspaceTabs: { key: 'equipment' | 'logistics'; label: string }[] = [
    { key: 'equipment', label: 'Equipment' },
    { key: 'logistics', label: 'Logistics' }
  ]

  const aiExtractorActions: {
    mode: 'all' | 'scope' | 'logistics'
    label: string
    icon: LucideIcon
  }[] = [
    { mode: 'all', label: 'Full Extract', icon: Bot },
    { mode: 'scope', label: 'Scope Focus', icon: FileText },
    { mode: 'logistics', label: 'Logistics Focus', icon: Truck }
  ]

  const primaryActionButton =
    'flex w-full items-center justify-between gap-2 rounded-2xl border border-accent/20 bg-surface-highlight/60 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-accent hover:bg-accent-soft/40 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent/60'

  const aiControlButton =
    'flex flex-1 items-center justify-center gap-2 rounded-xl border border-accent/25 bg-surface-highlight/60 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:border-accent hover:bg-accent-soft/30 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent/60'

  useEffect(() => {
    if (quickSaveState === 'success' || quickSaveState === 'error') {
      if (typeof window === 'undefined') {
        return
      }

      const timeout = window.setTimeout(() => {
        setQuickSaveMessage(null)
        setQuickSaveState('idle')
      }, 4000)

      return () => window.clearTimeout(timeout)
    }
  }, [quickSaveState])

  const handleQuickSave = async () => {
    if (!activeQuoteId || !activeQuoteNumber) {
      setQuickSaveMessage('Select a saved quote from the library to enable quick save.')
      setQuickSaveState('error')
      openHistory()
      return
    }

    setIsQuickSaving(true)
    setQuickSaveMessage(null)

    try {
      const result = await QuoteService.saveQuote(
        activeQuoteNumber,
        equipmentData,
        logisticsData,
        equipmentData.equipmentRequirements,
        emailTemplate,
        scopeTemplate,
        activeQuoteId
      )

      if (result.success) {
        setQuickSaveState('success')
        setQuickSaveMessage(`Quote ${activeQuoteNumber} updated.`)
        if (result.id) {
          setActiveQuoteId(result.id)
        }
      } else {
        setQuickSaveState('error')
        setQuickSaveMessage(result.error || 'Failed to save quote.')
      }
    } catch (error) {
      console.error('Quick save failed:', error)
      setQuickSaveState('error')
      setQuickSaveMessage('Failed to save quote.')
    } finally {
      setIsQuickSaving(false)
    }
  }

  const handleQuoteSaved = (quoteId: string, quoteNumber: string) => {
    setActiveQuoteId(quoteId)
    setActiveQuoteNumber(quoteNumber)
    setQuickSaveState('success')
    setQuickSaveMessage(`Quote ${quoteNumber} ready for quick save.`)
  }

  const aiControlButtonDisabled =
    'flex flex-1 items-center justify-center gap-2 rounded-xl border border-accent/10 bg-surface/60 px-3 py-2 text-xs font-semibold text-slate-500/80 cursor-not-allowed'

  const statCardClass =
    'rounded-2xl border border-accent/15 bg-surface/60 p-4 shadow-[0_20px_60px_rgba(6,12,24,0.55)] backdrop-blur-lg'

  const copyToClipboard = async (text: string, templateType: TemplateType) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedTemplate(templateType)
      setTimeout(() => setCopiedTemplate(null), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  interface TemplateCardProps {
    title: string
    icon: LucideIcon
    description?: string
    template: string
    templateType: TemplateType
    actions?: ReactNode
  }

  const TemplateCard = ({
    title,
    icon: Icon,
    description,
    template,
    templateType,
    actions
  }: TemplateCardProps) => {
    const isCopied = copiedTemplate === templateType

    return (
      <div className="rounded-3xl border border-accent/15 bg-surface/80 p-6 shadow-[0_30px_100px_rgba(10,18,35,0.55)] backdrop-blur-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/15 text-accent">
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-xl font-semibold text-white">{title}</h2>
              {description && <p className="mt-1 text-sm text-slate-300">{description}</p>}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {actions}
            <button
              type="button"
              onClick={() => copyToClipboard(template, templateType)}
              className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition ${
                isCopied
                  ? 'border-accent/60 bg-accent-soft/50 text-accent'
                  : 'border-accent/25 bg-accent-soft/40 text-slate-100 hover:border-accent hover:bg-accent/15 hover:text-white'
              }`}
            >
              {isCopied ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy
                </>
              )}
            </button>
          </div>
        </div>
        <div className="mt-4 rounded-2xl border border-accent/20 bg-surface-highlight/70 p-4">
          <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed text-slate-200">{template}</pre>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden text-white">
      <div className="absolute inset-0 -z-40 bg-[linear-gradient(140deg,#03060f_0%,#09152a_48%,#02040a_100%)]" />
      <div className="absolute inset-0 -z-30 bg-[radial-gradient(circle_at_16%_20%,rgba(28,255,135,0.18),transparent_58%)]" />
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_82%_12%,rgba(56,189,248,0.18),transparent_62%)]" />
      <div className="absolute -top-48 -left-48 -z-10 h-[28rem] w-[28rem] rounded-full bg-accent/30 blur-[150px] opacity-80" />
      <div className="absolute -bottom-40 right-[-6rem] -z-10 h-[26rem] w-[26rem] rounded-full bg-sky-500/25 blur-[160px] opacity-70" />

      <header className="relative z-10 border-b border-accent/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent-soft/40 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-accent">
                Bolt 3.0 System
              </span>
              <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Volt 1.1 Operations Hub
              </h1>
              <p className="mt-3 max-w-2xl text-base text-slate-300 sm:text-lg">
                Kyle is awesome! Keep being amazing and dont forget to smile!
              </p>
            </div>
            <div className="grid w-full max-w-xl grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className={statCardClass}>
                <span className="text-xs uppercase tracking-[0.28em] text-slate-400">Project</span>
                <p className="mt-2 truncate text-lg font-semibold text-white" title={projectNameDisplay}>
                  {projectNameDisplay}
                </p>
                <p className="mt-3 text-xs text-slate-400">
                  {hasScopeContent ? 'Scope drafted' : 'Scope awaiting details'}
                </p>
              </div>
              <div className={statCardClass}>
                <span className="text-xs uppercase tracking-[0.28em] text-slate-400">Client</span>
                <p className="mt-2 truncate text-lg font-semibold text-white" title={companyDisplay}>
                  {companyDisplay}
                </p>
                <p className="mt-3 truncate text-xs text-slate-400" title={contactDisplay}>
                  Contact: {contactDisplay}
                </p>
              </div>
              <div className={statCardClass}>
                <span className="text-xs uppercase tracking-[0.28em] text-slate-400">Logistics</span>
                <p className="mt-2 truncate text-lg font-semibold text-white" title={shipmentDisplay}>
                  {shipmentDisplay}
                </p>
                <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-[11px] font-semibold text-accent">
                  <Truck className="h-3.5 w-3.5" />
                  {piecesCount} piece{piecesCount === 1 ? '' : 's'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-[1500px] px-4 pb-20 pt-12 sm:px-6 lg:px-8 xl:px-6 2xl:px-0">
        <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1.35fr)_360px] 2xl:grid-cols-[320px_minmax(0,1.5fr)_400px]">
          <aside className="space-y-6">
            <div className="rounded-3xl border border-accent/20 bg-surface/70 p-6 shadow-[0_35px_120px_rgba(10,18,35,0.55)] backdrop-blur-xl">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-accent">Command Center</p>
                <h2 className="mt-3 text-2xl font-semibold text-white">Quote Controls</h2>
                <p className="mt-2 text-sm text-slate-300">
                  Kick off new projects, recall saved work, and orchestrate AI extractions from one panel.
                </p>
              </div>

              <div className="mt-6 space-y-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Workspace</p>
                  <div className="mt-3 space-y-3">
                    <button type="button" onClick={openHistory} className={primaryActionButton}>
                      <span className="flex items-center gap-2">
                        <Save className="h-4 w-4 text-accent" />
                        Save or Load Quote
                      </span>
                      <span className="text-xs text-slate-400">Library</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleQuickSave}
                      className={`${primaryActionButton} ${
                        isQuickSaving
                          ? 'cursor-not-allowed opacity-70'
                          : activeQuoteId
                            ? 'border-accent/40'
                            : 'border-accent/10'
                      }`}
                      disabled={isQuickSaving}
                    >
                      <span className="flex items-center gap-2">
                        <RefreshCcw className="h-4 w-4 text-accent" />
                        {isQuickSaving ? 'Saving…' : 'Quick Save'}
                      </span>
                      <span className="text-xs text-slate-400">
                        {activeQuoteNumber ? `Overwrite ${activeQuoteNumber}` : 'Select quote first'}
                      </span>
                    </button>
                    <button type="button" onClick={handleNewQuote} className={primaryActionButton}>
                      <span className="flex items-center gap-2">
                        <Plus className="h-4 w-4 text-accent" />
                        Start New Quote
                      </span>
                      <span className="text-xs text-slate-400">Reset</span>
                    </button>
                    {quickSaveMessage && (
                      <p
                        className={`text-xs ${
                          quickSaveState === 'error' ? 'text-red-400' : 'text-accent'
                        }`}
                      >
                        {quickSaveMessage}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-400">AI Assistants</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {aiExtractorActions.map(action => {
                      const Icon = action.icon
                      return (
                        <button
                          key={action.mode}
                          type="button"
                          onClick={() => handleOpenExtractor(action.mode)}
                          disabled={!hasApiKey}
                          className={hasApiKey ? aiControlButton : aiControlButtonDisabled}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {action.label}
                        </button>
                      )
                    })}
                  </div>
                  <p className="mt-3 text-xs text-slate-400">
                    {hasApiKey
                      ? 'AI extraction is live for this session—drop a proposal or invoice to auto-fill the workspace.'
                      : 'Connect your secure Supabase key to enable Bolt 3.0 AI extraction and smart parsing.'}
                  </p>
                </div>

                <div className="rounded-2xl border border-accent/15 bg-surface-highlight/60 p-4 text-xs text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-white">Session</span>
                    <span
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold ${
                        hasApiKey ? 'bg-accent/10 text-accent' : 'bg-surface/80 text-slate-400'
                      }`}
                    >
                      <Bot className="h-3.5 w-3.5" />
                      {aiStatusLabel}
                    </span>
                  </div>
                  <p className="mt-2 break-all font-mono text-[11px] text-slate-400">{sessionId}</p>
                  <div className="mt-4 grid gap-2 text-[11px] uppercase tracking-[0.2em] text-slate-500">
                    <div className="flex items-center justify-between">
                      <span>Scope</span>
                      <span
                        className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                          hasScopeContent ? 'bg-accent/10 text-accent' : 'bg-surface/80 text-slate-400'
                        }`}
                      >
                        {hasScopeContent ? 'Ready' : 'Draft'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Pieces</span>
                      <span className="text-white">{piecesCount}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <section className="rounded-3xl border border-accent/20 bg-surface/70 p-6 shadow-[0_35px_120px_rgba(10,18,35,0.55)] backdrop-blur-xl">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Workspace</p>
                <h2 className="mt-3 text-3xl font-semibold text-white">Volt 1.1 Builder</h2>
                <p className="mt-2 text-sm text-slate-300">
                  Toggle between equipment and logistics flows without losing context or data.
                </p>
              </div>
              <div className="grid grid-cols-2 items-center gap-2 rounded-full border border-accent/15 bg-surface-highlight/60 p-1">
                {workspaceTabs.map(tab => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveWorkspace(tab.key)}
                    className={`flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                      activeWorkspace === tab.key
                        ? 'bg-accent text-black shadow-[0_12px_30px_rgba(28,255,135,0.35)]'
                        : 'text-slate-300 hover:text-white'
                    }`}
                    aria-pressed={activeWorkspace === tab.key}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 space-y-6">
              <div className={activeWorkspace === 'equipment' ? 'block' : 'hidden'}>
                <EquipmentForm
                  data={equipmentData}
                  onFieldChange={handleEquipmentChange}
                  onRequirementsChange={handleEquipmentRequirementsChange}
                  onSelectContact={handleSelectHubSpotContact}
                  onCopySiteAddress={copySiteAddressToPickup}
                  onOpenScopeExtractor={() => handleOpenExtractor('scope')}
                  canUseAI={hasApiKey}
                  register={equipmentForm.register}
                  errors={equipmentForm.formState.errors}
                />
              </div>
              <div className={activeWorkspace === 'logistics' ? 'block' : 'hidden'}>
                <div className="space-y-6">
                  <LogisticsForm
                    data={logisticsData}
                    selectedPieces={selectedPieces}
                    onFieldChange={handleLogisticsChange}
                    onPieceChange={handlePieceChange}
                    addPiece={addPiece}
                    removePiece={removePiece}
                    togglePieceSelection={togglePieceSelection}
                    deleteSelectedPieces={deleteSelectedPieces}
                    movePiece={movePiece}
                    onOpenLogisticsExtractor={() => handleOpenExtractor('logistics')}
                    canUseAI={hasApiKey}
                    register={logisticsForm.register}
                    errors={logisticsForm.formState.errors}
                  />
                  {logisticsData.shipmentType && (
                    <LogisticsQuoteEmailCard
                      equipmentData={equipmentData}
                      logisticsData={logisticsData}
                    />
                  )}
                </div>
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <TemplateCard
              title="Scope of Work"
              icon={FileText}
              description="Polished narrative ready for your proposal or internal hand-off."
              template={scopeTemplate}
              templateType="scope"
            />
            <TemplateCard
              title="Client Email"
              icon={Mail}
              description="Instant client communication built from the details you capture."
              template={emailTemplate}
              templateType="email"
            />
          </aside>
        </div>

        <div className="mt-12 space-y-12">
          <section className="space-y-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Reference Library</span>
                <h2 className="mt-3 text-3xl font-semibold text-white">Clarifications</h2>
                <p className="mt-2 text-sm text-slate-300">
                  Keep your standard terms aligned with Volt's refreshed quoting experience.
                </p>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <ClarificationsSection
                title="Machinery Moving"
                initialItems={[
                  'Any change to the job will require approval in writing prior to completion of work.',
                  'Customer is to supply clear pathway for all items to be loaded onto trailers',
                  'Quote is based on no site visit and is not responsible for cracks in pavement or other unforeseen causes to not be able to perform work'
                ]}
              />
              <ClarificationsSection
                title="Crane"
                initialItems={[
                  'Crew to take half hour meal break between 4 - 5 hour start of shift in yard.',
                  'Customer may work crew through first meal break and pay missed meal charge of $175 per crew member.',
                  '60 ton boom truck quoted and 6 and 8 hour minimums. 8 hour quoted for budget.',
                  'Quoted straight time and portal to portal.',
                  'Overtime overtime to be charged $65/hour.',
                  'Straight time is the first 8 hours worked between 5am - 6pm Monday through Friday including travel and dismantle.',
                  'Customer may work crew through meal with signature on work ticket and pay missed meal charge of $175 per crew member per missed meal.',
                  'Mandatory missed meal charge at 10 hours from start of shift.'
                ]}
              />
            </div>
          </section>
        </div>

        <footer className="mt-16 border-t border-accent/10 pt-6 text-center text-xs text-slate-500">
          Crafted for Omega Morgan&apos;s Bolt 3.0 design language · Session ID: {sessionId}
        </footer>
      </main>

      <AIExtractorModal
        isOpen={showAIExtractor}
        onClose={closeAIExtractor}
        onExtract={handleAIExtraction}
        sessionId={sessionId}
        mode={extractorMode}
      />

      <QuoteSaveManager
        equipmentData={equipmentData}
        equipmentRequirements={equipmentData.equipmentRequirements}
        logisticsData={logisticsData}
        isOpen={showHistory}
        onClose={closeHistory}
        onLoadQuote={handleLoadQuote}
        onQuoteSaved={handleQuoteSaved}
      />
    </div>
  )
}

export default App
