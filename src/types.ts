import { EquipmentRequirements } from './components/EquipmentRequired'

export interface EquipmentData {
  jobNumber?: string
  startTime?: string
  projectName?: string
  companyName?: string
  contactName?: string
  siteAddress?: string
  sitePhone?: string
  shopLocation?: string
  scopeOfWork?: string
  email?: string
  equipmentRequirements: EquipmentRequirements
}

export interface LogisticsPiece {
  id: string
  description: string
  quantity: number
  length: string
  width: string
  height: string
  weight: string
}

export interface LogisticsData {
  pieces?: LogisticsPiece[]
  pickupAddress?: string
  pickupCity?: string
  pickupState?: string
  pickupZip?: string
  deliveryAddress?: string
  deliveryCity?: string
  deliveryState?: string
  deliveryZip?: string
  shipmentType?: string
  truckType?: string
  includeStorage?: boolean
  storageLocation?: 'inside' | 'outside' | ''
  storageSqFt?: string
  shipment?: Record<string, unknown> | null
  storage?: Record<string, unknown> | null
  dimensionUnit?: 'in' | 'ft'
}

export interface ExtractionResult {
  equipmentData?: Partial<EquipmentData>
  logisticsData?: Partial<LogisticsData>
  success: boolean
  error?: string
}

export interface SupabaseTempQuoteResponse {
  id?: string
  session_id: string
  equipment_data?: EquipmentData
  logistics_data?: LogisticsData
  created_at?: string
  updated_at?: string
}
