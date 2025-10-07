import React from 'react'
import { Truck, Package, Plus, Minus, Trash2, ArrowUp, ArrowDown, Bot } from 'lucide-react'
import { UseFormRegister, FieldErrors } from 'react-hook-form'

interface Piece {
  id: string;
  description: string;
  quantity: number;
  length: string;
  width: string;
  height: string;
  weight: string;
}

interface LogisticsData {
  pieces: Piece[];
  pickupAddress: string;
  pickupCity: string;
  pickupState: string;
  pickupZip: string;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryState: string;
  deliveryZip: string;
  shipmentType: string;
  truckType: string;
  storageType: string;
  storageSqFt: string;
}

interface LogisticsFormProps {
  data: LogisticsData;
  selectedPieces: string[];
  onFieldChange: (field: string, value: string) => void;
  onPieceChange: (
    index: number,
    field: string,
    value: string | number
  ) => void;
  addPiece: () => void;
  removePiece: (pieceId: string) => void;
  togglePieceSelection: (pieceId: string) => void;
  deleteSelectedPieces: () => void;
  movePiece: (oldIndex: number, newIndex: number) => void;
  onOpenLogisticsExtractor: () => void;
  canUseAI: boolean;
  register: UseFormRegister<LogisticsData>;
  errors: FieldErrors<LogisticsData>;
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
  return (
    <div className="bg-gray-900 rounded-lg border-2 border-accent p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex items-center">
          <Truck className="w-6 h-6 text-white mr-2" />
          <h2 className="text-2xl font-bold text-white">Logistics Quote</h2>
        </div>
        <button
          type="button"
          onClick={onOpenLogisticsExtractor}
          disabled={!canUseAI}
          className={`flex items-center justify-center px-3 py-2 rounded-lg text-sm transition-colors ${
            canUseAI
              ? 'bg-accent text-black hover:bg-green-400'
              : 'bg-gray-700 text-gray-300 cursor-not-allowed'
          }`}
        >
          <Bot className="w-4 h-4 mr-2" />
          AI Logistics Extractor {canUseAI ? '✓' : '✗'}
        </button>
      </div>

      <div className="space-y-6">
        {/* Items to Transport */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-medium text-white">
              <Package className="w-4 h-4 inline mr-1" />
              Items to Transport
            </label>
            <div className="flex gap-2">
              <button
                onClick={deleteSelectedPieces}
                disabled={selectedPieces.length === 0}
                className="flex items-center px-2 py-0.5 text-xs bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Delete Selected
              </button>
              <button
                onClick={addPiece}
                className="flex items-center px-3 py-1 bg-accent text-black rounded-lg hover:bg-green-400 transition-colors"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Item
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {data.pieces.map((piece, index) => (
              <div key={piece.id} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-5 flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={selectedPieces.includes(piece.id)}
                    onChange={() => togglePieceSelection(piece.id)}
                    className="form-checkbox mt-2 h-4 w-4 text-accent"
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
                            className="w-full px-3 py-2 bg-black border border-accent rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-white text-sm"
                            placeholder="Description"
                          />
                          {errors.pieces?.[index]?.description && (
                            <p className="text-red-500 text-xs mt-1">{String(errors.pieces[index]?.description?.message)}</p>
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
                          className="w-16 px-2 py-2 bg-black border border-accent rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-white text-sm text-center"
                          placeholder="Qty"
                          min="1"
                          max="99"
                        />
                        {errors.pieces?.[index]?.quantity && (
                          <p className="text-red-500 text-xs mt-1">{String(errors.pieces[index]?.quantity?.message)}</p>
                        )}
                      </>
                    )
                  })()}
                </div>
                <div className="col-span-1">
                  <input
                    type="text"
                    value={piece.length}
                    onChange={(e) => onPieceChange(index, 'length', e.target.value)}
                    className="w-full px-2 py-2 bg-black border border-accent rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-white text-sm"
                    placeholder="L"
                  />
                </div>
                <div className="col-span-1">
                  <input
                    type="text"
                    value={piece.width}
                    onChange={(e) => onPieceChange(index, 'width', e.target.value)}
                    className="w-full px-2 py-2 bg-black border border-accent rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-white text-sm"
                    placeholder="W"
                  />
                </div>
                <div className="col-span-1">
                  <input
                    type="text"
                    value={piece.height}
                    onChange={(e) => onPieceChange(index, 'height', e.target.value)}
                    className="w-full px-2 py-2 bg-black border border-accent rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-white text-sm"
                    placeholder="H"
                  />
                </div>
                <div className="col-span-1">
                  {(() => {
                    const field = register(`pieces.${index}.weight` as const)
                    return (
                      <div>
                        <input
                          type="text"
                          value={piece.weight}
                          onChange={(e) => {
                            field.onChange(e)
                            onPieceChange(index, 'weight', e.target.value)
                          }}
                          className="w-full px-2 py-2 bg-black border border-accent rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-white text-sm"
                          placeholder="Weight (lbs)"
                        />
                        {errors.pieces?.[index]?.weight && (
                          <p className="text-red-500 text-xs mt-1">{String(errors.pieces[index]?.weight?.message)}</p>
                        )}
                      </div>
                    )
                  })()}
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  {data.pieces.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePiece(piece.id)}
                      className="px-2 py-1 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors flex items-center justify-center"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                  )}
                  <div className="flex flex-col bg-gray-800 text-white rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => movePiece(index, index - 1)}
                      disabled={index === 0}
                      className="flex items-center justify-center px-2 py-1 hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => movePiece(index, index + 1)}
                      disabled={index === data.pieces.length - 1}
                      className="flex items-center justify-center px-2 py-1 hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pickup Location */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">Pickup Location</label>
          <div className="space-y-3">
            {(() => {
              const field = register('pickupAddress')
              return (
                <>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={data.pickupAddress}
                      onChange={(e) => {
                        field.onChange(e)
                        onFieldChange('pickupAddress', e.target.value)
                      }}
                      className="flex-1 px-3 py-2 bg-black border border-accent rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-white"
                      placeholder="Pickup address"
                    />
                  </div>
                  {errors.pickupAddress && (
                    <p className="text-red-500 text-xs mt-1">{String(errors.pickupAddress.message)}</p>
                  )}
                </>
              )
            })()}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(() => {
                const field = register('pickupCity')
                return (
                  <>
                    <input
                      type="text"
                      value={data.pickupCity}
                      onChange={(e) => {
                        field.onChange(e)
                        onFieldChange('pickupCity', e.target.value)
                      }}
                      className="w-full px-3 py-2 bg-black border border-accent rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-white"
                      placeholder="City"
                    />
                    {errors.pickupCity && (
                      <p className="text-red-500 text-xs mt-1">{String(errors.pickupCity.message)}</p>
                    )}
                  </>
                )
              })()}
              {(() => {
                const field = register('pickupState')
                return (
                  <>
                    <input
                      type="text"
                      value={data.pickupState}
                      onChange={(e) => {
                        field.onChange(e)
                        onFieldChange('pickupState', e.target.value)
                      }}
                      className="w-full px-3 py-2 bg-black border border-accent rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-white"
                      placeholder="State"
                    />
                    {errors.pickupState && (
                      <p className="text-red-500 text-xs mt-1">{String(errors.pickupState.message)}</p>
                    )}
                  </>
                )
              })()}
              {(() => {
                const field = register('pickupZip')
                return (
                  <>
                    <input
                      type="text"
                      value={data.pickupZip}
                      onChange={(e) => {
                        field.onChange(e)
                        onFieldChange('pickupZip', e.target.value)
                      }}
                      className="w-full px-3 py-2 bg-black border border-accent rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-white"
                      placeholder="Zip"
                    />
                    {errors.pickupZip && (
                      <p className="text-red-500 text-xs mt-1">{String(errors.pickupZip.message)}</p>
                    )}
                  </>
                )
              })()}
            </div>
          </div>
        </div>

        {/* Delivery Location */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">Delivery Location</label>
          <div className="space-y-3">
            {(() => {
              const field = register('deliveryAddress')
              return (
                <>
                  <input
                    type="text"
                    value={data.deliveryAddress}
                    onChange={(e) => {
                      field.onChange(e)
                      onFieldChange('deliveryAddress', e.target.value)
                    }}
                    className="w-full px-3 py-2 bg-black border border-accent rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-white"
                    placeholder="Delivery address"
                  />
                  {errors.deliveryAddress && (
                    <p className="text-red-500 text-xs mt-1">{String(errors.deliveryAddress.message)}</p>
                  )}
                </>
              )
            })()}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(() => {
                const field = register('deliveryCity')
                return (
                  <>
                    <input
                      type="text"
                      value={data.deliveryCity}
                      onChange={(e) => {
                        field.onChange(e)
                        onFieldChange('deliveryCity', e.target.value)
                      }}
                      className="w-full px-3 py-2 bg-black border border-accent rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-white"
                      placeholder="City"
                    />
                    {errors.deliveryCity && (
                      <p className="text-red-500 text-xs mt-1">{String(errors.deliveryCity.message)}</p>
                    )}
                  </>
                )
              })()}
              {(() => {
                const field = register('deliveryState')
                return (
                  <>
                    <input
                      type="text"
                      value={data.deliveryState}
                      onChange={(e) => {
                        field.onChange(e)
                        onFieldChange('deliveryState', e.target.value)
                      }}
                      className="w-full px-3 py-2 bg-black border border-accent rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-white"
                      placeholder="State"
                    />
                    {errors.deliveryState && (
                      <p className="text-red-500 text-xs mt-1">{String(errors.deliveryState.message)}</p>
                    )}
                  </>
                )
              })()}
              {(() => {
                const field = register('deliveryZip')
                return (
                  <>
                    <input
                      type="text"
                      value={data.deliveryZip}
                      onChange={(e) => {
                        field.onChange(e)
                        onFieldChange('deliveryZip', e.target.value)
                      }}
                      className="w-full px-3 py-2 bg-black border border-accent rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-white"
                      placeholder="Zip"
                    />
                    {errors.deliveryZip && (
                      <p className="text-red-500 text-xs mt-1">{String(errors.deliveryZip.message)}</p>
                    )}
                  </>
                )
              })()}
            </div>
          </div>
        </div>

        {/* Shipment Type */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">Shipment Type</label>
          {(() => {
            const field = register('shipmentType')
            return (
              <>
                <select
                  value={data.shipmentType}
                  onChange={(e) => {
                    const value = e.target.value
                    field.onChange(e)
                    onFieldChange('shipmentType', value)
                    if (!value) {
                      onFieldChange('truckType', '')
                    }
                  }}
                  className="w-full px-3 py-2 bg-black border border-accent rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-white"
                >
                  <option value="">None</option>
                  <option value="LTL">LTL</option>
                  <option value="FTL">FTL</option>
                </select>
                {errors.shipmentType && (
                  <p className="text-red-500 text-xs mt-1">{String(errors.shipmentType.message)}</p>
                )}
              </>
            )
          })()}
        </div>

        {/* Truck Type Requested */}
        {data.shipmentType && (
          <div>
            <label className="block text-sm font-medium text-white mb-2">Truck Type Requested</label>
            {(() => {
              const field = register('truckType')
              return (
                <>
                  <select
                    value={data.truckType}
                    onChange={(e) => {
                      field.onChange(e)
                      onFieldChange('truckType', e.target.value)
                    }}
                    className="w-full px-3 py-2 bg-black border border-accent rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-white"
                  >
                    <option value="">Select truck type</option>
                    <option value="Flatbed">Flatbed</option>
                    <option value="Flatbed with tarp">Flatbed with tarp</option>
                    <option value="Conestoga">Conestoga</option>
                  </select>
                  {errors.truckType && (
                    <p className="text-red-500 text-xs mt-1">{String(errors.truckType.message)}</p>
                  )}
                </>
              )
            })()}
          </div>
        )}

        {/* Storage Requirements */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">Storage</label>
          <select
            value={data.storageType}
            onChange={(e) => onFieldChange('storageType', e.target.value)}
            className="w-full px-3 py-2 bg-black border border-accent rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-white"
          >
            <option value="">No Storage</option>
            <option value="inside">Inside Storage ($1.50/sq ft)</option>
            <option value="outside">Outside Storage ($0.75/sq ft)</option>
          </select>
          {data.storageType && (
            <input
              type="number"
              value={data.storageSqFt}
              onChange={(e) => onFieldChange('storageSqFt', e.target.value)}
              className="mt-2 w-full px-3 py-2 bg-black border border-accent rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-white"
              placeholder="Square footage"
              min="0"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default LogisticsForm;
