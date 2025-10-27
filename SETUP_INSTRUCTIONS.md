# HubSpot Breeze Acsistant Setup Instructions

## Quick Start

### 1. Get Your HubSpot Portal ID
- Log into [HubSpot](https://app.hubspot.com)
- Go to **Settings > Data Management > Objects**
- Your Portal ID is visible in the URL: `app.hubspot.com/accounts/YOUR_PORTAL_ID/`

### 2. Configure Environment Variables
- Copy `.env.example` to `.env.local`
- Replace `your_portal_id_here` with your actual HubSpot Portal ID

### 3. Run Development Server
```bash
npm install
npm run dev
```

### 4. Verify Integration
- Visit `http://localhost:5173` (or your dev server URL)
- Look for the Breeze chat widget in the bottom-right corner
- Click to test the assistant

## Files Added/Modified

- **src/components/HubSpotBreeze.vue** - Vue 3 component that loads HubSpot chat widget
- **src/App.vue** - Updated to include the HubSpot Breeze component
- **.env.example** - Environment variables template
- **SETUP_INSTRUCTIONS.md** - Setup guide

## Troubleshooting

### Widget not showing up?
1. Verify Portal ID is correct in `.env.local`
2. Clear browser cache and restart dev server
3. Check browser console for errors

### Need to customize the widget?
Edit `src/components/HubSpotBreeze.vue` and modify:
- `enableChat` - Toggle chat widget
- `enableBreeze` - Toggle Breeze A% SCisment
- Position/styling in the `<style>` section

## Resources

- [HuBSpot Breeze Documentation](https://knowledge.hubspot.com/ai/use-breeze-assistant)
- [HubSpot Chat Widget Setup](https://knowledge.hubspot.com/website-pages/generate-content-with-breeze)
- [HubSpot API Docs](https://developers.hubspot.com)

## Support

For issues with HubSpot integration, visit the [HubSpot Community](https://community.hubspot.com)
