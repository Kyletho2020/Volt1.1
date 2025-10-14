import type { LogisticsData } from '../types'

export const LOGISTICS_QUOTE_RECIPIENTS = [
  'Logistics@omegamorgan.com',
  'MachineryLogistics@omegamorgan.com'
] as const

export type LogisticsEmailMissingField =
  | 'shipmentType'
  | 'pickupZip'
  | 'deliveryZip'

export interface LogisticsEmailReadiness {
  isReady: boolean
  missingFields: LogisticsEmailMissingField[]
}

const MISSING_FIELD_LABELS: Record<LogisticsEmailMissingField, string> = {
  shipmentType: 'shipment type',
  pickupZip: 'pickup ZIP',
  deliveryZip: 'delivery ZIP'
}

export const getLogisticsEmailReadiness = (
  logisticsData: LogisticsData
): LogisticsEmailReadiness => {
  const missingFields: LogisticsEmailMissingField[] = []

  if (!logisticsData.shipmentType?.trim()) {
    missingFields.push('shipmentType')
  }

  if (!logisticsData.pickupZip?.trim()) {
    missingFields.push('pickupZip')
  }

  if (!logisticsData.deliveryZip?.trim()) {
    missingFields.push('deliveryZip')
  }

  return {
    isReady: missingFields.length === 0,
    missingFields
  }
}

export const formatMissingLogisticsFields = (
  missingFields: LogisticsEmailMissingField[]
): string => {
  if (missingFields.length === 0) {
    return ''
  }

  const labels = missingFields.map(field => MISSING_FIELD_LABELS[field])

  if (labels.length === 1) {
    return labels[0]
  }

  if (labels.length === 2) {
    return `${labels[0]} and ${labels[1]}`
  }

  return `${labels.slice(0, -1).join(', ')}, and ${labels[labels.length - 1]}`
}
