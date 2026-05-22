import { useStudioStore } from '@/store/studio'

export default function PreviewFrame() {
  const previewUrl = useStudioStore((s) => s.previewUrl)
  const isGenerating = useStudioStore((s) => s.isGenerating)
  const generationId = useStudioStore((s) => s.generationId)

  return (
    <div className="relative h-full w-full bg-[var(--color-surface-subtle)]">
      {isGenerating && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-[var(--color-surface-subtle)]/100">
          <picture>
            <source srcSet="/logo-white.svg" media="(prefers-color-scheme: dark)" />
            <img
              src="/logo.svg"
              alt="Generating preview…"
              width="50%"
              height="50%"
              style={{ margin: 'auto', animation: 'logo-pulse 1.5s ease-in-out infinite' }}
            />
          </picture>
        </div>
      )}
      {previewUrl ? (
        <iframe
          key={generationId}
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
