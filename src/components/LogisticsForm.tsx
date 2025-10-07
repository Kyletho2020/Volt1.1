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

interface Piece {
  id: string
  description: string
  quantity: number
  length: string
  width: string
  height: string
  weight: string
}

interface LogisticsData {
  pieces: Piece[]
  pickupAddress: string
  pickupCity: string
  pickupState: string
  pickupZip: string
  deliveryAddress: string
  deliveryCity: string
  deliveryState: string
  deliveryZip: string
  shipmentType: string
  truckType: string
  storageType: string
  storageSqFt: string
}

interface LogisticsFormProps {
  data: LogisticsData
  selectedPieces: string[]
  onFieldChange: (field: string, value: string) => void
  onPieceChange: (index: number, field: string, value: string | number) => void
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
    'relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_25px_60px_rgba(15,23,42,0.45)] backdrop-blur'
  const inputClasses =
    'px-3 py-2.5 bg-slate-950/80 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-400 focus:border-accent focus:ring-2 focus:ring-accent/40 transition'

  return (
    <div className={containerClasses}>
      <div className="pointer-events-none absolute -bottom-32 -right-10 h-48 w-48 rounded-full bg-sky-500/20 blur-3xl" />
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
                ? 'border-accent/50 bg-accent/10 text-accent hover:border-accent/80 hover:bg-accent/15'
                : 'border-white/10 bg-white/[0.04] text-slate-500 cursor-not-allowed'
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
              {data.pieces.map((piece, index) => (
                <div
                  key={piece.id}
                  className="grid grid-cols-12 items-end gap-3 rounded-2xl border border-white/10 bg-slate-950/60 p-4 shadow-sm"
                >
                  <div className="col-span-5 flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedPieces.includes(piece.id)}
                      onChange={() => togglePieceSelection(piece.id)}
                      className="mt-2 h-4 w-4 rounded border-white/20 bg-transparent text-accent focus:ring-accent/40"
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
                    {['length', 'width', 'height', 'weight'].map((field) => (
                      <div key={field}>
                        {(() => {
                          const fieldRegister = register(`pieces.${index}.${field}` as const)
                          return (
                            <>
                              <input
                                type="text"
                                value={piece[field as keyof Piece] as string}
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
                      className="flex items-center justify-center rounded-lg border border-white/10 bg-white/[0.06] p-2 text-slate-200 transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => movePiece(index, index + 1)}
                      disabled={index === data.pieces.length - 1}
                      className="flex items-center justify-center rounded-lg border border-white/10 bg-white/[0.06] p-2 text-slate-200 transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-40"
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
              <input
                type="text"
                value={data.shipmentType}
                onChange={(e) => onFieldChange('shipmentType', e.target.value)}
                className={`w-full ${inputClasses}`}
              />
              {errors.shipmentType && (
                <p className="mt-1 text-xs text-red-400">{String(errors.shipmentType.message)}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-200">Truck Type</label>
              <input
                type="text"
                value={data.truckType}
                onChange={(e) => onFieldChange('truckType', e.target.value)}
                className={`w-full ${inputClasses}`}
              />
              {errors.truckType && (
                <p className="mt-1 text-xs text-red-400">{String(errors.truckType.message)}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-200">Storage Type</label>
              <input
                type="text"
                value={data.storageType}
                onChange={(e) => onFieldChange('storageType', e.target.value)}
                className={`w-full ${inputClasses}`}
              />
              {errors.storageType && (
                <p className="mt-1 text-xs text-red-400">{String(errors.storageType.message)}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-200">Storage Sq Ft</label>
              <input
                type="text"
                value={data.storageSqFt}
                onChange={(e) => onFieldChange('storageSqFt', e.target.value)}
                className={`w-full ${inputClasses}`}
              />
              {errors.storageSqFt && (
                <p className="mt-1 text-xs text-red-400">{String(errors.storageSqFt.message)}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LogisticsForm
