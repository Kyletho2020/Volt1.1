import { Router } from 'express'
import {
  createContact,
  deleteContact,
  getContact,
  rotateHubspotKey,
  searchContacts,
  updateContact,
} from '../services/hubspotService.js'

const router = Router()

router.post('/contacts', async (req, res, next) => {
  try {
    const { properties } = req.body ?? {}
    if (!properties || typeof properties !== 'object') {
      throw new Error('Contact properties are required')
    }
    const result = await createContact(properties)
    res.status(201).json(result)
  } catch (error) {
    next(error)
  }
})

router.get('/contacts/:id', async (req, res, next) => {
  try {
    const result = await getContact(req.params.id)
    res.json(result)
  } catch (error) {
    next(error)
  }
})

router.patch('/contacts/:id', async (req, res, next) => {
  try {
    const { properties } = req.body ?? {}
    if (!properties || typeof properties !== 'object') {
      throw new Error('Contact properties are required')
    }
    const result = await updateContact(req.params.id, properties)
    res.json(result)
  } catch (error) {
    next(error)
  }
})

router.delete('/contacts/:id', async (req, res, next) => {
  try {
    await deleteContact(req.params.id)
    res.status(204).send()
  } catch (error) {
    next(error)
  }
})

router.post('/contacts/search', async (req, res, next) => {
  try {
    const { filters } = req.body ?? {}
    if (!Array.isArray(filters)) {
      throw new Error('Search filters must be an array')
    }
    const result = await searchContacts(filters)
    res.json(result)
  } catch (error) {
    next(error)
  }
})

router.post('/keys/rotate', async (req, res, next) => {
  try {
    const { apiKey, metadata } = req.body ?? {}
    if (!apiKey || typeof apiKey !== 'string') {
      throw new Error('apiKey is required for rotation')
    }
    const metadataRecord =
      metadata && typeof metadata === 'object' ? metadata : undefined
    await rotateHubspotKey(apiKey, metadataRecord)
    res.status(204).send()
  } catch (error) {
    next(error)
  }
})

export default router
