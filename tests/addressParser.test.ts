import { describe, it, expect } from 'vitest'
import { parseAddressParts } from '../src/lib/address'

describe('parseAddressParts', () => {
  it('parses a multi-line address into parts', () => {
    const result = parseAddressParts('123 Main St\nPortland, OR 97205')

    expect(result).toEqual({
      street: '123 Main St',
      city: 'Portland',
      state: 'OR',
      zip: '97205'
    })
  })

  it('handles suite information in the street line', () => {
    const result = parseAddressParts('123 Main St, Suite 200, Portland, OR 97205')

    expect(result).toEqual({
      street: '123 Main St, Suite 200',
      city: 'Portland',
      state: 'OR',
      zip: '97205'
    })
  })

  it('captures city and state when zip is unavailable', () => {
    const result = parseAddressParts('123 Main St, Portland, OR')

    expect(result).toEqual({
      street: '123 Main St',
      city: 'Portland',
      state: 'OR',
      zip: ''
    })
  })

  it('returns blank parts when address is empty', () => {
    expect(parseAddressParts('')).toEqual({
      street: '',
      city: '',
      state: '',
      zip: ''
    })
  })
})
