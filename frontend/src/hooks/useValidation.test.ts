import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { useValidation } from '@/hooks/useValidation'
import { useStudioStore } from '@/store/studio'
import { server } from '@/mocks/server'

const TOKEN = 'test-token'
// Validation debounce is 500ms; give enough headroom for fetch + store update.
const HOOK_TIMEOUT = 4000

describe('useValidation', () => {
  beforeEach(() => {
    useStudioStore.getState().reset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it(
    'calls server validate and clears errors when YAML is valid',
    async () => {
      server.use(
        http.post(`/api/v1/sessions/${TOKEN}/validate`, () => {
          return HttpResponse.json({ valid: true, errors: [] })
        }),
        http.get('/schemas/cvwonder.schema.json', () => new HttpResponse(null, { status: 404 })),
      )

      useStudioStore.getState().setValidationErrors([{ field: '/x', message: 'old' }])
      useStudioStore.getState().setYamlContent('firstname: John')
      renderHook(() => useValidation(TOKEN))

      await waitFor(
        () => expect(useStudioStore.getState().validationErrors).toEqual([]),
        { timeout: HOOK_TIMEOUT },
      )
    },
    HOOK_TIMEOUT + 1000,
  )

  it(
    'stores validation errors returned by the server',
    async () => {
      server.use(
        http.post(`/api/v1/sessions/${TOKEN}/validate`, () => {
          return HttpResponse.json({
            valid: false,
            errors: [{ field: '/firstname', message: 'required' }],
          })
        }),
        http.get('/schemas/cvwonder.schema.json', () => new HttpResponse(null, { status: 404 })),
      )

      useStudioStore.getState().setYamlContent('bad: yaml')
      renderHook(() => useValidation(TOKEN))

      await waitFor(
        () =>
          expect(useStudioStore.getState().validationErrors).toEqual([
            { field: '/firstname', message: 'required' },
          ]),
        { timeout: HOOK_TIMEOUT },
      )
    },
    HOOK_TIMEOUT + 1000,
  )

  it('does nothing when token is null', async () => {
    useStudioStore.getState().setYamlContent('name: x')
    renderHook(() => useValidation(null))

    // Wait a little longer than debounce to confirm nothing happens.
    await new Promise((r) => setTimeout(r, 700))
    expect(useStudioStore.getState().validationErrors).toEqual([])
  }, 2000)
})
