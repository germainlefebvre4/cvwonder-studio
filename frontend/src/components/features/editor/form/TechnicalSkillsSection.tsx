import { useStudioStore } from '@/store/studio'
import { Button } from '@/components/ui/Button'

export default function TechnicalSkillsSection() {
  const formData = useStudioStore((s) => s.formData)
  const isYamlValid = useStudioStore((s) => s.isYamlValid)
  const updateFormField = useStudioStore((s) => s.updateFormField)
  const appendFormListItem = useStudioStore((s) => s.appendFormListItem)
  const removeFormListItem = useStudioStore((s) => s.removeFormListItem)
  const moveFormListItem = useStudioStore((s) => s.moveFormListItem)

  const domains = formData?.technicalSkills?.domains || []

  const handleDomainNameChange = (domainIndex: number, value: string) => {
    updateFormField(['technicalSkills', 'domains', domainIndex, 'name'], value)
  }

  const handleAddDomain = () => {
    appendFormListItem(['technicalSkills', 'domains'], {
      name: 'Nouveau domaine de compétences',
      competencies: [
        { name: 'Ex: Go', level: 90 }
      ]
    })
  }

  const handleRemoveDomain = (index: number) => {
    removeFormListItem(['technicalSkills', 'domains'], index)
  }

  const handleMoveDomain = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex >= 0 && targetIndex < domains.length) {
      moveFormListItem(['technicalSkills', 'domains'], index, targetIndex)
    }
  }

  // Competency Actions
  const handleCompetencyChange = (domainIndex: number, compIndex: number, key: string, value: any) => {
    updateFormField(['technicalSkills', 'domains', domainIndex, 'competencies', compIndex, key], value)
  }

  const handleAddCompetency = (domainIndex: number) => {
    appendFormListItem(['technicalSkills', 'domains', domainIndex, 'competencies'], {
      name: 'Nouvelle compétence',
      level: 80
    })
  }

  const handleRemoveCompetency = (domainIndex: number, compIndex: number) => {
    removeFormListItem(['technicalSkills', 'domains', domainIndex, 'competencies'], compIndex)
  }

  return (
    <div className="space-y-6">
      {domains.map((dom: any, dIdx: number) => (
        <div key={dIdx} className="border border-[var(--color-border)] rounded-lg bg-[var(--color-surface-subtle)] p-4 space-y-4">
          
          {/* Header controls for Domain */}
          <div className="flex justify-between items-center border-b border-[var(--color-border)] pb-2">
            <div className="flex-1 flex gap-2 items-center">
              <label className="text-xs font-bold text-[var(--color-text-secondary)] shrink-0 uppercase tracking-wider">Domaine #{dIdx + 1}</label>
              <input
                type="text"
                className="px-2 py-1 text-sm rounded border border-[var(--color-border)] bg-[var(--color-surface-default)] text-[var(--color-text-primary)] font-bold focus:outline-none focus:border-[var(--color-accent)] disabled:opacity-50"
                value={dom.name ?? ''}
                onChange={(e) => handleDomainNameChange(dIdx, e.target.value)}
                disabled={!isYamlValid}
                placeholder="Ex: Développement Backend"
              />
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="py-1 px-2 border-none text-xs"
                onClick={() => handleMoveDomain(dIdx, 'up')}
                disabled={!isYamlValid || dIdx === 0}
              >
                ▲
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="py-1 px-2 border-none text-xs"
                onClick={() => handleMoveDomain(dIdx, 'down')}
                disabled={!isYamlValid || dIdx === domains.length - 1}
              >
                ▼
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-[var(--color-destructive)] hover:bg-[var(--red-2)] border-none shrink-0"
                onClick={() => handleRemoveDomain(dIdx)}
                disabled={!isYamlValid}
              >
                ❌
              </Button>
            </div>
          </div>

          {/* Competencies list */}
          <div className="space-y-3">
            {(dom.competencies || []).map((c: any, cIdx: number) => (
              <div key={cIdx} className="flex gap-4 items-center bg-[var(--color-surface-default)] border border-[var(--color-border)] rounded p-2.5">
                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    className="w-full px-2 py-1 text-xs rounded border border-[var(--color-border)] bg-[var(--color-surface-default)] text-[var(--color-text-primary)] font-semibold focus:outline-none focus:border-[var(--color-accent)] disabled:opacity-50"
                    value={c.name ?? ''}
                    onChange={(e) => handleCompetencyChange(dIdx, cIdx, 'name', e.target.value)}
                    disabled={!isYamlValid}
                    placeholder="Ex: Go / Gin"
                  />
                </div>

                {/* Level slider */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-[var(--color-text-secondary)] font-mono w-8 text-right">{c.level}%</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    className="w-24 accent-[var(--color-accent)] h-1 rounded bg-[var(--color-surface-muted)] cursor-pointer"
                    value={c.level ?? 80}
                    onChange={(e) => handleCompetencyChange(dIdx, cIdx, 'level', parseInt(e.target.value) || 0)}
                    disabled={!isYamlValid}
                  />
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[var(--color-destructive)] hover:bg-[var(--red-2)] border-none scale-90 p-1 shrink-0"
                  onClick={() => handleRemoveCompetency(dIdx, cIdx)}
                  disabled={!isYamlValid}
                >
                  ❌
                </Button>
              </div>
            ))}

            <Button
              variant="secondary"
              size="sm"
              className="w-full text-xs py-1"
              onClick={() => handleAddCompetency(dIdx)}
              disabled={!isYamlValid}
            >
              ➕ Ajouter une compétence dans ce domaine
            </Button>
          </div>

        </div>
      ))}

      <Button
        variant="primary"
        size="md"
        onClick={handleAddDomain}
        disabled={!isYamlValid}
        className="w-full"
      >
        🛠️ Ajouter un domaine de compétences
      </Button>
    </div>
  )
}
