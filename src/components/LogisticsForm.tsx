import React from 'react'
import {
  Truck,
  Package,
  Plus,
  Minus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Bot
} from 'lucide-react'
import { UseFormRegister, FieldErrors } from 'react-hook-form'
import type { LogisticsData, LogisticsPiece } from '../types'

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
    'relative overflow-hidden rounded-3xl border border-accent/25 bg-surface/80 p-6 shadow-[0_35px_120px_rgba(10,18,35,0.55)] backdrop-blur-xl'
  const inputClasses =
    'px-3 py-2.5 bg-surface-highlight/70 border border-accent/25 rounded-xl text-sm text-white placeholder:text-slate-400 shadow-[0_10px_28px_rgba(8,16,28,0.45)] transition focus:border-accent focus:ring-2 focus:ring-accent/40'
  const selectClasses =
    'px-3 py-2.5 bg-surface-highlight/70 border border-accent/25 rounded-xl text-sm text-white focus:border-accent focus:ring-2 focus:ring-accent/40'

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

  const storageRate =
    data.storageLocation === 'inside'
      ? 3.5
      : data.storageLocation === 'outside'
        ? 2.5
        : null
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

  return (
    <div className={containerClasses}>
      <div className="pointer-events-none absolute -bottom-32 -right-10 h-48 w-48 rounded-full bg-accent/25 blur-[120px] opacity-80" />
      <div className="relative z-10 flex flex-col gap-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/15 text-accent">
              <Truck className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-2xl font-semibold text-white">Logistics Quote</h2>
              <p className="text-sm text-slate-300">
                Track transport details, storage needs, and weights with Bolt 3.0 clarity.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenLogisticsExtractor}
            disabled={!canUseAI}
            className={`inline-flex items-center justify-center rounded-xl border px-3 py-2 text-xs font-medium transition ${
              canUseAI
                ? 'border-accent/40 bg-accent-soft/40 text-accent hover:border-accent hover:bg-accent/15 hover:text-white'
                : 'border-accent/15 bg-surface/40 text-slate-500/80 cursor-not-allowed'
            }`}
          >
            <Bot className="mr-2 h-3.5 w-3.5" />
            Logistics AI
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Package className="h-4 w-4 text-accent" />
                Items to Transport
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={deleteSelectedPieces}
                  disabled={selectedPieces.length === 0}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-500/90 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete Selected
                </button>
                <button
                  onClick={addPiece}
                  className="inline-flex items-center gap-2 rounded-xl bg-accent px-3 py-2 text-xs font-semibold text-black shadow-sm transition hover:bg-green-400"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Item
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {(data.pieces ?? []).map((piece, index) => (
                <div
                  key={piece.id}
                  className="grid grid-cols-12 items-end gap-3 rounded-2xl border border-accent/20 bg-surface-highlight/70 p-4 shadow-[0_18px_36px_rgba(10,18,35,0.45)]"
                >
                  <div className="col-span-5 flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedPieces.includes(piece.id)}
                      onChange={() => togglePieceSelection(piece.id)}
                      className="mt-2 h-4 w-4 rounded border-accent/40 bg-transparent text-accent focus:ring-accent/40"
                    />
                    <div className="flex-1">
                      {(() => {
                        const field = register(`pieces.${index}.description` as const)
                        return (
                          <>
                            <input
                              type="text"
                              value={piece.description}
                              onChange={(e) => {
                                field.onChange(e)
                                onPieceChange(index, 'description', e.target.value)
                              }}
                              className={`w-full ${inputClasses}`}
                              placeholder="Description"
                            />
                            {errors.pieces?.[index]?.description && (
                              <p className="mt-1 text-xs text-red-400">
                                {String(errors.pieces[index]?.description?.message)}
                              </p>
                            )}
                          </>
                        )
                      })()}
                    </div>
                  </div>
                  <div className="col-span-1">
                    {(() => {
                      const field = register(`pieces.${index}.quantity` as const)
                      return (
                        <>
                          <input
                            type="number"
                            value={piece.quantity}
                            onChange={(e) => {
                              field.onChange(e)
                              onPieceChange(index, 'quantity', parseInt(e.target.value) || 1)
                            }}
                            className={`${inputClasses} w-16 text-center`}
                            placeholder="Qty"
                            min="1"
                          />
                          {errors.pieces?.[index]?.quantity && (
                            <p className="mt-1 text-xs text-red-400">
                              {String(errors.pieces[index]?.quantity?.message)}
                            </p>
                          )}
                        </>
                      )
                    })()}
                  </div>
                  <div className="col-span-5 grid grid-cols-4 gap-2">
                    {(['length', 'width', 'height', 'weight'] as const).map((field) => (
                      <div key={field}>
                        {(() => {
                          const fieldRegister = register(`pieces.${index}.${field}` as const)
                          const rawValue = piece[field]
                          const displayValue =
                            typeof rawValue === 'number'
                              ? rawValue.toString()
                              : rawValue || ''
                          return (
                            <>
                              <input
                                type="text"
                                value={displayValue}
                                onChange={(e) => {
                                  fieldRegister.onChange(e)
                                  onPieceChange(index, field, e.target.value)
                                }}
                                className={`w-full ${inputClasses}`}
                                placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                              />
                              {errors.pieces?.[index]?.[field] && (
                                <p className="mt-1 text-xs text-red-400">
                                  {String(errors.pieces[index]?.[field]?.message)}
                                </p>
                              )}
                            </>
                          )
                        })()}
                      </div>
                    ))}
                  </div>
                  <div className="col-span-1 flex flex-col gap-1">
                    <button
                      onClick={() => movePiece(index, index - 1)}
                      disabled={index === 0}
                      className="flex items-center justify-center rounded-lg border border-accent/25 bg-accent-soft/40 p-2 text-accent transition hover:border-accent hover:bg-accent/15 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => movePiece(index, index + 1)}
                      disabled={index === (data.pieces?.length ?? 0) - 1}
                      className="flex items-center justify-center rounded-lg border border-accent/25 bg-accent-soft/40 p-2 text-accent transition hover:border-accent hover:bg-accent/15 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => removePiece(piece.id)}
                      className="flex items-center justify-center rounded-lg bg-red-500/90 p-2 text-white transition hover:bg-red-500"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                    {([
                      { value: 'inside', label: 'Inside', description: '$3.50 / sq ft' },
                      { value: 'outside', label: 'Outside', description: '$2.50 / sq ft' }
                    ] as const).map((option) => {
                      const isActive = data.storageLocation === option.value
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
