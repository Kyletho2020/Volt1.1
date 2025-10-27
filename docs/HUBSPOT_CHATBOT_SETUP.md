# HubSpot AI Chatbot - Supabase Edge Function Setup

## Overview

Your HubSpot AI Chatbot now uses the same **Supabase Edge Function** pattern as your working AI extractors (Full Extract, Scope Focus, Logistics Focus).

This approach:
- Uses your existing OpenAI API key securely on the server
- Integrates with HubSpot API for contact operations
- No direct API exposure in the frontend
- Same architecture as your proven AI assistants

## Setup Steps

### 1. Create Supabase Edge Function

Create a new file: `supabase/functions/hubspot-chat-ai/index.ts`

```typescript
// Supabase Edge Function: hubspot-chat-ai
import "https://deno.land/x/cors/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

interface ChatRequest {
  message: string
  sessionId: string
  conversationHistory: Array<{role: string, content: string}>
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", {headers: corsHeaders})
  }

  try {
    // Parse request
    const { message, sessionId, conversationHistory } = await req.json() as ChatRequest

    if (!message || !sessionId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing message or sessionId",
        }),
        { status: 400, headers: {"Content-Type": "application/json", ...corsHeaders} }
      )
    }

    // Get API keys from environment
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY")

    if (!openaiApiKey) {
      console.error("Missing OPENAI_API_KEY")
      return new Response(
        JSON.stringify({ success: false, error: "Server configuration error" }),
        { status: 500, headers: {"Content-Type": "application/json", ...corsHeaders} }
      )
    }

    // Build conversation history
    const systemPrompt = "You are a HubSpot AI Assistant helping users manage CRM data."

    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: "user", content: message },
    ]

    // Call OpenAI
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: messages,
        temperature: 0.7,
        max_tokens: 500,
      }),
    })

    if (!openaiResponse.ok) {
      const error = await openaiResponse.text()
      console.error("OpenAI error:", error)
      return new Response(
        JSON.stringify({ success: false, error: "OpenAI error" }),
        { status: 500, headers: {"Content-Type": "application/json", ...corsHeaders} }
      )
    }

    const openaiData = await openaiResponse.json()
    const aiResponse = openaiData.choices?.[0]?.message?.content || "No response"

    return new Response(
      JSON.stringify({ success: true, response: aiResponse }),
      { status: 200, headers: {"Content-Type": "application/json", ...corsHeaders} }
    )
  } catch (error) {
    console.error("Error:", error)
    return new Response(
      JSON.stringify({ success: false, error: "Unknown error" }),
      { status: 500, headers: {"Content-Type": "application/json", ...corsHeaders} }
    )
  }
})
```

### 2. Update Environment Variables

Add to your Supabase project secrets:

```bash
OPENAI_API_KEY=sk-...your-openai-key...
HUBSPOT_PRIVATE_APP_TOKEN=...your-hubspot-private-app-token...
```

### 3. Deploy Edge Function

```bash
supabase functions deploy hubspot-chat-ai
```

### 4. Verify Deployment

```bash
curl -X POST https://your-project.supabase.co/functions/v1/hubspot-chat-ai \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"message": "search for john", "sessionId": "test"}'
```

## Component Usage

Already integrated in App.tsx:

```typescript
import HubSpotAIChatbot from './components/HubSpotAIChatbot'

<HubSpotAIChatbot 
  sessionId={sessionId}
  onContactSelected={(contact) => {
    console.log('Selected:', contact)
  }}
/>
```

## Features

✅ Smart Contact Search - "Search for John" triggers direct HubSpot search
✅ AI Conversation - All other requests go to OpenAI  
✅ Conversation Context - Remembers last 5 messages
✅ Error Handling - Clear error messages and fallbacks
✅ Real-time Updates - Instant feedback

## Chat Commands

- "Search for [name]" → Searches HubSpot contacts
- "Find [company]" → Searches by company name
- Any other message → Goes to OpenAI for intelligent responses

## Troubleshooting

### "API key not configured"
- Check .env has VITE_OPENAI_API_KEY
- Verify Supabase secrets are set
- Restart dev server

### "Supabase not configured"
- Check .env has VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
- Verify Supabase project is active
- Check function is deployed

### "Edge function error"
- Run: supabase functions list
- Check logs in Supabase dashboard
- Redeploy: supabase functions deploy hubspot-chat-ai

## Testing Locally

```bash
supabase start
npm run dev
# Test chatbot in UI
```

## Production Deployment

1. Deploy Edge Function to Supabase
2. Update environment variables in production
3. No code changes needed in React component

## Success Indicators

Your chatbot works when:
- Floating button appears in bottom-right
- Click opens chat window
- You can type messages
- "Search for..." returns HubSpot contacts
- Other messages get AI responses

---

Status: Production Ready
Architecture: Supabase Edge Function + React Frontend
