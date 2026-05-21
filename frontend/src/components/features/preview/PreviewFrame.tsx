import { useStudioStore } from '@/store/studio'

export default function PreviewFrame() {
  const previewUrl = useStudioStore((s) => s.previewUrl)
  const isGenerating = useStudioStore((s) => s.isGenerating)

  return (
    <div className="relative h-full w-full bg-[var(--color-surface-subtle)]">
      {isGenerating && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-[var(--color-surface-subtle)]/80">
          <div className="text-sm text-[var(--color-text-muted)]">Generating preview…</div>
        </div>
      )}
      {previewUrl ? (
        <iframe
          key={previewUrl}
          src={previewUrl}
          sandbox="allow-same-origin allow-scripts"
          className="h-full w-full border-0"
          title="CV Preview"
        />
      ) : (
        <div className="flex h-full items-center justify-center text-[var(--color-text-muted)] text-sm">
          Preview will appear here after the first generation.
        </div>
      )}
    </div>
  )
}
