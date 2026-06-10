import { useStudioStore } from '@/store/studio'

export default function PersonalInfoSection() {
  const formData = useStudioStore((s) => s.formData)
  const isYamlValid = useStudioStore((s) => s.isYamlValid)
  const updateFormField = useStudioStore((s) => s.updateFormField)

  const person = formData?.person || {}

  const handleChange = (key: string, value: string | number) => {
    updateFormField(['person', key], value)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5 col-span-2">
          <label className="text-xs font-semibold text-[var(--color-text-secondary)]">Nom complet</label>
          <input
            type="text"
            className="w-full px-3 py-1.5 text-sm rounded border border-[var(--color-border)] bg-[var(--color-surface-default)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] disabled:opacity-50"
            value={person.name ?? ''}
            onChange={(e) => handleChange('name', e.target.value)}
            disabled={!isYamlValid}
            placeholder="Ex: Germain Lefebvre"
          />
        </div>

        <div className="flex flex-col gap-1.5 col-span-2">
          <label className="text-xs font-semibold text-[var(--color-text-secondary)]">Titre professionnel</label>
          <input
            type="text"
            className="w-full px-3 py-1.5 text-sm rounded border border-[var(--color-border)] bg-[var(--color-surface-default)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] disabled:opacity-50"
            value={person.profession ?? ''}
            onChange={(e) => handleChange('profession', e.target.value)}
            disabled={!isYamlValid}
            placeholder="Ex: Lead Engineer Go / React"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[var(--color-text-secondary)]">Email</label>
          <input
            type="email"
            className="w-full px-3 py-1.5 text-sm rounded border border-[var(--color-border)] bg-[var(--color-surface-default)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] disabled:opacity-50"
            value={person.email ?? ''}
            onChange={(e) => handleChange('email', e.target.value)}
            disabled={!isYamlValid}
            placeholder="Ex: contact@cvwonder.io"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[var(--color-text-secondary)]">Téléphone</label>
          <input
            type="text"
            className="w-full px-3 py-1.5 text-sm rounded border border-[var(--color-border)] bg-[var(--color-surface-default)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] disabled:opacity-50"
            value={person.phone ?? ''}
            onChange={(e) => handleChange('phone', e.target.value)}
            disabled={!isYamlValid}
            placeholder="Ex: +33 6 12 34 56 78"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[var(--color-text-secondary)]">Localisation</label>
          <input
            type="text"
            className="w-full px-3 py-1.5 text-sm rounded border border-[var(--color-border)] bg-[var(--color-surface-default)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] disabled:opacity-50"
            value={person.location ?? ''}
            onChange={(e) => handleChange('location', e.target.value)}
            disabled={!isYamlValid}
            placeholder="Ex: Paris, France"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[var(--color-text-secondary)]">Nationalité / Citoyenneté</label>
          <input
            type="text"
            className="w-full px-3 py-1.5 text-sm rounded border border border-[var(--color-border)] bg-[var(--color-surface-default)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] disabled:opacity-50"
            value={person.citizenship ?? ''}
            onChange={(e) => handleChange('citizenship', e.target.value)}
            disabled={!isYamlValid}
            placeholder="Ex: Française"
          />
        </div>

        <div className="flex flex-col gap-1.5 col-span-2">
          <label className="text-xs font-semibold text-[var(--color-text-secondary)]">Site Web Personnel</label>
          <input
            type="text"
            className="w-full px-3 py-1.5 text-sm rounded border border-[var(--color-border)] bg-[var(--color-surface-default)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] disabled:opacity-50"
            value={person.site ?? ''}
            onChange={(e) => handleChange('site', e.target.value)}
            disabled={!isYamlValid}
            placeholder="Ex: https://germainlefebvre.dev"
          />
        </div>

        <div className="flex flex-col gap-1.5 col-span-2">
          <label className="text-xs font-semibold text-[var(--color-text-secondary)]">URL Photo de Profil</label>
          <input
            type="text"
            className="w-full px-3 py-1.5 text-sm rounded border border-[var(--color-border)] bg-[var(--color-surface-default)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] disabled:opacity-50"
            value={person.depiction ?? ''}
            onChange={(e) => handleChange('depiction', e.target.value)}
            disabled={!isYamlValid}
            placeholder="Ex: https://avatars.githubusercontent.com/u/..."
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[var(--color-text-secondary)]">Années d'expérience</label>
          <input
            type="number"
            className="w-full px-3 py-1.5 text-sm rounded border border-[var(--color-border)] bg-[var(--color-surface-default)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] disabled:opacity-50"
            value={person.experience?.years ?? ''}
            onChange={(e) => handleChange('experience', { ...person.experience, years: parseInt(e.target.value) || 0 })}
            disabled={!isYamlValid}
            placeholder="Ex: 8"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[var(--color-text-secondary)]">Depuis l'année</label>
          <input
            type="number"
            className="w-full px-3 py-1.5 text-sm rounded border border-[var(--color-border)] bg-[var(--color-surface-default)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] disabled:opacity-50"
            value={person.experience?.since ?? ''}
            onChange={(e) => handleChange('experience', { ...person.experience, since: parseInt(e.target.value) || 0 })}
            disabled={!isYamlValid}
            placeholder="Ex: 2018"
          />
        </div>
      </div>
    </div>
  )
}
