import { env } from '../env.js'
import { supabaseAdmin } from './supabaseClient.js'
import { decryptSecret, encryptSecret } from '../utils/encryption.js'

const CACHE_TTL_MS = 5 * 60 * 1000

class KeyManager {
  constructor() {
    this.cache = new Map()
    this.seededProviders = new Set()
  }

  cacheKey(provider, keyType) {
    return `${provider}:${keyType}`
  }

  async loadActiveKey(provider, keyType) {
    const { data, error } = await supabaseAdmin
      .from('integration_keys')
      .select('*')
      .eq('provider', provider)
      .eq('key_type', keyType)
      .eq('status', 'active')
      .order('version', { ascending: false })
      .limit(1)

    if (error) {
      throw new Error(`Failed to fetch active key for ${provider}: ${error.message}`)
    }

    return data?.[0]
  }

  getFallbackKey(provider) {
    if (provider === 'hubspot') {
      return env.HUBSPOT_FALLBACK_KEY || undefined
    }
    return undefined
  }

  async seedFromFallback(provider, keyType) {
    const cacheKey = this.cacheKey(provider, keyType)
    if (this.seededProviders.has(cacheKey)) {
      return
    }
    const fallback = this.getFallbackKey(provider)
    if (!fallback) {
      this.seededProviders.add(cacheKey)
      return
    }
    await this.rotateKey(provider, fallback, { source: 'env' }, keyType)
    this.seededProviders.add(cacheKey)
  }

  async getActiveKey(provider, keyType = 'api_key') {
    const cacheKey = this.cacheKey(provider, keyType)
    const cached = this.cache.get(cacheKey)
    const now = Date.now()
    if (cached && cached.expiresAt > now) {
      return cached.secret
    }

    await this.seedFromFallback(provider, keyType)

    const record = await this.loadActiveKey(provider, keyType)
    if (!record) {
      throw new Error(`No active key found for provider ${provider}`)
    }

    const secret = decryptSecret(record.encrypted_secret)
    this.cache.set(cacheKey, { secret, expiresAt: now + CACHE_TTL_MS })
    return secret
  }

  async rotateKey(provider, secret, metadata = {}, keyType = 'api_key') {
    const encrypted = encryptSecret(secret)

    const { data: current, error: currentError } = await supabaseAdmin
      .from('integration_keys')
      .select('id, version')
      .eq('provider', provider)
      .eq('key_type', keyType)
      .order('version', { ascending: false })
      .limit(1)

    if (currentError) {
      throw new Error(`Unable to look up existing key: ${currentError.message}`)
    }

    const nextVersion = current?.[0]?.version ? current[0].version + 1 : 1

    if (current?.[0]?.id) {
      const { error: updateError } = await supabaseAdmin
        .from('integration_keys')
        .update({ status: 'rotated', rotated_at: new Date().toISOString() })
        .eq('id', current[0].id)
      if (updateError) {
        throw new Error(`Unable to retire previous key: ${updateError.message}`)
      }
    }

    const { error: insertError } = await supabaseAdmin
      .from('integration_keys')
      .insert({
        provider,
        key_type: keyType,
        version: nextVersion,
        status: 'active',
        encrypted_secret: encrypted,
        metadata,
      })

    if (insertError) {
      throw new Error(`Unable to store new key: ${insertError.message}`)
    }

    this.cache.set(this.cacheKey(provider, keyType), {
      secret,
      expiresAt: Date.now() + CACHE_TTL_MS,
    })
  }
}

export const keyManager = new KeyManager()
