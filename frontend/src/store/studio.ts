import { create } from 'zustand'
import { parseDocument } from 'yaml'
import {
  setASTField,
  appendASTListItem,
  removeASTListItem,
  moveASTListItem,
} from '@/lib/ast-patcher'

export interface ValidationError {
  field: string
  message: string
}

export type ViewLayout = 'code' | 'visual' | 'split'

interface StudioState {
  yamlContent: string
  selectedThemeId: string | null
  validationErrors: ValidationError[]
  previewUrl: string | null
  isGenerating: boolean
  isExporting: boolean
  generationId: number

  // No-Code state extension
  formData: any
  isYamlValid: boolean
  viewLayout: ViewLayout

  setYamlContent: (yaml: string) => void
  setSelectedThemeId: (id: string | null) => void
  setValidationErrors: (errors: ValidationError[]) => void
  setPreviewUrl: (url: string | null) => void
  setIsGenerating: (v: boolean) => void
  setIsExporting: (v: boolean) => void
  incrementGenerationId: () => void
  reset: () => void

  // No-Code actions
  setYamlFromCode: (yaml: string) => void
  setViewLayout: (layout: ViewLayout) => void
  updateFormField: (path: (string | number)[], value: any) => void
  appendFormListItem: (path: (string | number)[], item: any) => void
  removeFormListItem: (path: (string | number)[], index: number) => void
  moveFormListItem: (path: (string | number)[], sourceIndex: number, destinationIndex: number) => void
}

const initialState = {
  yamlContent: '',
  selectedThemeId: null,
  validationErrors: [],
  previewUrl: null,
  isGenerating: false,
  isExporting: false,
  generationId: 0,
  formData: {},
  isYamlValid: true,
  viewLayout: 'split' as ViewLayout,
}

// Get the initial view layout from sessionStorage if available
const getInitialViewLayout = (): ViewLayout => {
  if (typeof window !== 'undefined') {
    const saved = sessionStorage.getItem('studio_layout')
    if (saved === 'code' || saved === 'visual' || saved === 'split') {
      return saved
    }
  }
  return 'split'
}

export const useStudioStore = create<StudioState>((set, get) => ({
  ...initialState,
  viewLayout: getInitialViewLayout(),

  setYamlContent: (yaml) => {
    // Standard setYamlContent that also updates formData silently if valid
    set({ yamlContent: yaml })
    try {
      const doc = parseDocument(yaml)
      if (doc.errors.length === 0) {
        set({ formData: doc.toJS() || {}, isYamlValid: true })
      }
    } catch {
      // Ignore errors for standard background updates
    }
  },
  setSelectedThemeId: (id) => set({ selectedThemeId: id }),
  setValidationErrors: (errors) => set({ validationErrors: errors }),
  setPreviewUrl: (url) => set({ previewUrl: url }),
  setIsGenerating: (v) => set({ isGenerating: v }),
  setIsExporting: (v) => set({ isExporting: v }),
  incrementGenerationId: () => set((s) => ({ generationId: s.generationId + 1 })),
  reset: () => set({
    ...initialState,
    viewLayout: getInitialViewLayout(),
  }),

  // No-Code Actions implementation
  setYamlFromCode: (yaml) => {
    try {
      const doc = parseDocument(yaml)
      if (doc.errors.length === 0) {
        set({
          yamlContent: yaml,
          formData: doc.toJS() || {},
          isYamlValid: true,
        })
      } else {
        set({
          yamlContent: yaml,
          isYamlValid: false,
        })
      }
    } catch {
      set({
        yamlContent: yaml,
        isYamlValid: false,
      })
    }
  },

  setViewLayout: (layout) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('studio_layout', layout)
    }
    set({ viewLayout: layout })
  },

  updateFormField: (path, value) => {
    const { yamlContent } = get()
    try {
      const doc = parseDocument(yamlContent)
      setASTField(doc, path, value)
      const updatedYaml = doc.toString({ lineWidth: 0 })
      set({
        yamlContent: updatedYaml,
        formData: doc.toJS() || {},
        isYamlValid: true,
      })
    } catch (err) {
      console.error('Error patching AST field', err)
    }
  },

  appendFormListItem: (path, item) => {
    const { yamlContent } = get()
    try {
      const doc = parseDocument(yamlContent)
      appendASTListItem(doc, path, item)
      const updatedYaml = doc.toString({ lineWidth: 0 })
      set({
        yamlContent: updatedYaml,
        formData: doc.toJS() || {},
        isYamlValid: true,
      })
    } catch (err) {
      console.error('Error appending AST list item', err)
    }
  },

  removeFormListItem: (path, index) => {
    const { yamlContent } = get()
    try {
      const doc = parseDocument(yamlContent)
      removeASTListItem(doc, path, index)
      const updatedYaml = doc.toString({ lineWidth: 0 })
      set({
        yamlContent: updatedYaml,
        formData: doc.toJS() || {},
        isYamlValid: true,
      })
    } catch (err) {
      console.error('Error removing AST list item', err)
    }
  },

  moveFormListItem: (path, sourceIndex, destinationIndex) => {
    const { yamlContent } = get()
    try {
      const doc = parseDocument(yamlContent)
      moveASTListItem(doc, path, sourceIndex, destinationIndex)
      const updatedYaml = doc.toString({ lineWidth: 0 })
      set({
        yamlContent: updatedYaml,
        formData: doc.toJS() || {},
        isYamlValid: true,
      })
    } catch (err) {
      console.error('Error moving AST list item', err)
    }
  },
}))
