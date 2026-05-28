## 1. Backend — Quota dans UserSessionHandler

- [x] 1.1 Ajouter `configRepo *repository.ConfigRepository` dans la struct `UserSessionHandler` et mettre à jour `NewUserSessionHandler` pour l'accepter
- [x] 1.2 Mettre à jour `main.go` pour passer `configRepo` à `NewUserSessionHandler`
- [x] 1.3 Modifier le handler `List` (`GET /api/sessions`) pour appeler `CountActiveByUser` et lire `max_sessions_per_user` depuis `configRepo`, puis retourner `{ sessions, total, active, max }`
- [x] 1.4 Modifier le handler `Duplicate` pour remplacer la constante hardcodée `10` par `configRepo.GetInt("max_sessions_per_user")`

## 2. Backend — Quota dans SessionHandler (Create)

- [x] 2.1 Modifier le handler `Create` (`POST /api/v1/sessions`) pour vérifier le quota quand `userID` est présent : appeler `CountActiveByUser` et lire `max_sessions_per_user`, retourner HTTP 422 si dépassé

## 3. Backend — Nouveau endpoint GET /api/sessions/:id

- [x] 3.1 Ajouter la méthode `GetByID(ctx, sessionID)` dans `SessionRepository` (appelle sqlc `GetSessionByID`)
- [x] 3.2 Ajouter le handler `GetSession(c *gin.Context)` dans `UserSessionHandler` : vérifier l'ownership, retourner HTTP 404 si absent ou autre propriétaire, HTTP 200 avec la session complète (incluant `yaml_content`)
- [x] 3.3 Enregistrer la route `GET /api/sessions/:id` dans `main.go` (groupe `apiSessions` protégé par `UserMiddleware`)

## 4. Backend — Claiming TTL étendu

- [x] 4.1 Modifier `claimAnonSession` dans `auth.go` pour appeler `UpdateTTL(session.ID, time.Now().AddDate(0, 0, h.userSessionTTLDays))` après `ClaimAnonymousSession`
- [x] 4.2 Ajouter `userSessionTTLDays int` dans la struct `AuthHandler` et mettre à jour `NewAuthHandler` pour l'accepter
- [x] 4.3 Supprimer le champ mort `queries *db.Queries` de `AuthHandler` et son param dans `NewAuthHandler`
- [x] 4.4 Mettre à jour `main.go` : retirer `db.New(pool)` et ajouter `cfg.SessionDurationDays` dans l'appel à `NewAuthHandler`

- [x] 4.5 Corriger la gestion des erreurs dans `Callback()` dans `auth.go` : (a) checker `c.Query("error")` en premier → `c.Redirect(302, h.frontendBaseURL+"/login?error=oauth_denied")` ; (b) remplacer tous les `c.JSON(400/401)` dans le Callback par des redirects `c.Redirect(302, h.frontendBaseURL+"/login?error=...")` pour les cas state manquant, state mismatch, state invalide, code absent, exchange échoué

## 5. Frontend — Accès studio via ?session=:uuid

- [x] 5.1 Modifier `SessionCard.tsx` : remplacer `href={`/studio/${session.token}`}` par `href={`/studio?session=${session.id}`}`
- [x] 5.2 Modifier `services/user.ts` : retirer le champ `token` de l'interface `UserSession` (n'est plus utilisé)
- [x] 5.3 Modifier `app/studio/page.tsx` (ou `pages/studio`) : lire `?session=:uuid` depuis `useSearchParams` ; si présent, appeler `GET /api/sessions/:uuid` pour charger le YAML au lieu du flux token
- [x] 5.4 Ajouter la fonction `getSessionById(id: string)` dans `services/user.ts` qui appelle `GET /api/sessions/:id`

## 6. Frontend — Affichage quota dans le dashboard

- [x] 6.1 Vérifier que `Dashboard.tsx` utilise `data.active` et `data.max` pour la barre de quota (devrait fonctionner une fois que le backend retourne ces champs)
- [x] 6.2 Vérifier que le bouton "+ Nouvelle session" utilise `data.active >= data.max` pour masquage (idem)
