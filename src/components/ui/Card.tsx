import React from 'react'
import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface CardProps {
  title?: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  animate?: boolean
}

const paddingStyles = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
} as const

const Card: React.FC<CardProps> = ({ title, subtitle, actions, children, className = '', padding = 'md', animate = true }) => {
  const Wrapper = animate ? motion.div : 'div'
  const motionProps = animate
    ? {
        initial: { opacity: 0, y: 8 } as const,
        animate: { opacity: 1, y: 0 } as const,
        transition: { duration: 0.3, ease: 'easeOut' } as const,
      }
    : {}

  return (
    <Wrapper
      className={`rounded-xl bg-white/[0.03] backdrop-blur-md border border-white/[0.06] shadow-card transition-all duration-300 ease-out hover:border-white/[0.12] hover:shadow-glow ${paddingStyles[padding]} ${className}`}
      {...motionProps}
    >
      {(title || actions) && (
        <div className={`flex items-start justify-between gap-3 ${padding === 'none' ? 'p-4 pb-0' : 'mb-3'}`}>
          <div>
            {title && <h3 className="text-sm font-semibold text-white">{title}</h3>}
            {subtitle && <p className="mt-0.5 text-xs text-gray-400">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-1.5">{actions}</div>}
        </div>
      )}
      {children}
    </Wrapper>
  )
}

export default Card
