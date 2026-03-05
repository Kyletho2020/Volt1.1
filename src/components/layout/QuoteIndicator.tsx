import React from 'react'
import { Badge } from '../ui'

interface QuoteIndicatorProps {
  activeQuoteNumber: string | null
  quickSaveState: 'idle' | 'success' | 'error'
  quickSaveMessage: string | null
}

const QuoteIndicator: React.FC<QuoteIndicatorProps> = ({
  activeQuoteNumber,
  quickSaveState,
  quickSaveMessage,
}) => {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-gray-300">
        {activeQuoteNumber ? `Quote ${activeQuoteNumber}` : 'New Quote'}
      </span>
      {quickSaveState === 'success' && quickSaveMessage && (
        <Badge variant="success">{quickSaveMessage}</Badge>
      )}
      {quickSaveState === 'error' && quickSaveMessage && (
        <Badge variant="danger">{quickSaveMessage}</Badge>
      )}
    </div>
  )
}

export default QuoteIndicator
