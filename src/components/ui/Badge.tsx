import React from 'react'

const variantStyles = {
  default: 'bg-surface-raised text-gray-300 border-surface-overlay',
  success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  warning: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  danger: 'bg-red-500/15 text-red-400 border-red-500/30',
  accent: 'bg-accent-soft text-accent border-accent/30',
} as const

interface BadgeProps {
  variant?: keyof typeof variantStyles
  children: React.ReactNode
  className?: string
}

const Badge: React.FC<BadgeProps> = ({ variant = 'default', children, className = '' }) => {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  )
}

export default Badge
