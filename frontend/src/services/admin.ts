// Admin API service layer

export interface AdminTheme {
  id: string
  name: string
  slug: string
  github_url: string | null
  local_path: string
  is_builtin: boolean
  installed_ref: string | null
  latest_ref: string | null
  last_checked_at: string | null
  description: string | null
  preview_url: string | null
  created_at: string
  updated_at: string
}

export interface CatalogTheme {
  slug: string
  name: string
  repo: string
  installed: boolean
  installed_ref?: string | null
}

export interface VersionInfo {
  ref: string
  name: string
  published_at?: string | null
}

export interface AdminSession {
  id: string
  token_hash: string
  yaml_content: string
  theme_id: string | null
  expires_at: string
  created_at: string
  updated_at: string
  is_expired: boolean
}

export interface PaginatedSessions {
  items: AdminSession[]
  page: number
  per_page: number
  total_items: number
  total_pages: number
}

export interface DashboardStats {
  sessions: {
    active: number
    expiring_soon: number
  }
  themes: {
    total: number
    builtin: number
    runtime: number
  }
  system: {
    binary_version: string
    themes_storage_bytes: number
  }
}

export interface SystemHealth {
  status: 'ok' | 'degraded'
  db: string
  binary: string
}

export interface CheckUpdatesResult {
  installed_ref: string | null
  latest_ref: string | null
  update_available: boolean
}

async function adminFetch(path: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(`/api/admin${path}`, {
    credentials: 'same-origin',
    ...init,
  })
  return res
}

export async function adminLogin(username: string, password: string): Promise<void> {
  const res = await adminFetch('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `login failed: ${res.status}`)
  }
}

export async function adminLogout(): Promise<void> {
  await adminFetch('/logout', { method: 'POST' })
}

export async function getDashboard(): Promise<DashboardStats> {
  const res = await adminFetch('/dashboard')
  if (!res.ok) throw new Error(`dashboard: ${res.status}`)
  return res.json()
}

export async function getSystemHealth(): Promise<SystemHealth> {
  const res = await adminFetch('/system/health')
  if (!res.ok) throw new Error(`health: ${res.status}`)
  return res.json()
}

export async function listAdminThemes(): Promise<AdminTheme[]> {
  const res = await adminFetch('/themes')
  if (!res.ok) throw new Error(`list themes: ${res.status}`)
  return res.json()
}

export async function getCatalog(): Promise<CatalogTheme[]> {
  const res = await adminFetch('/catalog')
  if (!res.ok) throw new Error(`catalog: ${res.status}`)
  return res.json()
}

export async function getCatalogVersions(slug: string): Promise<VersionInfo[]> {
  const res = await adminFetch(`/catalog/${slug}/versions`)
  if (!res.ok) throw new Error(`versions: ${res.status}`)
  return res.json()
}

export async function installTheme(slug: string, ref: string): Promise<AdminTheme> {
  const res = await adminFetch('/themes/install', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug, ref }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `install: ${res.status}`)
  }
  return res.json()
}

export async function checkThemeUpdates(slug: string): Promise<CheckUpdatesResult> {
  const res = await adminFetch(`/themes/${slug}/check-updates`, { method: 'POST' })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `check-updates: ${res.status}`)
  }
  return res.json()
}

export async function deleteAdminTheme(slug: string): Promise<void> {
  const res = await adminFetch(`/themes/${slug}`, { method: 'DELETE' })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `delete theme: ${res.status}`)
  }
}

export async function listAdminSessions(params?: {
  page?: number
  per_page?: number
  q?: string
}): Promise<PaginatedSessions> {
  const qs = new URLSearchParams()
  if (params?.page) qs.set('page', String(params.page))
  if (params?.per_page) qs.set('per_page', String(params.per_page))
  if (params?.q) qs.set('q', params.q)
  const res = await adminFetch(`/sessions?${qs}`)
  if (!res.ok) throw new Error(`list sessions: ${res.status}`)
  return res.json()
}

export async function expireSession(id: string): Promise<void> {
  const res = await adminFetch(`/sessions/${id}/expire`, { method: 'POST' })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `expire: ${res.status}`)
  }
}

export async function deleteAdminSession(id: string): Promise<void> {
  const res = await adminFetch(`/sessions/${id}`, { method: 'DELETE' })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `delete session: ${res.status}`)
  }
}

export async function purgeExpiredSessions(): Promise<{ deleted_count: number }> {
  const res = await adminFetch('/sessions/purge', { method: 'POST' })
  if (!res.ok) throw new Error(`purge: ${res.status}`)
  return res.json()
}
