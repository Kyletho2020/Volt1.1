import React from 'react'
import {
  Truck,
  Package,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Bot,
  Copy,
  Info
} from 'lucide-react'
import { UseFormRegister, FieldErrors } from 'react-hook-form'
import type { LogisticsData, LogisticsPiece } from '../types'
import {
  formatStorageRateLabel,
  getStorageRate,
  normalizeStorageLocation,
  type StorageLocation
} from '../lib/storage'
import { Button, Toggle } from './ui'

const APPROX_PATTERN = /\s*\(approx\.\)/gi

const stripApproxSuffix = (value: string) =>
  value.replace(APPROX_PATTERN, ' ').replace(/\s+/g, ' ').trim()

const titleCase = (value: string) =>
  value.toLowerCase().replace(/\b([a-z])/g, (_, char) => char.toUpperCase())

const applyApproxSuffix = (value: string) =>
  value ? `${value} (approx.)` : value

export const formatDescriptionInputValue = (
  rawValue: string,
  options: { approximateLabelEnabled: boolean }
) => {
  const hasTrailingSpace = /\s$/.test(rawValue)
  const normalizedWhitespace = rawValue.replace(/\s+/g, ' ').trim()
  const withoutApprox = stripApproxSuffix(normalizedWhitespace)
  const capitalized = titleCase(withoutApprox)
  const withApprox = options.approximateLabelEnabled ? applyApproxSuffix(capitalized) : capitalized
  if (hasTrailingSpace) return withApprox ? `${withApprox} ` : ' '
  return withApprox
}

interface LogisticsFormProps {
  data: LogisticsData
  selectedPieces: string[]
  onFieldChange: <K extends keyof LogisticsData>(field: K, value: LogisticsData[K]) => void
  onPieceChange: (index: number, field: keyof LogisticsPiece, value: string | number) => void
  addPiece: () => void
  duplicatePiece: (pieceId: string) => void
  removePiece: (pieceId: string) => void
  togglePieceSelection: (pieceId: string) => void
  deleteSelectedPieces: () => void
  movePiece: (oldIndex: number, newIndex: number) => void
  onOpenLogisticsExtractor: () => void
  canUseAI: boolean
  register: UseFormRegister<LogisticsData>
  errors: FieldErrors<LogisticsData>
}

const inputCls =
  'h-9 rounded-lg border border-surface-overlay bg-surface-raised px-3 text-sm text-white placeholder-gray-500 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent'
const selectCls =
  'h-9 rounded-lg border border-surface-overlay bg-surface-raised px-3 text-sm text-white focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent'
const labelCls = 'block text-xs font-medium uppercase tracking-wide text-gray-400 mb-1'

const LogisticsForm: React.FC<LogisticsFormProps> = ({
  data, selectedPieces, onFieldChange, onPieceChange,
  addPiece, duplicatePiece, removePiece, togglePieceSelection,
  deleteSelectedPieces, movePiece, onOpenLogisticsExtractor,
  canUseAI, register, errors
}) => {
  const [approximateLabelEnabled, setApproximateLabelEnabled] = React.useState(false)
  const [dimensionUnit, setDimensionUnit] = React.useState<'in' | 'ft'>(data.dimensionUnit || 'in')

  React.useEffect(() => { setDimensionUnit(data.dimensionUnit || 'in') }, [data.dimensionUnit])

  const formatDescriptionValue = React.useCallback(
    (rawValue: string) => formatDescriptionInputValue(rawValue, { approximateLabelEnabled }),
    [approximateLabelEnabled]
  )

  const parseMeasurement = (value: string | number | undefined) => {
    if (typeof value === 'number') return value
    if (!value) return null
    const parsed = parseFloat(value.replace(/[^0-9.-]/g, ''))
    return Number.isFinite(parsed) ? parsed : null
  }

  const formatMeasurement = (value: number) => {
    if (!Number.isFinite(value)) return ''
    const fixed = value % 1 === 0 ? value.toFixed(0) : value.toFixed(2)
    return fixed.replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1')
  }

  const handleDimensionUnitChange = (unit: 'in' | 'ft') => {
    if (unit === dimensionUnit) return
    const factor = unit === 'ft' ? 1 / 12 : 12
    data.pieces?.forEach((piece, pieceIndex) => {
      ;(['length', 'width', 'height'] as const).forEach(field => {
        const numericValue = parseMeasurement(piece[field])
        if (numericValue === null) return
        onPieceChange(pieceIndex, field, formatMeasurement(numericValue * factor))
      })
    })
    setDimensionUnit(unit)
    onFieldChange('dimensionUnit', unit)
  }

  const toggleApproximateLabels = () => {
    setApproximateLabelEnabled(prev => {
      const next = !prev
      data.pieces?.forEach((piece, index) => {
        const base = stripApproxSuffix(piece.description || '')
        const capitalized = titleCase(base)
        onPieceChange(index, 'description', next ? applyApproxSuffix(capitalized) : capitalized)
      })
      return next
    })
  }

  const createSyntheticEvent = (name: string, value: string): React.ChangeEvent<HTMLInputElement> =>
    ({ target: { name, value } } as React.ChangeEvent<HTMLInputElement>)

  const shipmentOptions = [
    { value: '', label: 'Select shipment type' },
    { value: 'LTL (Less Than Truckload)', label: 'LTL (Less Than Truckload)' },
    { value: 'FTL (Full Truck Load)', label: 'FTL (Full Truck Load)' }
  ] as const

  const truckTypeOptions = ['Flatbed', 'Flatbed with tarp', 'Conestoga', 'Step Deck', 'Dry Van']

  const hasCustomShipmentType = data.shipmentType && !shipmentOptions.some(o => o.value === data.shipmentType)
  const hasCustomTruckType = data.truckType && !truckTypeOptions.some(o => o.toLowerCase() === data.truckType?.toLowerCase())

  const shipmentTypeRegister = register('shipmentType')
  const truckTypeRegister = register('truckType')
  const includeStorageRegister = register('includeStorage')
  const storageLocationRegister = register('storageLocation')
  const storageSqFtRegister = register('storageSqFt')

  const normalizedStorageLocation = normalizeStorageLocation(data.storageLocation)
  const storageRate = getStorageRate(data.storageLocation)
  const sanitizedSqFtInput = data.storageSqFt?.replace(/,/g, '') ?? ''
  const parsedSqFt = parseFloat(sanitizedSqFtInput)
  const storageCost =
    data.includeStorage && storageRate !== null && !Number.isNaN(parsedSqFt)
      ? parsedSqFt * storageRate : null
  const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
  const storageCostLabel = storageCost !== null ? currencyFormatter.format(storageCost) : '--'

  const actionBtnCls = 'rounded-md p-1 text-gray-500 transition hover:bg-surface-overlay hover:text-white disabled:opacity-40 disabled:cursor-not-allowed'

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">Shipment Items</h2>
        <Button
          variant={canUseAI ? 'secondary' : 'ghost'}
          size="sm"
          icon={Bot}
          onClick={onOpenLogisticsExtractor}
          disabled={!canUseAI}
        >
          Logistics AI
        </Button>
      </div>

      {/* Pieces section */}
      <div className="rounded-xl border border-surface-overlay/50 bg-surface-raised p-3">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-white">
            <Package className="h-3.5 w-3.5 text-accent" />
            Shipment Items
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={toggleApproximateLabels}
              className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium transition ${
                approximateLabelEnabled
                  ? 'border-accent/30 bg-accent-soft text-accent'
                  : 'border-surface-overlay bg-surface text-gray-400 hover:text-white'
              }`}
              aria-pressed={approximateLabelEnabled}
            >
              <Info className="h-3 w-3" />
              {approximateLabelEnabled ? 'Remove Approx.' : 'Add Approx.'}
            </button>
            <div className="flex items-center rounded-md border border-surface-overlay bg-surface text-[11px] font-medium text-gray-400">
              <span className="px-2 py-1 text-[10px] uppercase tracking-wider">Dim</span>
              {(['in', 'ft'] as const).map(unit => (
                <button
                  key={unit}
                  type="button"
                  onClick={() => handleDimensionUnitChange(unit)}
                  className={`px-2 py-1 transition ${
                    dimensionUnit === unit ? 'bg-accent-soft text-accent' : 'text-gray-400 hover:text-white'
                  }`}
                  aria-pressed={dimensionUnit === unit}
                >
                  {unit === 'in' ? 'Inches' : 'Feet'}
                </button>
              ))}
            </div>
            <Button
              variant="danger"
              size="sm"
              icon={Trash2}
              onClick={deleteSelectedPieces}
              disabled={selectedPieces.length === 0}
            >
              Delete
            </Button>
            <Button variant="primary" size="sm" icon={Plus} onClick={addPiece}>
              Add Item
            </Button>
          </div>
        </div>

        {approximateLabelEnabled && (
          <p className="mb-2 text-[11px] text-accent/80">
            Items tagged with <span className="font-semibold">(approx.)</span> for estimated measurements.
          </p>
        )}

        <div className="space-y-2">
          {(data.pieces ?? []).map((piece, index) => (
            <div
              key={piece.id}
              className="rounded-lg border border-surface-overlay/50 bg-surface p-3 transition hover:border-surface-overlay"
            >
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedPieces.includes(piece.id)}
                  onChange={() => togglePieceSelection(piece.id)}
                  className="h-4 w-4 rounded border-surface-overlay bg-transparent text-accent focus:ring-accent/50"
                />
                <span className="inline-flex h-6 min-w-[2rem] items-center justify-center rounded-md bg-accent-soft px-2 text-xs font-semibold text-accent">
                  #{index + 1}
                </span>
                {(() => {
                  const field = register(`pieces.${index}.description` as const)
                  return (
                    <div className="flex-1 min-w-[180px]">
                      <input
                        type="text"
                        value={piece.description}
                        onChange={(e) => {
                          const v = formatDescriptionValue(e.target.value)
                          field.onChange(createSyntheticEvent(field.name, v))
                          onPieceChange(index, 'description', v)
                        }}
                        className={`${inputCls} w-full`}
                        placeholder="Item description"
                      />
                      {errors.pieces?.[index]?.description && (
                        <p className="mt-1 text-[11px] text-red-400">{String(errors.pieces[index]?.description?.message)}</p>
                      )}
                    </div>
                  )
                })()}
                <div className="ml-auto flex items-center gap-0.5">
                  <button onClick={() => movePiece(index, index - 1)} disabled={index === 0} className={actionBtnCls} title="Move up">
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => movePiece(index, index + 1)} disabled={index === (data.pieces?.length ?? 0) - 1} className={actionBtnCls} title="Move down">
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => duplicatePiece(piece.id)} className="rounded-md p-1 text-accent transition hover:bg-accent-soft" title="Duplicate">
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => removePiece(piece.id)} className="rounded-md p-1 text-red-400 transition hover:bg-red-500/10" title="Remove">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-6">
                <div>
                  {(() => {
                    const field = register(`pieces.${index}.quantity` as const)
                    return (
                      <>
                        <label className="mb-1 block text-[11px] uppercase tracking-wide text-gray-500">Qty</label>
                        <input
                          type="number" min="1" value={piece.quantity}
                          onChange={(e) => { field.onChange(e); onPieceChange(index, 'quantity', parseInt(e.target.value) || 1) }}
                          className={`${inputCls} w-full text-center`} placeholder="0"
                        />
                        {errors.pieces?.[index]?.quantity && <p className="mt-1 text-[11px] text-red-400">{String(errors.pieces[index]?.quantity?.message)}</p>}
                      </>
                    )
                  })()}
                </div>
                {(['length', 'width', 'height', 'weight'] as const).map((field) => (
                  <div key={field}>
                    {(() => {
                      const fieldReg = register(`pieces.${index}.${field}` as const)
                      const raw = piece[field]
                      const displayValue = typeof raw === 'number' ? raw.toString() : raw || ''
                      return (
                        <>
                          <label className="mb-1 block text-[11px] uppercase tracking-wide text-gray-500">
                            {field === 'weight' ? 'Wt (lbs)' : `${field.charAt(0).toUpperCase() + field.slice(1)} (${dimensionUnit})`}
                          </label>
                          <input
                            type="text" value={displayValue}
                            onChange={(e) => { fieldReg.onChange(e); onPieceChange(index, field, e.target.value) }}
                            className={`${inputCls} w-full text-center`}
                            placeholder="0"
                          />
                          {errors.pieces?.[index]?.[field] && <p className="mt-1 text-[11px] text-red-400">{String(errors.pieces[index]?.[field]?.message)}</p>}
                        </>
                      )
                    })()}
                  </div>
                ))}
              </div>
            </div>
          ))}
          {(data.pieces?.length ?? 0) === 0 && (
            <p className="rounded-lg border border-dashed border-surface-overlay bg-surface px-4 py-6 text-center text-sm text-gray-500">
              No items yet. Click <span className="font-semibold text-white">"Add Item"</span> to start.
            </p>
          )}
        </div>
      </div>

      {/* Shipment Summary */}
      {(() => {
        const totalItems = (data.pieces ?? []).reduce((s, p) => s + (Number(p.quantity) || 0), 0)
        const totalWeight = (data.pieces ?? []).reduce((s, p) => {
          const qty = Number(p.quantity) || 0
          const w = parseFloat(String(p.weight).replace(/[^0-9.]/g, '')) || 0
          return s + qty * w
        }, 0)
        const totalFootprint = (data.pieces ?? []).reduce((s, p) => {
          const qty = Number(p.quantity) || 0
          const l = parseFloat(String(p.length).replace(/[^0-9.]/g, '')) || 0
          const w = parseFloat(String(p.width).replace(/[^0-9.]/g, '')) || 0
          const lIn = dimensionUnit === 'ft' ? l * 12 : l
          const wIn = dimensionUnit === 'ft' ? w * 12 : w
          return s + lIn * wIn * qty
        }, 0)
        return (
          <div className="rounded-xl border border-surface-overlay/50 bg-surface-raised p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Shipment Summary</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div className="rounded-lg bg-surface p-3 border border-surface-overlay/50">
                <p className="text-xs text-gray-500">Total Items</p>
                <p className="text-lg font-semibold text-white">{totalItems}</p>
              </div>
              <div className="rounded-lg bg-surface p-3 border border-surface-overlay/50">
                <p className="text-xs text-gray-500">Total Weight</p>
                <p className="text-lg font-semibold text-white">{totalWeight.toFixed(2)} lbs</p>
              </div>
              <div className="rounded-lg bg-surface p-3 border border-surface-overlay/50">
                <p className="text-xs text-gray-500">Floor Space</p>
                <p className="text-lg font-semibold text-white">{(totalFootprint / 144).toFixed(2)} sq ft</p>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Pickup Address */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {([
          ['pickupAddress', 'Pickup Address'],
          ['pickupCity', 'Pickup City'],
          ['pickupState', 'Pickup State'],
          ['pickupZip', 'Pickup ZIP'],
        ] as const).map(([field, label]) => (
          <div key={field}>
            <label className={labelCls}>{label}</label>
            <input
              type="text"
              value={(data as Record<string, any>)[field] || ''}
              onChange={(e) => onFieldChange(field as keyof LogisticsData, e.target.value)}
              className={`w-full ${inputCls}`}
            />
            {(errors as Record<string, any>)[field] && (
              <p className="mt-1 text-xs text-red-400">{String((errors as Record<string, any>)[field]?.message)}</p>
            )}
          </div>
        ))}
      </div>

      {/* Delivery Address */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {([
          ['deliveryAddress', 'Delivery Address'],
          ['deliveryCity', 'Delivery City'],
          ['deliveryState', 'Delivery State'],
          ['deliveryZip', 'Delivery ZIP'],
        ] as const).map(([field, label]) => (
          <div key={field}>
            <label className={labelCls}>{label}</label>
            <input
              type="text"
              value={(data as Record<string, any>)[field] || ''}
              onChange={(e) => onFieldChange(field as keyof LogisticsData, e.target.value)}
              className={`w-full ${inputCls}`}
            />
            {(errors as Record<string, any>)[field] && (
              <p className="mt-1 text-xs text-red-400">{String((errors as Record<string, any>)[field]?.message)}</p>
            )}
          </div>
        ))}
      </div>

      {/* Shipment & Truck Type */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label className={labelCls}>Shipment Type</label>
          <select
            {...shipmentTypeRegister}
            value={data.shipmentType || ''}
            onChange={(e) => { shipmentTypeRegister.onChange(e); onFieldChange('shipmentType', e.target.value) }}
            className={`w-full ${selectCls}`}
          >
            <option value="">Select shipment type</option>
            {hasCustomShipmentType && <option value={data.shipmentType}>{data.shipmentType}</option>}
            {shipmentOptions.filter(o => o.value !== '').map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          {errors.shipmentType && <p className="mt-1 text-xs text-red-400">{String(errors.shipmentType.message)}</p>}
        </div>
        <div>
          <label className={labelCls}>Truck Type Requested</label>
          <select
            {...truckTypeRegister}
            value={data.truckType || ''}
            onChange={(e) => { truckTypeRegister.onChange(e); onFieldChange('truckType', e.target.value) }}
            className={`w-full ${selectCls}`}
          >
            <option value="">Select truck type</option>
            {truckTypeOptions.map(o => <option key={o} value={o}>{o}</option>)}
            {hasCustomTruckType && <option value={data.truckType}>{data.truckType}</option>}
          </select>
          {errors.truckType && <p className="mt-1 text-xs text-red-400">{String(errors.truckType.message)}</p>}
        </div>
      </div>

      {/* Storage */}
      <div className="rounded-xl border border-surface-overlay/50 bg-surface-raised p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white">Include Storage</p>
            <p className="text-xs text-gray-400">Add optional storage space to your logistics request.</p>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              {...includeStorageRegister}
              checked={Boolean(data.includeStorage)}
              onChange={(e) => {
                includeStorageRegister.onChange(e)
                onFieldChange('includeStorage', e.target.checked)
                if (!e.target.checked) {
                  const resetLoc = { target: { name: 'storageLocation', value: '', type: 'radio', checked: false } } as unknown as React.ChangeEvent<HTMLInputElement>
                  const resetSqFt = { target: { name: 'storageSqFt', value: '', type: 'number' } } as unknown as React.ChangeEvent<HTMLInputElement>
                  storageLocationRegister.onChange(resetLoc)
                  storageSqFtRegister.onChange(resetSqFt)
                  onFieldChange('storageLocation', '')
                  onFieldChange('storageSqFt', '')
                }
              }}
              className="peer sr-only"
            />
            <span className="h-6 w-11 rounded-full bg-surface-overlay transition peer-checked:bg-accent" />
            <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-5" />
          </label>
        </div>

        {data.includeStorage && (
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-400">Storage Type</p>
              <div className="flex gap-2">
                {(['inside', 'outside'] as const).map((value) => {
                  const isActive = normalizedStorageLocation === value
                  const radioReg = register('storageLocation')
                  return (
                    <label
                      key={value}
                      className={`flex flex-1 min-w-[100px] cursor-pointer flex-col gap-0.5 rounded-lg border px-3 py-2 text-xs font-medium transition ${
                        isActive
                          ? 'border-accent bg-accent-soft text-white'
                          : 'border-surface-overlay bg-surface text-gray-400 hover:border-accent/30 hover:text-white'
                      }`}
                    >
                      <input
                        type="radio" {...radioReg} value={value} checked={isActive}
                        onChange={(e) => { radioReg.onChange(e); onFieldChange('storageLocation', value) }}
                        className="sr-only"
                      />
                      <span>{value === 'inside' ? 'Inside' : 'Outside'}</span>
                      <span className="text-[10px] font-normal text-gray-500">{formatStorageRateLabel(value)}</span>
                    </label>
                  )
                })}
              </div>
              {errors.storageLocation && <p className="mt-1 text-xs text-red-400">{String(errors.storageLocation.message)}</p>}
            </div>
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-gray-400">Square Feet</label>
              <div className="rounded-lg border border-surface-overlay bg-surface p-3">
                <input
                  type="number" step="0.01" min="0"
                  {...storageSqFtRegister}
                  value={data.storageSqFt || ''}
                  onChange={(e) => { storageSqFtRegister.onChange(e); onFieldChange('storageSqFt', e.target.value) }}
                  className="mb-2 w-full bg-transparent text-sm text-white outline-none placeholder-gray-500"
                  placeholder="Enter square footage"
                />
                <p className="text-xs text-gray-500">Cost: {storageCostLabel}</p>
              </div>
              {errors.storageSqFt && <p className="mt-1 text-xs text-red-400">{String(errors.storageSqFt.message)}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default LogisticsForm
