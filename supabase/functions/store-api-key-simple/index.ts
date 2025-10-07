import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const encoder = new TextEncoder()

async function getKey(): Promise<CryptoKey> {
  const keyB64 = Deno.env.get('API_KEY_ENCRYPTION_KEY')
  if (!keyB64) throw new Error('Missing API_KEY_ENCRYPTION_KEY environment variable')
  const rawKey = Uint8Array.from(atob(keyB64), c => c.charCodeAt(0))
  return crypto.subtle.importKey('raw', rawKey, 'AES-GCM', false, ['encrypt'])
}

async function encrypt(text: string): Promise<string> {
  const key = await getKey()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const cipherBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(text)
  )
  const ivB64 = btoa(String.fromCharCode(...iv))
  const cipherB64 = btoa(String.fromCharCode(...new Uint8Array(cipherBuffer)))
  return `${ivB64}:${cipherB64}`
}

interface StoreKeyRequest {
  apiKey: string
  keyId: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { apiKey, keyId }: StoreKeyRequest = await req.json()

    if (!apiKey || !keyId) {
      throw new Error('API key and keyId are required')
    }

    // Encrypt the API key using AES-GCM before storing
    const encryptedApiKey = await encrypt(apiKey)

    const { error } = await supabaseClient
      .from('api_key_storage')
      .upsert({
        id: keyId,
        key_name: 'chatgpt_api_key',
        encrypted_key: encryptedApiKey,
      })

    if (error) {
      throw new Error(`Failed to store API key: ${error.message}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        keyId: keyId,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error in store-api-key-simple:', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
