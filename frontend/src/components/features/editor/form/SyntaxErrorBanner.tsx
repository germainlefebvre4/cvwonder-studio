export default function SyntaxErrorBanner() {
  return (
    <div className="bg-[var(--color-error)]/10 border border-[var(--color-error)]/30 rounded-lg p-4 text-[var(--color-error)] space-y-1 mb-4 select-none animate-pulse">
      <div className="flex items-center gap-2 font-bold text-sm">
        ⚠️ Édition Visuelle Suspendue
      </div>
      <p className="text-xs text-[var(--color-text-secondary)]">
        Le code YAML contient une erreur de syntaxe ou d'indentation. Veuillez corriger l'erreur dans l'éditeur de code pour réactiver l'assistant No-Code.
      </p>
    </div>
  )
}
