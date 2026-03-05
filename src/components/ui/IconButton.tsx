import React from 'react'
import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'

const variantStyles = {
  default: 'text-gray-400 hover:bg-surface-raised hover:text-white',
  accent: 'text-accent hover:bg-accent-soft hover:text-accent',
  danger: 'text-gray-400 hover:bg-red-500/15 hover:text-red-400',
} as const

const sizeStyles = {
  sm: 'p-1.5',
  md: 'p-2',
  lg: 'p-2.5',
} as const

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon
  tooltip?: string
  variant?: keyof typeof variantStyles
  size?: keyof typeof sizeStyles
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon: Icon, tooltip, variant = 'default', size = 'md', className = '', disabled, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        title={tooltip}
        aria-label={tooltip}
        disabled={disabled}
        whileHover={disabled ? undefined : { scale: 1.1 }}
        whileTap={disabled ? undefined : { scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        className={`inline-flex items-center justify-center rounded-lg transition focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        <Icon className={size === 'sm' ? 'h-3.5 w-3.5' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} />
      </motion.button>
    )
  }
)

IconButton.displayName = 'IconButton'
export default IconButton
