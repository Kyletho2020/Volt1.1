import type { LogisticsPiece } from '../types'

export type DimensionUnit = 'in' | 'ft'

export const normalizeDimensionUnit = (unit?: string | null): DimensionUnit =>
  unit === 'ft' ? 'ft' : 'in'

export const parseDimensionValue = (
  value: string | number | null | undefined
): number | null => {
  if (value === null || value === undefined) {
    return null
  }

  const numeric = parseFloat(String(value).replace(/[^0-9.-]/g, ''))
  return Number.isNaN(numeric) ? null : numeric
}

const formatNumericValue = (value: number): string => {
  const fixed = value.toFixed(3)
  return fixed.replace(/\.000$/, '').replace(/\.([0-9]*?)0+$/, (_, decimals) =>
    decimals ? `.${decimals}` : ''
  )
}

const convertNumericValue = (
  value: number,
  fromUnit: DimensionUnit,
  toUnit: DimensionUnit
): number => {
  if (fromUnit === toUnit) {
    return value
  }

  return fromUnit === 'in' && toUnit === 'ft' ? value / 12 : value * 12
}

export const convertDimensionValue = (
  value: string | number | undefined,
  fromUnit: DimensionUnit,
  toUnit: DimensionUnit
): string => {
  if (value === undefined) {
    return ''
  }

  const parsed = parseDimensionValue(value)
  if (parsed === null) {
    return typeof value === 'string' ? value : String(value ?? '')
  }

  const converted = convertNumericValue(parsed, fromUnit, toUnit)
  return formatNumericValue(converted)
}

export const convertPiecesDimensions = (
  pieces: LogisticsPiece[] | undefined,
  fromUnit: DimensionUnit,
  toUnit: DimensionUnit
): LogisticsPiece[] => {
  if (!pieces) {
    return []
  }

  return pieces.map(piece => ({
    ...piece,
    length: convertDimensionValue(piece.length, fromUnit, toUnit),
    width: convertDimensionValue(piece.width, fromUnit, toUnit),
    height: convertDimensionValue(piece.height, fromUnit, toUnit)
  }))
}

export const toFeet = (
  value: string | number | undefined,
  unit: DimensionUnit
): number | null => {
  const parsed = parseDimensionValue(value)
  if (parsed === null) {
    return null
  }

  return unit === 'ft' ? parsed : parsed / 12
}

export const formatDimensionWithUnit = (
  value: string | number | undefined,
  unit: DimensionUnit,
  fallback: string
): string => {
  const trimmed = value !== undefined ? String(value).trim() : ''
  const displayValue = trimmed || fallback
  const unitSymbol = unit === 'ft' ? "'" : '"'
  return `${displayValue}${unitSymbol}`
}

export const getDimensionPlaceholder = (unit: DimensionUnit) =>
  unit === 'ft' ? "0'" : '0"'

export const getDimensionUnitLabel = (unit: DimensionUnit) =>
  unit === 'ft' ? 'ft' : 'in'
