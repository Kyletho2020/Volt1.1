import React, { useEffect, useRef } from 'react'

interface HubSpotBreezeConfig {
  portalId: string
  enableChat?: boolean
}

interface HubSpotBreezeProps {
  config?: HubSpotBreezeConfig
}

declare global {
  interface Window {
    HubSpotConversations?: {
      widget: {\n        load: () => void
        open: () => void
      }
    }
  }
}

const HubSpotBreeze: React.FC<HubSpotBreezeProps> = ({ 
  config = {
    portalId: import.meta.env.VITE_HUBSPOT_PORTAL_ID || '',
    enableChat: true
  }
}) => {
  const scriptRef = useRef<HTMLScriptElement | null>(null)

  useEffect(() => {
    if (!config.portalId) {
      console.warn('HubSpot Breeze: Portal ID not configured')
      return
    }

    // Create and append the HubSpot script
    const script = document.createElement('script')
    script.src = `https://js.hs-scripts.com/${config.portalId}.js`
    script.async = true
    script.defer = true
    scriptRef.current = script

    script.onload = () => {
      if (window.HubSpotConversations) {
        window.HubSpotConversations.widget.load()
      }
    }

    script.onerror = () => {
      console.error('Failed to load HubSpot Breeze script')
    }

    document.head.appendChild(script)

    return () => {
      // Cleanup
      if (scriptRef.current && scriptRef.current.parentElement) {
        scriptRef.current.parentElement.removeChild(scriptRef.current)
      }
    }
  }, [config.portalId])

  return <div id="hubspot-breeze-widget" style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 999 }} />
  }

export default HubSpotBreeze
