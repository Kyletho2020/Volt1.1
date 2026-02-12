import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { EquipmentData, LogisticsData } from '../types'
import { EquipmentRequirements } from '../components/EquipmentRequired'

const LOCAL_STORAGE_KEY = 'om-quote-generator::quotes'

const hasLocalStorage = () => typeof window !== 'undefined' && !!window.localStorage

const readLocalQuotes = (): SavedQuote[] => {
  if (!hasLocalStorage()) {
    return []
  }

  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY)
    if (!raw) {
      return []
    }
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return []
    }
    return (parsed as Partial<SavedQuote>[]).map(quote => ({
      ...quote,
      email: quote.email ?? null
    })) as SavedQuote[]
  } catch (error) {
    console.error('Failed to read local quotes store:', error)
    return []
  }
}

const writeLocalQuotes = (quotes: SavedQuote[]) => {
  if (!hasLocalStorage()) {
    return
  }

  try {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(quotes))
  } catch (error) {
    console.error('Failed to write local quotes store:', error)
  }
}

const generateLocalId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `local-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export interface QuoteListItem {
  id: string
  quote_number: string
  project_name: string | null
  company_name: string | null
  contact_name: string | null
  email: string | null
  created_at: string
  updated_at: string
}

export interface SavedQuote {
  id: string
  quote_number: string
  project_name: string | null
  company_name: string | null
  contact_name: string | null
  email: string | null
  site_phone: string | null
  shop_location: string | null
  site_address: string | null
  scope_of_work: string | null
  logistics_data: LogisticsData | null
  logistics_shipment: Record<string, unknown> | null
  logistics_storage: Record<string, unknown> | null
  equipment_requirements: EquipmentRequirements | null
  email_template: string | null
  scope_template: string | null
  created_at: string
  updated_at: string
}

export class QuoteService {
  static isRemoteEnabled(): boolean {
    return isSupabaseConfigured && !!supabase
  }

  // Generate a readable quote number
  static generateQuoteNumber(projectName?: string, companyName?: string): string {
    const date = new Date()
    const year = date.getFullYear().toString().slice(-2)
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    const time = date.getHours().toString().padStart(2, '0') + date.getMinutes().toString().padStart(2, '0')

    const sanitize = (value?: string) =>
      (value || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase()

    const companySegment = sanitize(companyName)
    const projectSegment = sanitize(projectName)

    const base = companySegment || projectSegment || 'QUOTE'
    const repeatCount = Math.ceil(6 / base.length)
    const prefix = base.repeat(repeatCount).slice(0, 6)

    return `${prefix}-${year}${month}${day}-${time}`
  }

  static async saveQuote(
    quoteNumber: string,
    equipmentData: EquipmentData,
    logisticsData: LogisticsData,
    equipmentRequirements: EquipmentRequirements,
    emailTemplate?: string,
    scopeTemplate?: string,
    existingId?: string
  ): Promise<{ success: boolean; id?: string; error?: string }> {
    const quoteData: SavedQuote = {
      id: existingId || generateLocalId(),
      quote_number: quoteNumber,
      project_name: equipmentData.projectName || null,
      company_name: equipmentData.companyName || null,
      contact_name: equipmentData.contactName || null,
      email: equipmentData.email || null,
      site_phone: equipmentData.sitePhone || null,
      shop_location: equipmentData.shopLocation || null,
      site_address: equipmentData.siteAddress || null,
      scope_of_work: equipmentData.scopeOfWork || null,
      logistics_data: {
        ...logisticsData,
        shipmentType: logisticsData?.shipmentType || '',
        includeStorage: logisticsData?.includeStorage ?? false,
        storageLocation: logisticsData?.storageLocation || '',
        storageSqFt: logisticsData?.storageSqFt || ''
      },
      logistics_shipment: logisticsData?.shipment || null,
      logistics_storage: logisticsData?.storage || null,
      equipment_requirements: equipmentRequirements || null,
      email_template: emailTemplate || null,
      scope_template: scopeTemplate || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    if (!this.isRemoteEnabled()) {
      if (!hasLocalStorage()) {
        console.warn('Supabase is not configured and local storage is unavailable.')
        return {
          success: false,
          error: 'Quotes cannot be saved because Supabase is not configured.'
        }
      }

      const existingQuotes = readLocalQuotes()
      const existingIndex = existingId
        ? existingQuotes.findIndex(quote => quote.id === existingId)
        : -1

      if (existingIndex >= 0) {
        const original = existingQuotes[existingIndex]
        existingQuotes[existingIndex] = {
          ...quoteData,
          id: original.id,
          created_at: original.created_at,
          updated_at: new Date().toISOString()
        }
      } else {
        existingQuotes.unshift({
          ...quoteData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      }

      writeLocalQuotes(existingQuotes)
      return { success: true, id: existingId || existingQuotes[0].id }
    }

    try {
      const payload = {
        quote_number: quoteData.quote_number,
        project_name: quoteData.project_name,
        company_name: quoteData.company_name,
        contact_name: quoteData.contact_name,
        email: quoteData.email,
        site_phone: quoteData.site_phone,
        shop_location: quoteData.shop_location,
        site_address: quoteData.site_address,
        scope_of_work: quoteData.scope_of_work,
        logistics_data: quoteData.logistics_data,
        logistics_shipment: quoteData.logistics_shipment,
        logistics_storage: quoteData.logistics_storage,
        equipment_requirements: quoteData.equipment_requirements,
        email_template: quoteData.email_template,
        scope_template: quoteData.scope_template
      }

      let result
      if (existingId) {
        const { data, error } = await supabase!
          .from('quotes')
          .update(payload)
          .eq('id', existingId)
          .select()
          .single()

        result = { data, error }
      } else {
        const { data, error } = await supabase!
          .from('quotes')
          .insert(payload)
          .select()
          .single()

        result = { data, error }
      }

      if (result.error) {
        throw new Error(result.error.message)
      }

      return { success: true, id: result.data.id }
    } catch (error) {
      console.error('Error saving quote:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save quote'
      }
    }
  }

  static async listQuotes(): Promise<QuoteListItem[]> {
    if (!this.isRemoteEnabled()) {
      const quotes = readLocalQuotes()
      return quotes
        .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
        .slice(0, 50)
        .map(({ id, quote_number, project_name, company_name, contact_name, email, created_at, updated_at }) => ({
          id,
          quote_number,
          project_name,
          company_name,
          contact_name,
          email: email ?? null,
          created_at,
          updated_at
        }))
    }

    try {
      const { data, error } = await supabase!
        .from('quotes')
        .select('id, quote_number, project_name, company_name, contact_name, email, created_at, updated_at')
        .order('updated_at', { ascending: false })
        .limit(50)

      if (error) {
        throw new Error(error.message)
      }

      return (data || []).map(item => ({
        ...item,
        email: item.email ?? null
      }))
    } catch (error) {
      console.error('Error listing quotes:', error)
      return []
    }
  }

  static async getQuote(id: string): Promise<SavedQuote | null> {
    if (!this.isRemoteEnabled()) {
      const quotes = readLocalQuotes()
      return quotes.find(quote => quote.id === id) || null
    }

    try {
      const { data, error } = await supabase!
        .from('quotes')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return data
    } catch (error) {
      console.error('Error getting quote:', error)
      return null
    }
  }

  static async deleteQuote(id: string): Promise<boolean> {
    if (!this.isRemoteEnabled()) {
      const quotes = readLocalQuotes()
      const filtered = quotes.filter(quote => quote.id !== id)
      writeLocalQuotes(filtered)
      return filtered.length !== quotes.length
    }

    try {
      const { error } = await supabase!
        .from('quotes')
        .delete()
        .eq('id', id)

      if (error) {
        throw new Error(error.message)
      }

      return true
    } catch (error) {
      console.error('Error deleting quote:', error)
      return false
    }
  }

  static async searchQuotes(searchTerm: string): Promise<QuoteListItem[]> {
    if (!this.isRemoteEnabled()) {
      const lowerTerm = searchTerm.toLowerCase()
      return readLocalQuotes()
        .filter(quote => {
          const values = [
            quote.quote_number,
            quote.project_name || '',
            quote.company_name || '',
            quote.contact_name || '',
            quote.email || ''
          ]

          return values.some(value => value.toLowerCase().includes(lowerTerm))
        })
        .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
        .slice(0, 20)
        .map(({ id, quote_number, project_name, company_name, contact_name, email, created_at, updated_at }) => ({
          id,
          quote_number,
          project_name,
          company_name,
          contact_name,
          email: email ?? null,
          created_at,
          updated_at
        }))
    }

    try {
      const { data, error } = await supabase!
        .from('quotes')
        .select('id, quote_number, project_name, company_name, contact_name, email, created_at, updated_at')
        .or(`quote_number.ilike.%${searchTerm}%,project_name.ilike.%${searchTerm}%,company_name.ilike.%${searchTerm}%,contact_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .order('updated_at', { ascending: false })
        .limit(20)

      if (error) {
        throw new Error(error.message)
      }

      return (data || []).map(item => ({
        ...item,
        email: item.email ?? null
      }))
    } catch (error) {
      console.error('Error searching quotes:', error)
      return []
    }
  }
}