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
          className="flex items-center px-3 py-1 bg-gray-900 border border-accent rounded-lg hover:bg-gray-800 transition-colors text-white"
        >
          <X className="w-4 h-4 mr-1" />
          Clear Section
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-white mb-2">Crew Size</label>
        <select
          value={data.crewSize}
          onChange={(e) => handleFieldChange('crewSize', e.target.value)}
          className="w-full px-3 py-2 bg-black border border-accent rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-white"
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
        <div className="bg-gray-900 border border-accent rounded-lg p-4 text-white">
          <h4 className="text-lg font-semibold mb-3">Selected Equipment</h4>
          {selectedItems.length > 0 ? (
            <div className="space-y-2">
              {selectedItems.map((item) => (
                <div
                  key={`${item.field}-${item.name}`}
                  className="flex items-center justify-between bg-black/40 border border-accent/60 rounded-lg px-3 py-2"
                >
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-gray-300">{item.label}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => adjustQuantity(item.field, item.name, -1)}
                      className="p-1 bg-gray-800 rounded hover:bg-gray-700"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => adjustQuantity(item.field, item.name, 1)}
                      className="p-1 bg-gray-800 rounded hover:bg-gray-700"
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
            className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-black border border-accent rounded-lg hover:bg-gray-800 transition-colors"
          >
            {showAllOptions ? (
              <ChevronUp className="w-4 h-4" aria-hidden="true" />
            ) : (
              <ChevronDown className="w-4 h-4" aria-hidden="true" />
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
                className="w-full px-3 py-2 bg-black border border-accent rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-white"
              />
            </div>

            <div className="space-y-2">
              {filteredSections.map((section) => {
                const isActive = activeCategory === section.field
                const hasOptions = section.options.length > 0
                return (
                  <div key={section.field} className="border border-accent rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() =>
                        setActiveCategory((prev) =>
                          prev === section.field ? null : section.field
                        )
                      }
                      className="w-full flex items-center justify-between px-4 py-2 bg-gray-900 text-white hover:bg-gray-800"
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
                      <div className="bg-black/50 px-4 py-3 space-y-2">
                        {hasOptions ? (
                          section.options.map((option) => {
                            const qty = getQuantity(section.field, option)
                            return (
                              <div
                                key={option}
                                className="flex items-center justify-between bg-gray-900 border border-accent rounded-lg px-3 py-2 text-white"
                              >
                                <span>{option}</span>
                                <div className="flex items-center space-x-2">
                                  <button
                                    type="button"
                                    onClick={() => adjustQuantity(section.field, option, -1)}
                                    className="p-1 bg-gray-800 rounded hover:bg-gray-700"
                                  >
                                    <Minus className="w-4 h-4" />
                                  </button>
                                  <span>{qty}</span>
                                  <button
                                    type="button"
                                    onClick={() => adjustQuantity(section.field, option, 1)}
                                    className="p-1 bg-gray-800 rounded hover:bg-gray-700"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            )
                          })
                        ) : (
                          <p className="text-sm text-gray-300">
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
