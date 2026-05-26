## Context

Deux pages du parcours utilisateur connecté présentent des problèmes UX :

1. **Page Mon compte** (`Account.tsx`) — largeur `max-w-3xl` alors que Dashboard et Landing utilisent `max-w-6xl`. La page utilise aussi des classes Tailwind brutes (`bg-gray-50`, `bg-white`, `text-gray-900`) au lieu des design tokens CSS (`var(--color-*)`) définis dans le système de design.

2. **Bouton "+ Nouvelle session"** (`Dashboard.tsx`) — implémenté comme `<a href="/">`, ce qui redirige vers la landing page. L'utilisateur doit alors recliquer sur "Démarrer" pour créer une session. L'endpoint `POST /api/v1/sessions` supporte déjà les sessions liées à un compte via cookie — aucun changement backend requis.

## Goals / Non-Goals

**Goals:**
- Harmoniser `max-w-6xl` sur header et main de la page Account
- Migrer Account.tsx vers les design tokens CSS existants
- Le bouton "+ Nouvelle session" appelle directement `createSession()` et redirige vers `/studio/:token`
- Gestion du rate limit sur le bouton (même pattern que la landing)

**Non-Goals:**
- Refonte du layout ou du contenu de la page Account
- Modification du comportement du bouton sur la landing page
- Changements backend

## Decisions

### Largeur : `max-w-6xl` pour Account

Dashboard et Landing utilisent tous les deux `max-w-6xl`. Aligner Account sur cette valeur garantit une cohérence visuelle dans tous les contextes connectés. Le contenu de la page Compte (formulaires, sections RGPD) s'adapte sans problème à cette largeur.

### Création de session depuis le Dashboard

Remplacer `<a href="/">` par un `<button>` avec handler `onClick`. Le handler :
1. Appelle `createSession()` depuis `@/services/sessions`
2. En succès : `navigate('/studio/:token')`
3. En `RateLimitError` : affiche un message dans le Dashboard (ne pas naviguer)
4. Le bouton est déjà conditionné par `!quotaFull`, donc pas de risque de doublon avec la logique quota

### Migration design tokens dans Account.tsx

Remplacer les classes brutes par les équivalents tokens déjà utilisés dans Dashboard.tsx :

| Avant | Après |
|---|---|
| `bg-gray-50` | `bg-[var(--color-surface-subtle)]` |
| `bg-white` | `bg-[var(--color-surface-default)]` |
| `border` (implicite blanc) | `border-[var(--color-border)]` |
| `text-gray-900` | `text-[var(--color-text-primary)]` |
| `text-gray-500` | `text-[var(--color-text-secondary)]` |
| `text-gray-400` | `text-[var(--color-text-muted)]` |
| `text-gray-800` | `text-[var(--color-text-primary)]` |
| `text-gray-600` | `text-[var(--color-text-secondary)]` |
| `bg-blue-600` | `bg-[var(--color-accent)]` |
| `hover:bg-blue-700` | `hover:bg-[var(--color-accent-hover)]` |
| `text-white` (sur accent) | `text-[var(--color-text-inverse)]` |
| `rounded-lg` | `rounded-[var(--radius-lg)]` |
| `rounded` | `rounded-[var(--radius-sm)]` |

## Risks / Trade-offs

- **Rate limit visible** : si l'utilisateur clique "+ Nouvelle session" trop vite, le Dashboard doit lui afficher un message. Le composant actuel n'a pas d'état pour ça. Solution simple : état local `rateLimitMessage` affiché en toast ou inline sous le bouton.
- **Pas de loading state** : l'appel `createSession()` est quasi-instantané, un état de chargement n'est pas indispensable mais peut être ajouté si la latence réseau est perceptible. Décision : ne pas ajouter de loading state pour rester minimal.
