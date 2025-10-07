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
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-[2000px] mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">OM Quote Generator</h1>
          <p className="text-white">Professional quote generation system for Omega Morgan</p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <button
            onClick={openHistory}
            className="flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors border border-accent"
          >
            <Archive className="w-4 h-4 mr-2" />
            Quote History
          </button>

          <button
            onClick={handleNewQuote}
            className="flex items-center px-4 py-2 bg-accent text-black rounded-lg hover:bg-green-400 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Quote
          </button>

          <button
            onClick={openHistory}
            className="flex items-center px-4 py-2 bg-accent text-black rounded-lg hover:bg-green-400 transition-colors"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Quote
          </button>

          <button
            onClick={() => handleOpenExtractor('all')}
            disabled={!hasApiKey}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
              hasApiKey
                ? 'bg-accent text-black hover:bg-green-400'
                : 'bg-gray-600 text-gray-300 cursor-not-allowed'
            }`}
          >
            <Bot className="w-4 h-4 mr-2" />
            AI Extractor {hasApiKey ? '✓' : '✗'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Equipment Quote Form */}
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

          {/* Logistics Quote Form */}
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
        </div>

        {/* Templates */}
        <div className="mt-8 space-y-8">
          <div className="bg-gray-900 rounded-lg border-2 border-accent p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <FileText className="w-6 h-6 text-white mr-2" />
                <h2 className="text-2xl font-bold text-white">Scope of Work Template</h2>
              </div>
              <button
                onClick={() => copyToClipboard(scopeTemplate, 'scope')}
                className="flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors border border-accent"
              >
                {copiedTemplate === 'scope' ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </>
                )}
              </button>
            </div>
            <div className="bg-black rounded-lg p-4 border border-accent">
              <pre className="whitespace-pre-wrap text-sm text-white font-mono leading-relaxed">
                {scopeTemplate}
              </pre>
            </div>
          </div>

          <div className="bg-gray-900 rounded-lg border-2 border-accent p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Mail className="w-6 h-6 text-white mr-2" />
                <h2 className="text-2xl font-bold text-white">Email Template</h2>
              </div>
              <button
                onClick={() => copyToClipboard(emailTemplate, 'email')}
                className="flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors border border-accent"
              >
                {copiedTemplate === 'email' ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </>
                )}
              </button>
            </div>
            <div className="bg-black rounded-lg p-4 border border-accent">
              <pre className="whitespace-pre-wrap text-sm text-white font-mono leading-relaxed">
                {emailTemplate}
              </pre>
            </div>
          </div>

          {showLogisticsTemplate && (
            <div className="bg-gray-900 rounded-lg border-2 border-accent p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Truck className="w-6 h-6 text-white mr-2" />
                  <h2 className="text-2xl font-bold text-white">Logistics Email Template</h2>
                </div>
                <div className="flex gap-2">
                  <a
                    href={`mailto:Logistics@omegamorgan.com; MachineryLogistics@omegamorgan.com?subject=${encodeURIComponent(logisticsSubject)}&body=${encodeURIComponent(logisticsBody)}`}
                    className="flex items-center px-4 py-2 bg-accent text-black rounded-lg hover:bg-green-400 transition-colors"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Email
                  </a>
                  <button
                    onClick={() => copyToClipboard(logisticsTemplate, 'logistics')}
                    className="flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors border border-accent"
                  >
                    {copiedTemplate === 'logistics' ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>
              <div className="bg-black rounded-lg p-4 border border-accent">
                <pre className="whitespace-pre-wrap text-sm text-white font-mono leading-relaxed">
                  {logisticsTemplate}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Clarifications */}
        <div className="mt-8 space-y-8">
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

        {/* Modals */}
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
    </div>
  )
}

export default App
