import React, { useEffect, useMemo, useState } from 'react'
import {
  X,
  Plus,
  Minus,
  ChevronDown,
  ChevronRight,
  ChevronUp
} from 'lucide-react'
import { Button } from './ui'

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
  'Forklift (5k)', 'Forklift (8k)', 'Forklift (15k)', 'Forklift (30k)',
  'Forklift (12k Reach)', 'Forklift (20k Reach)', 'Forklift – Hoist 18/26',
  'Versalift 25/35', 'Versalift 40/60', 'Versalift 60/80', 'Trilifter',
]

const tractorOptions = ['3-axle tractor', '4-axle tractor', 'Rollback']
const trailerOptions = ['Dovetail', 'Flatbed', 'Lowboy', 'Step Deck', 'Curtain Trailer']
const additionalEquipmentOptions = [
  'Material Handler', 'Spreader Bar', '1-ton Gantry', '5-ton Gantry',
  "8'x20' Metal Plate", "8'x10' Metal Plate", 'Lift Platform', 'Bundle of Crib Ties'
]

type EquipmentField = 'forklifts' | 'tractors' | 'trailers' | 'additionalEquipment'

interface EquipmentSection {
  label: string
  field: EquipmentField
  options: string[]
}

const equipmentSections: EquipmentSection[] = [
  { label: 'Forklifts', field: 'forklifts', options: forkliftOptions },
  { label: 'Tractors', field: 'tractors', options: tractorOptions },
  { label: 'Trailers', field: 'trailers', options: trailerOptions },
  { label: 'Material Handling & Rigging', field: 'additionalEquipment', options: additionalEquipmentOptions }
]

const inputCls =
  'w-full rounded-lg border border-surface-overlay bg-surface-raised px-3 py-2 text-sm text-white placeholder-gray-500 transition focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent'

const EquipmentRequired: React.FC<EquipmentRequiredProps> = ({ data, onChange }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [showAllOptions, setShowAllOptions] = useState(false)
  const [activeCategory, setActiveCategory] = useState<EquipmentField | null>(null)

  const handleFieldChange = <K extends keyof EquipmentRequirements>(
    field: K, value: EquipmentRequirements[K]
  ) => {
    onChange({ ...data, [field]: value })
  }

  const adjustQuantity = (field: EquipmentField, name: string, delta: number) => {
    const items = data[field]
    const index = items.findIndex((i) => i.name === name)
    if (index >= 0) {
      const newQty = items[index].quantity + delta
      if (newQty <= 0) {
        handleFieldChange(field, items.filter((_, i) => i !== index))
      } else {
        const newItems = [...items]
        newItems[index] = { name, quantity: newQty }
        handleFieldChange(field, newItems)
      }
    } else if (delta > 0) {
      handleFieldChange(field, [...items, { name, quantity: 1 }])
    }
  }

  const getQuantity = (field: EquipmentField, name: string) =>
    data[field].find((i) => i.name === name)?.quantity || 0

  const filteredSections = useMemo(
    () => equipmentSections.map((section) => ({
      ...section,
      options: section.options.filter((option) =>
        option.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })),
    [searchQuery]
  )

  const selectedItems = useMemo(
    () => equipmentSections.flatMap((section) =>
      data[section.field].map((item) => ({
        ...item, field: section.field, label: section.label
      }))
    ),
    [data]
  )

  useEffect(() => {
    if (!showAllOptions) { setActiveCategory(null); return }
    const availableSection = filteredSections.find((s) => s.options.length > 0)
    if (availableSection) {
      setActiveCategory((prev) => {
        if (prev && filteredSections.some((s) => s.field === prev && s.options.length > 0)) return prev
        return availableSection.field
      })
    } else {
      setActiveCategory(null)
    }
  }, [showAllOptions, filteredSections])

  const clearSection = () => {
    onChange({ crewSize: '', forklifts: [], tractors: [], trailers: [], additionalEquipment: [] })
  }

  const qtyBtnCls =
    'flex h-7 w-7 items-center justify-center rounded-md border border-surface-overlay bg-surface-raised text-gray-400 transition hover:bg-surface-overlay hover:text-white'

  return (
    <div className="mt-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Equipment Requirements</h3>
        <Button variant="ghost" size="sm" icon={X} onClick={clearSection}>
          Clear
        </Button>
      </div>

      <div>
        <label className="block text-xs font-medium uppercase tracking-wide text-gray-400 mb-1">Crew Size</label>
        <select
          value={data.crewSize}
          onChange={(e) => handleFieldChange('crewSize', e.target.value)}
          className={inputCls}
        >
          <option value="" disabled>Select crew size</option>
          {Array.from({ length: 9 }, (_, i) => i + 2).map((size) => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>
      </div>

      <div className="rounded-xl border border-surface-overlay/50 bg-surface-raised p-4">
        <h4 className="text-sm font-semibold text-white mb-3">Selected Equipment</h4>
        {selectedItems.length > 0 ? (
          <div className="space-y-2">
            {selectedItems.map((item) => (
              <div
                key={`${item.field}-${item.name}`}
                className="flex items-center justify-between rounded-lg border border-surface-overlay/50 bg-surface px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium text-white">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.label}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => adjustQuantity(item.field, item.name, -1)} className={qtyBtnCls}>
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-sm text-white w-6 text-center">{item.quantity}</span>
                  <button type="button" onClick={() => adjustQuantity(item.field, item.name, 1)} className={qtyBtnCls}>
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No equipment selected yet.</p>
        )}
        <Button
          variant="secondary"
          size="sm"
          icon={showAllOptions ? ChevronUp : ChevronDown}
          onClick={() => setShowAllOptions((prev) => !prev)}
          className="mt-3"
        >
          {showAllOptions ? 'Hide equipment list' : 'Add or adjust equipment'}
        </Button>
      </div>

      {showAllOptions && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-gray-400 mb-1">Search Equipment</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Type to filter equipment"
              className={inputCls}
            />
          </div>

          <div className="space-y-1.5">
            {filteredSections.map((section) => {
              const isActive = activeCategory === section.field
              const hasOptions = section.options.length > 0
              return (
                <div key={section.field} className="rounded-lg border border-surface-overlay/50 bg-surface overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setActiveCategory((prev) => prev === section.field ? null : section.field)}
                    className="flex w-full items-center justify-between px-3 py-2 text-sm text-white transition hover:bg-surface-raised"
                  >
                    <span className="flex items-center gap-2">
                      {isActive ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      {section.label}
                    </span>
                    <span className="text-xs text-gray-500">
                      {data[section.field].reduce((t, i) => t + i.quantity, 0)} selected
                    </span>
                  </button>
                  {isActive && (
                    <div className="space-y-1.5 bg-surface-raised px-3 py-2">
                      {hasOptions ? (
                        section.options.map((option) => {
                          const qty = getQuantity(section.field, option)
                          return (
                            <div
                              key={option}
                              className="flex items-center justify-between rounded-lg border border-surface-overlay/50 bg-surface px-3 py-2 text-sm text-white"
                            >
                              <span>{option}</span>
                              <div className="flex items-center gap-2">
                                <button type="button" onClick={() => adjustQuantity(section.field, option, -1)} className={qtyBtnCls}>
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="w-6 text-center">{qty}</span>
                                <button type="button" onClick={() => adjustQuantity(section.field, option, 1)} className={qtyBtnCls}>
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          )
                        })
                      ) : (
                        <p className="text-sm text-gray-500">No equipment matches your search.</p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
            {filteredSections.every((s) => s.options.length === 0) && (
              <p className="text-sm text-gray-500 text-center py-4">No equipment matches your search.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default EquipmentRequired
