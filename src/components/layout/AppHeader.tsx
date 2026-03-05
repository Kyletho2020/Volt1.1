import React from 'react'
import { motion } from 'framer-motion'
import { Badge } from '../ui'
import QuoteIndicator from './QuoteIndicator'
import ActionBar from './ActionBar'

interface AppHeaderProps {
  activeQuoteNumber: string | null
  quickSaveState: 'idle' | 'success' | 'error'
  quickSaveMessage: string | null
  onNewQuote: () => void
  onOpenHistory: () => void
  onQuickSave: () => void
  onOpenDailyConfirmation: () => void
  onOpenExtractor: (mode: 'all' | 'scope' | 'logistics') => void
  isQuickSaving: boolean
  activeQuoteId: string | null
  hasApiKey: boolean
}

const AppHeader: React.FC<AppHeaderProps> = ({
  activeQuoteNumber,
  quickSaveState,
  quickSaveMessage,
  onNewQuote,
  onOpenHistory,
  onQuickSave,
  onOpenDailyConfirmation,
  onOpenExtractor,
  isQuickSaving,
  activeQuoteId,
  hasApiKey,
}) => {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-40 w-full max-w-[1460px] px-4 sm:px-6"
    >
      <div className="flex h-14 items-center justify-between rounded-2xl bg-surface/80 backdrop-blur-xl border border-white/[0.08] px-5 shadow-glow-lg">
        {/* Left: wordmark */}
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-white tracking-tight">Volt</span>
          <Badge variant="accent">1.2</Badge>
        </div>

        {/* Center: quote indicator */}
        <QuoteIndicator
          activeQuoteNumber={activeQuoteNumber}
          quickSaveState={quickSaveState}
          quickSaveMessage={quickSaveMessage}
        />

        {/* Right: actions */}
        <ActionBar
          onNewQuote={onNewQuote}
          onOpenHistory={onOpenHistory}
          onQuickSave={onQuickSave}
          onOpenDailyConfirmation={onOpenDailyConfirmation}
          onOpenExtractor={onOpenExtractor}
          isQuickSaving={isQuickSaving}
          activeQuoteId={activeQuoteId}
          hasApiKey={hasApiKey}
        />
      </div>
    </motion.header>
  )
}

export default AppHeader
