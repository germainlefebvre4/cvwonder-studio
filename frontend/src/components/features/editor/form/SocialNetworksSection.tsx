import { useStudioStore } from '@/store/studio'

export default function SocialNetworksSection() {
  const formData = useStudioStore((s) => s.formData)
  const isYamlValid = useStudioStore((s) => s.isYamlValid)
  const updateFormField = useStudioStore((s) => s.updateFormField)

  const socials = formData?.socialNetworks || {}

  const handleChange = (key: string, value: string) => {
    updateFormField(['socialNetworks', key], value)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5 col-span-2">
          <label className="text-xs font-semibold text-[var(--color-text-secondary)]">GitHub Username</label>
          <input
            type="text"
            className="w-full px-3 py-1.5 text-sm rounded border border-[var(--color-border)] bg-[var(--color-surface-default)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] disabled:opacity-50"
            value={socials.github ?? ''}
            onChange={(e) => handleChange('github', e.target.value)}
            disabled={!isYamlValid}
            placeholder="Ex: germainlefebvre4"
          />
        </div>

        <div className="flex flex-col gap-1.5 col-span-2">
          <label className="text-xs font-semibold text-[var(--color-text-secondary)]">LinkedIn Username</label>
          <input
            type="text"
            className="w-full px-3 py-1.5 text-sm rounded border border-[var(--color-border)] bg-[var(--color-surface-default)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] disabled:opacity-50"
            value={socials.linkedin ?? ''}
            onChange={(e) => handleChange('linkedin', e.target.value)}
            disabled={!isYamlValid}
            placeholder="Ex: germain-lefebvre"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[var(--color-text-secondary)]">Twitter Username</label>
          <input
            type="text"
            className="w-full px-3 py-1.5 text-sm rounded border border-[var(--color-border)] bg-[var(--color-surface-default)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] disabled:opacity-50"
            value={socials.twitter ?? ''}
            onChange={(e) => handleChange('twitter', e.target.value)}
            disabled={!isYamlValid}
            placeholder="Ex: germain_l"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[var(--color-text-secondary)]">Bluesky Username</label>
          <input
            type="text"
            className="w-full px-3 py-1.5 text-sm rounded border border-[var(--color-border)] bg-[var(--color-surface-default)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] disabled:opacity-50"
            value={socials.bluesky ?? ''}
            onChange={(e) => handleChange('bluesky', e.target.value)}
            disabled={!isYamlValid}
            placeholder="Ex: germain.bsky.social"
          />
        </div>

        <div className="flex flex-col gap-1.5 col-span-2">
          <label className="text-xs font-semibold text-[var(--color-text-secondary)]">StackOverflow User ID</label>
          <input
            type="text"
            className="w-full px-3 py-1.5 text-sm rounded border border-[var(--color-border)] bg-[var(--color-surface-default)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] disabled:opacity-50"
            value={socials.stackoverflow ?? ''}
            onChange={(e) => handleChange('stackoverflow', e.target.value)}
            disabled={!isYamlValid}
            placeholder="Ex: 1234567"
          />
        </div>
      </div>
    </div>
  )
}
