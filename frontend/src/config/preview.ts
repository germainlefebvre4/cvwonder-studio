/**
 * Minimum interval in milliseconds between any two consecutive preview
 * generations, whether triggered automatically (yaml/theme change debounce)
 * or manually (force-refresh button). Both share the same cooldown counter.
 */
export const PREVIEW_DEBOUNCE_MS = 1_000

/**
 * Minimum duration in milliseconds for the loading animation to remain
 * visible, regardless of how fast the generation request completes.
 */
export const MIN_ANIMATION_MS = 1_000
