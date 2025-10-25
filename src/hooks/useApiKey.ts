import { useState, useEffect } from 'react'
import { ApiKeyService } from '../services/apiKeyService'

export const useApiKey = () => {
  const [hasApiKey, setHasApiKey] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const checkApiKey = async () => {
    try {
      setLoading(true)
      setError(null)
      let hasKey = false

      try {
        hasKey = await ApiKeyService.hasApiKey()
      } catch (serviceError) {
        console.error('Error checking stored API key:', serviceError)
      }

      if (!hasKey) {
        const envKey = import.meta.env.VITE_OPENAI_API_KEY
        hasKey = Boolean(envKey)

        if (envKey) {
          console.warn('Using API key from environment variable.')
        }
      }

      setHasApiKey(hasKey)
    } catch (err) {
      console.error('Error checking API key:', err)
      setError(err instanceof Error ? err.message : 'Failed to check API key')
      setHasApiKey(false)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkApiKey()
  }, [])

  return { hasApiKey, loading, error, refetch: checkApiKey }
}