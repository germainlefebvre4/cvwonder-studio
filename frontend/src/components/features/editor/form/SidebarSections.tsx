import { useStudioStore } from '@/store/studio'
import { Button } from '@/components/ui/Button'

// ── LANGUES ─────────────────────────────────────────────────────────────────
export function LanguagesSection() {
  const formData = useStudioStore((s) => s.formData)
  const isYamlValid = useStudioStore((s) => s.isYamlValid)
  const updateFormField = useStudioStore((s) => s.updateFormField)
  const appendFormListItem = useStudioStore((s) => s.appendFormListItem)
  const removeFormListItem = useStudioStore((s) => s.removeFormListItem)

  const languages = formData?.languages || []

  const handleLangChange = (index: number, key: string, value: string) => {
    updateFormField(['languages', index, key], value)
  }

  const handleAddLang = () => {
    appendFormListItem(['languages'], { name: 'Nouvelle langue', level: 'Ex: C2 / Courant' })
  }

  return (
    <div className="space-y-4">
      {languages.map((l: any, idx: number) => (
        <div key={idx} className="flex gap-3 items-center bg-[var(--color-surface-default)] border border-[var(--color-border)] rounded p-2.5">
          <div className="flex-1">
            <input
              type="text"
              className="w-full px-2 py-1 text-xs rounded border border-[var(--color-border)] bg-[var(--color-surface-default)] text-[var(--color-text-primary)] font-semibold focus:outline-none focus:border-[var(--color-accent)] disabled:opacity-50"
              value={l.name ?? ''}
              onChange={(e) => handleLangChange(idx, 'name', e.target.value)}
              disabled={!isYamlValid}
              placeholder="Ex: Anglais"
            />
          </div>
          <div className="flex-1">
            <input
              type="text"
              className="w-full px-2 py-1 text-xs rounded border border-[var(--color-border)] bg-[var(--color-surface-default)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] disabled:opacity-50"
              value={l.level ?? ''}
              onChange={(e) => handleLangChange(idx, 'level', e.target.value)}
              disabled={!isYamlValid}
              placeholder="Ex: B2 - Intermédiaire"
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-[var(--color-destructive)] hover:bg-[var(--red-2)] border-none scale-90 p-1 shrink-0"
            onClick={() => removeFormListItem(['languages'], idx)}
            disabled={!isYamlValid}
          >
            ❌
          </Button>
        </div>
      ))}
      <Button
        variant="secondary"
        size="sm"
        onClick={handleAddLang}
        disabled={!isYamlValid}
        className="w-full text-xs py-1"
      >
        ➕ Ajouter une langue
      </Button>
    </div>
  )
}

// ── EDUCATION ────────────────────────────────────────────────────────────────
export function EducationSection() {
  const formData = useStudioStore((s) => s.formData)
  const isYamlValid = useStudioStore((s) => s.isYamlValid)
  const updateFormField = useStudioStore((s) => s.updateFormField)
  const appendFormListItem = useStudioStore((s) => s.appendFormListItem)
  const removeFormListItem = useStudioStore((s) => s.removeFormListItem)

  const education = formData?.education || []

  const handleChange = (index: number, key: string, value: string) => {
    updateFormField(['education', index, key], value)
  }

  const handleAddEdu = () => {
    appendFormListItem(['education'], {
      schoolName: 'Université / École',
      degree: 'Diplôme obtenu',
      dates: 'Dates',
      location: ''
    })
  }

  return (
    <div className="space-y-4">
      {education.map((e: any, idx: number) => (
        <div key={idx} className="border border-[var(--color-border)] rounded p-3 bg-[var(--color-surface-default)] space-y-3 relative">
          <div className="flex justify-between items-center pb-1 border-b border-[var(--color-border)]">
            <span className="text-xs font-bold text-[var(--color-text-primary)]">Formation #{idx + 1}</span>
            <Button
              variant="ghost"
              size="sm"
              className="text-[var(--color-destructive)] hover:bg-[var(--red-2)] border-none scale-90 py-0.5 px-1 shrink-0"
              onClick={() => removeFormListItem(['education'], idx)}
              disabled={!isYamlValid}
            >
              ❌
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1 col-span-2">
              <label className="text-[10px] font-semibold text-[var(--color-text-secondary)]">Nom de l'établissement</label>
              <input
                type="text"
                className="w-full px-2 py-1 text-xs rounded border border-[var(--color-border)] bg-[var(--color-surface-default)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] disabled:opacity-50"
                value={e.schoolName ?? ''}
                onChange={(v) => handleChange(idx, 'schoolName', v.target.value)}
                disabled={!isYamlValid}
              />
            </div>
            <div className="flex flex-col gap-1 col-span-2">
              <label className="text-[10px] font-semibold text-[var(--color-text-secondary)]">Diplôme / Spécialité</label>
              <input
                type="text"
                className="w-full px-2 py-1 text-xs rounded border border-[var(--color-border)] bg-[var(--color-surface-default)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] disabled:opacity-50"
                value={e.degree ?? ''}
                onChange={(v) => handleChange(idx, 'degree', v.target.value)}
                disabled={!isYamlValid}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-[var(--color-text-secondary)]">Période d'études</label>
              <input
                type="text"
                className="w-full px-2 py-1 text-xs rounded border border-[var(--color-border)] bg-[var(--color-surface-default)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] disabled:opacity-50"
                value={e.dates ?? ''}
                onChange={(v) => handleChange(idx, 'dates', v.target.value)}
                disabled={!isYamlValid}
                placeholder="Ex: 2015 - 2018"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-[var(--color-text-secondary)]">Lieu d'études</label>
              <input
                type="text"
                className="w-full px-2 py-1 text-xs rounded border border-[var(--color-border)] bg-[var(--color-surface-default)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] disabled:opacity-50"
                value={e.location ?? ''}
                onChange={(v) => handleChange(idx, 'location', v.target.value)}
                disabled={!isYamlValid}
                placeholder="Ex: Lyon, France"
              />
            </div>
          </div>
        </div>
      ))}
      <Button
        variant="secondary"
        size="sm"
        onClick={handleAddEdu}
        disabled={!isYamlValid}
        className="w-full text-xs py-1"
      >
        ➕ Ajouter une formation
      </Button>
    </div>
  )
}

// ── PROJETS PARALÈLLES ────────────────────────────────────────────────────────
export function SideProjectsSection() {
  const formData = useStudioStore((s) => s.formData)
  const isYamlValid = useStudioStore((s) => s.isYamlValid)
  const updateFormField = useStudioStore((s) => s.updateFormField)
  const appendFormListItem = useStudioStore((s) => s.appendFormListItem)
  const removeFormListItem = useStudioStore((s) => s.removeFormListItem)

  const sideProjects = formData?.sideProjects || []

  const handleChange = (index: number, key: string, value: string) => {
    updateFormField(['sideProjects', index, key], value)
  }

  const handleAddProj = () => {
    appendFormListItem(['sideProjects'], {
      name: 'Nouveau projet personnel',
      position: 'Créateur',
      description: 'Description du projet...',
      link: ''
    })
  }

  return (
    <div className="space-y-4">
      {sideProjects.map((p: any, idx: number) => (
        <div key={idx} className="border border-[var(--color-border)] rounded p-3 bg-[var(--color-surface-default)] space-y-3 relative">
          <div className="flex justify-between items-center pb-1 border-b border-[var(--color-border)]">
            <span className="text-xs font-bold text-[var(--color-text-primary)]">Projet #{idx + 1} : {p.name}</span>
            <Button
              variant="ghost"
              size="sm"
              className="text-[var(--color-destructive)] hover:bg-[var(--red-2)] border-none scale-90 py-0.5 px-1 shrink-0"
              onClick={() => removeFormListItem(['sideProjects'], idx)}
              disabled={!isYamlValid}
            >
              ❌
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-[var(--color-text-secondary)]">Nom du projet</label>
              <input
                type="text"
                className="w-full px-2 py-1 text-xs rounded border border-[var(--color-border)] bg-[var(--color-surface-default)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] disabled:opacity-50"
                value={p.name ?? ''}
                onChange={(v) => handleChange(idx, 'name', v.target.value)}
                disabled={!isYamlValid}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-[var(--color-text-secondary)]">Votre rôle</label>
              <input
                type="text"
                className="w-full px-2 py-1 text-xs rounded border border-[var(--color-border)] bg-[var(--color-surface-default)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] disabled:opacity-50"
                value={p.position ?? ''}
                onChange={(v) => handleChange(idx, 'position', v.target.value)}
                disabled={!isYamlValid}
                placeholder="Ex: Auteur / Maintainer"
              />
            </div>
            <div className="flex flex-col gap-1 col-span-2">
              <label className="text-[10px] font-semibold text-[var(--color-text-secondary)]">Lien du projet</label>
              <input
                type="text"
                className="w-full px-2 py-1 text-xs rounded border border-[var(--color-border)] bg-[var(--color-surface-default)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] disabled:opacity-50"
                value={p.link ?? ''}
                onChange={(v) => handleChange(idx, 'link', v.target.value)}
                disabled={!isYamlValid}
                placeholder="Ex: https://github.com/..."
              />
            </div>
            <div className="flex flex-col gap-1 col-span-2">
              <label className="text-[10px] font-semibold text-[var(--color-text-secondary)]">Description</label>
              <textarea
                rows={2}
                className="w-full px-2 py-1 text-xs rounded border border-[var(--color-border)] bg-[var(--color-surface-default)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] disabled:opacity-50 resize-y"
                value={p.description ?? ''}
                onChange={(v) => handleChange(idx, 'description', v.target.value)}
                disabled={!isYamlValid}
              />
            </div>
          </div>
        </div>
      ))}
      <Button
        variant="secondary"
        size="sm"
        onClick={handleAddProj}
        disabled={!isYamlValid}
        className="w-full text-xs py-1"
      >
        ➕ Ajouter un projet personnel
      </Button>
    </div>
  )
}

// ── CERTIFICATIONS ──────────────────────────────────────────────────────────
export function CertificationsSection() {
  const formData = useStudioStore((s) => s.formData)
  const isYamlValid = useStudioStore((s) => s.isYamlValid)
  const updateFormField = useStudioStore((s) => s.updateFormField)
  const appendFormListItem = useStudioStore((s) => s.appendFormListItem)
  const removeFormListItem = useStudioStore((s) => s.removeFormListItem)

  const certifications = formData?.certifications || []

  const handleChange = (index: number, key: string, value: string) => {
    updateFormField(['certifications', index, key], value)
  }

  const handleAddCert = () => {
    appendFormListItem(['certifications'], {
      certificationName: 'Nouvelle certification',
      companyName: 'Organisme émetteur',
      date: 'Dates'
    })
  }

  return (
    <div className="space-y-4">
      {certifications.map((c: any, idx: number) => (
        <div key={idx} className="border border-[var(--color-border)] rounded p-3 bg-[var(--color-surface-default)] space-y-3 relative">
          <div className="flex justify-between items-center pb-1 border-b border-[var(--color-border)]">
            <span className="text-xs font-bold text-[var(--color-text-primary)]">Certif #{idx + 1} : {c.certificationName}</span>
            <Button
              variant="ghost"
              size="sm"
              className="text-[var(--color-destructive)] hover:bg-[var(--red-2)] border-none scale-90 py-0.5 px-1 shrink-0"
              onClick={() => removeFormListItem(['certifications'], idx)}
              disabled={!isYamlValid}
            >
              ❌
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1 col-span-2">
              <label className="text-[10px] font-semibold text-[var(--color-text-secondary)]">Nom de la certification</label>
              <input
                type="text"
                className="w-full px-2 py-1 text-xs rounded border border-[var(--color-border)] bg-[var(--color-surface-default)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] disabled:opacity-50"
                value={c.certificationName ?? ''}
                onChange={(v) => handleChange(idx, 'certificationName', v.target.value)}
                disabled={!isYamlValid}
              />
            </div>
            <div className="flex flex-col gap-1 col-span-2">
              <label className="text-[10px] font-semibold text-[var(--color-text-secondary)]">Organisme émetteur</label>
              <input
                type="text"
                className="w-full px-2 py-1 text-xs rounded border border-[var(--color-border)] bg-[var(--color-surface-default)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] disabled:opacity-50"
                value={c.companyName ?? ''}
                onChange={(v) => handleChange(idx, 'companyName', v.target.value)}
                disabled={!isYamlValid}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-[var(--color-text-secondary)]">Date d'obtention</label>
              <input
                type="text"
                className="w-full px-2 py-1 text-xs rounded border border-[var(--color-border)] bg-[var(--color-surface-default)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] disabled:opacity-50"
                value={c.date ?? ''}
                onChange={(v) => handleChange(idx, 'date', v.target.value)}
                disabled={!isYamlValid}
                placeholder="Ex: 2024"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-[var(--color-text-secondary)]">Lien du justificatif</label>
              <input
                type="text"
                className="w-full px-2 py-1 text-xs rounded border border-[var(--color-border)] bg-[var(--color-surface-default)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] disabled:opacity-50"
                value={c.link ?? ''}
                onChange={(v) => handleChange(idx, 'link', v.target.value)}
                disabled={!isYamlValid}
                placeholder="Ex: https://..."
              />
            </div>
          </div>
        </div>
      ))}
      <Button
        variant="secondary"
        size="sm"
        onClick={handleAddCert}
        disabled={!isYamlValid}
        className="w-full text-xs py-1"
      >
        ➕ Ajouter une certification
      </Button>
    </div>
  )
}
