import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface SearchRequestBody {
  name: string
  partial?: boolean
}

interface HubSpotSearchFilter {
  propertyName: string
  operator: string
  value: string
}

interface HubSpotSearchBody {
  filterGroups: Array<{ filters: HubSpotSearchFilter[] }>
  properties: string[]
  limit?: number
  after?: string
  query?: string
}

interface HubSpotContactResult {
  id: string
  properties: Record<string, string | undefined>
}

interface HubSpotSearchResponse {
  results?: HubSpotContactResult[]
  paging?: { next?: { after?: string } }
}

const composeFullAddress = (address?: string, city?: string, state?: string, zip?: string): string => {
  const parts = [address?.trim(), city?.trim(), state?.trim(), zip?.trim()].filter(Boolean)
  if (parts.length === 0) return ''
  // "123 Main St, Portland, OR 97202"
  const [addr, c, s, z] = parts
  const loc = [c, s].filter(Boolean).join(', ')
  return [addr, [loc, z].filter(Boolean).join(' ')].filter(Boolean).join(', ')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Initialize Supabase (not strictly needed here, but kept for parity and future use)
    createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const token = Deno.env.get('HUBSPOT_PRIVATE_APP_TOKEN')
    if (!token) {
      return new Response(JSON.stringify({ error: 'Missing HUBSPOT_PRIVATE_APP_TOKEN secret' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body: SearchRequestBody = await req.json().catch(() => ({ name: '' }))
    const name = (body.name || '').trim()
    const partial = Boolean(body.partial)

    if (!name) {
      return new Response(JSON.stringify({ error: 'Name is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const parts = name.split(/\s+/)
    const filterGroups: HubSpotSearchBody['filterGroups'] = []

    if (!partial) {
      if (parts.length >= 2) {
        const first = parts[0]
        const last = parts.slice(1).join(' ')
        filterGroups.push({
          filters: [
            { propertyName: 'firstname', operator: 'EQ', value: first },
            { propertyName: 'lastname', operator: 'EQ', value: last },
          ],
        })
        filterGroups.push({
          filters: [
            { propertyName: 'firstname', operator: 'EQ', value: last },
            { propertyName: 'lastname', operator: 'EQ', value: first },
          ],
        })
      } else {
        const single = parts[0]
        filterGroups.push({ filters: [{ propertyName: 'firstname', operator: 'EQ', value: single }] })
        filterGroups.push({ filters: [{ propertyName: 'lastname', operator: 'EQ', value: single }] })
      }
    }

    // Collect all results via pagination (soft cap to protect function)
    const collected: HubSpotContactResult[] = []
    let after: string | undefined = undefined
    let pageCount = 0
    const MAX_PAGES = 50 // soft cap (approx up to 5k if limit=100)
    do {
      const afterParam = after ? { after } : {}
      const hsBody: HubSpotSearchBody = partial
        ? {
            ...afterParam,
            properties: ['firstname', 'lastname', 'email', 'phone', 'address', 'city', 'state', 'zip'],
            query: name,
            limit: 100,
            filterGroups: [],
          }
        : {
            filterGroups,
            properties: ['firstname', 'lastname', 'email', 'phone', 'address', 'city', 'state', 'zip'],
            limit: 100,
            ...afterParam,
          }

      const hsRes = await fetch('https://api.hubapi.com/crm/v3/objects/contacts/search', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(hsBody),
      })

      if (!hsRes.ok) {
        const errText = await hsRes.text().catch(() => 'HubSpot error')
        return new Response(JSON.stringify({ error: `HubSpot search failed: ${errText}` }), {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const data = (await hsRes.json()) as HubSpotSearchResponse
      if (data.results?.length) collected.push(...data.results)
      after = data.paging?.next?.after
      pageCount += 1
    } while (after && pageCount < MAX_PAGES)

    // For each contact, try to get first associated company and read its address
    interface HubSpotContact {
      id: string
      firstName: string
      lastName: string
      email: string
      phone: string
      companyName: string
      contactAddress: string
      contactAddress1: string
      contactCity: string
      contactState: string
      contactZip: string
      companyAddress: string
      companyAddress1: string
      companyCity: string
      companyState: string
      companyZip: string
    }

    const mapped: HubSpotContact[] = []
    for (const r of collected) {
      const p = r.properties || {}
      let companyName = ''
      let companyAddress = ''
      let companyAddress1 = ''
      let companyCity = ''
      let companyState = ''
      let companyZip = ''

      try {
        const assocRes = await fetch(`https://api.hubapi.com/crm/v4/objects/contacts/${r.id}/associations/companies`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (assocRes.ok) {
          const assocData = await assocRes.json() as { results?: Array<{ toObjectId?: string }> }
          const first = assocData.results?.[0]?.toObjectId
          if (first) {
            const companyRes = await fetch(
              `https://api.hubapi.com/crm/v3/objects/companies/${first}?properties=name,address,address2,city,state,zip`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            )
            if (companyRes.ok) {
              const companyData = (await companyRes.json()) as {
                properties?: Record<string, string>
              }
              const cp = companyData.properties || {}
              companyName = cp.name || ''
              companyAddress1 = cp.address || ''
              companyCity = cp.city || ''
              companyState = cp.state || ''
              companyZip = cp.zip || ''
              companyAddress = composeFullAddress(
                companyAddress1,
                companyCity,
                companyState,
                companyZip
              )
            }
          }
        }
      } catch {
        // ignore enrichment errors per-contact
      }

      const contactAddress = composeFullAddress(p.address, p.city, p.state, p.zip)
      mapped.push({
        id: r.id,
        firstName: p.firstname || '',
        lastName: p.lastname || '',
        email: p.email || '',
        phone: p.phone || '',
        companyName,
        contactAddress,
        contactAddress1: p.address || '',
        contactCity: p.city || '',
        contactState: p.state || '',
        contactZip: p.zip || '',
        companyAddress,
        companyAddress1,
        companyCity,
        companyState,
        companyZip,
      })
    }

    return new Response(JSON.stringify({ results: mapped }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})


