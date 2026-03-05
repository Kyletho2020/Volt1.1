import React from 'react'
import type { UseFormRegisterReturn } from 'react-hook-form'

interface TextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  label?: string
  error?: string
  registration?: UseFormRegisterReturn
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, registration, onChange, className = '', id, rows = 4, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-')

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      registration?.onChange(e)
      onChange?.(e)
    }

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={textareaId} className="block text-xs font-medium uppercase tracking-wide text-gray-400 mb-1">
            {label}
          </label>
        )}
        <textarea
          ref={registration ? registration.ref : ref}
          id={textareaId}
          name={registration?.name}
          onBlur={registration?.onBlur}
          onChange={handleChange}
          rows={rows}
          className={`w-full rounded-lg border bg-surface-raised px-3 py-2 text-sm text-white placeholder-gray-500 transition focus:outline-none focus:ring-1 focus:ring-accent resize-y ${
            error
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
              : 'border-surface-overlay focus:border-accent'
          } ${className}`}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
export default Textarea
