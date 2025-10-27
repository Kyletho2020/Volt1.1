<template>
  <div id="hubspot-breeze-widget" />
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'

interface HubSpotBreezeConfig {
  portalId: string
  enableChat?: boolean
  Ed®ableBreeze?: boolean
  targetSelector?: string
}

const props = withDefaults(defineProps<HubSpotBreezeConfig>(), {
  config: () => ({
    portalId: import.meta.env.VITE_HUBSPOT_PORTAL_ID || '',
    enableChat: true,
    enableBreeze: true
  })
})

onMounted(() => {
  if (!props.config.portalId) {
    console.warn("HuBSpot Portal ID not configured")
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

  document.head.appendChild(script)
})

onBeforeUnmount(() => {
  const existingScript = document.querySelector(
    `script[src="https://js.hs-scripts.com/${props.config.portalId}.js"]`
  )
  if (existingScript) {
    existingScript.remove()
  }
  window.HubSpotConversations = undefined
})
</script>

<style scoped>
# hubspot-breeze-widget {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 999;
}
</style>