## 1. SQL & sqlc

- [x] 1.1 Ajouter `user_id` dans la query `InsertSession` dans `backend/db/queries/sessions.sql`
- [x] 1.2 Exécuter `sqlc generate` pour regénérer `backend/db/generated/`

## 2. Repository

- [x] 2.1 Mettre à jour `SessionRepository.Insert()` dans `backend/internal/adapters/repository/session.go` pour passer `UserID` dans `InsertSessionParams`

## 3. Usecase

- [x] 3.1 Ajouter `userID *uuid.UUID` comme premier paramètre de `CreateUsecase.Execute()` dans `backend/internal/usecases/session/create.go`
- [x] 3.2 Positionner `UserID: userID` sur le `domain.Session` construit dans `Execute()`
- [x] 3.3 Appliquer le TTL utilisateur (`user_session_ttl_days` lu depuis la config) quand `userID != nil`, conserver le TTL anonyme sinon

## 4. Handler

- [x] 4.1 Extraire l'identité utilisateur via `userauth.GetUserID(c)` dans `SessionHandler.Create()` (`backend/internal/adapters/http/session.go`)
- [x] 4.2 Passer `&userID` (ou `nil` si non connecté) au `h.create.Execute()`

## 5. Tests

- [x] 5.1 Mettre à jour `backend/internal/usecases/session/create_test.go` : adapter la signature du fake repo et les appels à `Execute()`
- [x] 5.2 Ajouter un scénario de test vérifiant que `UserID` est bien positionné sur la session créée quand un `userID` est fourni
- [x] 5.3 Ajouter un scénario de test vérifiant que `UserID` est `nil` quand aucun `userID` n'est fourni (comportement anonyme préservé)
- [x] 5.4 Exécuter `go test ./...` et vérifier que tous les tests passent
