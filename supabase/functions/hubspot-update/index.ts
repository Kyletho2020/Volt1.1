import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface UpdateRequestBody {
  id: string
  properties: Record<string, unknown>
}

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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body: UpdateRequestBody = await req.json().catch(() => ({ id: '', properties: {} }))
    const contactId = body.id?.trim()
    const props = body.properties || {}

    if (!contactId || Object.keys(props).length === 0) {
      return new Response(JSON.stringify({ error: 'Contact id and properties are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const hsRes = await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${contactId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ properties: props }),
    })

    if (!hsRes.ok) {
      const errText = await hsRes.text().catch(() => 'HubSpot error')
      return new Response(JSON.stringify({ error: `HubSpot update failed: ${errText}` }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const data = await hsRes.json().catch(() => ({}))
    return new Response(JSON.stringify({ result: data }), {
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

