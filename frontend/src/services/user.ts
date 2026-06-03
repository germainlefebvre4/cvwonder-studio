export interface User {
  id: string
  email: string
  name: string
  avatar_url: string
  default_theme_id: string | null
  created_at: string
}

export interface UserSession {
  id: string
  name: string | null
  yaml_content: string | null
  theme_id: string | null
  expires_at: string
  is_archived: boolean
  archived_at: string | null
  has_share_token: boolean
  share_expires_at: string | null
  last_generated_at: string | null
  tags: string[]
  view_count: number
  last_viewed_at: string | null
}

export interface SessionListResponse {
  sessions: UserSession[]
  total: number
  active: number
  max: number
}

export async function getCurrentUser(): Promise<User | null> {
  const res = await fetch('/api/auth/me')
  if (res.status === 401) return null
  if (!res.ok) throw new Error(`getCurrentUser: ${res.status}`)
  return res.json()
}

export async function logout(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST' })
}

export async function deleteAccount(): Promise<void> {
  const res = await fetch('/api/auth/account', { method: 'DELETE' })
  if (!res.ok) throw new Error(`deleteAccount: ${res.status}`)
}

export async function exportAccount(): Promise<Blob> {
  const res = await fetch('/api/auth/account/export')
  if (!res.ok) throw new Error(`exportAccount: ${res.status}`)
  return res.blob()
}

export interface OwnedSession {
  id: string
  name: string | null
  yaml_content: string
  theme_id: string | null
  expires_at: string
  is_archived: boolean
  created_at: string
  updated_at: string
}

export async function getSessionById(id: string): Promise<OwnedSession | null> {
  const res = await fetch(`/api/sessions/${id}`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`getSessionById: ${res.status}`)
  return res.json()
}

export async function listSessions(archived = false): Promise<SessionListResponse> {
  const res = await fetch(`/api/sessions${archived ? '?archived=true' : ''}`)
  if (!res.ok) throw new Error(`listSessions: ${res.status}`)
  return res.json()
}

export async function renameSession(id: string, name: string): Promise<void> {
  const res = await fetch(`/api/sessions/${id}/name`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })
  if (!res.ok) throw new Error(`renameSession: ${res.status}`)
}

export async function archiveSession(id: string): Promise<void> {
  const res = await fetch(`/api/sessions/${id}/archive`, { method: 'POST' })
  if (!res.ok) throw new Error(`archiveSession: ${res.status}`)
}

export async function restoreSession(id: string): Promise<void> {
  const res = await fetch(`/api/sessions/${id}/restore`, { method: 'POST' })
  if (!res.ok) throw new Error(`restoreSession: ${res.status}`)
}

export async function duplicateSession(id: string): Promise<void> {
  const res = await fetch(`/api/sessions/${id}/duplicate`, { method: 'POST' })
  if (!res.ok) throw new Error(`duplicateSession: ${res.status}`)
}

export async function deleteSession(id: string): Promise<void> {
  const res = await fetch(`/api/sessions/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`deleteSession: ${res.status}`)
}

export async function createShare(id: string, duration?: '7d' | '30d' | null): Promise<{ token: string; share_url: string }> {
  const res = await fetch(`/api/sessions/${id}/share`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ duration: duration ?? null }),
  })
  if (!res.ok) throw new Error(`createShare: ${res.status}`)
  return res.json()
}

export async function revokeShare(id: string): Promise<void> {
  const res = await fetch(`/api/sessions/${id}/share`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`revokeShare: ${res.status}`)
}

export async function setSharePassword(id: string, password: string): Promise<void> {
  const res = await fetch(`/api/sessions/${id}/share/password`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })
  if (!res.ok) throw new Error(`setSharePassword: ${res.status}`)
}

export async function getSharedSession(
  id: string,
  token: string,
  password?: string,
): Promise<UserSession> {
  const headers: Record<string, string> = {}
  if (password) headers['X-Share-Password'] = password
  const res = await fetch(`/api/sessions/shared/${id}/${token}`, { headers })
  if (!res.ok) throw new Error(`getSharedSession: ${res.status}`)
  return res.json()
}

export async function exportSession(id: string): Promise<Blob> {
  const res = await fetch(`/api/sessions/${id}/export`)
  if (!res.ok) throw new Error(`exportSession: ${res.status}`)
  return res.blob()
}

export async function addTag(id: string, tag: string): Promise<void> {
  const res = await fetch(`/api/sessions/${id}/tags`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'add', tag }),
  })
  if (!res.ok) throw new Error(`addTag: ${res.status}`)
}

export async function removeTag(id: string, tag: string): Promise<void> {
  const res = await fetch(`/api/sessions/${id}/tags`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'remove', tag }),
  })
  if (!res.ok) throw new Error(`removeTag: ${res.status}`)
}

export async function getUserTags(): Promise<string[]> {
  const res = await fetch('/api/users/me/tags')
  if (!res.ok) throw new Error(`getUserTags: ${res.status}`)
  const data = await res.json()
  return data.tags ?? []
}

export async function updateDefaultTheme(themeId: string | null): Promise<void> {
  const res = await fetch('/api/users/me/default-theme', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ theme_id: themeId }),
  })
  if (!res.ok) throw new Error(`updateDefaultTheme: ${res.status}`)
}

// UUID-based session operations for authenticated users
export interface UpdateSessionContentRequest {
  yaml_content?: string
  theme_id?: string
}

export interface UpdateSessionContentResponse {
  id: string
  yaml_content: string
  theme_id: string | null
  updated_at: string
}

export async function updateSessionContent(
  id: string,
  updates: UpdateSessionContentRequest
): Promise<UpdateSessionContentResponse> {
  const res = await fetch(`/api/sessions/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  })
  if (!res.ok) throw new Error(`updateSessionContent: ${res.status}`)
  return res.json()
}

export interface GenerateSessionPreviewResponse {
  preview_url: string
}

export async function generateSessionPreview(id: string): Promise<GenerateSessionPreviewResponse> {
  const res = await fetch(`/api/sessions/${id}/preview`, {
    method: 'POST',
  })
  if (!res.ok) throw new Error(`generateSessionPreview: ${res.status}`)
  return res.json()
}

export interface ValidationError {
  field: string
  message: string
}

export interface ValidateSessionYamlResponse {
  valid: boolean
  errors: ValidationError[]
}

export async function validateSessionYaml(id: string): Promise<ValidateSessionYamlResponse> {
  const res = await fetch(`/api/sessions/${id}/validate`, {
    method: 'POST',
  })
  if (!res.ok) throw new Error(`validateSessionYaml: ${res.status}`)
  return res.json()
}

export interface ConfigLimits {
  max_sessions_per_user: number
  anon_session_ttl_hours: number
  anon_expiry_warn_1_hours: number
  anon_expiry_warn_2_hours: number
  session_creation_rate_limit_per_hour: number
  max_yaml_size_kb: number
  anon_generation_rate_limit_seconds: number
  connected_generation_rate_limit_seconds: number
  pdf_export_enabled: boolean
}

export async function getConfigLimits(): Promise<ConfigLimits> {
  const res = await fetch('/api/config/limits')
  if (!res.ok) throw new Error(`getConfigLimits: ${res.status}`)
  return res.json()
}
