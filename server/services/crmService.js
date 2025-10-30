import { supabaseAdmin } from './supabaseClient.js'
import { createContact, updateContact } from './hubspotService.js'

const TABLE = 'crm_records'

function sanitizeProperties(properties) {
  if (!properties || typeof properties !== 'object') {
    return {}
  }
  return properties
}

function sanitizeMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object') {
    return {}
  }
  return metadata
}

async function fetchRecord(recordId) {
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .select('*')
    .eq('id', recordId)
    .single()

  if (error) {
    throw new Error(`Failed to load CRM record: ${error.message}`)
  }

  return data
}

async function persistRecord(recordId, payload) {
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .update(payload)
    .eq('id', recordId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update CRM record state: ${error.message}`)
  }

  return data
}

async function syncWithHubSpot(record) {
  let status = 'pending'
  let error = null
  let hubspotPayload

  if (record.object_type_id === 'contacts') {
    try {
      if (record.object_id) {
        hubspotPayload = await updateContact(record.object_id, record.properties ?? {})
      } else {
        const created = await createContact(record.properties ?? {})
        hubspotPayload = created
        const newObjectId = created?.id ?? created?.objectId
        if (newObjectId) {
          record.object_id = String(newObjectId)
        }
      }
      status = 'synced'
    } catch (err) {
      status = 'failed'
      error = err instanceof Error ? err.message : 'HubSpot sync failed'
    }
  }

  const updated = await persistRecord(record.id, {
    object_id: record.object_id ?? null,
    properties: record.properties ?? {},
    metadata: record.metadata ?? {},
    status,
    error,
  })

  return { record: updated, hubspotPayload, error }
}

export async function createCrmRecord({ objectTypeId, objectId, properties, metadata }) {
  if (!objectTypeId || typeof objectTypeId !== 'string') {
    throw new Error('objectTypeId is required to create a CRM record')
  }

  const payload = {
    object_type_id: objectTypeId,
    object_id: objectId ?? null,
    properties: sanitizeProperties(properties),
    metadata: sanitizeMetadata(metadata),
  }

  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .insert(payload)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create CRM record: ${error.message}`)
  }

  return syncWithHubSpot(data)
}

export async function updateCrmRecord(recordId, { objectId, properties, metadata }) {
  const existing = await fetchRecord(recordId)

  const payload = {
    object_id: objectId ?? existing.object_id ?? null,
    properties: sanitizeProperties(properties ?? existing.properties ?? {}),
    metadata: { ...sanitizeMetadata(existing.metadata), ...sanitizeMetadata(metadata) },
    status: 'pending',
    error: null,
  }

  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .update(payload)
    .eq('id', recordId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update CRM record: ${error.message}`)
  }

  return syncWithHubSpot(data)
}

export async function getCrmRecord(recordId) {
  return fetchRecord(recordId)
}
