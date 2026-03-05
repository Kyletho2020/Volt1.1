import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Copy, CheckCircle } from 'lucide-react'
import { Card } from './ui'

type TemplateType = 'email' | 'scope' | 'logistics'

interface TemplateCardProps {
  title: string
  icon: LucideIcon
  description?: string
  template: string
  templateType: TemplateType
  actions?: ReactNode
  copiedTemplate: TemplateType | null
  onCopy: (text: string, type: TemplateType) => void
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  title,
  icon: Icon,
  description,
  template,
  templateType,
  actions,
  copiedTemplate,
  onCopy,
}) => {
  const isCopied = copiedTemplate === templateType

  return (
    <Card padding="md">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent shrink-0 ring-1 ring-accent/20">
            <Icon className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-white">{title}</h3>
            {description && <p className="mt-0.5 text-xs text-gray-400">{description}</p>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {actions}
          <button
            type="button"
            onClick={() => onCopy(template, templateType)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
              isCopied
                ? 'border-accent/40 bg-accent-soft text-accent'
                : 'border-surface-overlay bg-surface-raised text-gray-300 hover:text-white hover:bg-surface-overlay'
            }`}
          >
            <AnimatePresence mode="wait" initial={false}>
              {isCopied ? (
                <motion.span
                  key="check"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  className="inline-flex items-center gap-1.5"
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                  Copied
                </motion.span>
              ) : (
                <motion.span
                  key="copy"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  className="inline-flex items-center gap-1.5"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>
      <div className="mt-3 rounded-lg border border-white/[0.06] bg-surface-raised p-3 transition-colors hover:bg-white/[0.02]">
        <pre className="whitespace-pre-wrap text-xs font-mono leading-relaxed text-gray-300">{template}</pre>
      </div>
    </Card>
  )
}

export default TemplateCard
