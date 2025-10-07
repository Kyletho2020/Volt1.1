const encoder = new TextEncoder()
const decoder = new TextDecoder()

async function getKey(): Promise<CryptoKey> {
  const keyB64 = import.meta.env.VITE_API_KEY_ENCRYPTION_KEY
  if (!keyB64) throw new Error('Encryption key is not configured')
  const rawKey = Uint8Array.from(atob(keyB64), c => c.charCodeAt(0))
  return crypto.subtle.importKey('raw', rawKey, 'AES-GCM', false, ['encrypt', 'decrypt'])
}

export async function encrypt(text: string): Promise<string> {
  const key = await getKey()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const cipherBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(text)
  )
  const cipherArray = new Uint8Array(cipherBuffer)
  const ivB64 = btoa(String.fromCharCode(...iv))
  const cipherB64 = btoa(String.fromCharCode(...cipherArray))
  return `${ivB64}:${cipherB64}`
}

export async function decrypt(payload: string): Promise<string> {
  const [ivB64, cipherB64] = payload.split(':')
  if (!ivB64 || !cipherB64) throw new Error('Invalid payload format')
  const iv = Uint8Array.from(atob(ivB64), c => c.charCodeAt(0))
  const cipher = Uint8Array.from(atob(cipherB64), c => c.charCodeAt(0))
  const key = await getKey()
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    cipher
  )
  return decoder.decode(decrypted)
}
