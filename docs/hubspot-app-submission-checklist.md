# HubSpot App Submission Checklist

Use this checklist to validate the Volt1.1 HubSpot integration before submitting your private app. Each item references the implementation in this repository so you can verify configuration quickly.

## 1. Scopes and API Access
- [ ] **crm.objects.contacts.read** – Required for Supabase Edge Functions that search and retrieve contact details via `/crm/v3/objects/contacts/search` and `/crm/v3/objects/contacts/{id}`. 【F:supabase/functions/hubspot-search/index.ts†L92-L198】【F:supabase/functions/hubspot-contact/index.ts†L74-L120】
- [ ] **crm.objects.contacts.write** – Needed for creating and updating contacts from the HubSpot AI chatbot flows and property sync routines. 【F:supabase/functions/hubspot-create/index.ts†L61-L109】【F:supabase/functions/hubspot-update/index.ts†L37-L95】
- [ ] **crm.objects.companies.read** – Enables lookup of associated companies when displaying contact results. 【F:supabase/functions/hubspot-search/index.ts†L170-L208】
- [ ] **crm.schemas.contacts.read** – Confirm access if the app reads contact metadata for property mapping (required by HubSpot for contact read/write apps).
- [ ] **oauth** – Private app token-based auth is used throughout the Supabase functions and webhook integrations; ensure the private app is issued with the above scopes. 【F:supabase/functions/hubspot-search/index.ts†L63-L78】

## 2. Supabase Logging & Data Storage
- [ ] Supabase URL and Service Role key configured so chat sessions persist through `supabaseAdmin`. 【F:server/services/supabaseClient.js†L1-L14】
- [ ] Chat sessions create and update records in `chat_sessions` and `chat_messages` tables for every WebSocket conversation. 【F:server/services/chatService.js†L5-L73】
- [ ] Review retention and PII handling policies for stored chat transcripts before submission.

## 3. Token-Based Authentication
- [ ] **Supabase Edge Functions** expect the Supabase anon key in the `Authorization` header from the frontend. 【F:src/services/hubspotService.ts†L61-L146】【F:src/components/HubSpotAIChatbot.tsx†L76-L106】
- [ ] **HubSpot Private App Token** is injected in Supabase Edge Functions via `HUBSPOT_PRIVATE_APP_TOKEN` environment variable. 【F:supabase/functions/hubspot-search/index.ts†L63-L90】【F:supabase/functions/hubspot-create/index.ts†L41-L78】
- [ ] **OpenAI API Key Management** uses encrypted storage handled by the Edge Function to unlock AI responses; confirm Supabase secrets are configured. 【F:supabase/functions/hubspot-chat-ai/index.ts†L104-L219】

## 4. UI Review Items
- [ ] Validate HubSpot AI Chatbot widget loads and handles contact selection in `App.tsx`. 【F:src/App.tsx†L101-L521】
- [ ] Confirm HubSpot Breeze chat launcher renders with a configured Portal ID and handles script loading gracefully. 【F:src/components/HubSpotBreeze.tsx†L1-L68】
- [ ] Test property editing workflows inside `ProjectDetails` to ensure updates reach HubSpot via `HubSpotService.updateContact`. 【F:src/components/ProjectDetails.tsx†L91-L175】【F:src/services/hubspotService.ts†L115-L146】
- [ ] Verify HubSpot CRM card extension UI copy and loading states in the Breeze CRM card extension. 【F:src/hubspot/extensions/breezeCrmCard/BreezeCrmCardApp.tsx†L100-L590】
- [ ] Check responsive behaviour of the quote workspace UI (forms, chat window, side panels) across desktop and tablet breakpoints.

## 5. QA Sign-off
- [ ] Document limitations encountered in automated tests (e.g., npm install blocked, missing hosted environment) in the release notes.
- [ ] Capture screenshots or recordings of the chat, property sync, and Supabase logging dashboards for HubSpot’s UI review package.
- [ ] Ensure rollback steps are documented if HubSpot revokes scopes or tokens post-approval.

