import { describe, it, expect } from 'vitest'
import { equipmentSchema, pieceSchema, logisticsSchema } from '../src/lib/validation'

describe('validation schemas', () => {
  it('equipmentSchema rejects missing project name', async () => {
    await expect(
      equipmentSchema.validate(
        {
          projectName: '',
          companyName: '',
          contactName: '',
          siteAddress: '',
          sitePhone: '',
          shopLocation: '',
          scopeOfWork: ''
        },
        { abortEarly: false }
      )
    ).rejects.toBeDefined()
  })

  it('pieceSchema rejects quantity below 1', async () => {
    await expect(
      pieceSchema.validate({
        id: 'piece-1',
        description: 'test',
        quantity: 0,
        length: '1',
        width: '1',
        height: '1',
        weight: '1'
      })
    ).rejects.toBeDefined()
  })

  it('logisticsSchema rejects when missing pickup address', async () => {
    await expect(
      logisticsSchema.validate({
        pieces: [{
          id: 'piece-1',
          description: 'a',
          quantity: 1,
          length: '1',
          width: '1',
          height: '1',
          weight: '1'
        }],
        pickupAddress: '',
        pickupCity: 'c',
        pickupState: 's',
        pickupZip: 'z',
        deliveryAddress: 'd',
        deliveryCity: 'dc',
        deliveryState: 'ds',
        deliveryZip: 'dz',
        shipmentType: 'LTL (Less Than Truckload)',
        truckType: 'Flatbed',
        includeStorage: false,
        storageLocation: '',
        storageSqFt: ''
      })
    ).rejects.toBeDefined()
  })
})
