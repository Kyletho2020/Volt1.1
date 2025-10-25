import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, Content-Type, Authorization, X-Client-Info, Apikey',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface ChatMessage {
  role: string
  content: string
}

interface ChatRequest {
  message: string
  sessionId: string
  conversationHistory?: ChatMessage[]
}

interface FunctionCall {
  name: string
  arguments: string
}

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant' | 'function'
  content: string | null
  function_call?: FunctionCall
  name?: string
}

const SYSTEM_PROMPT = `You are a helpful HubSpot AI Assistant embedded in a quote management application. You help users interact with their HubSpot CRM data.

Your capabilities:
1. Search for contacts by name
2. Get detailed contact information
3. Create new contacts
4. Update existing contacts
5. List companies associated with contacts

When users ask you to perform tasks, use the available functions to help them. Be conversational, friendly, and helpful. If a user asks about something you cannot do, politely explain your limitations.

Always format contact information clearly and ask for confirmation before creating or updating records.`

const AVAILABLE_FUNCTIONS = [
  {
    name: 'search_contacts',
    description: 'Search for contacts in HubSpot by name. Use partial matching to find contacts.',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'The name or partial name to search for',
        },
        partial: {
          type: 'boolean',
          description: 'Whether to use partial matching (default: true)',
          default: true,
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'get_contact_details',
    description: 'Get detailed information about a specific contact by ID or email',
    parameters: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'The HubSpot contact ID',
        },
        email: {
          type: 'string',
          description: 'The contact email address',
        },
      },
    },
  },
  {
    name: 'create_contact',
    description: 'Create a new contact in HubSpot',
    parameters: {
      type: 'object',
      properties: {
        firstName: {
          type: 'string',
          description: 'First name',
        },
        lastName: {
          type: 'string',
          description: 'Last name',
        },
        email: {
          type: 'string',
          description: 'Email address',
        },
        phone: {
          type: 'string',
          description: 'Phone number',
        },
        companyName: {
          type: 'string',
          description: 'Company name',
        },
      },
      required: ['email'],
    },
  },
  {
    name: 'update_contact',
    description: 'Update an existing contact in HubSpot',
    parameters: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'The HubSpot contact ID',
        },
        firstName: {
          type: 'string',
          description: 'First name',
        },
        lastName: {
          type: 'string',
          description: 'Last name',
        },
        email: {
          type: 'string',
          description: 'Email address',
        },
        phone: {
          type: 'string',
          description: 'Phone number',
        },
        companyName: {
          type: 'string',
          description: 'Company name',
        },
      },
      required: ['id'],
    },
  },
]

async function callHubSpotFunction(
  functionName: string,
  args: Record<string, unknown>,
  supabaseUrl: string,
  supabaseAnonKey: string
): Promise<string> {
  const functionMap: Record<string, string> = {
    search_contacts: 'hubspot-search',
    get_contact_details: 'hubspot-contact',
    create_contact: 'hubspot-create',
    update_contact: 'hubspot-update',
  }

  const edgeFunctionName = functionMap[functionName]
  if (!edgeFunctionName) {
    return JSON.stringify({ error: `Unknown function: ${functionName}` })
  }

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/${edgeFunctionName}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(args),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Network error')
      return JSON.stringify({ error: `HubSpot API error: ${errorText}` })
    }

    const result = await response.json()
    return JSON.stringify(result)
  } catch (error) {
    return JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' })
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

    const supabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey)

    const body: ChatRequest = await req.json()
    const { message, sessionId, conversationHistory = [] } = body

    if (!message?.trim()) {
      throw new Error('Message is required')
    }

    if (!sessionId?.trim()) {
      throw new Error('Session ID is required')
    }

    console.log('Processing chat request:', { sessionId, messageLength: message.length })

    const apiKey = Deno.env.get('OPENAI_API_KEY')
    if (!apiKey) {
      throw new Error('OpenAI API key not configured')
    }

    const messages: OpenAIMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...conversationHistory.slice(-5).map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      { role: 'user', content: message.trim() },
    ]

    let iterationCount = 0
    const MAX_ITERATIONS = 5

    while (iterationCount < MAX_ITERATIONS) {
      iterationCount++
      console.log(`Iteration ${iterationCount}: Calling OpenAI...`)

      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages,
          functions: AVAILABLE_FUNCTIONS,
          temperature: 0.7,
          max_tokens: 500,
        }),
      })

      if (!openaiResponse.ok) {
        const errorText = await openaiResponse.text()
        console.error('OpenAI API error:', openaiResponse.status, errorText)
        throw new Error(`OpenAI API error: ${openaiResponse.status}`)
      }

      const openaiData = await openaiResponse.json()
      const assistantMessage = openaiData.choices?.[0]?.message

      if (!assistantMessage) {
        throw new Error('No response from OpenAI')
      }

      if (assistantMessage.function_call) {
        const functionName = assistantMessage.function_call.name
        const functionArgs = JSON.parse(assistantMessage.function_call.arguments || '{}')

        console.log(`Calling function: ${functionName}`, functionArgs)

        messages.push({
          role: 'assistant',
          content: null,
          function_call: assistantMessage.function_call,
        })

        const functionResult = await callHubSpotFunction(
          functionName,
          functionArgs,
          supabaseUrl,
          supabaseAnonKey
        )

        console.log(`Function result:`, functionResult.substring(0, 200))

        messages.push({
          role: 'function',
          name: functionName,
          content: functionResult,
        })

        continue
      }

      const finalResponse = assistantMessage.content || 'No response generated'
      console.log('Chat completed successfully')

      return new Response(
        JSON.stringify({
          success: true,
          response: finalResponse,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Maximum iterations reached',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error in hubspot-chat-ai:', error)
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
