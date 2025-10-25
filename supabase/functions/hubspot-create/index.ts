import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

interface CreateRequestBody {
  properties?: Record<string, unknown>
}

interface HubSpotCreateResponse {
  id?: string
  properties?: Record<string, string>
}

const composeFullAddress = (address?: string, city?: string, state?: string, zip?: string): string => {
  const parts = [address?.trim(), city?.trim(), state?.trim(), zip?.trim()].filter(Boolean)
  if (parts.length === 0) return ''
  const [street, cityPart, statePart, zipPart] = [parts[0], parts[1], parts[2], parts[3]]
  const location = [cityPart, statePart].filter(Boolean).join(', ')
  return [street, [location, zipPart].filter(Boolean).join(' ')].filter(Boolean).join(', ')
}

const mapContact = (id: string, properties: Record<string, string> = {}) => ({
  id,
  firstName: properties.firstname || '',
  lastName: properties.lastname || '',
  email: properties.email || '',
  phone: properties.phone || '',
  companyName: properties.company || '',
  contactAddress: composeFullAddress(properties.address, properties.city, properties.state, properties.zip),
  contactAddress1: properties.address || '',
  contactCity: properties.city || '',
  contactState: properties.state || '',
  contactZip: properties.zip || '',
  companyAddress: '',
  companyAddress1: '',
  companyCity: '',
  companyState: '',
  companyZip: ''
})

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const token = Deno.env.get('HUBSPOT_PRIVATE_APP_TOKEN')
    if (!token) {
      return new Response(JSON.stringify({ error: 'Missing HUBSPOT_PRIVATE_APP_TOKEN secret' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const body: CreateRequestBody = await req.json().catch(() => ({}))
    const properties = body.properties && typeof body.properties === 'object' ? body.properties : {}

    if (Object.keys(properties).length === 0) {
      return new Response(JSON.stringify({ error: 'Contact properties are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const hsRes = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ properties })
    })

    if (!hsRes.ok) {
      const errText = await hsRes.text().catch(() => 'HubSpot error')
      return new Response(JSON.stringify({ error: `HubSpot create failed: ${errText}` }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const data = (await hsRes.json().catch(() => ({}))) as HubSpotCreateResponse
    if (!data.id) {
      return new Response(JSON.stringify({ error: 'Invalid response from HubSpot' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(
      JSON.stringify({ result: mapContact(data.id, data.properties ?? {}) }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
