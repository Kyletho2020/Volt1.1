export interface HubSpotContact {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  companyName?: string
  contactAddress?: string
  contactAddress1?: string
  contactCity?: string
  contactState?: string
  contactZip?: string
  companyAddress?: string
  companyAddress1?: string
  companyCity?: string
  companyState?: string
  companyZip?: string
}

type ContactPayload = Partial<HubSpotContact> & Record<string, unknown>

export class HubSpotService {
  private static readonly SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
  private static readonly SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

  private static ensureConfigured() {
    if (!this.SUPABASE_URL || !this.SUPABASE_ANON_KEY) {
      throw new Error('Supabase configuration missing')
    }
  }

  private static mapToHubSpotProperties(payload: ContactPayload): Record<string, unknown> {
    const propertyMap: Record<string, string> = {
      firstName: 'firstname',
      lastName: 'lastname',
      email: 'email',
      phone: 'phone',
      contactAddress: 'address',
      contactAddress1: 'address',
      contactCity: 'city',
      contactState: 'state',
      contactZip: 'zip',
      address: 'address',
      city: 'city',
      state: 'state',
      zip: 'zip',
      companyName: 'company',
      jobTitle: 'jobtitle'
    }

    const mapped: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(payload)) {
      if (value === undefined || value === null) continue
      if (typeof value === 'string' && value.trim() === '') continue
      const mappedKey = propertyMap[key] || key
      mapped[mappedKey] = value
    }
    return mapped
  }

  static async searchContactsByName(name: string, partial = false): Promise<HubSpotContact[]> {
    this.ensureConfigured()

    const response = await fetch(`${this.SUPABASE_URL}/functions/v1/hubspot-search`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.SUPABASE_ANON_KEY}`,
        apikey: this.SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, partial })
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Network error' }))
      throw new Error(err.error || 'Failed to search HubSpot')
    }

    const data = await response.json()
    return data.results || []
  }

  static async getContactDetails(params: { id?: string; email?: string }): Promise<HubSpotContact | null> {
    this.ensureConfigured()

    const response = await fetch(`${this.SUPABASE_URL}/functions/v1/hubspot-contact`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.SUPABASE_ANON_KEY}`,
        apikey: this.SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Network error' }))
      throw new Error(err.error || 'Failed to load contact')
    }

    const data = await response.json()
    return data.result || null
  }

  static async createContact(payload: ContactPayload): Promise<HubSpotContact> {
    this.ensureConfigured()

    const properties = this.mapToHubSpotProperties(payload)

    if (Object.keys(properties).length === 0) {
      throw new Error('No contact details provided to create')
    }

    const response = await fetch(`${this.SUPABASE_URL}/functions/v1/hubspot-create`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.SUPABASE_ANON_KEY}`,
        apikey: this.SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ properties })
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Network error' }))
      throw new Error(err.error || 'Failed to create contact')
    }

    const data = await response.json()
    return data.result as HubSpotContact
  }

  static async updateContact(id: string, payload: ContactPayload): Promise<void> {
    this.ensureConfigured()

    const properties = this.mapToHubSpotProperties(payload)
    if (Object.keys(properties).length === 0) {
      throw new Error('No valid properties provided for update')
    }

    const response = await fetch(`${this.SUPABASE_URL}/functions/v1/hubspot-update`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.SUPABASE_ANON_KEY}`,
        apikey: this.SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ id, properties })
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Network error' }))
      throw new Error(err.error || 'Failed to update contact')
    }
  }
}


