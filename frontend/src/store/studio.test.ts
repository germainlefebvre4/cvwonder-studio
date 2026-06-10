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

  describe('No-Code Store Actions', () => {
    it('setYamlFromCode parses valid YAML and sets isYamlValid to true', () => {
      useStudioStore.getState().setYamlFromCode('person:\n  name: Germain')
      const state = useStudioStore.getState()
      expect(state.yamlContent).toBe('person:\n  name: Germain')
      expect(state.formData).toEqual({ person: { name: 'Germain' } })
      expect(state.isYamlValid).toBe(true)
    })

    it('setYamlFromCode flags isYamlValid to false on invalid YAML but retains text', () => {
      useStudioStore.getState().setYamlFromCode('person:\n  name: Germain\n  broken-yaml-line: : :')
      const state = useStudioStore.getState()
      expect(state.yamlContent).toBe('person:\n  name: Germain\n  broken-yaml-line: : :')
      expect(state.isYamlValid).toBe(false)
    })

    it('setViewLayout changes viewLayout and stores in sessionStorage', () => {
      useStudioStore.getState().setViewLayout('visual')
      expect(useStudioStore.getState().viewLayout).toBe('visual')
      expect(sessionStorage.getItem('studio_layout')).toBe('visual')
    })

    it('updateFormField modifies AST and updates yamlContent and formData', () => {
      useStudioStore.getState().setYamlFromCode('person:\n  name: Germain')
      useStudioStore.getState().updateFormField(['person', 'name'], 'Germain Lefebvre')
      const state = useStudioStore.getState()
      expect(state.yamlContent).toContain('name: Germain Lefebvre')
      expect(state.formData.person.name).toBe('Germain Lefebvre')
    })

    it('appendFormListItem, removeFormListItem, and moveFormListItem operate on lists', () => {
      useStudioStore.getState().setYamlFromCode('career:\n  - companyName: Company A\n  - companyName: Company B')
      
      // Append
      useStudioStore.getState().appendFormListItem(['career'], { companyName: 'Company C' })
      expect(useStudioStore.getState().formData.career.length).toBe(3)
      expect(useStudioStore.getState().formData.career[2].companyName).toBe('Company C')

      // Move
      useStudioStore.getState().moveFormListItem(['career'], 2, 0) // move C to start
      expect(useStudioStore.getState().formData.career[0].companyName).toBe('Company C')

      // Remove
      useStudioStore.getState().removeFormListItem(['career'], 1) // remove Company A (now at index 1)
      expect(useStudioStore.getState().formData.career.length).toBe(2)
      expect(useStudioStore.getState().formData.career.map((c: any) => c.companyName)).toEqual(['Company C', 'Company B'])
    })
  })
})
