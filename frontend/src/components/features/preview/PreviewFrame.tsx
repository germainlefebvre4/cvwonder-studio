import { useStudioStore } from '@/store/studio'

function CvSkeleton() {
  return (
    <div className="h-full w-full p-8 overflow-hidden animate-pulse" aria-hidden="true">
      {/* Header - name + contact */}
      <div className="mb-6">
        <div className="h-7 w-48 rounded bg-[var(--color-surface-muted)] mb-2" />
        <div className="h-4 w-72 rounded bg-[var(--color-surface-muted)] opacity-60" />
      </div>
      <div className="h-px w-full bg-[var(--color-border)] mb-6" />
      {/* Two-column body */}
      <div className="flex gap-6">
        {/* Left column - sections */}
        <div className="flex-1 space-y-5">
          <div>
            <div className="h-4 w-24 rounded bg-[var(--color-surface-muted)] mb-3" />
            <div className="space-y-2">
              <div className="h-3 w-full rounded bg-[var(--color-surface-muted)] opacity-70" />
              <div className="h-3 w-5/6 rounded bg-[var(--color-surface-muted)] opacity-70" />
              <div className="h-3 w-4/6 rounded bg-[var(--color-surface-muted)] opacity-50" />
            </div>
          </div>
          <div>
            <div className="h-4 w-28 rounded bg-[var(--color-surface-muted)] mb-3" />
            <div className="space-y-2">
              <div className="h-3 w-full rounded bg-[var(--color-surface-muted)] opacity-70" />
              <div className="h-3 w-3/4 rounded bg-[var(--color-surface-muted)] opacity-70" />
              <div className="h-3 w-5/6 rounded bg-[var(--color-surface-muted)] opacity-50" />
              <div className="h-3 w-2/3 rounded bg-[var(--color-surface-muted)] opacity-40" />
            </div>
          </div>
          <div>
            <div className="h-4 w-20 rounded bg-[var(--color-surface-muted)] mb-3" />
            <div className="space-y-2">
              <div className="h-3 w-full rounded bg-[var(--color-surface-muted)] opacity-70" />
              <div className="h-3 w-4/5 rounded bg-[var(--color-surface-muted)] opacity-60" />
            </div>
          </div>
        </div>
        {/* Right column - skills/sidebar */}
        <div className="w-36 space-y-4">
          <div>
            <div className="h-4 w-16 rounded bg-[var(--color-surface-muted)] mb-3" />
            <div className="space-y-2">
              <div className="h-3 w-full rounded bg-[var(--color-surface-muted)] opacity-70" />
              <div className="h-3 w-4/5 rounded bg-[var(--color-surface-muted)] opacity-60" />
              <div className="h-3 w-3/4 rounded bg-[var(--color-surface-muted)] opacity-50" />
              <div className="h-3 w-full rounded bg-[var(--color-surface-muted)] opacity-70" />
              <div className="h-3 w-2/3 rounded bg-[var(--color-surface-muted)] opacity-50" />
            </div>
          </div>
          <div>
            <div className="h-4 w-20 rounded bg-[var(--color-surface-muted)] mb-3" />
            <div className="space-y-2">
              <div className="h-3 w-full rounded bg-[var(--color-surface-muted)] opacity-70" />
              <div className="h-3 w-3/5 rounded bg-[var(--color-surface-muted)] opacity-50" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

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
        <CvSkeleton />
      )}
    </div>
  )
}
