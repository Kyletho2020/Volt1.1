import React from 'react'
import type { UseFormRegisterReturn } from 'react-hook-form'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string
  error?: string
  options: SelectOption[]
  registration?: UseFormRegisterReturn
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void
  placeholder?: string
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, registration, onChange, placeholder, className = '', id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-')

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      registration?.onChange(e)
      onChange?.(e)
    }

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="block text-xs font-medium uppercase tracking-wide text-gray-400 mb-1">
            {label}
          </label>
        )}
        <select
          ref={registration ? registration.ref : ref}
          id={selectId}
          name={registration?.name}
          onBlur={registration?.onBlur}
          onChange={handleChange}
          className={`w-full rounded-lg border bg-surface-raised px-3 py-2 text-sm text-white transition focus:outline-none focus:ring-1 focus:ring-accent ${
            error
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
              : 'border-surface-overlay focus:border-accent'
          } ${className}`}
          {...props}
        >
          {placeholder && (
            <option value="" className="text-gray-500">
              {placeholder}
            </option>
          )}
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
      </div>
    )
  }
)

Select.displayName = 'Select'
export default Select
