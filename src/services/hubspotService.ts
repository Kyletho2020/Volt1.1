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

export class HubSpotService {
  private static readonly SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
  private static readonly SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

  static async searchContactsByName(name: string, partial = false): Promise<HubSpotContact[]> {
    if (!this.SUPABASE_URL || !this.SUPABASE_ANON_KEY) {
      throw new Error('Supabase configuration missing')
    }

    const response = await fetch(`${this.SUPABASE_URL}/functions/v1/hubspot-search`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.SUPABASE_ANON_KEY}`,
        'apikey': this.SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, partial }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Network error' }))
      throw new Error(err.error || 'Failed to search HubSpot')
    }

    const data = await response.json()
    return data.results || []
  }

  static async updateContact(id: string, payload: Partial<HubSpotContact>): Promise<void> {
    if (!this.SUPABASE_URL || !this.SUPABASE_ANON_KEY) {
      throw new Error('Supabase configuration missing')
    }

    const response = await fetch(`${this.SUPABASE_URL}/functions/v1/hubspot-update`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.SUPABASE_ANON_KEY}`,
        'apikey': this.SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id, properties: payload }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Network error' }))
      throw new Error(err.error || 'Failed to update contact')
    }
  }
}


