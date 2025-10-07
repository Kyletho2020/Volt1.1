import { supabase } from '../lib/supabase'
import { encrypt, decrypt } from '../lib/encryption'

export class ApiKeyService {
  private static readonly FIXED_KEY_ID = 'c9f1ba25-04c8-4e36-b942-ff20dfa3d8b3'

  static async getApiKey(): Promise<string | null> {
    try {
      const { data, error } = await supabase
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
    try {
      // Encrypt the API key using AES-GCM before storing
      const encryptedApiKey = await encrypt(apiKey)

      const { error } = await supabase
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
