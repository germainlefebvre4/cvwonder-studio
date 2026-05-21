import { useEffect } from 'react'
import { useStudioStore } from '@/store/studio'
import { generatePreview } from '@/services/generation'
import { useDebounce } from './useDebounce'

const PREVIEW_DEBOUNCE_MS = 2000

export function usePreview(token: string | null) {
  const yamlContent = useStudioStore((s) => s.yamlContent)
  const selectedThemeId = useStudioStore((s) => s.selectedThemeId)
  const setPreviewUrl = useStudioStore((s) => s.setPreviewUrl)
  const setIsGenerating = useStudioStore((s) => s.setIsGenerating)

  const debouncedYaml = useDebounce(yamlContent, PREVIEW_DEBOUNCE_MS)
  const debouncedTheme = useDebounce(selectedThemeId, PREVIEW_DEBOUNCE_MS)

  useEffect(() => {
    if (!token || !debouncedYaml || !debouncedTheme) return

    let cancelled = false

    const run = async () => {
      setIsGenerating(true)
      try {
        const result = await generatePreview(token)
        if (!cancelled) {
          setPreviewUrl(result.preview_url)
        }
      } catch {
        // Preview generation errors are non-critical; ignore silently.
      } finally {
        if (!cancelled) setIsGenerating(false)
      }
    }

    run()
    return () => { cancelled = true }
  }, [debouncedYaml, debouncedTheme, token, setPreviewUrl, setIsGenerating])
}
