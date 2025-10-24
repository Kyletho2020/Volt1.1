import React, { useCallback, useEffect, useRef, useState } from 'react'
import { MessageCircle } from 'lucide-react'

const HUBSPOT_SCRIPT_ID = 'hubspot-chat-widget-loader'

type HubSpotConversationsWidget = {
  open: () => void
  close?: () => void
  load?: () => void
  status?: () => string
}

type HubSpotWindow = Window & {
  HubSpotConversations?: {
    widget?: HubSpotConversationsWidget
  }
  hsConversationsSettings?: Record<string, unknown>
  hsConversationsOnReady?: Array<() => void>
}

const HubSpotChatWidget: React.FC = () => {
  const portalId = import.meta.env.VITE_HUBSPOT_PORTAL_ID?.trim()
  const region = import.meta.env.VITE_HUBSPOT_REGION?.trim() || 'na1'
  const [isWidgetReady, setIsWidgetReady] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const pendingOpenRef = useRef(false)
  const loadCheckIntervalRef = useRef<number | null>(null)

  useEffect(() => {
    if (!portalId) {
      console.warn('HubSpot portal ID is not configured.')
      return
    }

    const hubspotWindow = window as HubSpotWindow
    const previousSettings = hubspotWindow.hsConversationsSettings
    hubspotWindow.hsConversationsSettings = {
      ...previousSettings,
      loadImmediately: false
    }

    const handleReady = () => {
      setIsWidgetReady(true)
      setIsLoading(false)
      if (loadCheckIntervalRef.current !== null) {
        window.clearInterval(loadCheckIntervalRef.current)
        loadCheckIntervalRef.current = null
      }

      if (pendingOpenRef.current) {
        pendingOpenRef.current = false
        hubspotWindow.HubSpotConversations?.widget?.open()
      }
    }

    const readyQueue = hubspotWindow.hsConversationsOnReady ?? []
    readyQueue.push(handleReady)
    hubspotWindow.hsConversationsOnReady = readyQueue

    if (hubspotWindow.HubSpotConversations?.widget) {
      handleReady()
    }

    let scriptElement = document.getElementById(HUBSPOT_SCRIPT_ID) as HTMLScriptElement | null
    let shouldRemoveScript = false

    if (scriptElement) {
      if (scriptElement.dataset.portalId !== portalId || scriptElement.dataset.region !== region) {
        scriptElement.remove()
        scriptElement = null
      }
    }

    if (!scriptElement) {
      scriptElement = document.createElement('script')
      scriptElement.id = HUBSPOT_SCRIPT_ID
      scriptElement.async = true
      scriptElement.defer = true
      scriptElement.dataset.portalId = portalId
      scriptElement.dataset.region = region
      scriptElement.src = `https://js-${region}.hs-scripts.com/${portalId}.js`
      document.body.appendChild(scriptElement)
      shouldRemoveScript = true
    }

    return () => {
      if (hubspotWindow.hsConversationsOnReady) {
        hubspotWindow.hsConversationsOnReady = hubspotWindow.hsConversationsOnReady.filter(
          callback => callback !== handleReady
        )
      }

      if (shouldRemoveScript && scriptElement) {
        scriptElement.remove()
        delete hubspotWindow.HubSpotConversations
      }

      if (previousSettings) {
        hubspotWindow.hsConversationsSettings = previousSettings
      } else {
        delete hubspotWindow.hsConversationsSettings
      }

      if (loadCheckIntervalRef.current !== null) {
        window.clearInterval(loadCheckIntervalRef.current)
        loadCheckIntervalRef.current = null
      }
    }
  }, [portalId, region])

  const handleOpenChat = useCallback(() => {
    if (!portalId) {
      return
    }

    const hubspotWindow = window as HubSpotWindow
    const widget = hubspotWindow.HubSpotConversations?.widget

    if (widget?.open) {
      widget.open()
      setIsWidgetReady(true)
      setIsLoading(false)
      pendingOpenRef.current = false
      return
    }

    pendingOpenRef.current = true
    setIsLoading(true)

    if (widget?.load) {
      widget.load()
    } else if (loadCheckIntervalRef.current === null) {
      loadCheckIntervalRef.current = window.setInterval(() => {
        const candidateWidget = (window as HubSpotWindow).HubSpotConversations?.widget
        if (candidateWidget?.load) {
          candidateWidget.load()
        }

        if (candidateWidget?.open) {
          const intervalId = loadCheckIntervalRef.current
          if (intervalId !== null) {
            window.clearInterval(intervalId)
            loadCheckIntervalRef.current = null
          }

          if (pendingOpenRef.current) {
            pendingOpenRef.current = false
            candidateWidget.open()
          }

          setIsWidgetReady(true)
          setIsLoading(false)
        }
      }, 400)
    }
  }, [portalId])

  if (!portalId) {
    return null
  }

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
      <button
        type="button"
        onClick={handleOpenChat}
        className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-black shadow-lg shadow-accent/30 transition hover:bg-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black/10 text-black">
          <MessageCircle className="h-4 w-4" />
        </span>
        {isLoading ? 'Connecting to Assistant…' : 'Chat with HubSpot Assistant'}
      </button>
      {!isWidgetReady && !isLoading ? (
        <span className="pointer-events-auto rounded-full bg-black/40 px-4 py-1 text-xs font-medium text-slate-200">
          Initializing HubSpot chat…
        </span>
      ) : null}
    </div>
  )
}

export default HubSpotChatWidget
