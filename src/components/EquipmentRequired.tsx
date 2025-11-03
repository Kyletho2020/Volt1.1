import React, { useEffect, useMemo, useState } from 'react'
import {
  X,
  Plus,
  Minus,
  ChevronDown,
  ChevronRight,
  ChevronUp
} from 'lucide-react'

export interface EquipmentItem {
  name: string
  quantity: number
}

export interface EquipmentRequirements {
  crewSize: string
  forklifts: EquipmentItem[]
  tractors: EquipmentItem[]
  trailers: EquipmentItem[]
  additionalEquipment: EquipmentItem[]
}

interface EquipmentRequiredProps {
  data: EquipmentRequirements
  onChange: (data: EquipmentRequirements) => void
}

const forkliftOptions = [
  'Forklift (5k)',
  'Forklift (8k)',
  'Forklift (15k)',
  'Forklift (30k)',
  'Forklift (12k Reach)',
  'Forklift (20k Reach)',
  'Forklift – Hoist 18/26',
  'Versalift 25/35',
  'Versalift 40/60',
  'Versalift 60/80',
  'Trilifter',
]

const tractorOptions = ['3-axle tractor', '4-axle tractor', 'Rollback']

const trailerOptions = ['Dovetail', 'Flatbed', 'Lowboy', 'Step Deck']

const additionalEquipmentOptions = [
  'Material Handler',
  'Spreader Bar',
  '1-ton Gantry',
  '5-ton Gantry',
  "8'x20' Metal Plate",
  "8'x10' Metal Plate",
  'Lift Platform'
]

type EquipmentField =
  | 'forklifts'
  | 'tractors'
  | 'trailers'
  | 'additionalEquipment'

interface EquipmentSection {
  label: string
  field: EquipmentField
  options: string[]
}

const equipmentSections: EquipmentSection[] = [
  { label: 'Forklifts', field: 'forklifts', options: forkliftOptions },
  { label: 'Tractors', field: 'tractors', options: tractorOptions },
  { label: 'Trailers', field: 'trailers', options: trailerOptions },
  {
    label: 'Material Handling & Rigging',
    field: 'additionalEquipment',
    options: additionalEquipmentOptions
  }
]

const EquipmentRequired: React.FC<EquipmentRequiredProps> = ({ data, onChange }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [showAllOptions, setShowAllOptions] = useState(false)
  const [activeCategory, setActiveCategory] = useState<EquipmentField | null>(null)

  const handleFieldChange = <K extends keyof EquipmentRequirements>(
    field: K,
    value: EquipmentRequirements[K]
  ) => {
    onChange({ ...data, [field]: value })
  }

  const adjustQuantity = (
    field: EquipmentField,
    name: string,
    delta: number
  ) => {
    const items = data[field]
    const index = items.findIndex((i) => i.name === name)
    if (index >= 0) {
      const newQty = items[index].quantity + delta
      if (newQty <= 0) {
        handleFieldChange(
          field,
          items.filter((_, i) => i !== index)
        )
      } else {
        const newItems = [...items]
        newItems[index] = { name, quantity: newQty }
        handleFieldChange(field, newItems)
      }
    } else if (delta > 0) {
      handleFieldChange(field, [...items, { name, quantity: 1 }])
    }
  }

  const getQuantity = (
    field: EquipmentField,
    name: string
  ) => data[field].find((i) => i.name === name)?.quantity || 0

  const filteredSections = useMemo(
    () =>
      equipmentSections.map((section) => ({
        ...section,
        options: section.options.filter((option) =>
          option.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })),
    [searchQuery]
  )

  const selectedItems = useMemo(
    () =>
      equipmentSections.flatMap((section) =>
        data[section.field].map((item) => ({
          ...item,
          field: section.field,
          label: section.label
        }))
      ),
    [data]
  )

  useEffect(() => {
    if (!showAllOptions) {
      setActiveCategory(null)
      return
    }

    const availableSection = filteredSections.find((section) => section.options.length > 0)
    if (availableSection) {
      setActiveCategory((prev) => {
        if (
          prev &&
          filteredSections.some(
            (section) => section.field === prev && section.options.length > 0
          )
        ) {
          return prev
        }
        return availableSection.field
      })
    } else {
      setActiveCategory(null)
    }
  }, [showAllOptions, filteredSections])

  const clearSection = () => {
    onChange({
      crewSize: '',
      forklifts: [],
      tractors: [],
      trailers: [],
      additionalEquipment: []
    })
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">Equipment Requirements</h3>
        <button
          type="button"
          onClick={clearSection}
          className="flex items-center gap-2 rounded-lg border border-accent/40 bg-accent-soft/40 px-3 py-1 text-sm font-medium text-accent transition hover:border-accent hover:bg-accent/15 hover:text-white"
        >
          <X className="h-4 w-4" />
          Clear Section
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-white mb-2">Crew Size</label>
        <select
          value={data.crewSize}
          onChange={(e) => handleFieldChange('crewSize', e.target.value)}
          className="w-full rounded-lg border border-accent/30 bg-surface-highlight/70 px-3 py-2 text-white shadow-[0_12px_28px_rgba(8,16,28,0.45)] focus:border-accent focus:ring-2 focus:ring-accent/40"
        >
          <option value="" disabled>
            Select crew size
          </option>
          {Array.from({ length: 9 }, (_, i) => i + 2).map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border border-accent/25 bg-surface-highlight/70 p-4 text-white shadow-[0_20px_45px_rgba(10,18,35,0.5)]">
          <h4 className="text-lg font-semibold mb-3">Selected Equipment</h4>
          {selectedItems.length > 0 ? (
            <div className="space-y-2">
              {selectedItems.map((item) => (
                <div
                  key={`${item.field}-${item.name}`}
                  className="flex items-center justify-between rounded-lg border border-accent/40 bg-surface/80 px-3 py-2 shadow-[0_8px_20px_rgba(8,16,28,0.45)]"
                >
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-gray-300">{item.label}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => adjustQuantity(item.field, item.name, -1)}
                      className="flex h-7 w-7 items-center justify-center rounded border border-accent/30 bg-accent-soft/40 text-accent transition hover:border-accent hover:bg-accent/15 hover:text-white"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => adjustQuantity(item.field, item.name, 1)}
                      className="flex h-7 w-7 items-center justify-center rounded border border-accent/30 bg-accent-soft/40 text-accent transition hover:border-accent hover:bg-accent/15 hover:text-white"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-300">No equipment selected yet.</p>
          )}
          <button
            type="button"
            onClick={() => setShowAllOptions((prev) => !prev)}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-accent/40 bg-accent-soft/40 px-3 py-1 text-sm font-medium text-accent transition hover:border-accent hover:bg-accent/15 hover:text-white"
          >
            {showAllOptions ? (
              <ChevronUp className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            )}
            <span>
              {showAllOptions ? 'Hide equipment list' : 'Add or adjust equipment'}
            </span>
          </button>
        </div>

        {showAllOptions && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Search Equipment</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type to filter equipment"
                className="w-full rounded-lg border border-accent/30 bg-surface-highlight/70 px-3 py-2 text-white shadow-[0_12px_28px_rgba(8,16,28,0.45)] focus:border-accent focus:ring-2 focus:ring-accent/40"
              />
            </div>

            <div className="space-y-2">
              {filteredSections.map((section) => {
                const isActive = activeCategory === section.field
                const hasOptions = section.options.length > 0
                return (
                  <div key={section.field} className="overflow-hidden rounded-xl border border-accent/30 bg-surface/80">
                    <button
                      type="button"
                      onClick={() =>
                        setActiveCategory((prev) =>
                          prev === section.field ? null : section.field
                        )
                      }
                      className="flex w-full items-center justify-between px-4 py-2 text-white transition hover:bg-surface-highlight/80"
                    >
                      <span className="flex items-center gap-2">
                        {isActive ? (
                          <ChevronDown className="w-4 h-4" aria-hidden="true" />
                        ) : (
                          <ChevronRight className="w-4 h-4" aria-hidden="true" />
                        )}
                        <span>{section.label}</span>
                      </span>
                      <span className="text-sm text-gray-300">
                        {data[section.field].reduce((total, item) => total + item.quantity, 0)} selected
                      </span>
                    </button>
                    {isActive && (
                      <div className="space-y-2 bg-surface-highlight/70 px-4 py-3">
                        {hasOptions ? (
                          section.options.map((option) => {
                            const qty = getQuantity(section.field, option)
                            return (
                              <div
                                key={option}
                                className="flex items-center justify-between rounded-lg border border-accent/30 bg-surface/90 px-3 py-2 text-white shadow-[0_8px_18px_rgba(8,16,28,0.4)]"
                              >
                                <span>{option}</span>
                                <div className="flex items-center space-x-2">
                                  <button
                                    type="button"
                                    onClick={() => adjustQuantity(section.field, option, -1)}
                                    className="flex h-7 w-7 items-center justify-center rounded border border-accent/30 bg-accent-soft/40 text-accent transition hover:border-accent hover:bg-accent/15 hover:text-white"
                                  >
                                    <Minus className="w-4 h-4" />
                                  </button>
                                  <span>{qty}</span>
                                  <button
                                    type="button"
                                    onClick={() => adjustQuantity(section.field, option, 1)}
                                    className="flex h-7 w-7 items-center justify-center rounded border border-accent/30 bg-accent-soft/40 text-accent transition hover:border-accent hover:bg-accent/15 hover:text-white"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            )
                          })
                        ) : (
                          <p className="text-sm text-slate-300">
                            No equipment matches your search.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
              {filteredSections.every((section) => section.options.length === 0) && (
                <p className="text-sm text-gray-300 text-center py-4">
                  No equipment matches your search.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default EquipmentRequired
