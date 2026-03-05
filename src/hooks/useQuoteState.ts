import { useState, useEffect } from 'react'
import type { EquipmentData, LogisticsData } from '../types'
import type { EquipmentRequirements } from '../components/EquipmentRequired'
import { QuoteService } from '../services/quoteService'
import { ensureJobFolders } from '../lib/projectFolders'
import { createLogisticsPiece } from '../lib/logisticsPieces'

interface UseQuoteStateArgs {
  equipmentData: EquipmentData
  logisticsData: LogisticsData
  setEquipmentData: React.Dispatch<React.SetStateAction<EquipmentData>>
  setLogisticsData: React.Dispatch<React.SetStateAction<LogisticsData>>
  setSelectedPieces: React.Dispatch<React.SetStateAction<string[]>>
  initialEquipmentData: EquipmentData
  initialLogisticsData: LogisticsData
  emailTemplate: string
  scopeTemplate: string
  openHistory: () => void
}

export function useQuoteState({
  equipmentData,
  logisticsData,
  setEquipmentData,
  setLogisticsData,
  setSelectedPieces,
  initialEquipmentData,
  initialLogisticsData,
  emailTemplate,
  scopeTemplate,
  openHistory,
}: UseQuoteStateArgs) {
  const [activeQuoteId, setActiveQuoteId] = useState<string | null>(null)
  const [activeQuoteNumber, setActiveQuoteNumber] = useState<string | null>(null)
  const [isQuickSaving, setIsQuickSaving] = useState(false)
  const [quickSaveMessage, setQuickSaveMessage] = useState<string | null>(null)
  const [quickSaveState, setQuickSaveState] = useState<'idle' | 'success' | 'error'>('idle')

  useEffect(() => {
    if (quickSaveState === 'success' || quickSaveState === 'error') {
      if (typeof window === 'undefined') return
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
        if (result.id) setActiveQuoteId(result.id)
        if (equipmentData.companyName) {
          await ensureJobFolders(
            equipmentData.companyName,
            equipmentData.jobNumber || undefined,
            equipmentData.projectName || undefined
          )
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
        loadedEquipmentRequirements || initialEquipmentData.equipmentRequirements,
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
        loadedLogisticsData.includeStorage ?? Boolean(normalizedStorageLocation),
      storageLocation: normalizedStorageLocation,
      storageSqFt: loadedLogisticsData.storageSqFt || '',
      pieces: loadedLogisticsData.pieces
        ? loadedLogisticsData.pieces.map(piece => createLogisticsPiece(piece))
        : initialLogisticsData.pieces,
    })

    if (quoteId) setActiveQuoteId(quoteId)
    if (quoteNumber) setActiveQuoteNumber(quoteNumber)
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

  return {
    activeQuoteId,
    activeQuoteNumber,
    isQuickSaving,
    quickSaveMessage,
    quickSaveState,
    handleQuickSave,
    handleQuoteSaved,
    handleLoadQuote,
    handleNewQuote,
  }
}
