## Why

La gestion du partage dans le dashboard est inutilisable : toutes les SessionCards affichent une bordure orange (seuil d'expiration trop large), la dialog "Gérer le partage" ne permet pas de récupérer ni de régénérer le lien sur une session déjà partagée, et il n'existe aucun moyen de limiter la durée de vie d'un lien de partage.

## What Changes

- **Bug fix**: seuil de `getSessionBorderStatus()` réduit de 30 jours à 7 jours — les sessions auth (TTL 30j) n'affichent plus la bordure warning dès leur création
- **Bug fix**: ShareDialog refonte pour le cas `hasShare = true` — message explicatif + bouton "Révoquer et créer un nouveau lien" remplaçant la zone vide actuelle
- **Feature**: nouveau champ `share_expires_at` sur la table `sessions` — le lien de partage peut avoir une durée de vie optionnelle (7 jours, 30 jours, ou illimitée)
- **Feature**: vérification de `share_expires_at` à chaque accès au lien partagé — les liens expirés retournent HTTP 404 sans nettoyage automatique en DB
- **Feature**: SessionCard affiche l'état du lien expiré (`🔗 Partagée · lien expiré`) avec un CTA "Recréer un lien"

## Capabilities

### New Capabilities

_(aucune nouvelle capacité)_

### Modified Capabilities

- `session-sharing`: ajout des requirements sur la durée de vie du lien (`share_expires_at`) et sur le flux de régénération de lien pour une session déjà partagée

## Impact

- `frontend/src/lib/session.ts` — seuil `getSessionBorderStatus()`
- `frontend/src/components/user/ShareDialog.tsx` — refonte du cas `hasShare = true`
- `frontend/src/components/user/SessionCard.tsx` — affichage lien expiré
- `frontend/src/services/user.ts` — `createShare` accepte un paramètre `duration`
- `backend/db/migrations/` — ajout colonne `share_expires_at TIMESTAMPTZ NULL`
- `backend/db/queries/sessions.sql` — update `SetShareToken` avec `share_expires_at`
- `backend/internal/adapters/http/user_session.go` — `CreateShare` lit `duration`, `GetShared` vérifie expiry
- `backend/db/generated/` — régénération sqlc
