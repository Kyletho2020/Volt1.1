import { useState, useEffect } from 'react'

export const useSessionId = () => {
  const [sessionId, setSessionId] = useState<string>('')

  useEffect(() => {
    // Get or create session ID
    let id = sessionStorage.getItem('quote-session-id')
    if (!id) {
      id = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem('quote-session-id', id)
    }
    setSessionId(id)
  }, [])

  return sessionId
}