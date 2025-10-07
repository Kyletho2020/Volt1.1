import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { SupabaseTempQuoteResponse } from '../types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

if (!isSupabaseConfigured && import.meta.env.DEV) {
  console.warn(
    'Supabase environment variables are not configured. Falling back to local storage.'
  )
}

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      },
      global: {
        headers: {
          'X-Client-Info': 'om-quote-generator'
        }
      }
    })
  : null

export type TempQuoteData = SupabaseTempQuoteResponse
