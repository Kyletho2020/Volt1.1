# Quick Start: HubSpot AI Chatbot

## 1. Environment Setup

Add to your `.env` file:

```bash
# Required for AI capabilities
VITE_OPENAI_API_KEY=sk-...your-openai-key...

# Supabase auth
VITE_SUPABASE_URL=...your-supabase-url...
VITE_SUPABASE_ANON_KEY=...your-supabase-anon-key...
```

## 2. Component Usage

The HubSpot AI Chatbot is already integrated in your application. It appears as a floating button in the bottom-right corner.

### Basic Implementation:

```typescript
import HubSpotAIChatbot from './components/HubSpotAIChatbot'

function App() {
  const handleContactSelected = (contact: HubSpotContact) => {
    console.log('Contact selected:', contact)
    // Use contact in your form
  }

  return (
    <>
      {/* Your app content */}
      <HubSpotAIChatbot onContactSelected={handleContactSelected} />
    </>
  )
}
```

## 3. Common Commands to Try

### Search Contacts
- "Search for John Smith"
- "Find contacts in California"
- "Look for any contact with email john@company.com"

### Create Contact
- "Add new contact Jane Doe, email jane@acme.com"
- "Create contact with name Bob, phone 555-1234"

### Update Contact
- "Update John's email to new@email.com"
- "Change Jane's phone number to 555-5678"

### List Contacts
- "Show my recent contacts"
- "List all contacts"

### Create Deal
- "Create a deal named 'Acme Corp' for $50,000"
- "New deal: Smith Industries, amount $25,000"

## 4. Features

✅ **Intelligent Search** - Fuzzy matching for contact search  
✅ **Smart Creation** - AI helps extract info and create records  
✅ **Auto-linking** - Contacts auto-selected when found  
✅ **Error Recovery** - Graceful handling of API failures  
✅ **Context Aware** - Remembers previous interactions  
✅ **Mobile Friendly** - Works on all device sizes  

## 5. Troubleshooting

**Chatbot not appearing?**
- Check browser console for errors
- Verify component is imported in App.tsx
- Check z-index CSS conflicts

**AI not responding?**
- Verify VITE_OPENAI_API_KEY is correct
- Check OpenAI account has remaining credits
- Try local fallback mode (works without API key)

**HubSpot operations failing?**
- Make sure the Supabase Edge Functions are deployed
- Verify the `HUBSPOT_PRIVATE_APP_TOKEN` secret is configured in Supabase
- Check HubSpot account permissions
- Ensure contact/record exists before updating

## 6. Advanced Configuration

### Custom System Prompt
Edit the `getSystemPrompt()` function in HubSpotAIChatbot.tsx to customize AI behavior.

### Tool Parameters
Modify tool definitions to add/remove capabilities:
- search_contact
- list_contacts
- get_contact
- create_contact
- update_contact
- create_deal
- get_deal

### UI Styling
The chatbot uses Tailwind CSS classes. Customize colors and sizes in the component.

## 7. API Keys Guide

### Get OpenAI API Key
1. Visit https://platform.openai.com/api-keys
2. Create new secret key
3. Copy and paste into `.env`

### Configure HubSpot Private App Token
1. Go to HubSpot app settings
2. Navigate to "Integrations" → "Private apps"
3. Create or reuse the private app that powers your other assistants
4. Copy the access token and store it as `HUBSPOT_PRIVATE_APP_TOKEN` in your Supabase project secrets

## 8. Performance Tips

- First request may take 2-3 seconds (model warm-up)
- Subsequent requests are faster
- Tool results cached within same conversation
- Chat history limited to last 10 messages for performance

## 9. Security Best Practices

🔒 **Never commit `.env` file**  
🔒 **Use environment variables in production**  
🔒 **Rotate API keys regularly**  
🔒 **Use least-privilege scopes in HubSpot**  
🔒 **Monitor API usage and costs**  

## 10. Support

For issues or questions:
- Check HUBSPOT_AI_ENHANCEMENT_GUIDE.md for detailed docs
- Review component code comments
- Check browser console for error messages
- Test in incognito mode to rule out cache issues

---

**Last Updated**: October 25, 2025  
**Version**: 2.0  
**Status**: Production Ready ✅
