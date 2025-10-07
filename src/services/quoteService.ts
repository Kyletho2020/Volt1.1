import { supabase } from '../lib/supabase'
import { EquipmentData, LogisticsData } from '../types'
import { EquipmentRequirements } from '../components/EquipmentRequired'

export interface QuoteListItem {
  id: string
  quote_number: string
  project_name: string | null
  company_name: string | null
  contact_name: string | null
  created_at: string
  updated_at: string
}

export interface SavedQuote {
  id: string
  quote_number: string
  project_name: string | null
  company_name: string | null
  contact_name: string | null
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
  // Generate a readable quote number
  static generateQuoteNumber(projectName?: string, companyName?: string): string {
    const date = new Date()
    const year = date.getFullYear().toString().slice(-2)
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    const time = date.getHours().toString().padStart(2, '0') + date.getMinutes().toString().padStart(2, '0')
    
    // Create prefix from project or company name
    let prefix = 'QT'
    if (projectName) {
      prefix = projectName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase()
    } else if (companyName) {
      prefix = companyName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase()
    }
    
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
    try {
      const quoteData = {
        quote_number: quoteNumber,
        project_name: equipmentData.projectName || null,
        company_name: equipmentData.companyName || null,
        contact_name: equipmentData.contactName || null,
        site_phone: equipmentData.sitePhone || null,
        shop_location: equipmentData.shopLocation || null,
        site_address: equipmentData.siteAddress || null,
        scope_of_work: equipmentData.scopeOfWork || null,
        logistics_data: {
          ...logisticsData,
          shipmentType: logisticsData?.shipmentType || '',
          storageType: logisticsData?.storageType || '',
          storageSqFt: logisticsData?.storageSqFt || ''
        },
        logistics_shipment: logisticsData?.shipment || null,
        logistics_storage: logisticsData?.storage || null,
        equipment_requirements: equipmentRequirements || null,
        email_template: emailTemplate || null,
        scope_template: scopeTemplate || null,
      }

      let result
      if (existingId) {
        // Update existing quote
        const { data, error } = await supabase
          .from('quotes')
          .update(quoteData)
          .eq('id', existingId)
          .select()
          .single()
        
        result = { data, error }
      } else {
        // Create new quote
        const { data, error } = await supabase
          .from('quotes')
          .insert(quoteData)
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
    try {
      const { data, error } = await supabase
        .from('quotes')
        .select('id, quote_number, project_name, company_name, contact_name, created_at, updated_at')
        .order('updated_at', { ascending: false })
        .limit(50)

      if (error) {
        throw new Error(error.message)
      }

      return data || []
    } catch (error) {
      console.error('Error listing quotes:', error)
      return []
    }
  }

  static async getQuote(id: string): Promise<SavedQuote | null> {
    try {
      const { data, error } = await supabase
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
    try {
      const { error } = await supabase
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
    try {
      const { data, error } = await supabase
        .from('quotes')
        .select('id, quote_number, project_name, company_name, contact_name, created_at, updated_at')
        .or(`quote_number.ilike.%${searchTerm}%,project_name.ilike.%${searchTerm}%,company_name.ilike.%${searchTerm}%,contact_name.ilike.%${searchTerm}%`)
        .order('updated_at', { ascending: false })
        .limit(20)

      if (error) {
        throw new Error(error.message)
      }

      return data || []
    } catch (error) {
      console.error('Error searching quotes:', error)
      return []
    }
  }
}