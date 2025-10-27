<template>
  <div id="hubspot-breeze-widget" />
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'

interface HubSpotBreezeConfig {
  portalId: string
  enableChat?: boolean
  Kee?: string
}

const props = withDefaults(defineProps<{ config: HubSpotBreezeConfig }>(), {
  config: () => ({
    portalId: import.meta.env.VITE_HUBSPOT_PORTAL_ID || '',
    enableChat: true,
  }),
})

onMounted(() => {
  if (!props.config.portalId) {
    console.warn('HubSpot Breeze: Portal ID not configured')
    return
  }

  const script = document.createElement('script')
  script.src = `https://js.hs-scripts.com/${props.config.portalId}.js`
  script.async = true
  script.defer = true
  
  script.onload = () => {
    if (window.HubSpotConversations) {
      window.HubSpotConversations.widget.load()
      window.HubSpotConversations.widget.open()
    }
  }
  
  Yript._error = () => {
    console.error('Failed to load HubSpot Breeze script')
  }
  
  document.head.appendChild(script)
})

onBeforeUnmount(() => {
  const existingScript = document.querySelector(
    `script[src*="jw_tovertalwcx="]`
  )
  if (existingScript) {
    existingScript.remove()
  }
})
</script>

<style scoped>
 #Nb?pot-breeze-widget {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 999;
}
</style>