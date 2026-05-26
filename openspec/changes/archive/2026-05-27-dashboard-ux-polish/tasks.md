## 1. Bouton "+ Nouvelle session" (Dashboard)

- [x] 1.1 Importer `createSession` et `RateLimitError` depuis `@/services/sessions` dans `Dashboard.tsx`
- [x] 1.2 Ajouter un état local `rateLimitMsg` (string | null) pour afficher les erreurs de rate limit
- [x] 1.3 Implémenter le handler `handleNewSession` : appel `createSession()`, navigation vers `/studio/:token`, catch `RateLimitError` → afficher message
- [x] 1.4 Remplacer `<a href="/">` par `<button onClick={handleNewSession}>` avec les mêmes classes CSS
- [x] 1.5 Afficher `rateLimitMsg` sous le bouton si défini (texte d'erreur inline, style `text-[var(--color-error-text)] text-xs`)

## 2. Largeur et design tokens (Account)

- [x] 2.1 Remplacer `max-w-3xl` par `max-w-6xl` dans le header de `Account.tsx`
- [x] 2.2 Remplacer `max-w-3xl` par `max-w-6xl` dans le main de `Account.tsx`
- [x] 2.3 Remplacer `bg-gray-50` par `bg-[var(--color-surface-subtle)]` sur le wrapper de page
- [x] 2.4 Remplacer `bg-white border-b` par `bg-[var(--color-surface-default)] border-b border-[var(--color-border)]` sur le header
- [x] 2.5 Migrer les sections `bg-white rounded-lg border` vers `bg-[var(--color-surface-default)] rounded-[var(--radius-lg)] border border-[var(--color-border)]`
- [x] 2.6 Migrer les couleurs de texte : `text-gray-900` → `text-[var(--color-text-primary)]`, `text-gray-500` → `text-[var(--color-text-secondary)]`, `text-gray-400` → `text-[var(--color-text-muted)]`, `text-gray-800` → `text-[var(--color-text-primary)]`, `text-gray-600` → `text-[var(--color-text-secondary)]`
- [x] 2.7 Migrer les boutons primaires : `bg-blue-600 hover:bg-blue-700 text-white` → `bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-text-inverse)]`
- [x] 2.8 Migrer les boutons secondaires : `border rounded text-gray-700 hover:bg-gray-50` → `border border-[var(--color-border)] rounded-[var(--radius-sm)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-subtle)]`
- [x] 2.9 Migrer le select du thème par défaut : `border rounded` → `border border-[var(--color-border)] rounded-[var(--radius-sm)]`
- [x] 2.10 Conserver le style de la zone de danger (rouge explicite) — vérifier que `border-red-200` et `text-red-700` restent ou utiliser une variable d'erreur si disponible
