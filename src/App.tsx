import React, { Suspense, lazy, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Mail, Send } from 'lucide-react'
import { useSessionId } from './hooks/useSessionId'
import { useApiKey } from './hooks/useApiKey'
import { useQuoteState } from './hooks/useQuoteState'
import { useTemplates } from './hooks/useTemplates'
import { useCrossFormHandlers } from './hooks/useCrossFormHandlers'
import useEquipmentForm from './hooks/useEquipmentForm'
import useLogisticsForm from './hooks/useLogisticsForm'
import useModals from './hooks/useModals'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { equipmentSchema, logisticsSchema } from './lib/validation'
import type { EquipmentData, LogisticsData } from './types'
import { AppLayout, AppHeader, OutputPanel } from './components/layout'
import { Tabs } from './components/ui'
import TemplateCard from './components/TemplateCard'
import EquipmentForm from './components/EquipmentForm'
import LogisticsForm from './components/LogisticsForm'

const AIExtractorModal = lazy(() => import('./components/AIExtractorModal'))
const QuoteSaveManager = lazy(() => import('./components/QuoteSaveManager'))
const ClarificationsSection = lazy(() => import('./components/ClarificationsSection'))
const LogisticsQuoteEmailCard = lazy(() => import('./components/LogisticsQuoteEmailCard'))
const DailyConfirmationModal = lazy(() => import('./components/DailyConfirmationModal'))

const App: React.FC = () => {
  const sessionId = useSessionId()
  const { hasApiKey } = useApiKey()

  const {
    equipmentData, setEquipmentData, initialEquipmentData,
    handleEquipmentChange, handleEquipmentRequirementsChange,
    handleSelectHubSpotContact: baseHandleSelectHubSpotContact,
  } = useEquipmentForm()

  const {
    logisticsData, setLogisticsData, selectedPieces, setSelectedPieces,
    initialLogisticsData, handleLogisticsChange, handlePieceChange,
    addPiece, duplicatePiece, removePiece, togglePieceSelection,
    deleteSelectedPieces, movePiece,
  } = useLogisticsForm()

  const equipmentForm = useForm<EquipmentData>({
    resolver: yupResolver(equipmentSchema),
    defaultValues: equipmentData,
    mode: 'onBlur',
  })
  const logisticsForm = useForm<LogisticsData>({
    resolver: yupResolver(logisticsSchema),
    defaultValues: logisticsData,
    mode: 'onBlur',
  })

  useEffect(() => { equipmentForm.reset(equipmentData) }, [equipmentData])
  useEffect(() => { logisticsForm.reset(logisticsData) }, [logisticsData])

  const {
    showAIExtractor, openAIExtractor, closeAIExtractor,
    showHistory, openHistory, closeHistory,
    showDailyConfirmation, openDailyConfirmation, closeDailyConfirmation,
  } = useModals()

  const [extractorMode, setExtractorMode] = useState<'all' | 'logistics' | 'scope'>('all')
  const [activeWorkspace, setActiveWorkspace] = useState<'equipment' | 'logistics'>('equipment')

  const { copiedTemplate, emailTemplate, scopeTemplate, copyToClipboard, launchEmailDraft } =
    useTemplates(equipmentData, logisticsData)

  const {
    activeQuoteId, activeQuoteNumber, isQuickSaving,
    quickSaveMessage, quickSaveState,
    handleQuickSave, handleQuoteSaved, handleLoadQuote, handleNewQuote,
  } = useQuoteState({
    equipmentData, logisticsData,
    setEquipmentData, setLogisticsData, setSelectedPieces,
    initialEquipmentData, initialLogisticsData,
    emailTemplate, scopeTemplate, openHistory,
  })

  const { copySiteAddressToPickup, handleSelectHubSpotContact, handleAIExtraction } =
    useCrossFormHandlers({
      equipmentData, setEquipmentData,
      logisticsData, setLogisticsData,
      baseHandleSelectHubSpotContact,
    })

  const handleOpenExtractor = (mode: 'all' | 'logistics' | 'scope') => {
    setExtractorMode(mode)
    openAIExtractor()
  }

  const hasScopeContent = Boolean(equipmentData.scopeOfWork?.trim())
  const piecesCount = logisticsData.pieces?.length ?? 0

  const workspaceTabs = [
    { key: 'equipment', label: 'Equipment' },
    { key: 'logistics', label: 'Logistics' },
  ]

  return (
    <AppLayout
      header={
        <AppHeader
          activeQuoteNumber={activeQuoteNumber}
          quickSaveState={quickSaveState}
          quickSaveMessage={quickSaveMessage}
          onNewQuote={handleNewQuote}
          onOpenHistory={openHistory}
          onQuickSave={handleQuickSave}
          onOpenDailyConfirmation={openDailyConfirmation}
          onOpenExtractor={handleOpenExtractor}
          isQuickSaving={isQuickSaving}
          activeQuoteId={activeQuoteId}
          hasApiKey={hasApiKey}
        />
      }
    >
      <div className="grid gap-6 pt-6 xl:grid-cols-[1fr_380px]">
        {/* Main workspace */}
        <div className="space-y-6">
          <div className="rounded-xl bg-white/[0.03] backdrop-blur-md border border-white/[0.06] p-5 shadow-card transition-all duration-300 hover:border-white/[0.12]">
            {/* Decorative gradient top border */}
            <div className="h-px -mt-5 mb-5 -mx-5 rounded-t-xl bg-gradient-to-r from-accent/20 via-transparent to-accent/20" />

            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white">Workspace</h2>
              <Tabs
                tabs={workspaceTabs}
                activeTab={activeWorkspace}
                onChange={(key) => setActiveWorkspace(key as 'equipment' | 'logistics')}
              />
            </div>

            <AnimatePresence mode="wait">
              {activeWorkspace === 'equipment' && (
                <motion.div
                  key="equipment"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                >
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
                </motion.div>
              )}
              {activeWorkspace === 'logistics' && (
                <motion.div
                  key="logistics"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="space-y-6">
                    <LogisticsForm
                      data={logisticsData}
                      selectedPieces={selectedPieces}
                      onFieldChange={handleLogisticsChange}
                      onPieceChange={handlePieceChange}
                      addPiece={addPiece}
                      duplicatePiece={duplicatePiece}
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
                      <Suspense
                        fallback={
                          <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 text-sm text-gray-400">
                            Preparing logistics email...
                          </div>
                        }
                      >
                        <LogisticsQuoteEmailCard
                          equipmentData={equipmentData}
                          logisticsData={logisticsData}
                        />
                      </Suspense>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Clarifications */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Clarifications</h2>
            <Suspense
              fallback={
                <div className="grid gap-4 lg:grid-cols-2">
                  {[0, 1].map(i => (
                    <div key={i} className="h-32 rounded-xl border border-white/[0.06] bg-white/[0.03]" />
                  ))}
                </div>
              }
            >
              <div className="grid gap-4 lg:grid-cols-2">
                <ClarificationsSection
                  title="Machinery Moving"
                  initialItems={[
                    'Any change to the job will require approval in writing prior to completion of work.',
                    'Customer is to supply clear pathway for all items to be loaded onto trailers',
                    'Quote is based on no site visit and is not responsible for cracks in pavement or other unforeseen causes to not be able to perform work',
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
                    'Mandatory missed meal charge at 10 hours from start of shift.',
                  ]}
                />
              </div>
            </Suspense>
          </div>
        </div>

        {/* Right sidebar */}
        <OutputPanel
          sessionId={sessionId}
          hasApiKey={hasApiKey}
          hasScopeContent={hasScopeContent}
          piecesCount={piecesCount}
        >
          <TemplateCard
            title="Scope of Work"
            icon={FileText}
            description="Ready for your proposal or internal hand-off."
            template={scopeTemplate}
            templateType="scope"
            copiedTemplate={copiedTemplate}
            onCopy={copyToClipboard}
          />
          <TemplateCard
            title="Client Email"
            icon={Mail}
            description="Auto-generated from project details."
            template={emailTemplate}
            templateType="email"
            copiedTemplate={copiedTemplate}
            onCopy={copyToClipboard}
            actions={
              <button
                type="button"
                onClick={launchEmailDraft}
                disabled={!equipmentData.email?.trim()}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
                  equipmentData.email?.trim()
                    ? 'border-surface-overlay bg-surface-raised text-gray-300 hover:text-white hover:bg-surface-overlay'
                    : 'cursor-not-allowed border-surface-overlay/50 bg-surface text-gray-600'
                }`}
              >
                <Send className="h-3.5 w-3.5" />
                Draft Email
              </button>
            }
          />
        </OutputPanel>
      </div>

      {/* Modals */}
      <Suspense fallback={null}>
        <AIExtractorModal
          isOpen={showAIExtractor}
          onClose={closeAIExtractor}
          onExtract={handleAIExtraction}
          sessionId={sessionId}
          mode={extractorMode}
        />
      </Suspense>
      <Suspense fallback={null}>
        <QuoteSaveManager
          equipmentData={equipmentData}
          equipmentRequirements={equipmentData.equipmentRequirements}
          logisticsData={logisticsData}
          isOpen={showHistory}
          onClose={closeHistory}
          onLoadQuote={handleLoadQuote}
          onQuoteSaved={handleQuoteSaved}
        />
      </Suspense>
      <Suspense fallback={null}>
        <DailyConfirmationModal
          isOpen={showDailyConfirmation}
          onClose={closeDailyConfirmation}
        />
      </Suspense>
    </AppLayout>
  )
}

export default App
