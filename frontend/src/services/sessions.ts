export interface Session {
  session_id: string
  yaml_content: string
  theme_id: string | null
  expires_at: string
}

export interface CreateSessionResponse {
  token: string
  session_id: string
  expires_at: string
}

export class RateLimitError extends Error {
  retryAfter: number
  constructor(retryAfter: number) {
    super(`Rate limited. Retry after ${retryAfter}s`)
    this.name = 'RateLimitError'
    this.retryAfter = retryAfter
  }
}

const FALLBACK_RETRY_AFTER = 1200 // 3 sessions/hour → 3600/3

export async function createSession(themeId?: string, templateId?: string): Promise<CreateSessionResponse> {
  const body: Record<string, string> = {}
  if (themeId) body.theme_id = themeId
  if (templateId) body.template_id = templateId
  const res = await fetch('/api/v1/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (res.status === 429) {
    const retryAfter = parseInt(res.headers.get('Retry-After') ?? '', 10)
    throw new RateLimitError(isNaN(retryAfter) ? FALLBACK_RETRY_AFTER : retryAfter)
  }
  if (!res.ok) throw new Error(`createSession: ${res.status}`)
  return res.json()
}

export async function getSession(token: string): Promise<Session | null> {
  const res = await fetch(`/api/v1/sessions/${token}`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`getSession: ${res.status}`)
  return res.json()
}

export async function updateSession(
  token: string,
  updates: { yaml_content?: string; theme_id?: string },
): Promise<Session> {
  const res = await fetch(`/api/v1/sessions/${token}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  })
  if (!res.ok) throw new Error(`updateSession: ${res.status}`)
  return res.json()
}
