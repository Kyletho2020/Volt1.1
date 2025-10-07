import { describe, expect, it } from 'vitest'
import { toTitleCase } from '../titleCase'

describe('toTitleCase', () => {
  it('capitalizes the first example phrase correctly', () => {
    expect(toTitleCase('fort know is amazing')).toBe('Fort Know Is Amazing')
  })

  it('capitalizes the second example phrase correctly', () => {
    expect(toTitleCase('port of tacoma is awesome')).toBe('Port of Tacoma Is Awesome')
  })

  it('capitalizes the third example phrase correctly', () => {
    expect(toTitleCase('seattle is the best')).toBe('Seattle Is the Best')
  })

  it('keeps articles and conjunctions lowercase when appropriate', () => {
    expect(toTitleCase('the rise and fall of ziggy')).toBe('The Rise and Fall of Ziggy')
  })

  it('capitalizes each part of a hyphenated major word', () => {
    expect(toTitleCase('state-of-the-art equipment')).toBe('State-Of-The-Art Equipment')
  })

  it('preserves acronyms', () => {
    expect(toTitleCase('NASA facility')).toBe('NASA Facility')
  })

  it('preserves trailing whitespace for in-progress typing', () => {
    expect(toTitleCase('port of tacoma ')).toBe('Port of Tacoma ')
  })
})
