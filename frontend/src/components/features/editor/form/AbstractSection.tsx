import { useStudioStore } from '@/store/studio'
import { Button } from '@/components/ui/Button'

export default function AbstractSection() {
  const formData = useStudioStore((s) => s.formData)
  const isYamlValid = useStudioStore((s) => s.isYamlValid)
  const updateFormField = useStudioStore((s) => s.updateFormField)
  const appendFormListItem = useStudioStore((s) => s.appendFormListItem)
  const removeFormListItem = useStudioStore((s) => s.removeFormListItem)

  const abstract: string[] = formData?.abstract || []

  const handleParagraphChange = (index: number, text: string) => {
    updateFormField(['abstract', index], text)
  }

  const handleAddParagraph = () => {
    appendFormListItem(['abstract'], 'Nouveau paragraphe de résumé professionnel...')
  }

  const handleRemoveParagraph = (index: number) => {
    removeFormListItem(['abstract'], index)
  }

  return (
    <div className="space-y-4">
      {abstract.map((paragraph, index) => (
        <div key={index} className="flex gap-2 items-start border border-[var(--color-border)] p-3 rounded bg-[var(--color-surface-subtle)]">
          <div className="flex-1 flex flex-col gap-1">
            <label className="text-xs font-semibold text-[var(--color-text-secondary)]">Paragraphe {index + 1}</label>
            <textarea
              rows={3}
              className="w-full px-3 py-1.5 text-sm rounded border border-[var(--color-border)] bg-[var(--color-surface-default)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] disabled:opacity-50 resize-y"
              value={paragraph}
              onChange={(e) => handleParagraphChange(index, e.target.value)}
              disabled={!isYamlValid}
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-[var(--color-destructive)] hover:bg-[var(--red-2)] border-none shrink-0 self-end"
            onClick={() => handleRemoveParagraph(index)}
            disabled={!isYamlValid}
          >
            ❌
          </Button>
        </div>
      ))}

      <Button
        variant="secondary"
        size="sm"
        onClick={handleAddParagraph}
        disabled={!isYamlValid}
        className="w-full"
      >
        ➕ Ajouter un paragraphe
      </Button>
    </div>
  )
}
