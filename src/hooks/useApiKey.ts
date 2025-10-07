import { useState, useEffect } from 'react'

export const useApiKey = () => {
  const [hasApiKey, setHasApiKey] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const checkApiKey = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Check if VITE_OPENAI_API_KEY is configured in environment
      const hasKey = !!import.meta.env.VITE_OPENAI_API_KEY
      console.log('API Key check:', { hasKey, envVar: import.meta.env.VITE_OPENAI_API_KEY ? 'present' : 'missing' })
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