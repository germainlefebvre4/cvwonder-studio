import { create } from 'zustand'

export interface ValidationError {
  field: string
  message: string
}

interface StudioState {
  yamlContent: string
  selectedThemeId: string | null
  validationErrors: ValidationError[]
  previewUrl: string | null
  isGenerating: boolean
  isExporting: boolean
  generationId: number

  setYamlContent: (yaml: string) => void
  setSelectedThemeId: (id: string | null) => void
  setValidationErrors: (errors: ValidationError[]) => void
  setPreviewUrl: (url: string | null) => void
  setIsGenerating: (v: boolean) => void
  setIsExporting: (v: boolean) => void
  incrementGenerationId: () => void
  reset: () => void
}

const initialState = {
  yamlContent: '',
  selectedThemeId: null,
  validationErrors: [],
  previewUrl: null,
  isGenerating: false,
  isExporting: false,
  generationId: 0,
}

export const useStudioStore = create<StudioState>((set) => ({
  ...initialState,

  setYamlContent: (yaml) => set({ yamlContent: yaml }),
  setSelectedThemeId: (id) => set({ selectedThemeId: id }),
  setValidationErrors: (errors) => set({ validationErrors: errors }),
  setPreviewUrl: (url) => set({ previewUrl: url }),
  setIsGenerating: (v) => set({ isGenerating: v }),
  setIsExporting: (v) => set({ isExporting: v }),
  incrementGenerationId: () => set((s) => ({ generationId: s.generationId + 1 })),
  reset: () => set(initialState),
}))
