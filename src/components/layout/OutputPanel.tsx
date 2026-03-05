import React from 'react'
import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { Bot } from 'lucide-react'

interface OutputPanelProps {
  children: ReactNode
  sessionId: string
  hasApiKey: boolean
  hasScopeContent: boolean
  piecesCount: number
}

const OutputPanel: React.FC<OutputPanelProps> = ({
  children,
  sessionId,
  hasApiKey,
  hasScopeContent,
  piecesCount,
}) => {
  const aiStatusLabel = hasApiKey ? 'AI Connected' : 'AI Locked'

  // Convert children to array for staggered animation
  const childArray = React.Children.toArray(children)

  return (
    <aside className="space-y-4">
      {/* Decorative accent line */}
      <div className="h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

      {childArray.map((child, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          {child}
        </motion.div>
      ))}

      {/* Session Info */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: childArray.length * 0.1 }}
        className="rounded-xl bg-white/[0.03] backdrop-blur-md border border-white/[0.06] p-4 shadow-card text-xs transition-all duration-300 hover:border-white/[0.12] hover:shadow-glow"
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-white">Session</span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
              hasApiKey ? 'bg-accent-soft text-accent' : 'bg-surface-raised text-gray-400'
            }`}
          >
            {hasApiKey && (
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-glow-pulse rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
              </span>
            )}
            <Bot className="h-3 w-3" />
            {aiStatusLabel}
          </span>
        </div>
        <p className="mt-2 break-all font-mono text-[11px] text-gray-500">{sessionId}</p>
        <div className="mt-3 grid gap-1.5 text-[11px] uppercase tracking-wider text-gray-500">
          <div className="flex items-center justify-between">
            <span>Scope</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
              hasScopeContent ? 'bg-accent-soft text-accent' : 'bg-surface-raised text-gray-500'
            }`}>
              {hasScopeContent ? 'Ready' : 'Draft'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Pieces</span>
            <span className="text-white">{piecesCount}</span>
          </div>
        </div>
      </motion.div>
    </aside>
  )
}

export default OutputPanel
