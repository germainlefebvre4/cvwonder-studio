import { useEffect, useRef, useState, useCallback } from 'react'
import { useStudioStore } from '@/store/studio'
import { generatePreview } from '@/services/generation'
import { generateSessionPreview } from '@/services/user'
import { useDebounce } from './useDebounce'
import { PREVIEW_DEBOUNCE_MS, MIN_ANIMATION_MS } from '@/config/preview'

export function usePreview(token: string | null, sessionId: string | null) {
  const yamlContent = useStudioStore((s) => s.yamlContent)
  const selectedThemeId = useStudioStore((s) => s.selectedThemeId)
  const setPreviewUrl = useStudioStore((s) => s.setPreviewUrl)
  const setIsGenerating = useStudioStore((s) => s.setIsGenerating)
  const incrementGenerationId = useStudioStore((s) => s.incrementGenerationId)

  const debouncedYaml = useDebounce(yamlContent, PREVIEW_DEBOUNCE_MS)
  const debouncedTheme = useDebounce(selectedThemeId, PREVIEW_DEBOUNCE_MS)

  // Determine which identifier to use (token takes priority for backward compat)
  const identifier = token ?? sessionId
  const isUuidMode = !token && !!sessionId

  // Cooldown state shared between auto-refresh and force-refresh.
  const [isCoolingDown, setIsCoolingDown] = useState(false)
  const cooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Guard against concurrent in-flight requests.
  const inFlightRef = useRef(false)
  // Ensures the immediate first-generation fires only once per hook lifetime.
  const hasTriggeredInitialRef = useRef(false)

  /**
   * Fire a preview generation request.
   * @param showOverlay - When true, shows the logo animation during generation
   *   (used by the force-refresh button). Auto-refresh passes false to update
   *   silently in the background.
   * Returns a cancel callback that marks the result as stale.
   */
  const triggerGeneration = useCallback((currentIdentifier: string, isUuid: boolean, showOverlay: boolean): (() => void) => {
    if (inFlightRef.current) return () => {}

    let cancelled = false
    inFlightRef.current = true

    // Start shared cooldown - prevents force-refresh during this interval.
    setIsCoolingDown(true)
    if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current)
    cooldownTimerRef.current = setTimeout(() => setIsCoolingDown(false), PREVIEW_DEBOUNCE_MS)

    if (showOverlay) setIsGenerating(true)
    const startedAt = Date.now()
    
    // Call appropriate API based on mode
    const previewPromise = isUuid 
      ? generateSessionPreview(currentIdentifier)
      : generatePreview(currentIdentifier)
    
    previewPromise
      .then((result) => {
        if (cancelled) return
        setPreviewUrl(result.preview_url)
        incrementGenerationId()
      })
      .catch(() => {
        // Preview generation errors are non-critical; ignore silently.
      })
      .finally(() => {
        inFlightRef.current = false
        if (cancelled || !showOverlay) return
        const elapsed = Date.now() - startedAt
        const remaining = Math.max(0, MIN_ANIMATION_MS - elapsed)
        setTimeout(() => setIsGenerating(false), remaining)
      })

    return () => {
      cancelled = true
      // Allow the next trigger to proceed even if the network request is
      // still in-flight (its result will be discarded via `cancelled`).
      inFlightRef.current = false
    }
  }, [setPreviewUrl, setIsGenerating, incrementGenerationId])

  // Auto-refresh: fires after PREVIEW_DEBOUNCE_MS of inactivity on yaml/theme.
  useEffect(() => {
    if (!identifier || !debouncedYaml || !debouncedTheme) return
    const cancel = triggerGeneration(identifier, isUuidMode, false)
    return cancel
  }, [debouncedYaml, debouncedTheme, identifier, isUuidMode, triggerGeneration])

  // Immediate first-generation: fires once as soon as YAML + theme are both ready,
  // bypassing the debounce. Subsequent edits use the debounced path above.
  useEffect(() => {
    if (!identifier || !yamlContent || !selectedThemeId) return
    if (hasTriggeredInitialRef.current) return
    hasTriggeredInitialRef.current = true
    triggerGeneration(identifier, isUuidMode, true)
  }, [identifier, isUuidMode, yamlContent, selectedThemeId, triggerGeneration])

  // Force refresh: bypasses debounce, blocked during cooldown.
  const forceRefresh = useCallback(() => {
    if (!identifier || isCoolingDown) return
    triggerGeneration(identifier, isUuidMode, true)
  }, [identifier, isUuidMode, isCoolingDown, triggerGeneration])

  return { forceRefresh, isCoolingDown }
}
