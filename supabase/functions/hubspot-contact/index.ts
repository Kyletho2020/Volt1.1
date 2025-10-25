import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

interface ContactRequestBody {
  id?: string
  email?: string
}

interface HubSpotContactResponse {
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

const mapContact = (id: string, properties: Record<string, string> = {}, company: Record<string, string> = {}) => ({
  id,
  firstName: properties.firstname || '',
  lastName: properties.lastname || '',
  email: properties.email || '',
  phone: properties.phone || '',
  companyName: company.name || properties.company || '',
  contactAddress: composeFullAddress(properties.address, properties.city, properties.state, properties.zip),
  contactAddress1: properties.address || '',
  contactCity: properties.city || '',
  contactState: properties.state || '',
  contactZip: properties.zip || '',
  companyAddress: composeFullAddress(company.address, company.city, company.state, company.zip),
  companyAddress1: company.address || '',
  companyCity: company.city || '',
  companyState: company.state || '',
  companyZip: company.zip || ''
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

    const body: ContactRequestBody = await req.json().catch(() => ({}))
    const contactId = body.id?.trim()
    const email = body.email?.trim()

    if (!contactId && !email) {
      return new Response(JSON.stringify({ error: 'Contact id or email is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const identifier = contactId ?? encodeURIComponent(email ?? '')
    const idProperty = contactId ? '' : '&idProperty=email'
    const hsRes = await fetch(
      `https://api.hubapi.com/crm/v3/objects/contacts/${identifier}?properties=firstname,lastname,email,phone,address,city,state,zip${idProperty}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )

    if (!hsRes.ok) {
      const errText = await hsRes.text().catch(() => 'HubSpot error')
      return new Response(JSON.stringify({ error: `HubSpot contact lookup failed: ${errText}` }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const data = (await hsRes.json().catch(() => ({}))) as HubSpotContactResponse
    if (!data.id) {
      return new Response(JSON.stringify({ error: 'Contact not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    let companyProps: Record<string, string> = {}
    try {
      const assocRes = await fetch(`https://api.hubapi.com/crm/v4/objects/contacts/${data.id}/associations/companies`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (assocRes.ok) {
        const assocData = (await assocRes.json()) as { results?: Array<{ toObjectId?: string }> }
        const firstCompanyId = assocData.results?.[0]?.toObjectId
        if (firstCompanyId) {
          const companyRes = await fetch(
            `https://api.hubapi.com/crm/v3/objects/companies/${firstCompanyId}?properties=name,address,address2,city,state,zip`,
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          )
          if (companyRes.ok) {
            const companyData = (await companyRes.json()) as { properties?: Record<string, string> }
            const properties = companyData.properties || {}
            companyProps = {
              name: properties.name || '',
              address: properties.address || '',
              city: properties.city || '',
              state: properties.state || '',
              zip: properties.zip || ''
            }
          }
        }
      }
    } catch {
      // ignore company enrichment errors
    }

    return new Response(
      JSON.stringify({ result: mapContact(data.id, data.properties ?? {}, companyProps) }),
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
