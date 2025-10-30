import fetch from 'node-fetch'
import { keyManager } from './keyManager.js'

const HUBSPOT_BASE_URL = 'https://api.hubapi.com'

async function hubspotRequest(path, options = {}) {
  const apiKey = await keyManager.getActiveKey('hubspot')
  const url = new URL(`${HUBSPOT_BASE_URL}${path}`)
  if (options.query) {
    for (const [key, value] of Object.entries(options.query)) {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value))
      }
    }
  }

  const response = await fetch(url.toString(), {
    method: options.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body:
      options.body !== undefined && options.body !== null
        ? JSON.stringify(options.body)
        : undefined,
  })

  if (!response.ok) {
    const errorPayload = await response.text()
    throw new Error(
      `HubSpot request failed (${response.status} ${response.statusText}): ${errorPayload}`
    )
  }

  if (response.status === 204) {
    return undefined
  }

  return await response.json()
}

export async function createContact(properties) {
  return hubspotRequest('/crm/v3/objects/contacts', {
    method: 'POST',
    body: { properties },
  })
}

export async function getContact(contactId) {
  return hubspotRequest(`/crm/v3/objects/contacts/${contactId}`)
}

export async function updateContact(contactId, properties) {
  return hubspotRequest(`/crm/v3/objects/contacts/${contactId}`, {
    method: 'PATCH',
    body: { properties },
  })
}

export async function deleteContact(contactId) {
  return hubspotRequest(`/crm/v3/objects/contacts/${contactId}`, {
    method: 'DELETE',
  })
}

export async function searchContacts(filters) {
  return hubspotRequest('/crm/v3/objects/contacts/search', {
    method: 'POST',
    body: { filterGroups: [{ filters }] },
  })
}

export async function rotateHubspotKey(secret, metadata) {
  await keyManager.rotateKey('hubspot', secret, metadata)
}
