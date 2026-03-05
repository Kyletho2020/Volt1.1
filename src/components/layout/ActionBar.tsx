import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Save, RefreshCcw, ClipboardList, Bot, FileText, Truck } from 'lucide-react'
import { IconButton, Tooltip } from '../ui'

interface ActionBarProps {
  onNewQuote: () => void
  onOpenHistory: () => void
  onQuickSave: () => void
  onOpenDailyConfirmation: () => void
  onOpenExtractor: (mode: 'all' | 'scope' | 'logistics') => void
  isQuickSaving: boolean
  activeQuoteId: string | null
  hasApiKey: boolean
}

const ActionBar: React.FC<ActionBarProps> = ({
  onNewQuote,
  onOpenHistory,
  onQuickSave,
  onOpenDailyConfirmation,
  onOpenExtractor,
  isQuickSaving,
  activeQuoteId,
  hasApiKey,
}) => {
  const [aiOpen, setAiOpen] = useState(false)
  const aiRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!aiOpen) return
    const handleClick = (e: MouseEvent) => {
      if (aiRef.current && !aiRef.current.contains(e.target as Node)) {
        setAiOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [aiOpen])

  const aiActions = [
    { mode: 'all' as const, label: 'Full Extract', icon: Bot },
    { mode: 'scope' as const, label: 'Scope Focus', icon: FileText },
    { mode: 'logistics' as const, label: 'Logistics Focus', icon: Truck },
  ]

  return (
    <div className="flex items-center gap-1">
      <Tooltip content="New Quote">
        <IconButton icon={Plus} onClick={onNewQuote} variant="default" />
      </Tooltip>
      <Tooltip content="Save / Load">
        <IconButton icon={Save} onClick={onOpenHistory} variant="default" />
      </Tooltip>
      <Tooltip content={activeQuoteId ? 'Quick Save' : 'Load a quote first'}>
        <IconButton
          icon={RefreshCcw}
          onClick={onQuickSave}
          variant={activeQuoteId ? 'accent' : 'default'}
          disabled={isQuickSaving}
        />
      </Tooltip>
      <Tooltip content="Daily Confirmation">
        <IconButton icon={ClipboardList} onClick={onOpenDailyConfirmation} variant="default" />
      </Tooltip>

      {/* Glowing divider */}
      <div className="mx-1 h-5 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />

      <div ref={aiRef} className="relative">
        <Tooltip content={hasApiKey ? 'AI Extract' : 'AI Locked'}>
          <IconButton
            icon={Bot}
            onClick={() => hasApiKey && setAiOpen(!aiOpen)}
            variant={hasApiKey ? 'accent' : 'default'}
            disabled={!hasApiKey}
          />
        </Tooltip>
        <AnimatePresence>
          {aiOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.95 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="absolute right-0 top-full mt-2 w-44 rounded-lg border border-white/[0.08] bg-surface-raised/95 backdrop-blur-xl shadow-panel z-50"
            >
              {aiActions.map(action => {
                const ActionIcon = action.icon
                return (
                  <button
                    key={action.mode}
                    type="button"
                    onClick={() => {
                      onOpenExtractor(action.mode)
                      setAiOpen(false)
                    }}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-300 transition hover:bg-surface-overlay hover:text-white first:rounded-t-lg last:rounded-b-lg"
                  >
                    <ActionIcon className="h-4 w-4 text-accent" />
                    {action.label}
                  </button>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default ActionBar
