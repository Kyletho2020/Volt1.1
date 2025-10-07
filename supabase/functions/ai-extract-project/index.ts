import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface ExtractRequest {
  text: string
  sessionId: string
}

interface OpenAIMessage {
  role: 'system' | 'user'
  content: string
}

interface OpenAIRequest {
  model: string
  messages: OpenAIMessage[]
  temperature: number
  max_tokens: number
}

const SYSTEM_PROMPT = `Extract project information from the provided text and return it as JSON. Include any of these fields if found:

Return a JSON object with two main sections: "equipment" and "logistics". Structure it like this:

{
  "equipment": {
    "projectName": "string",
    "companyName": "string", 
    "contactName": "string",
    "email": "string",
    "phone": "string",
    "projectAddress": "string (full address)",
    "scopeOfWork": "string (description of work to be done)"
  },
  "logistics": {
    "pieces": [{"description": "string", "quantity": number, "length": number, "width": number, "height": number, "weight": number}],
    "pickupAddress": "string",
    "pickupCity": "string", 
    "pickupState": "string",
    "pickupZip": "string",
    "deliveryAddress": "string",
    "deliveryCity": "string",
    "deliveryState": "string",
    "deliveryZip": "string",
    "truckType": "string (Flatbed, Flatbed with tarp, Conestoga)"
  }
}`


Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse and validate request
    const requestBody = await req.json()
    const { text, sessionId }: ExtractRequest = requestBody
    
    if (!text?.trim()) {
      throw new Error('Text is required and cannot be empty')
    }

    if (!sessionId?.trim()) {
      throw new Error('Session ID is required')
    }

    console.log('Processing extraction request:', { sessionId, textLength: text.length })

    // Get API key from environment variable
    const apiKey = Deno.env.get('OPENAI_API_KEY')
    if (!apiKey) {
      throw new Error('OpenAI API key not found. Please set OPENAI_API_KEY environment variable.')
    }

    // Validate decrypted API key format
    if (!apiKey.startsWith('sk-')) {
      throw new Error('Invalid API key format. Must start with sk-')
    }

    console.log('API key retrieved from environment successfully')

    // Prepare OpenAI request
    const openaiRequest: OpenAIRequest = {
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: text.trim() }
      ],
      temperature: 0.1,
      max_tokens: 1000,
    }

    // Call OpenAI API
    console.log('Calling OpenAI API...')
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(openaiRequest),
    })

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text()
      console.error('OpenAI API error:', openaiResponse.status, errorText)
      throw new Error(`OpenAI API error: ${openaiResponse.status} - ${errorText}`)
    }

    const openaiData = await openaiResponse.json()
    const extractedText = openaiData.choices?.[0]?.message?.content

    if (!extractedText) {
      throw new Error('No response content from OpenAI')
    }

    console.log('OpenAI response received:', extractedText.substring(0, 200) + '...')

    // Parse extracted JSON
    let extractedInfo
    try {
      extractedInfo = JSON.parse(extractedText)
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Raw response:', extractedText)
      throw new Error('Failed to parse extracted information as JSON')
    }

    // Extract equipment and logistics data from structured response
    const equipmentData = extractedInfo.equipment || {}
    const logisticsData = extractedInfo.logistics || {}

    console.log('Data categorized:', { 
      equipmentFields: Object.keys(equipmentData), 
      logisticsFields: Object.keys(logisticsData) 
    })

    // Store or update temporary data
    const { data: existingData } = await supabaseClient
      .from('temp_quote_data')
      .select('*')
      .eq('session_id', sessionId)
      .single()

    if (existingData) {
      // Update existing record
      const { error: updateError } = await supabaseClient
        .from('temp_quote_data')
        .update({
          equipment_data: { ...existingData.equipment_data, ...equipmentData },
          logistics_data: { ...existingData.logistics_data, ...logisticsData },
        })
        .eq('session_id', sessionId)

      if (updateError) {
        console.error('Update error:', updateError)
        throw new Error(`Failed to update temp data: ${updateError.message}`)
      }
      console.log('Updated existing temp data')
    } else {
      // Create new record
      const { error: insertError } = await supabaseClient
        .from('temp_quote_data')
        .insert({
          session_id: sessionId,
          equipment_data: equipmentData,
          logistics_data: logisticsData,
        })

      if (insertError) {
        console.error('Insert error:', insertError)
        throw new Error(`Failed to store temp data: ${insertError.message}`)
      }
      console.log('Created new temp data record')
    }

    // Return successful response
    const response = {
      success: true,
      equipmentData: Object.keys(equipmentData).length > 0 ? equipmentData : null,
      logisticsData: Object.keys(logisticsData).length > 0 ? logisticsData : null,
    }

    console.log('Extraction completed successfully')

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error in ai-extract-project:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
