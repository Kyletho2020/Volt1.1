import React from 'react'
import type { LucideIcon } from 'lucide-react'
import type { UseFormRegisterReturn } from 'react-hook-form'

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string
  error?: string
  icon?: LucideIcon
  registration?: UseFormRegisterReturn
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon: Icon, registration, onChange, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      registration?.onChange(e)
      onChange?.(e)
    }

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-medium uppercase tracking-wide text-gray-400 mb-1">
            {label}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Icon className="h-4 w-4 text-gray-500" />
            </div>
          )}
          <input
            ref={registration ? registration.ref : ref}
            id={inputId}
            name={registration?.name}
            onBlur={registration?.onBlur}
            onChange={handleChange}
            className={`w-full rounded-lg border bg-surface-raised px-3 py-2 text-sm text-white placeholder-gray-500 transition focus:outline-none focus:ring-1 focus:ring-accent ${
              Icon ? 'pl-10' : ''
            } ${
              error
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                : 'border-surface-overlay focus:border-accent'
            } ${className}`}
            {...props}
          />
        </div>
        {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
export default Input
