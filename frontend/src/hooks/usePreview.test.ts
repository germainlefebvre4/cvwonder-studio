import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { usePreview } from '@/hooks/usePreview'
import { useStudioStore } from '@/store/studio'
import { server } from '@/mocks/server'

const TOKEN = 'test-token'
const PREVIEW_URL = '/preview/00000000-0000-0000-0000-000000000001/index.html'
// Preview debounce is 1s; give 4s headroom.
const HOOK_TIMEOUT = 4000

describe('usePreview', () => {
  beforeEach(() => {
    useStudioStore.getState().reset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it(
    'calls generatePreview and sets the preview URL',
    async () => {
      server.use(
        http.post(`/api/v1/sessions/${TOKEN}/preview`, () => {
          return HttpResponse.json({ preview_url: PREVIEW_URL })
        }),
      )

      // Both yaml and theme must be set to trigger the immediate first-generation.
      useStudioStore.getState().setYamlContent('firstname: Jane')
      useStudioStore.getState().setSelectedThemeId('theme-id-1')
      renderHook(() => usePreview(TOKEN))

      await waitFor(
        () => expect(useStudioStore.getState().previewUrl).toBe(PREVIEW_URL),
        { timeout: HOOK_TIMEOUT },
      )
    },
    HOOK_TIMEOUT + 1000,
  )

  it('does nothing when token is null', async () => {
    useStudioStore.getState().setYamlContent('firstname: Jane')
    renderHook(() => usePreview(null))

    // Wait past debounce — preview should not be set.
    await new Promise((r) => setTimeout(r, 1500))
    expect(useStudioStore.getState().previewUrl).toBeNull()
  }, 3000)
})
