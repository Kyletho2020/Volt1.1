import React from 'react'
import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'

const variantStyles = {
  primary:
    'bg-gradient-to-r from-accent to-blue-600 text-white hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] focus:ring-accent/50',
  secondary:
    'border border-surface-overlay bg-surface-raised text-gray-300 hover:bg-surface-overlay hover:text-white focus:ring-accent/50',
  ghost:
    'text-gray-400 hover:bg-surface-raised hover:text-white focus:ring-accent/50',
  danger:
    'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500/50',
} as const

const sizeStyles = {
  sm: 'px-2.5 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-5 py-2.5 text-base gap-2',
} as const

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variantStyles
  size?: keyof typeof sizeStyles
  loading?: boolean
  icon?: LucideIcon
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, icon: Icon, children, className = '', disabled, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        disabled={disabled || loading}
        whileHover={disabled || loading ? undefined : { scale: 1.02 }}
        whileTap={disabled || loading ? undefined : { scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className={`relative inline-flex items-center justify-center rounded-lg font-medium transition-shadow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {loading && (
          <div className="absolute inset-0 rounded-lg animate-shimmer" />
        )}
        {loading ? (
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : Icon ? (
          <Icon className="h-4 w-4" />
        ) : null}
        <span className="relative z-10">{children}</span>
      </motion.button>
    )
  }
)

Button.displayName = 'Button'
export default Button
