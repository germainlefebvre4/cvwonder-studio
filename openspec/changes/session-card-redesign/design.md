## Context

Le composant `SessionCard` est un composant React autonome qui affiche les métadonnées d'une session et expose ses actions de gestion. Dans l'état actuel, toutes les actions (Ouvrir, Dupliquer, Partager, Archiver, Exporter, Supprimer) sont rendues au même poids visuel en bas de la card. Il n'existe aucune indication visuelle du statut de partage ou d'expiration imminente, et les dates affichées sont absolues.

Le Dashboard est l'interface principale des utilisateurs connectés. L'action dominante (80% du temps) est l'ouverture d'une session existante.

## Goals / Non-Goals

**Goals:**
- Établir une hiérarchie visuelle claire avec un CTA primaire pleine largeur "Ouvrir dans le studio"
- Matérialiser le statut de la session (partagée, expiration imminente) via une bordure colorée visible dans la grille 3 colonnes
- Réduire la charge cognitive en regroupant les actions rares dans un menu `⋯`
- Afficher des dates relatives pour une information contextuelle plus utile

**Non-Goals:**
- Aucun changement backend, API ou base de données
- La structure en grille 3 colonnes du `SessionList` est conservée telle quelle
- Pas de refonte du quota banner ni du système d'onglets
- Pas d'ajout de fonctionnalités de session (partage, export, etc.)

## Decisions

### 1. Border-left pour signaler le statut

**Décision** : bordure gauche de 3px selon la priorité : expiration imminente (< 30j) > partagée > défaut.

**Alternatives considérées** :
- Teinte de fond de la card → affecte la lisibilité du contenu
- Barre d'accent en haut (`border-top`) → consomme plus d'espace vertical, moins scannable en grille
- Badge dans le coin → trop discret, nécessite un label textuel

**Rationale** : La bordure gauche est visible d'un coup d'œil en grille sans modifier la lisibilité interne. La priorité expiration > partage reflète l'urgence (agir avant expiration > info de visibilité).

### 2. Radix DropdownMenu pour le menu `⋯`

**Décision** : réutiliser `@radix-ui/react-dropdown-menu` (déjà présent dans `UserHeader.tsx`) pour le menu d'actions secondaires.

**Contenu du menu** : Renommer · Dupliquer · Exporter ZIP · ─── · Supprimer (rouge, séparé).

**Alternatives considérées** : popover custom — rejeté, le pattern Radix est déjà établi dans le projet et géré correctement pour l'accessibilité et le z-index (Portal).

### 3. Nom de session = lien de navigation

**Décision** : le nom devient un `<a href="/studio/:token">` — cliquer navigue vers le studio. Le renommage est déplacé vers l'item "Renommer" du menu `⋯`.

**Rationale** : l'expectation utilisateur sur un nom cliquable est la navigation, pas l'édition inline. Le rename via dropdown est plus découvrable que le click sur le nom.

### 4. Dates relatives avec `Intl.RelativeTimeFormat`

**Décision** : nouvelle fonction utilitaire `formatRelativeDate(iso: string)` retournant une chaîne en français ("dans 8 mois", "dans 3 jours", "il y a 2j", "aujourd'hui").

**Bucketing** :
- ≥ 60j → mois arrondis
- 1–59j → jours exacts
- 0j → "aujourd'hui" / "demain"
- < 0 → "il y a X jours"

**Couleur de l'expiry** : muted si > 30j, warning si ≤ 30j et > 0, error si dépassé.

### 5. Ajout des tokens CSS warning dans `globals.css`

**Décision** : ajouter `--color-warning`, `--color-warning-text`, `--color-warning-subtle` en utilisant les Radix Colors `amber` (déjà dans l'écosystème Radix mais pas encore importé).

**Couleur choisie** : amber (orange chaud), cohérent avec l'usage warning dans des systèmes utilisant Radix Colors. Import de `@radix-ui/colors/amber.css` et `@radix-ui/colors/amber-dark.css`.

### 6. Indicateur de partage inline

**Décision** : si `share_token_hash !== null`, afficher une row dédiée sur la card :  
`🔗 Partagée · {view_count} vues · vu {formatRelativeDate(last_viewed_at)}`

Le bouton secondaire "Partager" change de label selon l'état :
- `share_token_hash === null` → "Partager"
- `share_token_hash !== null` → "Gérer le partage"

## Risks / Trade-offs

| Risque | Mitigation |
|---|---|
| Conflit de priorité border (shared + expiring) | Expiry always wins (plus urgent) — logique dans `getSessionBorderStatus()` |
| z-index du DropdownMenu dans la grille | Radix utilise un Portal — pas de problème de stacking context |
| `Intl.RelativeTimeFormat` non supporté anciens navigateurs | Support ≥ 96% (Chrome 71, Firefox 65, Safari 14) — acceptable pour CVWonder Studio |
| Resize du label "Gérer le partage" vs "Partager" | Boutons flex, largeur auto — pas d'impact layout |
