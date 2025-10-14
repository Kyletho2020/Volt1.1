const STORAGE_LOCATIONS = ['inside', 'outside'] as const

export type StorageLocation = (typeof STORAGE_LOCATIONS)[number]

export const STORAGE_RATES: Record<StorageLocation, number> = {
  inside: 3.5,
  outside: 2.5
}

export const normalizeStorageLocation = (location?: string | null): StorageLocation | null => {
  if (!location) return null

  const normalized = location.trim().toLowerCase()
  return (STORAGE_LOCATIONS as readonly string[]).includes(normalized)
    ? (normalized as StorageLocation)
    : null
}

export const formatStorageRateLabel = (location: StorageLocation) => {
  const rate = STORAGE_RATES[location]
  return `$${rate.toFixed(2)} / sq ft`
}

export const getStorageRate = (location?: string | null) => {
  const normalizedLocation = normalizeStorageLocation(location)
  return normalizedLocation ? STORAGE_RATES[normalizedLocation] : null
}
