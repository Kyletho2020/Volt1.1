import React from 'react'
import { Plus, Save, Bot } from 'lucide-react'
import { Button } from './ui'

interface QuickStartProps {
  onNewQuote: () => void
  onOpenHistory: () => void
  onOpenExtractor: () => void
  hasApiKey: boolean
}

const QuickStart: React.FC<QuickStartProps> = ({
  onNewQuote,
  onOpenHistory,
  onOpenExtractor,
  hasApiKey,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-soft">
        <span className="text-2xl font-bold text-accent">V</span>
      </div>
      <h2 className="text-xl font-semibold text-white">Get Started</h2>
      <p className="mt-2 max-w-sm text-sm text-gray-400">
        Create a new quote, load an existing one, or extract details from a document.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button icon={Plus} onClick={onNewQuote}>
          Start New Quote
        </Button>
        <Button variant="secondary" icon={Save} onClick={onOpenHistory}>
          Load from Library
        </Button>
        {hasApiKey && (
          <Button variant="secondary" icon={Bot} onClick={onOpenExtractor}>
            Extract from Document
          </Button>
        )}
      </div>
    </div>
  )
}

export default QuickStart
