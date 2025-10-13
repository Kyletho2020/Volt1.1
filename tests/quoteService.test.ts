import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../src/lib/supabase', () => ({
  supabase: { from: vi.fn() },
  isSupabaseConfigured: true
}))

import { QuoteService } from '../src/services/quoteService'
import type { EquipmentData, LogisticsData } from '../src/types'
import { EquipmentRequirements } from '../src/components/EquipmentRequired'
import { supabase } from '../src/lib/supabase'

const fromMock = supabase.from as unknown as ReturnType<typeof vi.fn>

const equipmentData: EquipmentData = {
  projectName: 'Project',
  companyName: 'Company',
  contactName: 'Contact',
  siteAddress: '',
  sitePhone: '',
  shopLocation: '',
  scopeOfWork: '',
  email: '',
  equipmentRequirements: {
    crewSize: '',
    forklifts: [],
    tractors: [],
    trailers: [],
    additionalEquipment: []
  } as EquipmentRequirements
}

const logisticsData: LogisticsData = {
  shipmentType: '',
  storageType: '',
  storageSqFt: '',
  shipment: null,
  storage: null
}

const equipmentRequirements: EquipmentRequirements = {
  crewSize: '',
  forklifts: [],
  tractors: [],
  trailers: [],
  additionalEquipment: []
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('QuoteService', () => {
  it('generates quote number with company prefix in first six characters', () => {
    const quoteNumber = QuoteService.generateQuoteNumber('My Project', 'Volt Corp')
    expect(quoteNumber.startsWith('VOLTCO-')).toBe(true)
  })

  it('falls back to project name prefix when company is missing', () => {
    const quoteNumber = QuoteService.generateQuoteNumber('My Project')
    expect(quoteNumber.startsWith('MYPROJ-')).toBe(true)
  })

  it('saves quote successfully', async () => {
    const singleMock = vi.fn().mockResolvedValue({ data: { id: '123' }, error: null })
    const selectMock = vi.fn().mockReturnValue({ single: singleMock })
    const insertMock = vi.fn().mockReturnValue({ select: selectMock })
    ;(fromMock as any).mockReturnValue({ insert: insertMock })

    const result = await QuoteService.saveQuote('Q1', equipmentData, logisticsData, equipmentRequirements)

    expect(insertMock).toHaveBeenCalled()
    expect(result).toEqual({ success: true, id: '123' })
  })

  it('returns error when supabase fails to save quote', async () => {
    const singleMock = vi.fn().mockResolvedValue({ data: null, error: { message: 'fail' } })
    const selectMock = vi.fn().mockReturnValue({ single: singleMock })
    const insertMock = vi.fn().mockReturnValue({ select: selectMock })
    ;(fromMock as any).mockReturnValue({ insert: insertMock })

    const result = await QuoteService.saveQuote('Q1', equipmentData, logisticsData, equipmentRequirements)

    expect(result.success).toBe(false)
    expect(result.error).toBe('fail')
  })
})
