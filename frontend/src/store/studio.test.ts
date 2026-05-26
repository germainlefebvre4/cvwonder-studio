import { describe, it, expect, beforeEach } from 'vitest'
import { useStudioStore } from '@/store/studio'

describe('useStudioStore', () => {
  beforeEach(() => {
    useStudioStore.getState().reset()
  })

  it('starts with empty yaml and no errors', () => {
    const { yamlContent, validationErrors, previewUrl } = useStudioStore.getState()
    expect(yamlContent).toBe('')
    expect(validationErrors).toEqual([])
    expect(previewUrl).toBeNull()
  })

  it('setYamlContent updates yamlContent', () => {
    useStudioStore.getState().setYamlContent('name: Test')
    expect(useStudioStore.getState().yamlContent).toBe('name: Test')
  })

  it('setSelectedThemeId stores the theme id', () => {
    useStudioStore.getState().setSelectedThemeId('theme-123')
    expect(useStudioStore.getState().selectedThemeId).toBe('theme-123')
  })

  it('setValidationErrors stores errors', () => {
    const errors = [{ field: '/name', message: 'required' }]
    useStudioStore.getState().setValidationErrors(errors)
    expect(useStudioStore.getState().validationErrors).toEqual(errors)
  })

  it('setPreviewUrl stores the URL', () => {
    useStudioStore.getState().setPreviewUrl('/preview/session/index.html')
    expect(useStudioStore.getState().previewUrl).toBe('/preview/session/index.html')
  })

  it('incrementGenerationId increases the counter', () => {
    const before = useStudioStore.getState().generationId
    useStudioStore.getState().incrementGenerationId()
    expect(useStudioStore.getState().generationId).toBe(before + 1)
  })

  it('reset returns to initial state', () => {
    useStudioStore.getState().setYamlContent('something')
    useStudioStore.getState().setValidationErrors([{ field: 'x', message: 'err' }])
    useStudioStore.getState().incrementGenerationId()
    useStudioStore.getState().reset()
    const { yamlContent, validationErrors, generationId } = useStudioStore.getState()
    expect(yamlContent).toBe('')
    expect(validationErrors).toEqual([])
    expect(generationId).toBe(0)
  })
})
