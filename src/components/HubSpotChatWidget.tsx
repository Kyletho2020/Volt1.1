import { useEffect } from 'react';

const HUBSPOT_SCRIPT_ID = 'hubspot-chat-widget-loader';

type HubSpotWindow = typeof window & {
  HubSpotConversations?: unknown;
  hsConversationsSettings?: unknown;
};

const HubSpotChatWidget: React.FC = () => {
  useEffect(() => {
    const portalId = import.meta.env.VITE_HUBSPOT_PORTAL_ID?.trim();

    if (!portalId) {
      console.warn('HubSpot portal ID is not configured.');
      return;
    }

    const region = import.meta.env.VITE_HUBSPOT_REGION?.trim() || 'na1';
    const existingScript = document.getElementById(HUBSPOT_SCRIPT_ID) as HTMLScriptElement | null;

    if (existingScript) {
      if (existingScript.dataset.portalId !== portalId || existingScript.dataset.region !== region) {
        existingScript.remove();
      } else {
        return;
      }
    }

    const script = document.createElement('script');
    script.id = HUBSPOT_SCRIPT_ID;
    script.async = true;
    script.defer = true;
    script.dataset.portalId = portalId;
    script.dataset.region = region;
    script.src = `https://js-${region}.hs-scripts.com/${portalId}.js`;

    document.body.appendChild(script);

    return () => {
      script.remove();
      const hubspotWindow = window as HubSpotWindow;
      delete hubspotWindow.HubSpotConversations;
      delete hubspotWindow.hsConversationsSettings;
    };
  }, []);

  return null;
};

export default HubSpotChatWidget;
