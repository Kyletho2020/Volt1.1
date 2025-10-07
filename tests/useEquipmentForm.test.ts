import { renderHook, act } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useEquipmentForm } from '../src/hooks/useEquipmentForm'
import { HubSpotContact } from '../src/services/hubspotService'

describe('useEquipmentForm', () => {
  it('uses contact address parts to populate siteAddress', () => {
    const { result } = renderHook(() => useEquipmentForm())

    const contact: HubSpotContact = {
      id: '1',
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      phone: '555-5555',
      contactAddress1: '123 Main St',
      contactCity: 'Portland',
      contactState: 'or',
      contactZip: '97205'
    }

    act(() => {
      result.current.handleSelectHubSpotContact(contact)
    })

    expect(result.current.equipmentData.siteAddress).toBe('123 Main St\nPortland, OR 97205')
  })
})
