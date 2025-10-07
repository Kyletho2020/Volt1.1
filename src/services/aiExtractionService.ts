import { ApiKeyService } from './apiKeyService'
import { ExtractionResult } from '../types'

export class AIExtractionService {
  private static readonly SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
  private static readonly SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

  static async extractProjectInfo(
    text: string,
    sessionId: string
  ): Promise<ExtractionResult> {
    try {
      // Check if environment variables are available
      if (!this.SUPABASE_URL || !this.SUPABASE_ANON_KEY) {
        throw new Error('Supabase configuration missing. Please check environment variables.')
      }

      // Validate inputs
      if (!text?.trim()) {
        throw new Error('Text is required')
      }

      if (!sessionId?.trim()) {
        throw new Error('Session ID is required')
      }

      console.log('Calling AI extraction service...', { 
        supabaseUrl: this.SUPABASE_URL,
        hasAnonKey: !!this.SUPABASE_ANON_KEY,
        sessionId,
        textLength: text.length
      })

      // Call the edge function
      const response = await fetch(`${this.SUPABASE_URL}/functions/v1/ai-extract-project`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text.trim(),
          sessionId: sessionId
        }),
      })

      console.log('Edge function response:', { 
        ok: response.ok, 
        status: response.status, 
        statusText: response.statusText 
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Network error')
        console.error('Edge function error:', errorText)
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { error: errorText }
        }
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const result: ExtractionResult = await response.json()
      console.log('AI extraction raw result:', result)

      if (!result.success) {
        throw new Error(result.error || 'Extraction failed')
      }

      // Log the extracted data for debugging
      console.log('Extracted equipment data:', result.equipmentData)
      console.log('Extracted logistics data:', result.logisticsData)

      return {
        success: true,
        equipmentData: result.equipmentData,
        logisticsData: result.logisticsData
      }

    } catch (error) {
      console.error('AI Extraction Error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown extraction error'
      }
    }
  }
}
