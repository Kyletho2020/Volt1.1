import React, { useMemo, useState } from 'react'
import {
  Truck,
  Package,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Bot,
  Copy,
  CheckCircle
} from 'lucide-react'
import { UseFormRegister, FieldErrors } from 'react-hook-form'
import type { LogisticsData, LogisticsPiece } from '../types'
import {
  formatStorageRateLabel,
  getStorageRate,
  normalizeStorageLocation,
  type StorageLocation
} from '../lib/storage'

interface LogisticsFormProps {
  data: LogisticsData
  selectedPieces: string[]
  onFieldChange: <K extends keyof LogisticsData>(
    field: K,
    value: LogisticsData[K]
  ) => void
  onPieceChange: (
    index: number,
    field: keyof LogisticsPiece,
    value: string | number
  ) => void
  addPiece: () => void
  removePiece: (pieceId: string) => void
  togglePieceSelection: (pieceId: string) => void
  deleteSelectedPieces: () => void
  movePiece: (oldIndex: number, newIndex: number) => void
  onOpenLogisticsExtractor: () => void
  canUseAI: boolean
  register: UseFormRegister<LogisticsData>
  errors: FieldErrors<LogisticsData>
}

const LogisticsForm: React.FC<LogisticsFormProps> = ({
  data,
  selectedPieces,
  onFieldChange,
  onPieceChange,
  addPiece,
  removePiece,
  togglePieceSelection,
  deleteSelectedPieces,
  movePiece,
  onOpenLogisticsExtractor,
  canUseAI,
  register,
  errors
}) => {
  const containerClasses =
    'relative overflow-hidden rounded-2xl border border-accent/20 bg-surface/70 p-4 shadow-[0_18px_60px_rgba(10,18,35,0.45)] backdrop-blur'
  const inputClasses =
    'h-9 rounded-lg border border-accent/25 bg-surface-highlight/60 px-3 text-sm text-white placeholder:text-slate-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30'
  const selectClasses =
    'h-9 rounded-lg border border-accent/25 bg-surface-highlight/60 px-3 text-sm text-white focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30'

  const shipmentOptions = [
    { value: '', label: 'Select shipment type' },
    { value: 'LTL (Less Than Truckload)', label: 'LTL (Less Than Truckload)' },
    { value: 'FTL (Full Truck Load)', label: 'FTL (Full Truck Load)' }
  ] as const

  const truckTypeOptions = [
    'Flatbed',
    'Flatbed with tarp',
    'Conestoga',
    'Step Deck',
    'Dry Van'
  ]

  const hasCustomShipmentType =
    data.shipmentType &&
    !shipmentOptions.some(option => option.value === data.shipmentType)
  const hasCustomTruckType =
    data.truckType &&
    !truckTypeOptions.some(
      (option) => option.toLowerCase() === data.truckType?.toLowerCase()
    )

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
    data.includeStorage &&
    storageRate !== null &&
    !Number.isNaN(parsedSqFt)
      ? parsedSqFt * storageRate
      : null
  const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  })
  const storageCostLabel = storageCost !== null ? currencyFormatter.format(storageCost) : '--'

  const formatLocation = (
    address?: string,
    city?: string,
    state?: string,
    zip?: string
  ) =>
    [address, city, state, zip]
      .map(part => part?.trim())
      .filter(Boolean)
      .join(', ')

  const pickupLocation = useMemo(
    () => formatLocation(data.pickupAddress, data.pickupCity, data.pickupState, data.pickupZip),
    [data.pickupAddress, data.pickupCity, data.pickupState, data.pickupZip]
  )

  const deliveryLocation = useMemo(
    () =>
      formatLocation(
        data.deliveryAddress,
        data.deliveryCity,
        data.deliveryState,
        data.deliveryZip
      ),
    [data.deliveryAddress, data.deliveryCity, data.deliveryState, data.deliveryZip]
  )

  const formatField = (value: string | undefined, placeholder: string) =>
    value && value.trim().length > 0 ? value.trim() : placeholder

  const logisticsEmailSnippet = useMemo(
    () =>
      [
        `Pick-Up Location: ${formatField(pickupLocation, '[Add pick-up location]')}`,
        '',
        `Delivery/Set Location: ${formatField(deliveryLocation, '[Add delivery location]')}`,
        '',
        `Truck Type Requested: ${formatField(data.truckType, '[Select truck type]')}`,
        '',
        `Shipment Type: ${formatField(data.shipmentType, '[Select shipment type]')}`
      ].join('\n'),
    [pickupLocation, deliveryLocation, data.truckType, data.shipmentType]
  )

  const [snippetCopied, setSnippetCopied] = useState(false)

  const handleSnippetCopy = async () => {
    try {
      await navigator.clipboard.writeText(logisticsEmailSnippet)
      setSnippetCopied(true)
      setTimeout(() => setSnippetCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy logistics snippet:', error)
    }
  }

  return (
    <div className={containerClasses}>
      <div className="pointer-events-none absolute -bottom-32 -right-10 h-48 w-48 rounded-full bg-accent/25 blur-[120px] opacity-80" />
      <div className="relative z-10 flex flex-col gap-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent/15 text-accent">
              <Truck className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-white">Shipment Items</h2>
              <p className="text-xs text-slate-300">Add item details for accurate quote calculation.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenLogisticsExtractor}
            disabled={!canUseAI}
            className={`inline-flex items-center justify-center gap-1 rounded-lg border px-3 py-1.5 text-[11px] font-medium transition ${
              canUseAI
                ? 'border-accent/40 bg-accent-soft/40 text-accent hover:border-accent hover:bg-accent/15 hover:text-white'
                : 'border-accent/15 bg-surface/40 text-slate-500/80 cursor-not-allowed'
            }`}
          >
            <Bot className="h-3 w-3" />
            Logistics AI
          </button>
        </div>

        <div className="space-y-5">
          <div className="rounded-xl border border-accent/20 bg-surface-highlight/40 px-3 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[13px] font-semibold text-white">
                <Package className="h-3.5 w-3.5 text-accent" />
                Shipment Items
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={deleteSelectedPieces}
                  disabled={selectedPieces.length === 0}
                  className="inline-flex items-center gap-1 rounded-lg bg-red-600/80 px-2.5 py-1.5 text-[11px] font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Trash2 className="h-3 w-3" />
                  Delete Selected
                </button>
                <button
                  onClick={addPiece}
                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-2.5 py-1.5 text-[11px] font-semibold text-black transition hover:bg-emerald-600"
                >
                  <Plus className="h-3 w-3" />
                  Add Item
                </button>
              </div>
            </div>

            <div className="mt-3 space-y-2 text-white">
              {(data.pieces ?? []).map((piece, index) => (
                <div
                  key={piece.id}
                  className="rounded-lg border border-white/10 bg-surface/60 p-3 shadow-sm transition hover:border-white/20"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedPieces.includes(piece.id)}
                      onChange={() => togglePieceSelection(piece.id)}
                      className="h-4 w-4 rounded border-accent/40 bg-transparent text-emerald-400 focus:ring-emerald-400"
                    />
                    <span className="inline-flex h-6 min-w-[2rem] items-center justify-center rounded-md border border-accent/30 bg-accent/10 px-2 text-xs font-semibold uppercase tracking-wide text-accent/90">
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
                              field.onChange(e)
                              onPieceChange(index, 'description', e.target.value)
                            }}
                            className={`${inputClasses} w-full text-sm`}
                            placeholder="Item description (e.g., Electronics box, Furniture)"
                          />
                          {errors.pieces?.[index]?.description && (
                            <p className="mt-1 text-[11px] text-red-400">
                              {String(errors.pieces[index]?.description?.message)}
                            </p>
                          )}
                        </div>
                      )
                    })()}

                    <div className="ml-auto flex items-center gap-1">
                      <button
                        onClick={() => movePiece(index, index - 1)}
                        disabled={index === 0}
                        className="rounded-md p-1 text-slate-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                        title="Move up"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => movePiece(index, index + 1)}
                        disabled={index === (data.pieces?.length ?? 0) - 1}
                        className="rounded-md p-1 text-slate-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                        title="Move down"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => removePiece(piece.id)}
                        className="rounded-md p-1 text-red-400 transition hover:bg-red-500/10"
                        title="Remove item"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-6">
                    <div>
                      {(() => {
                        const field = register(`pieces.${index}.quantity` as const)
                        return (
                          <>
                            <label className="mb-1 block text-[11px] uppercase tracking-wide text-slate-400">Quantity</label>
                            <input
                              type="number"
                              min="1"
                              value={piece.quantity}
                              onChange={(e) => {
                                field.onChange(e)
                                onPieceChange(index, 'quantity', parseInt(e.target.value) || 1)
                              }}
                              className={`${inputClasses} w-full text-center`}
                              placeholder="0"
                            />
                            {errors.pieces?.[index]?.quantity && (
                              <p className="mt-1 text-[11px] text-red-400">
                                {String(errors.pieces[index]?.quantity?.message)}
                              </p>
                            )}
                          </>
                        )
                      })()}
                    </div>

                    {(['length', 'width', 'height', 'weight'] as const).map((field) => (
                      <div key={field}>
                        {(() => {
                          const fieldRegister = register(`pieces.${index}.${field}` as const)
                          const rawValue = piece[field]
                          const displayValue = typeof rawValue === 'number' ? rawValue.toString() : rawValue || ''
                          return (
                            <>
                              <label className="mb-1 block text-[11px] uppercase tracking-wide text-slate-400">
                                {field === 'weight'
                                  ? 'Weight (lbs)'
                                  : `${field.charAt(0).toUpperCase() + field.slice(1)} (in)`}
                              </label>
                              <input
                                type="text"
                                value={displayValue}
                                onChange={(e) => {
                                  fieldRegister.onChange(e)
                                  onPieceChange(index, field, e.target.value)
                                }}
                                className={`${inputClasses} w-full text-center`}
                                placeholder={field === 'weight' ? '0' : '0"'}
                              />
                              {errors.pieces?.[index]?.[field] && (
                                <p className="mt-1 text-[11px] text-red-400">
                                  {String(errors.pieces[index]?.[field]?.message)}
                                </p>
                              )}
                            </>
                          )
                        })()}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {(data.pieces?.length ?? 0) === 0 && (
                <p className="rounded-lg border border-dashed border-white/15 bg-surface/40 px-4 py-6 text-center text-sm text-slate-300">
                  No items added yet. Click <span className="font-semibold text-white">"Add Item"</span> to start detailing the shipment.
                </p>
              )}
            </div>
          </div>

          {(() => {
            const totalItems = (data.pieces ?? []).reduce((sum, piece) => sum + (Number(piece.quantity) || 0), 0)
            const totalWeight = (data.pieces ?? []).reduce((sum, piece) => {
              const qty = Number(piece.quantity) || 0
              const weight = parseFloat(String(piece.weight).replace(/[^0-9.]/g, '')) || 0
              return sum + qty * weight
            }, 0)
            const totalFootprint = (data.pieces ?? []).reduce((sum, piece) => {
              const qty = Number(piece.quantity) || 0
              const length = parseFloat(String(piece.length).replace(/[^0-9.]/g, '')) || 0
              const width = parseFloat(String(piece.width).replace(/[^0-9.]/g, '')) || 0
              const footprint = length * width
              return sum + footprint * qty
            }, 0)
            const totalFootprintSqFt = totalFootprint / 144

            return (
              <div className="rounded-xl border border-accent/20 bg-surface-highlight/40 p-3">
                <p className="mb-3 text-[13px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                  Shipment Summary
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-white/10 bg-surface/60 p-3">
                    <p className="text-xs text-slate-400">Total Items</p>
                    <p className="text-lg font-semibold text-white">{totalItems.toFixed(0)}</p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-surface/60 p-3">
                    <p className="text-xs text-slate-400">Total Weight</p>
                    <p className="text-lg font-semibold text-white">{totalWeight.toFixed(2)} lbs</p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-surface/60 p-3">
                    <p className="text-xs text-slate-400">Total Floor Space</p>
                    <p className="text-lg font-semibold text-white">{totalFootprintSqFt.toFixed(2)} sq ft</p>
                  </div>
                </div>
              </div>
            )
          })()}

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-200">Pickup Address</label>
              <input
                type="text"
                value={data.pickupAddress}
                onChange={(e) => onFieldChange('pickupAddress', e.target.value)}
                className={`w-full ${inputClasses}`}
              />
              {errors.pickupAddress && (
                <p className="mt-1 text-xs text-red-400">{String(errors.pickupAddress.message)}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-200">Pickup City</label>
              <input
                type="text"
                value={data.pickupCity}
                onChange={(e) => onFieldChange('pickupCity', e.target.value)}
                className={`w-full ${inputClasses}`}
              />
              {errors.pickupCity && (
                <p className="mt-1 text-xs text-red-400">{String(errors.pickupCity.message)}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-200">Pickup State</label>
              <input
                type="text"
                value={data.pickupState}
                onChange={(e) => onFieldChange('pickupState', e.target.value)}
                className={`w-full ${inputClasses}`}
              />
              {errors.pickupState && (
                <p className="mt-1 text-xs text-red-400">{String(errors.pickupState.message)}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-200">Pickup ZIP</label>
              <input
                type="text"
                value={data.pickupZip}
                onChange={(e) => onFieldChange('pickupZip', e.target.value)}
                className={`w-full ${inputClasses}`}
              />
              {errors.pickupZip && (
                <p className="mt-1 text-xs text-red-400">{String(errors.pickupZip.message)}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-200">Delivery Address</label>
              <input
                type="text"
                value={data.deliveryAddress}
                onChange={(e) => onFieldChange('deliveryAddress', e.target.value)}
                className={`w-full ${inputClasses}`}
              />
              {errors.deliveryAddress && (
                <p className="mt-1 text-xs text-red-400">{String(errors.deliveryAddress.message)}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-200">Delivery City</label>
              <input
                type="text"
                value={data.deliveryCity}
                onChange={(e) => onFieldChange('deliveryCity', e.target.value)}
                className={`w-full ${inputClasses}`}
              />
              {errors.deliveryCity && (
                <p className="mt-1 text-xs text-red-400">{String(errors.deliveryCity.message)}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-200">Delivery State</label>
              <input
                type="text"
                value={data.deliveryState}
                onChange={(e) => onFieldChange('deliveryState', e.target.value)}
                className={`w-full ${inputClasses}`}
              />
              {errors.deliveryState && (
                <p className="mt-1 text-xs text-red-400">{String(errors.deliveryState.message)}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-200">Delivery ZIP</label>
              <input
                type="text"
                value={data.deliveryZip}
                onChange={(e) => onFieldChange('deliveryZip', e.target.value)}
                className={`w-full ${inputClasses}`}
              />
              {errors.deliveryZip && (
                <p className="mt-1 text-xs text-red-400">{String(errors.deliveryZip.message)}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-200">Shipment Type</label>
              <select
                {...shipmentTypeRegister}
                value={data.shipmentType || ''}
                onChange={(e) => {
                  shipmentTypeRegister.onChange(e)
                  onFieldChange('shipmentType', e.target.value)
                }}
                className={`w-full ${selectClasses}`}
              >
                <option value="">Select shipment type</option>
                {hasCustomShipmentType && (
                  <option value={data.shipmentType}>{data.shipmentType}</option>
                )}
                {shipmentOptions
                  .filter((option) => option.value !== '')
                  .map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
              </select>
              {errors.shipmentType && (
                <p className="mt-1 text-xs text-red-400">{String(errors.shipmentType.message)}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-200">Truck Type Requested</label>
              <select
                {...truckTypeRegister}
                value={data.truckType || ''}
                onChange={(e) => {
                  truckTypeRegister.onChange(e)
                  onFieldChange('truckType', e.target.value)
                }}
                className={`w-full ${selectClasses}`}
              >
                <option value="">Select truck type</option>
                {truckTypeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
                {hasCustomTruckType && (
                  <option value={data.truckType}>{data.truckType}</option>
                )}
              </select>
              {errors.truckType && (
                <p className="mt-1 text-xs text-red-400">{String(errors.truckType.message)}</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-accent/25 bg-surface-highlight/60 p-4 shadow-[0_18px_36px_rgba(10,18,35,0.45)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-100">Logistics Email Snippet</p>
                <p className="text-xs text-slate-400">
                  Quickly copy the core shipment details for the logistics quote email template.
                </p>
              </div>
              <button
                type="button"
                onClick={handleSnippetCopy}
                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[11px] font-semibold transition ${
                  snippetCopied
                    ? 'border-accent/60 bg-accent-soft/50 text-accent'
                    : 'border-accent/25 bg-surface/40 text-slate-100 hover:border-accent hover:bg-accent/15 hover:text-white'
                }`}
              >
                {snippetCopied ? (
                  <>
                    <CheckCircle className="h-3.5 w-3.5" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy Fields
                  </>
                )}
              </button>
            </div>
            <pre className="mt-3 whitespace-pre-wrap rounded-xl border border-accent/20 bg-surface/60 p-3 text-xs text-slate-200">
              {logisticsEmailSnippet}
            </pre>
          </div>

          <div className="rounded-2xl border border-accent/25 bg-surface-highlight/60 p-4 shadow-[0_18px_36px_rgba(10,18,35,0.45)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-100">Include Storage</p>
                <p className="text-xs text-slate-400">Add optional storage space to your logistics request.</p>
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
                      const resetLocationEvent = {
                        target: {
                          name: 'storageLocation',
                          value: '',
                          type: 'radio',
                          checked: false
                        }
                      } as unknown as React.ChangeEvent<HTMLInputElement>
                      const resetSqFtEvent = {
                        target: {
                          name: 'storageSqFt',
                          value: '',
                          type: 'number'
                        }
                      } as unknown as React.ChangeEvent<HTMLInputElement>
                      storageLocationRegister.onChange(resetLocationEvent)
                      storageSqFtRegister.onChange(resetSqFtEvent)
                      onFieldChange('storageLocation', '')
                      onFieldChange('storageSqFt', '')
                    }
                  }}
                  className="peer sr-only"
                />
                <span className="h-6 w-11 rounded-full bg-slate-600 transition peer-checked:bg-accent"></span>
                <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-5"></span>
              </label>
            </div>

            {data.includeStorage && (
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Storage Type</p>
                  <div className="flex flex-wrap gap-2">
                    {(['inside', 'outside'] as const).map((value) => {
                      const option: { value: StorageLocation; label: string; description: string } = {
                        value,
                        label: value === 'inside' ? 'Inside' : 'Outside',
                        description: formatStorageRateLabel(value)
                      }
                      const isActive = normalizedStorageLocation === option.value
                      const radioRegister = register('storageLocation')
                      return (
                        <label
                          key={option.value}
                          className={`flex flex-1 min-w-[120px] cursor-pointer flex-col gap-1 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                            isActive
                              ? 'border-accent bg-accent-soft/40 text-white'
                              : 'border-accent/20 bg-surface/60 text-slate-200 hover:border-accent/60 hover:text-white'
                          }`}
                        >
                          <input
                            type="radio"
                            {...radioRegister}
                            value={option.value}
                            checked={isActive}
                            onChange={(e) => {
                              radioRegister.onChange(e)
                              onFieldChange('storageLocation', option.value)
                            }}
                            className="sr-only"
                          />
                          <span>{option.label}</span>
                          <span className="text-[10px] font-normal text-slate-300">{option.description}</span>
                        </label>
                      )
                    })}
                  </div>
                  {errors.storageLocation && (
                    <p className="mt-2 text-xs text-red-400">{String(errors.storageLocation.message)}</p>
                  )}
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Square Feet
                  </label>
                  <div className="rounded-xl border border-accent/25 bg-surface/60 p-3">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      {...storageSqFtRegister}
                      value={data.storageSqFt || ''}
                      onChange={(e) => {
                        storageSqFtRegister.onChange(e)
                        onFieldChange('storageSqFt', e.target.value)
                      }}
                      className={`mb-2 w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-400`}
                      placeholder="Enter square footage"
                    />
                    <p className="text-xs text-slate-300">Cost: {storageCostLabel}</p>
                  </div>
                  {errors.storageSqFt && (
                    <p className="mt-1 text-xs text-red-400">{String(errors.storageSqFt.message)}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default LogisticsForm
