import React, { useState, useEffect } from 'react'
import {
  FileText,
  Bot,
  Archive,
  Plus,
  Copy,
  CheckCircle,
  Mail,
  Save,
  Truck
} from 'lucide-react'
import { useSessionId } from './hooks/useSessionId'
import { useApiKey } from './hooks/useApiKey'
import AIExtractorModal from './components/AIExtractorModal'
import {
  generateEmailTemplate,
  generateScopeTemplate,
  generateLogisticsEmail
} from './components/PreviewTemplates'
import QuoteSaveManager from './components/QuoteSaveManager'
import ClarificationsSection from './components/ClarificationsSection'
import EquipmentForm from './components/EquipmentForm'
import LogisticsForm from './components/LogisticsForm'
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
    loadedEquipmentRequirements?: EquipmentRequirements
  ) => {
    setEquipmentData({
      ...loadedEquipmentData,
      equipmentRequirements:
        loadedEquipmentRequirements || initialEquipmentData.equipmentRequirements
    })
    setLogisticsData({
      truckType: '',
      shipmentType: '',
      storageType: '',
      storageSqFt: '',
      ...loadedLogisticsData,
      pieces: loadedLogisticsData.pieces
        ? loadedLogisticsData.pieces.map(piece => createLogisticsPiece(piece))
        : loadedLogisticsData.pieces
    })
  }

  const handleNewQuote = () => {
    setEquipmentData(initialEquipmentData)
    setLogisticsData(initialLogisticsData)
    setSelectedPieces([])
  }

  const [copiedTemplate, setCopiedTemplate] = useState<
    'email' | 'scope' | 'logistics' | null
  >(null)

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

  const { subject: logisticsSubject, body: logisticsBody } =
    generateLogisticsEmail(equipmentData, logisticsData)
  const logisticsTemplate = `${logisticsSubject}\n\n${logisticsBody}`
  const showLogisticsTemplate = Boolean(logisticsData.shipmentType)

  const actionButtonClass =
    'group flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-100 transition-all hover:-translate-y-0.5 hover:border-accent/70 hover:bg-accent/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent/60'

  const disabledActionButtonClass =
    'group flex items-center justify-center gap-2 rounded-2xl border border-white/5 bg-white/[0.04] px-4 py-3 text-sm font-medium text-slate-500 transition-all cursor-not-allowed'

  const copyToClipboard = async (
    text: string,
    templateType: 'email' | 'scope' | 'logistics'
  ) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedTemplate(templateType)
      setTimeout(() => setCopiedTemplate(null), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }
  return (
    <div className="relative min-h-screen overflow-x-hidden text-white">
      <div className="absolute inset-0 -z-20 bg-gradient-to-br from-slate-950 via-slate-900 to-black" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(50,205,50,0.08),_transparent_65%)]" />
      <div className="absolute -top-48 -left-48 -z-10 h-[28rem] w-[28rem] rounded-full bg-accent/25 blur-3xl opacity-70" />
      <div className="absolute top-1/3 -right-40 -z-10 h-[26rem] w-[26rem] rounded-full bg-sky-500/15 blur-3xl opacity-60" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <header className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-slate-300">
            Bolt 3.0 Visual System
          </span>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Volt 1.1 Quote Studio
          </h1>
          <p className="mt-4 text-base text-slate-300 sm:text-lg">
            Generate polished Omega Morgan proposals with the refreshed Bolt 3.0 look and feel.
            Manage client data, logistics, and AI-assisted templates from a single immersive workspace.
          </p>
        </header>

        <section className="mt-12 rounded-3xl border border-white/10 bg-white/5 px-6 py-8 shadow-[0_25px_70px_rgba(15,23,42,0.45)] backdrop-blur-xl">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <button onClick={openHistory} className={actionButtonClass}>
              <Archive className="h-4 w-4 text-accent transition-transform group-hover:scale-110" />
              Quote History
            </button>

            <button onClick={handleNewQuote} className={actionButtonClass}>
              <Plus className="h-4 w-4 text-accent transition-transform group-hover:scale-110" />
              New Quote
            </button>

            <button onClick={openHistory} className={actionButtonClass}>
              <Save className="h-4 w-4 text-accent transition-transform group-hover:scale-110" />
              Save Quote
            </button>

            <button
              onClick={() => handleOpenExtractor('all')}
              disabled={!hasApiKey}
              className={hasApiKey ? actionButtonClass : disabledActionButtonClass}
            >
              <Bot className="h-4 w-4 text-accent" />
              AI Extractor {hasApiKey ? 'Ready' : 'Locked'}
            </button>
          </div>
          <p className="mt-4 text-center text-xs text-slate-400">
            {hasApiKey
              ? 'AI extraction is connected for this session — use it to accelerate scope and logistics capture.'
              : 'Connect your encrypted Supabase key to unlock AI extraction powered by Bolt 3.0.'}
          </p>
        </section>

        <section className="mt-12 grid gap-10 lg:grid-cols-2">
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
        </section>

        <section className="mt-12 space-y-8">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_50px_rgba(15,23,42,0.45)] backdrop-blur">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-6 w-6 text-accent" />
                  <h2 className="text-2xl font-semibold text-white">Scope of Work Template</h2>
                </div>
                <button
                  onClick={() => copyToClipboard(scopeTemplate, 'scope')}
                  className={`flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm transition ${
                    copiedTemplate === 'scope'
                      ? 'bg-accent/10 text-accent'
                      : 'bg-white/5 text-slate-100 hover:border-accent/60 hover:bg-accent/10'
                  }`}
                >
                  {copiedTemplate === 'scope' ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <div className="rounded-2xl border border-white/5 bg-slate-950/70 p-4">
                <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed text-slate-200">
                  {scopeTemplate}
                </pre>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_50px_rgba(15,23,42,0.45)] backdrop-blur">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-6 w-6 text-accent" />
                  <h2 className="text-2xl font-semibold text-white">Email Template</h2>
                </div>
                <button
                  onClick={() => copyToClipboard(emailTemplate, 'email')}
                  className={`flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm transition ${
                    copiedTemplate === 'email'
                      ? 'bg-accent/10 text-accent'
                      : 'bg-white/5 text-slate-100 hover:border-accent/60 hover:bg-accent/10'
                  }`}
                >
                  {copiedTemplate === 'email' ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <div className="rounded-2xl border border-white/5 bg-slate-950/70 p-4">
                <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed text-slate-200">
                  {emailTemplate}
                </pre>
              </div>
            </div>
          </div>

          {showLogisticsTemplate && (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_50px_rgba(15,23,42,0.45)] backdrop-blur">
              <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-2">
                  <Truck className="h-6 w-6 text-accent" />
                  <h2 className="text-2xl font-semibold text-white">Logistics Email Template</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={`mailto:Logistics@omegamorgan.com; MachineryLogistics@omegamorgan.com?subject=${encodeURIComponent(logisticsSubject)}&body=${encodeURIComponent(logisticsBody)}`}
                    className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-black shadow-sm transition hover:bg-green-400"
                  >
                    <Mail className="h-4 w-4" />
                    Email Logistics Team
                  </a>
                  <button
                    onClick={() => copyToClipboard(logisticsTemplate, 'logistics')}
                    className={`flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm transition ${
                      copiedTemplate === 'logistics'
                        ? 'bg-accent/10 text-accent'
                        : 'bg-white/5 text-slate-100 hover:border-accent/60 hover:bg-accent/10'
                    }`}
                  >
                    {copiedTemplate === 'logistics' ? (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Copied!
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
              <div className="rounded-2xl border border-white/5 bg-slate-950/70 p-4">
                <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed text-slate-200">
                  {logisticsTemplate}
                </pre>
              </div>
            </div>
          )}
        </section>

        <section className="mt-12 space-y-6">
          <div className="flex flex-col gap-2 text-center sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-3xl font-semibold text-white">Clarifications Library</h2>
              <p className="text-sm text-slate-400">
                Keep your standard terms aligned with Bolt 3.0’s refreshed quoting experience.
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

        <footer className="mt-12 border-t border-white/5 pt-6 text-center text-sm text-slate-500">
          Crafted for Omega Morgan&apos;s Bolt 3.0 design language. Session ID: {sessionId}
        </footer>
      </div>

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
      />
    </div>
  )
}

export default App
