import { useEffect } from 'react'
import type { EquipmentData, LogisticsData } from '../types'
import { parseAddressParts } from '../lib/address'
import { createLogisticsPiece } from '../lib/logisticsPieces'
import { HubSpotContact } from '../services/hubspotService'

interface UseCrossFormHandlersArgs {
  equipmentData: EquipmentData
  setEquipmentData: React.Dispatch<React.SetStateAction<EquipmentData>>
  logisticsData: LogisticsData
  setLogisticsData: React.Dispatch<React.SetStateAction<LogisticsData>>
  baseHandleSelectHubSpotContact: (contact: HubSpotContact) => void
}

export function useCrossFormHandlers({
  equipmentData,
  setEquipmentData,
  logisticsData,
  setLogisticsData,
  baseHandleSelectHubSpotContact,
}: UseCrossFormHandlersArgs) {
  // Auto-populate pickup address from project address
  useEffect(() => {
    if (equipmentData.siteAddress && !logisticsData.pickupAddress) {
      setLogisticsData(prev => ({
        ...prev,
        pickupAddress: equipmentData.siteAddress,
      }))
    }
  }, [equipmentData.siteAddress])

  const copySiteAddressToPickup = () => {
    const siteAddress = equipmentData.siteAddress?.trim()
    if (!siteAddress) return false

    const { street, city, state, zip } = parseAddressParts(siteAddress)
    setLogisticsData(prev => ({
      ...prev,
      pickupAddress: street || siteAddress,
      pickupCity: city,
      pickupState: state,
      pickupZip: zip,
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
      pickupZip: contact.contactZip || contact.companyZip || prev.pickupZip,
    }))
  }

  const handleAIExtraction = (
    extractedEquipmentData: Partial<EquipmentData>,
    extractedLogisticsData: Partial<LogisticsData>
  ) => {
    console.log('handleAIExtraction called with:', { extractedEquipmentData, extractedLogisticsData })

    if (extractedEquipmentData) {
      const mapped: Partial<EquipmentData> = {}
      if (extractedEquipmentData.projectName) mapped.projectName = extractedEquipmentData.projectName
      if (extractedEquipmentData.companyName) mapped.companyName = extractedEquipmentData.companyName
      if (extractedEquipmentData.contactName) mapped.contactName = extractedEquipmentData.contactName

      const siteAddress = extractedEquipmentData.projectAddress || extractedEquipmentData.siteAddress
      if (siteAddress) mapped.siteAddress = siteAddress

      const sitePhone = extractedEquipmentData.phone || extractedEquipmentData.sitePhone
      if (sitePhone) mapped.sitePhone = sitePhone

      if (extractedEquipmentData.email) mapped.email = extractedEquipmentData.email
      if (extractedEquipmentData.scopeOfWork) mapped.scopeOfWork = extractedEquipmentData.scopeOfWork

      if (Object.keys(mapped).length > 0) {
        console.log('Updating equipment data with:', mapped)
        setEquipmentData(prev => ({ ...prev, ...mapped }))
      }
    }

    if (extractedLogisticsData) {
      const mapped: Partial<LogisticsData> = {}

      if (extractedLogisticsData.pieces && Array.isArray(extractedLogisticsData.pieces)) {
        mapped.pieces = extractedLogisticsData.pieces.map(piece =>
          createLogisticsPiece({
            id: piece.id,
            description: piece.description || '',
            quantity: piece.quantity || 1,
            length: piece.length?.toString() || '',
            width: piece.width?.toString() || '',
            height: piece.height?.toString() || '',
            weight: piece.weight?.toString() || '',
          })
        )
      }

      if (extractedLogisticsData.pickupAddress) mapped.pickupAddress = extractedLogisticsData.pickupAddress
      if (extractedLogisticsData.pickupCity) mapped.pickupCity = extractedLogisticsData.pickupCity
      if (extractedLogisticsData.pickupState) mapped.pickupState = extractedLogisticsData.pickupState
      if (extractedLogisticsData.pickupZip) mapped.pickupZip = extractedLogisticsData.pickupZip
      if (extractedLogisticsData.deliveryAddress) mapped.deliveryAddress = extractedLogisticsData.deliveryAddress
      if (extractedLogisticsData.deliveryCity) mapped.deliveryCity = extractedLogisticsData.deliveryCity
      if (extractedLogisticsData.deliveryState) mapped.deliveryState = extractedLogisticsData.deliveryState
      if (extractedLogisticsData.deliveryZip) mapped.deliveryZip = extractedLogisticsData.deliveryZip
      if (extractedLogisticsData.truckType) mapped.truckType = extractedLogisticsData.truckType

      console.log('Updating logistics data with:', mapped)
      setLogisticsData(prev => ({ ...prev, ...mapped }))
    }
  }

  return {
    copySiteAddressToPickup,
    handleSelectHubSpotContact,
    handleAIExtraction,
  }
}
