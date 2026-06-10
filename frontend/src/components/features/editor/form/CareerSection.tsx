import { useStudioStore } from '@/store/studio'
import { Button } from '@/components/ui/Button'

export default function CareerSection() {
  const formData = useStudioStore((s) => s.formData)
  const isYamlValid = useStudioStore((s) => s.isYamlValid)
  const updateFormField = useStudioStore((s) => s.updateFormField)
  const appendFormListItem = useStudioStore((s) => s.appendFormListItem)
  const removeFormListItem = useStudioStore((s) => s.removeFormListItem)
  const moveFormListItem = useStudioStore((s) => s.moveFormListItem)

  const career = formData?.career || []

  const handleCompanyChange = (companyIndex: number, key: string, value: string) => {
    updateFormField(['career', companyIndex, key], value)
  }

  const handleAddCompany = () => {
    appendFormListItem(['career'], {
      companyName: 'Nouvelle entreprise',
      duration: 'Ex: 2 ans',
      missions: [
        {
          position: 'Ex: Développeur Go',
          company: 'Nouvelle entreprise',
          dates: 'Ex: 2024 - Présent',
          summary: 'Brève description de votre rôle...',
          technologies: [],
          description: ['A accompli XYZ']
        }
      ]
    })
  }

  const handleRemoveCompany = (index: number) => {
    removeFormListItem(['career'], index)
  }

  const handleMoveCompany = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex >= 0 && targetIndex < career.length) {
      moveFormListItem(['career'], index, targetIndex)
    }
  }

  // Nested Mission updates
  const handleMissionChange = (companyIndex: number, missionIndex: number, key: string, value: any) => {
    updateFormField(['career', companyIndex, 'missions', missionIndex, key], value)
  }

  const handleAddMission = (companyIndex: number, companyName: string) => {
    appendFormListItem(['career', companyIndex, 'missions'], {
      position: 'Nouveau poste',
      company: companyName,
      dates: 'Dates',
      summary: '',
      technologies: [],
      description: []
    })
  }

  const handleRemoveMission = (companyIndex: number, missionIndex: number) => {
    removeFormListItem(['career', companyIndex, 'missions'], missionIndex)
  }

  return (
    <div className="space-y-6">
      {career.map((comp: any, cIdx: number) => (
        <div key={cIdx} className="border border-[var(--color-border)] rounded-lg bg-[var(--color-surface-subtle)] p-4 space-y-4 relative">
          
          {/* Header controls for Company */}
          <div className="flex justify-between items-center border-b border-[var(--color-border)] pb-2">
            <span className="text-sm font-bold text-[var(--color-accent-text)]">
              Entreprise #{cIdx + 1} : {comp.companyName || 'Sans nom'}
            </span>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="py-1 px-2 border-none text-xs"
                onClick={() => handleMoveCompany(cIdx, 'up')}
                disabled={!isYamlValid || cIdx === 0}
              >
                ▲
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="py-1 px-2 border-none text-xs"
                onClick={() => handleMoveCompany(cIdx, 'down')}
                disabled={!isYamlValid || cIdx === career.length - 1}
              >
                ▼
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-[var(--color-destructive)] hover:bg-[var(--red-2)] border-none shrink-0"
                onClick={() => handleRemoveCompany(cIdx)}
                disabled={!isYamlValid}
              >
                ❌
              </Button>
            </div>
          </div>

          {/* Company Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[var(--color-text-secondary)]">Nom de l'entreprise</label>
              <input
                type="text"
                className="w-full px-3 py-1.5 text-sm rounded border border-[var(--color-border)] bg-[var(--color-surface-default)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] disabled:opacity-50"
                value={comp.companyName ?? ''}
                onChange={(e) => handleCompanyChange(cIdx, 'companyName', e.target.value)}
                disabled={!isYamlValid}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[var(--color-text-secondary)]">Durée totale</label>
              <input
                type="text"
                className="w-full px-3 py-1.5 text-sm rounded border border-[var(--color-border)] bg-[var(--color-surface-default)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] disabled:opacity-50"
                value={comp.duration ?? ''}
                onChange={(e) => handleCompanyChange(cIdx, 'duration', e.target.value)}
                disabled={!isYamlValid}
                placeholder="Ex: 2 ans"
              />
            </div>
          </div>

          {/* Missions List */}
          <div className="space-y-4 pl-4 border-l-2 border-[var(--color-border)]">
            <span className="text-xs font-bold text-[var(--color-text-secondary)] block uppercase tracking-wide">
              Postes & Missions
            </span>

            {(comp.missions || []).map((m: any, mIdx: number) => (
              <div key={mIdx} className="bg-[var(--color-surface-default)] border border-[var(--color-border)] rounded p-3 space-y-3 relative">
                <div className="flex justify-between items-center pb-1 border-b border-[var(--color-border)]">
                  <span className="text-xs font-semibold text-[var(--color-text-primary)]">
                    Poste #{mIdx + 1} : {m.position || 'Nouveau poste'}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[var(--color-destructive)] hover:bg-[var(--red-2)] border-none scale-90 py-0.5 px-1 shrink-0"
                    onClick={() => handleRemoveMission(cIdx, mIdx)}
                    disabled={!isYamlValid}
                  >
                    Supprimer poste
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-semibold text-[var(--color-text-secondary)]">Intitulé du poste</label>
                    <input
                      type="text"
                      className="w-full px-2 py-1 text-xs rounded border border-[var(--color-border)] bg-[var(--color-surface-default)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] disabled:opacity-50"
                      value={m.position ?? ''}
                      onChange={(e) => handleMissionChange(cIdx, mIdx, 'position', e.target.value)}
                      disabled={!isYamlValid}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-semibold text-[var(--color-text-secondary)]">Dates d'exercice</label>
                    <input
                      type="text"
                      className="w-full px-2 py-1 text-xs rounded border border-[var(--color-border)] bg-[var(--color-surface-default)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] disabled:opacity-50"
                      value={m.dates ?? ''}
                      onChange={(e) => handleMissionChange(cIdx, mIdx, 'dates', e.target.value)}
                      disabled={!isYamlValid}
                      placeholder="Ex: Mars 2022 - Présent"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-[var(--color-text-secondary)]">Résumé du poste</label>
                  <input
                    type="text"
                    className="w-full px-2 py-1 text-xs rounded border border-[var(--color-border)] bg-[var(--color-surface-default)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] disabled:opacity-50"
                    value={m.summary ?? ''}
                    onChange={(e) => handleMissionChange(cIdx, mIdx, 'summary', e.target.value)}
                    disabled={!isYamlValid}
                    placeholder="Ex: Responsable de la refonte de l'infrastructure..."
                  />
                </div>

                {/* Technologies */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-[var(--color-text-secondary)]">Technologies (séparées par des virgules)</label>
                  <input
                    type="text"
                    className="w-full px-2 py-1 text-xs rounded border border-[var(--color-border)] bg-[var(--color-surface-default)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] disabled:opacity-50"
                    value={Array.isArray(m.technologies) ? m.technologies.join(', ') : ''}
                    onChange={(e) =>
                      handleMissionChange(
                        cIdx,
                        mIdx,
                        'technologies',
                        e.target.value.split(',').map((t) => t.trim()).filter(Boolean)
                      )
                    }
                    disabled={!isYamlValid}
                    placeholder="Ex: Go, Docker, Kubernetes, React"
                  />
                </div>

                {/* Descriptions (bullet points) */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-[var(--color-text-secondary)]">Points clés / Missions accomplies (un par ligne)</label>
                  <textarea
                    rows={3}
                    className="w-full px-2 py-1 text-xs rounded border border-[var(--color-border)] bg-[var(--color-surface-default)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] disabled:opacity-50 resize-y"
                    value={Array.isArray(m.description) ? m.description.join('\n') : ''}
                    onChange={(e) =>
                      handleMissionChange(
                        cIdx,
                        mIdx,
                        'description',
                        e.target.value.split('\n').map((l) => l.trim()).filter(Boolean)
                      )
                    }
                    disabled={!isYamlValid}
                    placeholder="Ex: Développement d'APIs ultra-performantes en Go&#10;Automatisation des pipelines CI/CD sous GitHub Actions"
                  />
                </div>
              </div>
            ))}

            <Button
              variant="secondary"
              size="sm"
              className="w-full text-xs py-1"
              onClick={() => handleAddMission(cIdx, comp.companyName || '')}
              disabled={!isYamlValid}
            >
              ➕ Ajouter un poste dans cette entreprise
            </Button>
          </div>

        </div>
      ))}

      <Button
        variant="primary"
        size="md"
        onClick={handleAddCompany}
        disabled={!isYamlValid}
        className="w-full"
      >
        💼 Ajouter une expérience en entreprise
      </Button>
    </div>
  )
}
