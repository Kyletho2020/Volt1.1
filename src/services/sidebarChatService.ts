export type SendPromptPayload = {
  sessionId?: string | null
  message: string
  metadata?: Record<string, unknown>
  title?: string
}

export type ChatResponse = {
  sessionId: string
  reply: string
  usage?: unknown
}

export type CrmRecordStatus = 'pending' | 'synced' | 'failed'

export type CrmRecord = {
  id: string
  objectTypeId: string
  objectId?: string | null
  properties: Record<string, unknown>
  metadata: Record<string, unknown>
  status: CrmRecordStatus
  error: string | null
  createdAt: string
  updatedAt: string
}

export type CreateCrmRecordPayload = {
  objectTypeId: string
  objectId?: string | null
  properties: Record<string, unknown>
  metadata?: Record<string, unknown>
}

export type UpdateCrmRecordPayload = {
  objectId?: string | null
  properties?: Record<string, unknown>
  metadata?: Record<string, unknown>
}

type RawCrmRecord = {
  id?: string
  object_type_id?: string
  object_id?: string | null
  properties?: Record<string, unknown>
  metadata?: Record<string, unknown>
  status?: CrmRecordStatus
  error?: string | null
  created_at?: string
  updated_at?: string
}

const rawBaseUrl = import.meta.env.VITE_SERVICE_URL

const httpBase = (() => {
  if (typeof rawBaseUrl === 'string' && rawBaseUrl.length > 0) {
    try {
      const parsed = new URL(rawBaseUrl)
      const trimmedPath = parsed.pathname.replace(/\/$/, '')
      return `${parsed.origin}${trimmedPath}`
    } catch (error) {
      console.warn('Invalid VITE_SERVICE_URL provided, falling back to window origin.', error)
    }
  }
  if (typeof window !== 'undefined' && window.location) {
    return window.location.origin
  }
  return ''
})()

const wsBase = (() => {
  if (typeof rawBaseUrl === 'string' && rawBaseUrl.length > 0) {
    try {
      const parsed = new URL(rawBaseUrl)
      const protocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:'
      const trimmedPath = parsed.pathname.replace(/\/$/, '')
      return { protocol, host: parsed.host, pathPrefix: trimmedPath }
    } catch (error) {
      console.warn('Invalid VITE_SERVICE_URL provided for websocket fallback.', error)
    }
  }
  if (typeof window !== 'undefined' && window.location) {
    return {
      protocol: window.location.protocol === 'https:' ? 'wss:' : 'ws:',
      host: window.location.host,
      pathPrefix: '',
    }
  }
  return { protocol: 'ws:', host: 'localhost', pathPrefix: '' }
})()

function resolveUrl(path: string) {
  const cleanedPath = path.startsWith('/') ? path : `/${path}`
  if (!httpBase) {
    return cleanedPath
  }
  try {
    return new URL(cleanedPath, httpBase).toString()
  } catch (error) {
    console.warn('Failed to resolve service URL, falling back to string concatenation.', error)
    return `${httpBase}${cleanedPath}`
  }
}

function mapRecord(record: RawCrmRecord | null | undefined): CrmRecord {
  return {
    id: record?.id ?? '',
    objectTypeId: record?.object_type_id ?? '',
    objectId: record?.object_id ?? null,
    properties: record?.properties ?? {},
    metadata: record?.metadata ?? {},
    status: record?.status ?? 'pending',
    error: record?.error ?? null,
    createdAt: record?.created_at ?? new Date().toISOString(),
    updatedAt: record?.updated_at ?? new Date().toISOString(),
  }
}

async function handleJsonResponse(response: Response) {
  if (!response.ok) {
    const fallback = await response.text().catch(() => '')
    throw new Error(fallback || response.statusText)
  }
  return response.json()
}

export async function sendPromptRequest(payload: SendPromptPayload): Promise<ChatResponse> {
  const response = await fetch(resolveUrl('/api/chat/sessions'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: payload.sessionId ?? undefined,
      message: payload.message,
      metadata: payload.metadata ?? undefined,
      title: payload.title ?? undefined,
    }),
  })

  const data = await handleJsonResponse(response)
  return {
    sessionId: data?.sessionId ?? payload.sessionId ?? '',
    reply: data?.reply ?? '',
    usage: data?.usage,
  }
}

export function createChatSocket(sessionId?: string | null) {
  const params = new URLSearchParams()
  if (sessionId) {
    params.set('sessionId', sessionId)
  }

  const basePath = `${wsBase.pathPrefix ?? ''}/ws/chat`
  const query = params.toString()
  const suffix = query ? `?${query}` : ''
  const url = `${wsBase.protocol}//${wsBase.host}${basePath}${suffix}`

  return new WebSocket(url)
}

export async function createCrmRecord(payload: CreateCrmRecordPayload): Promise<CrmRecord> {
  const response = await fetch(resolveUrl('/api/crm/records'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const data = await handleJsonResponse(response)
  return mapRecord(data?.record ?? data)
}

export async function updateCrmRecord(
  id: string,
  payload: UpdateCrmRecordPayload
): Promise<CrmRecord> {
  const response = await fetch(resolveUrl(`/api/crm/records/${id}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const data = await handleJsonResponse(response)
  return mapRecord(data?.record ?? data)
}
