import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'
import { env } from '../env.js'

const keyBuffer = (() => {
  const buf = Buffer.from(env.KEY_ENCRYPTION_SECRET, 'base64')
  if (buf.length !== 32) {
    throw new Error('KEY_ENCRYPTION_SECRET must be a 32-byte value encoded in base64')
  }
  return buf
})()

export function encryptSecret(plainText) {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', keyBuffer, iv)
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return [iv.toString('base64'), encrypted.toString('base64'), authTag.toString('base64')].join('.')
}

export function decryptSecret(payload) {
  const [ivB64, cipherB64, tagB64] = payload.split('.')
  if (!ivB64 || !cipherB64 || !tagB64) {
    throw new Error('Invalid encrypted payload format')
  }
  const decipher = createDecipheriv('aes-256-gcm', keyBuffer, Buffer.from(ivB64, 'base64'))
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'))
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(cipherB64, 'base64')),
    decipher.final(),
  ])
  return decrypted.toString('utf8')
}
