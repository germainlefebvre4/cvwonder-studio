## Context

La route `POST /api/v1/sessions` est ouverte au public (pas d'auth requise) pour permettre la création de sessions anonymes. Le middleware `UserMiddleware` est appliqué globalement et injecte silencieusement le `user_id` dans le contexte Gin si un cookie `user_session` valide est présent — mais le handler `SessionHandler.Create` n'en tient pas compte. Résultat : toutes les sessions sont créées avec `user_id = NULL`, même quand l'utilisateur est connecté.

La colonne `user_id UUID REFERENCES users(id) ON DELETE SET NULL` existe déjà (migration 006). La query sqlc `InsertSession` ne l'inclut pas encore. Aucune migration DDL n'est nécessaire.

## Goals / Non-Goals

**Goals:**
- Les sessions créées par un utilisateur authentifié sont immédiatement liées à son `user_id`
- Les sessions créées anonymement restent avec `user_id = NULL` (comportement existant préservé)
- Les sessions créées tandis que connecté héritent du TTL utilisateur (clé `user_session_ttl_days`)
- Aucun changement d'API publique (corps requête/réponse inchangés)

**Non-Goals:**
- Backdating des sessions orphelines existantes en base
- Claiming multi-sessions avant login (seule la dernière session anonyme est réclamée — limitation acceptable)
- Modification du mécanisme de claiming post-login (déjà fonctionnel via `claimAnonSession`)

## Decisions

### Décision 1 : Passer `userID *uuid.UUID` à travers toute la stack verticalement

**Choix retenu** : Modifier la signature de `CreateUsecase.Execute(ctx, userID *uuid.UUID, themeID, templateID)` pour propager l'identité depuis le handler jusqu'au repository.

**Alternative considérée** : Injecter le `user_id` via le `context.Context` (pattern "context value"). Rejeté — anti-pattern Go pour des données business, opaque et difficile à tester.

**Rationale** : Explicite, testable, aligné avec le reste du codebase (le `GetUsecase` et `UpdateUsecase` n'utilisent pas non plus le contexte pour les données business).

### Décision 2 : Utiliser `uuid.Nil` comme sentinelle dans le handler

**Choix retenu** : Si `GetUserID(c)` retourne `(uuid.Nil, false)`, passer `nil` au usecase (session anonyme). Si `ok == true`, passer `&userID`.

**Rationale** : Le usecase et le repository distinguent déjà `nil` (anonyme) vs `*uuid.UUID` (lié). Cohérent avec le domaine existant.

### Décision 3 : Appliquer le TTL utilisateur lors de la création liée

**Choix retenu** : Lire `user_session_ttl_days` depuis `system_config` dans le usecase quand `userID != nil`. Conserver l'existant (`anon_session_ttl_hours`) quand `userID == nil`.

**Alternative considérée** : Toujours utiliser le TTL anonyme à la création, puis le prolonger au claim. Rejeté — incohérent avec l'expérience dashboard (la session apparaît avec la bonne durée dès le départ).

**Rationale** : Un utilisateur connecté crée directement une session avec son TTL standard.

### Décision 4 : Régénérer les fichiers sqlc

La query `InsertSession` doit inclure `user_id`. Après modification de `sessions.sql`, un `make sqlc` (ou `sqlc generate`) regénère `db/generated/`. Les fichiers générés ne sont pas édités manuellement.

## Risks / Trade-offs

- [Régression silencieuse si `user_session_ttl_days` absent de system_config] → Mitigation : fallback sur la valeur existante du `CreateUsecase` (lire la config ou conserver le TTL par défaut injecté à l'init)
- [Test `create_test.go` existant devient invalide] → Mitigation : mettre à jour la signature du fake et les assertions dans le même commit

## Migration Plan

1. Modifier `db/queries/sessions.sql` (ajouter `user_id` à `InsertSession`)
2. Exécuter `sqlc generate` → met à jour `db/generated/`
3. Mettre à jour `adapters/repository/session.go` — passer `UserID` dans `InsertSessionParams`
4. Mettre à jour `usecases/session/create.go` — nouvelle signature + TTL conditionnel
5. Mettre à jour `adapters/http/session.go` — extraire `userID` du contexte
6. Mettre à jour `usecases/session/create_test.go`
7. Vérifier avec `go test ./...`

Pas de rollback DB nécessaire (la colonne accepte NULL, les sessions existantes sans `user_id` restent valides).
