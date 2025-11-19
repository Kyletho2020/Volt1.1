/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react'
import { FileText, Mail, Copy, CheckCircle, Eye, X, Truck } from 'lucide-react'
import {
  formatStorageRateLabel,
  getStorageRate,
  normalizeStorageLocation,
  type StorageLocation
} from '../lib/storage'

const PROPER_EQUIPMENT_TERMS = new Set([
  'versalift',
  'trilifter'
])

const isProperEquipmentWord = (word: string) => {
  const lettersOnly = word.replace(/[^A-Za-z]/g, '')

  if (!lettersOnly) {
    return false
  }

  const normalized = lettersOnly.toLowerCase()

  if (PROPER_EQUIPMENT_TERMS.has(normalized)) {
    return true
  }

  const hasLetter = /[A-Za-z]/.test(lettersOnly)
  const isAllCaps = lettersOnly === lettersOnly.toUpperCase()

  return hasLetter && isAllCaps
}

const normalizeEquipmentName = (name: string) =>
  name.replace(/[A-Za-z][A-Za-z0-9'/-]*/g, match =>
    isProperEquipmentWord(match) ? match : match.toLowerCase()
  )

const shouldUseFallback = (value: any) =>
  value === undefined || value === null || value === ''

const sanitizeWeightInput = (value: any) =>
  typeof value === 'string' ? value.replace(/,/g, '') : value

const getNumericWeight = (value: any) => {
  const sanitizedValue = sanitizeWeightInput(value)
  const numericValue =
    typeof sanitizedValue === 'number'
      ? sanitizedValue
      : Number(sanitizedValue)

  if (Number.isNaN(numericValue)) {
    return null
  }

  return numericValue
}

const formatWeight = (value: any, fallback: string) => {
  if (shouldUseFallback(value)) {
    return fallback
  }

  const numericValue = getNumericWeight(value)

  if (numericValue === null) {
    if (typeof value === 'string' && value.trim() !== '') {
      return value
    }

    return fallback
  }

  return `${numericValue.toLocaleString()} lbs`
}

const parseWeight = (value: any) => {
  if (shouldUseFallback(value)) {
    return 0
  }

  const numericValue = getNumericWeight(value)

  if (numericValue === null) {
    return 0
  }

  return numericValue
}

const safeArray = (value: any) => (Array.isArray(value) ? value : [])

const formatEquipmentItem = (quantity: number, name: string) => {
  const normalizedName = normalizeEquipmentName(name)
  const needsPlural =
    quantity > 1 && !normalizedName.toLowerCase().endsWith('s')

  return quantity > 1
    ? `${quantity} ${needsPlural ? `${normalizedName}s` : normalizedName}`
    : normalizedName
}

const ensureTrailerDescriptor = (name: string) =>
  name.toLowerCase().includes('trailer') ? name : `${name} trailer`

const buildEquipmentItems = (
  equipmentRequirements: any,
  includeCrew: boolean
) => {
  if (!equipmentRequirements) {
    return []
  }

  const crewSize = equipmentRequirements.crewSize || ''
  const forklifts = safeArray(equipmentRequirements.forklifts).filter(
    (item: any) => item.quantity > 0
  )
  const tractors = safeArray(equipmentRequirements.tractors).filter(
    (item: any) => item.quantity > 0
  )
  const trailers = safeArray(equipmentRequirements.trailers).filter(
    (item: any) => item.quantity > 0
  )
  const additionalEquipment = safeArray(
    equipmentRequirements.additionalEquipment
  ).filter((item: any) => item.quantity > 0)

  const crewDescription =
    includeCrew && crewSize
      ? `${crewSize === '8' ? 'an' : 'a'} ${crewSize}-man crew`
      : ''

  return [
    crewDescription,
    'Gear truck and trailer',
    ...forklifts.map((item: any) =>
      formatEquipmentItem(item.quantity, item.name)
    ),
    ...tractors.map((item: any) =>
      formatEquipmentItem(item.quantity, item.name)
    ),
    ...trailers.map((item: any) =>
      formatEquipmentItem(item.quantity, ensureTrailerDescriptor(item.name))
    ),
    ...additionalEquipment.map((item: any) =>
      formatEquipmentItem(item.quantity, item.name)
    )
  ].filter(Boolean)
}

const formatEquipmentList = (items: string[]) => {
  if (items.length === 0) return ''
  if (items.length === 1) return items[0]
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`
}

const buildEquipmentSummary = (
  equipmentRequirements: any,
  options: { includeCrew?: boolean } = {}
) => {
  const includeCrew = options.includeCrew ?? true
  const items = buildEquipmentItems(equipmentRequirements, includeCrew)
  return formatEquipmentList(items)
}

export const generateEmailTemplate = (
  equipmentData: any,
  _logisticsData: any,
  equipmentRequirements: any
) => {
  const projectName = equipmentData.projectName || '[project name]'
  const contactName = equipmentData.contactName || '[Site Contact]'
  const contactFirstName = equipmentData.contactName
    ? equipmentData.contactName.trim().split(/\s+/)[0]
    : contactName
  const siteAddress = equipmentData.siteAddress || '[site address]'
  const scopeOfWork = equipmentData.scopeOfWork || '[Scope of Work]'
  const equipmentSummary =
    buildEquipmentSummary(equipmentRequirements, { includeCrew: false }) ||
    '[Equipment List]'
  const crewSizeDescription = equipmentRequirements?.crewSize
    ? `${equipmentRequirements.crewSize}-person crew`
    : '[Crew Size]'

  return `Quote for ${contactFirstName}- Omega Morgan - ${projectName}\n\nHello ${contactFirstName},\n\nThank you for choosing to work with Omega Morgan on your upcoming project at ${siteAddress}.\n\nOur team is excited to support you and ensure everything goes smoothly from start to finish.\n\nBelow is a quick summary of the plan we discussed.\n\nPROJECT OVERVIEW\n• Project Name: ${projectName}\n• Site Contact: ${contactName}\n• Location: ${siteAddress}\n• Omega Morgan Equipment: ${equipmentSummary}\n• Crew on Site: ${crewSizeDescription}\n\nWORK PLAN\n${scopeOfWork}\n\nNEXT STEPS\nTo confirm the schedule, please return the completed mobile or credit account form along with the signed quote.\n\nIf you have any questions or need assistance, don’t hesitate to reach out.\n\nWe are happy to help, and we appreciate the opportunity to partner with you and your team. We look forward to a successful project.`
}

export const generateScopeTemplate = (
  equipmentData: any,
  logisticsData: any,
  equipmentRequirements: any
) => {
  const siteAddress = equipmentData.siteAddress || '[Site Address]'
  const contactName = equipmentData.contactName || '[Site Contact]'
  const phone = equipmentData.sitePhone || '[Site Phone]'
  const shopLocation = equipmentData.shopLocation || '[Shop]'
  const scopeOfWork = equipmentData.scopeOfWork || ''

  const equipmentSummary = buildEquipmentSummary(equipmentRequirements)

  const storageLine = logisticsData.includeStorage
    ? `Storage: ${
        logisticsData.storageLocation === 'inside'
          ? 'Inside Storage'
          : logisticsData.storageLocation === 'outside'
            ? 'Outside Storage'
            : '[Storage Type]'
      } - ${logisticsData.storageSqFt || '[Sq Ft]'} sq ft\n`
    : ''

  const logisticsSection = storageLine ? `\n${storageLine}` : '\n'

  const itemsSection =
    logisticsData.pieces && logisticsData.pieces.length > 0
      ? `ITEMS TO HANDLE:\n${logisticsData.pieces
          .map(
            (piece: any) =>
              `• (Qty: ${piece.quantity || 1}) ${
                piece.description || '[Item Description]'
              } - ${piece.length || '[L]'}"L x ${piece.width || '[W]'}"W x ${
                piece.height || '[H]'
              }"H, ${formatWeight(piece.weight, 'Weight Not listed')}`
          )
          .join('\n')}\n`
      : ''

  return `Mobilize crew and Omega Morgan equipment to site:
${siteAddress}

${contactName}
${phone}

Omega Morgan to supply ${equipmentSummary || 'necessary crew and equipment'}.
${logisticsSection}${scopeOfWork ? `${scopeOfWork}\n\n` : ''}${itemsSection}\nWhen job is complete clean up debris and return to ${shopLocation}.`
}

export const generateLogisticsEmail = (
  equipmentData: any,
  logisticsData: any
) => {
  const rawShipmentType = logisticsData.shipmentType || ''
  const shipmentType = rawShipmentType || '[shipment type]'
  const shipmentCode = (() => {
    if (!rawShipmentType) {
      return '[shipment type]'
    }

    const match = String(rawShipmentType).match(/[A-Za-z]+/)
    return match ? match[0].toUpperCase() : rawShipmentType
  })()

  const pickupZip = logisticsData.pickupZip?.trim() || '[pickup ZIP]'
  const deliveryZip = logisticsData.deliveryZip?.trim() || '[delivery ZIP]'

  const pieces = Array.isArray(logisticsData.pieces) ? logisticsData.pieces : []
  const totalPiecesCount = pieces.length
    ? pieces.reduce(
        (sum: number, piece: any) => sum + (piece.quantity || 1),
        0
      )
    : null
  const numberOfPieces =
    totalPiecesCount !== null ? String(totalPiecesCount) : '[number of pieces]'

  const pieceDetails = pieces.length
    ? pieces
        .map((piece: any) => {
          const quantity = piece.quantity || 1
          const qtyPrefix = quantity > 1 ? `Qty ${quantity} – ` : ''
          const description = piece.description
            ? `${piece.description} – `
            : ''
          const dimensions = `${piece.length || '[L]'}" x ${
            piece.width || '[W]'
          }" x ${piece.height || '[H]'}"`
          const weightValue = formatWeight(piece.weight, 'Weight not listed')
          const normalizedWeight =
            weightValue.toLowerCase() === 'weight not listed'
              ? 'Weight not listed'
              : `approx. ${weightValue}`
          return `${qtyPrefix}${description}${dimensions} – ${normalizedWeight}`
        })
        .join('\n')
    : '[List piece dimensions and weights]'

  const totalWeightValue = pieces.length
    ? pieces.reduce(
        (sum: number, piece: any) =>
          sum + parseWeight(piece.weight) * (piece.quantity || 1),
        0
      )
    : 0
  const totalWeight =
    pieces.length && totalWeightValue > 0
      ? `Approx. ${formatWeight(totalWeightValue, 'Weight not listed')}`
      : 'Weight not listed'

  const composeLocation = (
    address: string | undefined,
    city: string | undefined,
    state: string | undefined,
    zip: string | undefined,
    fallback: string
  ) => {
    const parts: string[] = []
    const trimmedAddress = address?.trim()
    if (trimmedAddress) {
      parts.push(trimmedAddress)
    }

    const cityState = [city?.trim(), state?.trim()].filter(Boolean).join(', ')
    const cityStateZip = [cityState, zip?.trim()].filter(Boolean).join(' ')
    if (cityStateZip) {
      parts.push(cityStateZip)
    }

    return parts.length ? parts.join(', ') : fallback
  }

  const pickupLocation = composeLocation(
    logisticsData.pickupAddress,
    logisticsData.pickupCity,
    logisticsData.pickupState,
    logisticsData.pickupZip,
    '[pickup location]'
  )
  const deliveryLocation = composeLocation(
    logisticsData.deliveryAddress,
    logisticsData.deliveryCity,
    logisticsData.deliveryState,
    logisticsData.deliveryZip,
    '[delivery location]'
  )

  const truckType = logisticsData.truckType || '[truck type requested]'

  const contactName = equipmentData.contactName?.trim() || ''
  const companyName = equipmentData.companyName?.trim() || ''
  const signatureLines = [contactName, companyName].filter(Boolean).join('\n')

  const normalizedStorageLocation = normalizeStorageLocation(
    logisticsData.storageLocation
  )
  const storageRate = getStorageRate(logisticsData.storageLocation)
  const sanitizedStorageSqFt = logisticsData.storageSqFt
    ? String(logisticsData.storageSqFt).replace(/,/g, '')
    : ''
  const parsedStorageSqFt = parseFloat(sanitizedStorageSqFt)
  const hasStorageSqFt = !Number.isNaN(parsedStorageSqFt) && parsedStorageSqFt > 0
  const storageSqFtDisplay = hasStorageSqFt
    ? parsedStorageSqFt.toLocaleString(undefined, {
        maximumFractionDigits: 2,
        minimumFractionDigits: parsedStorageSqFt % 1 === 0 ? 0 : 2
      })
    : logisticsData.storageSqFt?.trim() || '[square footage]'
  const storageCost =
    logisticsData.includeStorage && storageRate !== null && hasStorageSqFt
      ? parsedStorageSqFt * storageRate
      : null
  const storageCostDisplay =
    storageCost !== null
      ? new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(storageCost)
      : '--'
  const storageTypeLabels: Record<StorageLocation, string> = {
    inside: `Inside storage (${formatStorageRateLabel('inside')})`,
    outside: `Outside storage (${formatStorageRateLabel('outside')})`
  }

  const storageTypeLabel = normalizedStorageLocation
    ? storageTypeLabels[normalizedStorageLocation]
    : '[Storage Type]'

  const storageSection = logisticsData.includeStorage
    ? `\nStorage Requested:\n• Type: ${storageTypeLabel}\n• Square Feet: ${storageSqFtDisplay}\n• Cost: ${storageCostDisplay}\n\n`
    : ''

  const subject = `Truck request for ${shipmentCode} – ${pickupZip} to ${deliveryZip}`

  const body = `Hello,\n\nI'm reaching out to request a logistics quote for an upcoming project. Please see the load and transport details below:\n\nNumber of Pieces: ${numberOfPieces}\n\nPiece Dimensions & Weights (L x W x H):\n${pieceDetails}\n\nTotal Load Weight: ${totalWeight}\n\nPick-Up Location: ${pickupLocation}\n\nDelivery/Set Location: ${deliveryLocation}\n\nTruck Type Requested: ${truckType}\n\nShipment Type: ${shipmentType}\n${storageSection}Please let me know if you need any additional information or documents to complete the quote. Looking forward to your response.\n\nBest regards, 
  `

  return { subject, body }
}

export const generateLogisticsTemplate = (
  equipmentData: any,
  logisticsData: any
) => {
  const { subject, body } = generateLogisticsEmail(equipmentData, logisticsData)
  return `To: Logistics@omegamorgan.com; MachineryLogistics@omegamorgan.com\n\n${subject}\n\n${body}`
}

interface PreviewTemplatesProps {
  equipmentData: any
  logisticsData: any
  equipmentRequirements: any
  isOpen: boolean
  onClose: () => void
}

const PreviewTemplates: React.FC<PreviewTemplatesProps> = ({
  equipmentData,
  logisticsData,
  equipmentRequirements,
  isOpen,
  onClose
}) => {
  const [activeTemplate, setActiveTemplate] = useState<
    'email' | 'scope' | 'logistics'
  >('email')
  const [copiedTemplate, setCopiedTemplate] = useState<string | null>(null)

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
  const logisticsTemplate = generateLogisticsTemplate(
    equipmentData,
    logisticsData
  )

  const copyToClipboard = async (text: string, templateType: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedTemplate(templateType)
      setTimeout(() => setCopiedTemplate(null), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border-2 border-accent rounded-2xl text-white shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2 border-accent">
          <div className="flex items-center">
            <Eye className="w-6 h-6 text-white mr-2" />
            <h3 className="text-xl font-bold text-white">Preview Templates</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Template Tabs */}
        <div className="flex border-b-2 border-accent">
          <button
            onClick={() => setActiveTemplate('email')}
            className={`flex-1 flex items-center justify-center px-6 py-3 transition-colors ${
              activeTemplate === 'email'
                ? 'bg-gray-900 text-white border-b-2 border-accent'
                : 'text-white hover:text-white hover:bg-gray-800'
            }`}
          >
            <Mail className="w-4 h-4 mr-2" />
            Email Template
          </button>
          <button
            onClick={() => setActiveTemplate('scope')}
            className={`flex-1 flex items-center justify-center px-6 py-3 transition-colors ${
              activeTemplate === 'scope'
                ? 'bg-gray-900 text-white border-b-2 border-accent'
                : 'text-white hover:text-white hover:bg-gray-800'
            }`}
          >
            <FileText className="w-4 h-4 mr-2" />
            Scope Template
          </button>
          <button
            onClick={() => setActiveTemplate('logistics')}
            className={`flex-1 flex items-center justify-center px-6 py-3 transition-colors ${
              activeTemplate === 'logistics'
                ? 'bg-gray-900 text-white border-b-2 border-accent'
                : 'text-white hover:text-white hover:bg-gray-800'
            }`}
          >
            <Truck className="w-4 h-4 mr-2" />
            Logistics Template
          </button>
        </div>

        {/* Template Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="p-6 border-b-2 border-accent">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-white">
                {activeTemplate === 'email'
                  ? 'Email Template'
                  : activeTemplate === 'scope'
                  ? 'Scope of Work Template'
                  : 'Logistics Template'}
              </h4>
              <button
                onClick={() =>
                  copyToClipboard(
                    activeTemplate === 'email'
                      ? emailTemplate
                      : activeTemplate === 'scope'
                      ? scopeTemplate
                      : logisticsTemplate,
                    activeTemplate
                  )
                }
                className="flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 hover:text-white transition-colors"
              >
                {copiedTemplate === activeTemplate ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Template
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="bg-black rounded-lg p-4 border border-accent">
              <pre className="whitespace-pre-wrap text-sm text-white font-mono leading-relaxed">
                {activeTemplate === 'email'
                  ? emailTemplate
                  : activeTemplate === 'scope'
                  ? scopeTemplate
                  : logisticsTemplate}
              </pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t-2 border-accent bg-gray-900">
          <p className="text-sm text-white">
            Templates are automatically populated with extracted data. Fields in brackets [ ] need manual completion.
          </p>
        </div>
      </div>
    </div>
  )
}

export default PreviewTemplates
