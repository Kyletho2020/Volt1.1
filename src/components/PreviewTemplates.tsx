/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react'
import { FileText, Mail, Copy, CheckCircle, Eye, X, Truck } from 'lucide-react'
import { LOGISTICS_QUOTE_RECIPIENTS } from '../lib/logisticsEmail'

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

export const generateEmailTemplate = (
  equipmentData: any,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _logisticsData: any,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _equipmentRequirements: any
) => {
  const projectName = equipmentData.projectName || '[project name]'
  const contactName = equipmentData.contactName || '[site contact]'
  const contactFirstName = equipmentData.contactName
    ? equipmentData.contactName.trim().split(/\s+/)[0]
    : contactName
  const siteAddress = equipmentData.siteAddress || '[site address]'
  const scopeOfWork = equipmentData.scopeOfWork || '[Scope of Work]'

  return `Quote - ${projectName}\n\nDear ${contactFirstName},\n\nI hope this email finds you well. Thank you for considering Omega Morgan for the scope of work attached and summarized below.\n\nPROJECT DETAILS:\n• Project Name: ${projectName}\n• Site Contact: ${contactFirstName}\n• Project Location: ${siteAddress}\n\nSCOPE OF WORK:\n\n${scopeOfWork}\n\nThank you for your time and consideration. I look forward to hearing from you soon.\n\nBest regards,`
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

  const crewSize = equipmentRequirements.crewSize || ''
  const forklifts = (equipmentRequirements.forklifts || []).filter((f: any) => f.quantity > 0)
  const tractors = (equipmentRequirements.tractors || []).filter((t: any) => t.quantity > 0)
  const trailers = (equipmentRequirements.trailers || []).filter((t: any) => t.quantity > 0)
  const additionalEquipment = (equipmentRequirements.additionalEquipment || []).filter(
    (item: any) => item.quantity > 0
  )

  const formatEquipmentItem = (quantity: number, name: string) => {
    const normalizedName = normalizeEquipmentName(name)
    const needsPlural =
      quantity > 1 && !normalizedName.toLowerCase().endsWith('s')
    return quantity > 1
      ? `${quantity} ${needsPlural ? `${normalizedName}s` : normalizedName}`
      : normalizedName
  }

  const crewDescription = crewSize
    ? `${crewSize === '8' ? 'an' : 'a'} ${crewSize}-man crew`
    : ''

  const equipmentItems = [
    crewDescription,
    'gear truck and trailer',
    ...forklifts.map((f: any) => formatEquipmentItem(f.quantity, f.name)),
    ...tractors.map((t: any) => formatEquipmentItem(t.quantity, t.name)),
    ...trailers.map((t: any) =>
      formatEquipmentItem(
        t.quantity,
        t.name.toLowerCase().includes('trailer')
          ? t.name
          : `${t.name} trailer`
      )
    ),
    ...additionalEquipment.map((item: any) => formatEquipmentItem(item.quantity, item.name))
  ].filter(Boolean)

  const equipmentSummary = (() => {
    if (equipmentItems.length === 0) return ''
    if (equipmentItems.length === 1) return equipmentItems[0]
    if (equipmentItems.length === 2)
      return `${equipmentItems[0]} and ${equipmentItems[1]}`
    return `${equipmentItems.slice(0, -1).join(', ')} and ${
      equipmentItems[equipmentItems.length - 1]
    }`
  })()

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

  const storageRate =
    logisticsData.storageLocation === 'inside'
      ? 3.5
      : logisticsData.storageLocation === 'outside'
        ? 2.5
        : null
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
  const storageSection = logisticsData.includeStorage
    ? `\nStorage Requested:\n• Type: ${
        logisticsData.storageLocation === 'inside'
          ? 'Inside storage ($3.50 / sq ft)'
          : logisticsData.storageLocation === 'outside'
            ? 'Outside storage ($2.50 / sq ft)'
            : '[Storage Type]'
      }\n• Square Feet: ${storageSqFtDisplay}\n• Cost: ${storageCostDisplay}\n\n`
    : ''

  const subject = `Truck request for ${shipmentCode} – ${pickupZip} to ${deliveryZip}`

  const body = `Hello,\n\nI'm reaching out to request a logistics quote for an upcoming project. Please see the load and transport details below:\n\nNumber of Pieces: ${numberOfPieces}\n\nPiece Dimensions & Weights (L x W x H):\n${pieceDetails}\n\nTotal Load Weight: ${totalWeight}\n\nPick-Up Location: ${pickupLocation}\n\nDelivery/Set Location: ${deliveryLocation}\n\nTruck Type Requested: ${truckType}\n\nShipment Type: ${shipmentType}\n${storageSection}Please let me know if you need any additional information or documents to complete the quote. Looking forward to your response.\n\nBest regards,${
    signatureLines ? `\n${signatureLines}` : ''
  }`

  return { subject, body }
}

export const generateLogisticsTemplate = (
  equipmentData: any,
  logisticsData: any
) => {
  const { subject, body } = generateLogisticsEmail(equipmentData, logisticsData)
  const recipientsList = LOGISTICS_QUOTE_RECIPIENTS.join('; ')
  return `To: ${recipientsList}\n\n${subject}\n\n${body}`
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
