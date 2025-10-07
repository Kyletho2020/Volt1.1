export interface ParsedAddressParts {
  street: string
  city: string
  state: string
  zip: string
}

interface AddressPartsInput {
  street?: string | null
  city?: string | null
  state?: string | null
  zip?: string | null
}

const toUpperState = (value: string | undefined) =>
  value ? value.toUpperCase() : ''

const createEmpty = (): ParsedAddressParts => ({
  street: '',
  city: '',
  state: '',
  zip: ''
})

/**
 * Attempts to split a free-form address into street, city, state, and zip parts.
 * The parser is tolerant of additional address segments (e.g., suite numbers)
 * and gracefully falls back to returning the full address as the street when a
 * segment cannot be determined.
 */
export const parseAddressParts = (address: string): ParsedAddressParts => {
  if (!address) {
    return createEmpty()
  }

  const normalized = address
    .replace(/\s*\n+\s*/g, ', ')
    .replace(/\s{2,}/g, ' ')
    .trim()

  if (!normalized) {
    return createEmpty()
  }

  const segments = normalized
    .split(',')
    .map(segment => segment.trim())
    .filter(Boolean)

  if (segments.length === 0) {
    return createEmpty()
  }

  if (segments.length === 1) {
    return {
      street: segments[0],
      city: '',
      state: '',
      zip: ''
    }
  }

  const streetSegments = [...segments]

  const pop = () => streetSegments.pop()
  const peek = () => streetSegments[streetSegments.length - 1]

  let city = ''
  let state = ''
  let zip = ''

  let last = peek()

  if (!last) {
    return createEmpty()
  }

  let match = last.match(/^([A-Za-z]{2})(?:\s+(\d{5}(?:-\d{4})?))?$/)
  if (match) {
    state = toUpperState(match[1])
    if (match[2]) {
      zip = match[2]
    }
    pop()
    last = peek()
  } else {
    match = last.match(/^(\d{5}(?:-\d{4})?)$/)
    if (match) {
      zip = match[1]
      pop()
      last = peek()
    }
  }

  if (last && (!state || !zip)) {
    match = last.match(/^(.+?)\s+([A-Za-z]{2})\s+(\d{5}(?:-\d{4})?)$/)
    if (match) {
      city = match[1]
      if (!state) state = toUpperState(match[2])
      if (!zip) zip = match[3]
      pop()
      last = peek()
    }
  }

  if (last && !state) {
    match = last.match(/^([A-Za-z]{2})$/)
    if (match) {
      state = toUpperState(match[1])
      pop()
      last = peek()
    }
  }

  if (last && !zip) {
    match = last.match(/(\d{5}(?:-\d{4})?)$/)
    if (match) {
      zip = match[1]
      const remainder = last.slice(0, last.length - match[1].length).trim()
      if (remainder && !city) {
        city = remainder.replace(/,+$/, '')
      }
      pop()
      last = peek()
    }
  }

  if (last && !city) {
    match = last.match(/^(.+?)\s+([A-Za-z]{2})$/)
    if (match) {
      city = match[1]
      if (!state) state = toUpperState(match[2])
      pop()
      last = peek()
    }
  }

  if (!city && streetSegments.length) {
    city = pop() ?? ''
  }

  const street = streetSegments.join(', ')

  return {
    street,
    city,
    state,
    zip
  }
}

export const formatAddressFromParts = ({
  street,
  city,
  state,
  zip
}: AddressPartsInput): string => {
  const normalizedStreet = street?.trim() ?? ''
  const normalizedCity = city?.trim() ?? ''
  const normalizedState = state?.trim()?.toUpperCase() ?? ''
  const normalizedZip = zip?.trim() ?? ''

  const lines: string[] = []

  if (normalizedStreet) {
    lines.push(normalizedStreet)
  }

  const cityStateZipSegments: string[] = []

  if (normalizedCity) {
    cityStateZipSegments.push(normalizedCity)
  }

  const stateZip = [normalizedState, normalizedZip].filter(Boolean).join(' ').trim()
  if (stateZip) {
    cityStateZipSegments.push(stateZip)
  }

  if (cityStateZipSegments.length > 0) {
    lines.push(cityStateZipSegments.join(', '))
  }

  return lines.join('\n').trim()
}
