import { http, HttpResponse } from 'msw'

const SESSION_TOKEN = 'test-token'
const SESSION_ID = '00000000-0000-0000-0000-000000000001'
const THEME_ID = '00000000-0000-0000-0000-000000000010'

export const handlers = [
  // Create session
  http.post('/api/v1/sessions', () => {
    return HttpResponse.json({
      token: SESSION_TOKEN,
      session_id: SESSION_ID,
      expires_at: new Date(Date.now() + 3600_000).toISOString(),
    })
  }),

  // Get session by token
  http.get(`/api/v1/sessions/${SESSION_TOKEN}`, () => {
    return HttpResponse.json({
      session_id: SESSION_ID,
      yaml_content: 'firstname: John\nlastname: Doe',
      theme_id: null,
      expires_at: new Date(Date.now() + 3600_000).toISOString(),
    })
  }),

  // Update session
  http.patch(`/api/v1/sessions/${SESSION_TOKEN}`, () => {
    return HttpResponse.json({
      session_id: SESSION_ID,
      yaml_content: 'firstname: John\nlastname: Doe',
      theme_id: null,
      expires_at: new Date(Date.now() + 3600_000).toISOString(),
    })
  }),

  // Validate YAML
  http.post(`/api/v1/sessions/${SESSION_TOKEN}/validate`, () => {
    return HttpResponse.json({ valid: true, errors: [] })
  }),

  // Generate preview
  http.post(`/api/v1/sessions/${SESSION_TOKEN}/preview`, () => {
    return HttpResponse.json({ preview_url: `/preview/${SESSION_ID}/index.html` })
  }),

  // List themes
  http.get('/api/v1/themes', () => {
    return HttpResponse.json([
      { id: THEME_ID, name: 'Default', slug: 'default', github_url: null, is_builtin: true },
    ])
  }),

  // Current user (unauthenticated by default)
  http.get('/api/auth/me', () => {
    return new HttpResponse(null, { status: 401 })
  }),

  // User sessions list
  http.get('/api/sessions', () => {
    return HttpResponse.json({ sessions: [], total: 0, active: 0, max: 3 })
  }),
]
