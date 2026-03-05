import { useState } from 'react'

export const useModals = () => {
  const [showAIExtractor, setShowAIExtractor] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showDailyConfirmation, setShowDailyConfirmation] = useState(false)

  return {
    showAIExtractor,
    openAIExtractor: () => setShowAIExtractor(true),
    closeAIExtractor: () => setShowAIExtractor(false),
    showHistory,
    openHistory: () => setShowHistory(true),
    closeHistory: () => setShowHistory(false),
    showDailyConfirmation,
    openDailyConfirmation: () => setShowDailyConfirmation(true),
    closeDailyConfirmation: () => setShowDailyConfirmation(false),
  }
}

export default useModals
