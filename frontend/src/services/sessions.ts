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

export async function createSession(themeId?: string): Promise<CreateSessionResponse> {
  const res = await fetch('/api/v1/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(themeId ? { theme_id: themeId } : {}),
  })
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
