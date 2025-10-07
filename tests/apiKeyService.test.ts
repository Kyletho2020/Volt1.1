import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../src/lib/supabase', () => ({
  supabase: { from: vi.fn() }
}))

vi.mock('../src/lib/encryption', () => ({
  encrypt: vi.fn(async (t: string) => `enc-${t}`),
  decrypt: vi.fn(async (t: string) => t.replace('enc-', ''))
}))

import { ApiKeyService } from '../src/services/apiKeyService'
import { supabase } from '../src/lib/supabase'
import { encrypt, decrypt } from '../src/lib/encryption'

const fromMock = supabase.from as unknown as ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
})

describe('ApiKeyService', () => {
  it('retrieves and decrypts api key', async () => {
    const singleMock = vi.fn().mockResolvedValue({ data: { encrypted_key: 'enc-secret' }, error: null })
    const eqMock = vi.fn().mockReturnValue({ single: singleMock })
    const selectMock = vi.fn().mockReturnValue({ eq: eqMock })
    ;(fromMock as any).mockReturnValue({ select: selectMock })

    const key = await ApiKeyService.getApiKey()

    expect(decrypt).toHaveBeenCalledWith('enc-secret')
    expect(key).toBe('secret')
  })

  it('encrypts and saves api key', async () => {
    const upsertMock = vi.fn().mockResolvedValue({ error: null })
    ;(fromMock as any).mockReturnValue({ upsert: upsertMock })

    const result = await ApiKeyService.saveApiKey('secret')

    expect(encrypt).toHaveBeenCalledWith('secret')
    expect(upsertMock).toHaveBeenCalled()
    expect(result).toBe(true)
  })

  it('checks if api key exists', async () => {
    vi.spyOn(ApiKeyService, 'getApiKey').mockResolvedValue('abc')
    const result = await ApiKeyService.hasApiKey()
    expect(result).toBe(true)
  })
})
