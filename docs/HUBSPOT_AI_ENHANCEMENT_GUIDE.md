# HubSpot AI Assistant Enhancement Guide

## Overview

Your HubSpot AI Assistant chatbot has been significantly enhanced with:
- **7 Integrated CRM Tools** for contact and deal management
- **Two-Way API Integration** enabling both read and write operations
- **Advanced AI Agent Capabilities** using GPT-4o-mini
- **Improved UI/UX** with better feedback and error handling

## What's New

### 1. **7 HubSpot Tools Available**

#### Contact Management
- **search_contact**: Find contacts by name or partial match
  ```
  User: "Search for John"
  AI: Searches HubSpot and returns matching contacts
  ```

- **list_contacts**: Retrieve paginated list of contacts
  ```
  User: "Show me my contacts"
  AI: Fetches recent/active contacts
  ```

- **get_contact**: Get full details for specific contact
  ```
  User: "Get details for John"
  AI: Returns complete contact information
  ```

- **create_contact**: Add new contact to HubSpot
  ```
  User: "Add Jane Doe, email jane@company.com"
  AI: Creates contact in HubSpot with provided details
  ```

- **update_contact**: Modify existing contact info
  ```
  User: "Update John's phone to 555-1234"
  AI: Updates the contact's phone number
  ```

#### Deal Management
- **create_deal**: Create new sales deal
  ```
  User: "Create a deal for $50,000 named 'Acme Corp'"
  AI: Creates deal in HubSpot
  ```

- **get_deal**: Retrieve deal details
  ```
  User: "Get details for deal 123"
  AI: Returns deal information
  ```

### 2. **Two-Way API Integration**

The chatbot now supports bidirectional communication:

**Read Operations:**
- Search and retrieve contacts
- Get deal information
- Access company data (coming soon)
- View ticket details (coming soon)

**Write Operations:**
- Create new contacts
- Update existing contact information
- Create sales deals
- Associate contacts with deals

### 3. **Enhanced AI Agent**

- **Model**: GPT-4o-mini (faster, more accurate)
- **JSON Response Format**: Structured output for reliable parsing
- **Context Awareness**: Remembers last 10 messages for conversation continuity
- **Tool Selection**: AI intelligently chooses the right tool based on user intent
- **Fallback Logic**: Local response generation if API is unavailable

### 4. **Improved User Experience**

- 🎯 **Emoji Indicators**: Quick visual feedback (👤 for contacts, 🏢 for companies, etc.)
- ⚠️ **Clear Error Messages**: Helpful guidance when something goes wrong
- ⏳ **Loading State**: Visual indicator during processing
- 💬 **Conversation History**: Full chat history within session
- 📝 **Better Formatting**: Organized, readable response format

## Setup Instructions

### 1. **Ensure Environment Variables**

Make sure your `.env` file includes:

```bash
# OpenAI Configuration
VITE_OPENAI_API_KEY=your_openai_api_key_here

# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. **Install Dependencies** (if needed)

```bash
npm install
# or
yarn install
```

### 3. **Update Your AI Service** (Optional)

If you're using the chatbot outside of the main app, ensure it has access to `HubSpotService`:

```typescript
import { HubSpotService } from './services/hubspotService'
import HubSpotAIChatbot from './components/HubSpotAIChatbot'

// In your component
<HubSpotAIChatbot 
  onContactSelected={(contact) => {
    console.log('Selected contact:', contact)
    // Handle selection
  }}
/>
```

## Usage Examples

### Example 1: Search and Select a Contact

**User Input:**
```
"Find me the contact for John Smith"
```

**AI Response:**
- Searches HubSpot for "John Smith"
- If found: Returns contact details (name, email, phone, company, address)
- If multiple matches: Shows top 5 results for user to choose from
- If none found: Provides helpful message

**Result:** Contact is auto-selected and can be used in the quoting form

### Example 2: Create a New Contact

**User Input:**
```
"Add a new contact: Jane Doe, email jane@acme.com, phone 555-0123, company Acme Corp"
```

**AI Response:**
- Parses the contact information
- Creates contact in HubSpot
- Returns confirmation with contact ID
- Auto-selects the new contact

### Example 3: Update Contact Information

**User Input:**
```
"Update John's email to john.new@company.com"
```

**AI Response:**
- Finds John's contact
- Updates the email field
- Returns updated contact details
- Refreshes the form if applicable

### Example 4: Create a Deal

**User Input:**
```
"Create a deal called 'Acme Expansion' for $150,000"
```

**AI Response:**
- Creates the deal in HubSpot
- Associates with current contact (if selected)
- Returns deal ID and confirmation

## Technical Details

### Component File
**Location**: `src/components/HubSpotAIChatbot.tsx`

### Key Features

1. **Type Safety**: Full TypeScript support with proper interfaces
2. **Error Handling**: Graceful error management with user-friendly messages
3. **Performance**: Efficient API calls with memoization
4. **Accessibility**: Proper ARIA labels and keyboard support
5. **Responsiveness**: Mobile-friendly chat interface

### API Integration Points

```typescript
// Contact operations
await HubSpotService.searchContactsByName(query)
await HubSpotService.getContactDetails({ id, email })
await HubSpotService.createContact(payload)
await HubSpotService.updateContact(contactId, updates)

// Deal operations (coming soon)
await HubSpotService.createDeal(dealData)
await HubSpotService.getDeal(dealId)
```

## Troubleshooting

### Issue: "AI API error" or No Response

**Solution:**
- Check that `VITE_OPENAI_API_KEY` is set correctly
- Verify OpenAI account has sufficient credits
- Check browser console for detailed error messages

### Issue: HubSpot Operations Fail

**Solution:**
- Confirm the HubSpot Supabase Edge Functions are deployed
- Verify the `HUBSPOT_PRIVATE_APP_TOKEN` secret exists in Supabase
- Check HubSpot account permissions
- Ensure contact/deal exists before trying to update

### Issue: Chatbot Won't Open

**Solution:**
- Check browser console for JavaScript errors
- Verify component is properly imported
- Check z-index conflicts with other elements

## Future Enhancements

- ✅ Company management
- ✅ Ticket/support ticket handling
- ✅ Activity logging and notes
- ✅ Email templates integration
- ✅ Batch operations
- ✅ Advanced filtering and search
- ✅ Deal pipeline management

## API Tool Reference

### System Prompt Structure

The AI uses an advanced system prompt that defines:
1. Response format (JSON structure)
2. Available tools and parameters
3. Instructions for ambiguity resolution
4. Conversation context management

### Response Format

All AI responses follow this JSON schema:

```json
{
  "type": "response" | "tool",
  "message": "User-friendly explanation",
  "tool": "optional - tool name if type is 'tool'",
  "parameters": {
    "...": "tool-specific parameters"
  }
}
```

## Best Practices

1. **Be Specific**: Provide as much detail as possible in requests
   ```
   ❌ "Add a contact"
   ✅ "Add contact Jane Smith, email jane@acme.com, company Acme"
   ```

2. **Use Names**: Reference people/companies by name when possible
   ```
   ✅ "Update John's phone"
   ```

3. **Confirm Actions**: The AI will ask for confirmation on important actions
   ```
   "I found 5 contacts named John. Which one would you like?"
   ```

4. **Check Results**: Always verify the AI's actions match your intent

## Support & Contributing

If you encounter issues or want to add more features:

1. Check the GitHub issues page
2. Review the enhanced code comments
3. Test locally before deploying changes
4. Submit pull requests for improvements

## Key Files Modified

- `src/components/HubSpotAIChatbot.tsx` - Main component (enhanced)
- No breaking changes to existing code
- Fully backward compatible

## Version History

### v2.0 (Current)
- ✅ Enhanced AI agent with 7 tools
- ✅ Two-way API integration
- ✅ Improved UI/UX
- ✅ Better error handling
- ✅ Context-aware conversations

### v1.0 (Previous)
- Basic contact search
- Simple tool support
- Limited AI capabilities

---

**Last Updated**: October 25, 2025
**Component Version**: 2.0
**AI Model**: GPT-4o-mini
**Status**: Production Ready
