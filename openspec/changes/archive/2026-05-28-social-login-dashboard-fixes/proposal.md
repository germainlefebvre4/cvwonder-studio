## Why

Les utilisateurs connectés via Google OAuth ne peuvent pas utiliser leur dashboard correctement : la barre de quota affiche NaN, le bouton "Ouvrir" pointe vers `/studio/undefined`, et les sessions réclamées au login expirent en 24h au lieu d'être prolongées au TTL utilisateur. Ces bugs rendent le dashboard inutilisable pour tous les utilisateurs authentifiés.

## What Changes

- **GET /api/sessions** retourne désormais `total`, `active`, et `max` en plus de `sessions`
- **UserSessionHandler** reçoit `configRepo` pour lire `max_sessions_per_user` depuis `system_config`
- **Duplicate handler** remplace la constante hardcodée `10` par la valeur lue depuis `system_config`
- **POST /api/v1/sessions** (Create) vérifie le quota pour les utilisateurs connectés
- **GET /api/sessions/:id** : nouveau endpoint owner-only retournant la session complète avec `yaml_content`
- **Studio page** gère un second mode d'accès `?session=:uuid` pour les propriétaires authentifiés
- **SessionCard** utilise `/studio?session={id}` au lieu de `/studio/${session.token}`
- **claimAnonSession** prolonge le TTL de la session réclamée au TTL utilisateur (`SESSION_DURATION_DAYS`)
- **AuthHandler** : suppression de la dépendance morte `queries *db.Queries`, ajout de `userSessionTTLDays`
- **Callback OAuth** : tous les cas d'erreur utilisateur (Google refuse, state invalide, code manquant, exchange échoué) redirigent vers `/login?error=...` au lieu de retourner HTTP 400/401 JSON

## Capabilities

### New Capabilities

_(aucune nouvelle capability — tous les bugs corrigés tombent dans des specs existantes)_

### Modified Capabilities

- `user-dashboard` : la réponse `GET /api/sessions` doit inclure `active` et `max` ; le lien vers le studio utilise `?session={id}` et non le raw token
- `user-sessions` : `GET /api/sessions/:id` owner-only pour accès studio authentifié ; quota enforced dans Create et Duplicate via `system_config`
- `user-auth` : le claiming de session anonyme prolonge le TTL au TTL utilisateur ; le callback OAuth redirige toujours vers `/login` en cas d'erreur utilisateur

## Impact

- **Backend** : `adapters/http/user_session.go`, `adapters/http/auth.go`, `adapters/http/session.go`, `cmd/api/main.go`
- **Frontend** : `app/studio/page.tsx`, `services/user.ts`, `components/user/SessionCard.tsx`
- **Aucune migration DB** requise
- **Aucun changement sqlc** requis
