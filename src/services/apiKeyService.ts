import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { encrypt, decrypt } from '../lib/encryption'

export class ApiKeyService {
  private static readonly FIXED_KEY_ID = 'c9f1ba25-04c8-4e36-b942-ff20dfa3d8b3'
  private static readonly LOCAL_STORAGE_KEY = 'om-quote-generator::api-key'
  private static readonly HAS_ENCRYPTION_KEY = Boolean(import.meta.env.VITE_API_KEY_ENCRYPTION_KEY)

  private static isRemoteEnabled(): boolean {
    return isSupabaseConfigured && !!supabase
  }

  private static hasLocalStorage(): boolean {
    return typeof window !== 'undefined' && !!window.localStorage
  }

  static async getApiKey(): Promise<string | null> {
    if (!this.isRemoteEnabled()) {
      if (!this.hasLocalStorage()) {
        return null
      }

      try {
        const raw = window.localStorage.getItem(this.LOCAL_STORAGE_KEY)
        if (!raw) {
          return null
        }

        const stored = JSON.parse(raw) as { encrypted: boolean; value: string }
        if (!stored?.value) {
          return null
        }

        if (stored.encrypted) {
          if (!this.HAS_ENCRYPTION_KEY) {
            console.warn('Encrypted API key found but encryption key is not configured.')
            return null
          }
          return await decrypt(stored.value)
        }

        return stored.value
      } catch (error) {
        console.error('Error reading API key from local storage:', error)
        return null
      }
    }

    try {
      const { data, error } = await supabase!
        .from('api_key_storage')
        .select('encrypted_key')
        .eq('id', this.FIXED_KEY_ID)
        .single()

      if (error) {
        console.error('Error fetching API key:', error)
        return null
      }

      if (!data?.encrypted_key) {
        return null
      }

      try {
        return await decrypt(data.encrypted_key)
      } catch (decryptError) {
        console.error('Failed to decrypt API key:', decryptError)
        return null
      }
    } catch (error) {
      console.error('Error in getApiKey:', error)
      return null
    }
  }

  static async saveApiKey(apiKey: string): Promise<boolean> {
    if (!this.isRemoteEnabled()) {
      if (!this.hasLocalStorage()) {
        console.warn('Cannot persist API key - Supabase and local storage unavailable.')
        return false
      }

      try {
        let value = apiKey
        let encrypted = false

        if (this.HAS_ENCRYPTION_KEY) {
          value = await encrypt(apiKey)
          encrypted = true
        }

        window.localStorage.setItem(
          this.LOCAL_STORAGE_KEY,
          JSON.stringify({ encrypted, value })
        )

        return true
      } catch (error) {
        console.error('Error saving API key locally:', error)
        return false
      }
    }

    try {
      // Encrypt the API key using AES-GCM before storing
      const encryptedApiKey = await encrypt(apiKey)

      const { error } = await supabase!
        .from('api_key_storage')
        .upsert({
          id: this.FIXED_KEY_ID,
          key_name: 'chatgpt_api_key',
          encrypted_key: encryptedApiKey,
        })

      if (error) {
        console.error('Error saving API key:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in saveApiKey:', error)
      return false
    }
  }

  static async hasApiKey(): Promise<boolean> {
    const key = await this.getApiKey()
    return !!key
  }
}
