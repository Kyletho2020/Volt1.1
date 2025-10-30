import { Router } from 'express'
import { createCrmRecord, getCrmRecord, updateCrmRecord } from '../services/crmService.js'

const router = Router()

router.post('/records', async (req, res, next) => {
  try {
    const { objectTypeId, objectId, properties, metadata } = req.body ?? {}
    if (!objectTypeId || typeof objectTypeId !== 'string') {
      throw new Error('objectTypeId is required')
    }
    if (!properties || typeof properties !== 'object') {
      throw new Error('properties must be provided for CRM records')
    }

    const result = await createCrmRecord({
      objectTypeId,
      objectId,
      properties,
      metadata,
    })

    const statusCode = result.record?.status === 'synced' ? 201 : 202
    res.status(statusCode).json(result)
  } catch (error) {
    next(error)
  }
})

router.patch('/records/:id', async (req, res, next) => {
  try {
    const { properties, objectId, metadata } = req.body ?? {}
    if (properties && typeof properties !== 'object') {
      throw new Error('properties payload must be an object')
    }

    const result = await updateCrmRecord(req.params.id, {
      properties,
      objectId,
      metadata,
    })

    const statusCode = result.record?.status === 'synced' ? 200 : 202
    res.status(statusCode).json(result)
  } catch (error) {
    next(error)
  }
})

router.get('/records/:id', async (req, res, next) => {
  try {
    const record = await getCrmRecord(req.params.id)
    res.json({ record })
  } catch (error) {
    next(error)
  }
})

export default router
