## Why

Lors de la création d'une session via `POST /api/v1/sessions`, le handler ignore l'identité de l'utilisateur connecté (cookie `user_session` valide), ce qui provoque la création d'une session avec `user_id = NULL`. Ces sessions n'apparaissent donc jamais dans le dashboard utilisateur (`/api/sessions` filtre par `user_id`). Le problème est pur code applicatif — la colonne `user_id` existe déjà dans le schéma (migration 006).

## What Changes

- Le handler `POST /api/v1/sessions` lit l'identité utilisateur depuis le contexte Gin (`userauth.GetUserID`) et la transmet au usecase de création
- Le usecase `CreateUsecase.Execute` accepte un `userID *uuid.UUID` optionnel et le positionne sur le `domain.Session`
- Le repository `SessionRepository.Insert` inclut `user_id` dans les paramètres `InsertSession` (sqlc)
- La query SQL `InsertSession` est mise à jour pour inclure `user_id` dans l'INSERT
- Les sessions créées par un utilisateur connecté héritent du TTL connecté (configurable via `user_session_ttl_days`) au lieu du TTL anonyme

## Capabilities

### New Capabilities
<!-- Aucune nouvelle capability — c'est un fix d'implémentation -->

### Modified Capabilities
- `user-sessions` : la création de session SHALL lier `user_id` quand l'utilisateur est authentifié

## Impact

- `backend/db/queries/sessions.sql` — query `InsertSession` + `sqlc generate`
- `backend/db/generated/` — fichiers générés par sqlc (ne pas éditer manuellement)
- `backend/internal/adapters/repository/session.go` — `Insert()`
- `backend/internal/usecases/session/create.go` — `Execute()`
- `backend/internal/adapters/http/session.go` — `Create()` handler
- `backend/internal/usecases/session/create_test.go` — tests unitaires à mettre à jour
- Aucun changement d'API publique (le body et la réponse de `POST /api/v1/sessions` restent identiques)
