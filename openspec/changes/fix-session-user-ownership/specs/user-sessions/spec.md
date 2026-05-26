## MODIFIED Requirements

### Requirement: Les utilisateurs connectés peuvent créer jusqu'à N sessions
Le système SHALL permettre aux utilisateurs connectés de créer jusqu'à la limite définie par la clé `max_sessions_per_user` de `system_config` (défaut : 10). Le backend SHALL refuser la création si le nombre de sessions actives non archivées atteint cette limite. Lors de la création, le backend SHALL lier `user_id` à la session en extrayant l'identité depuis le cookie `user_session` (déjà vérifié par `UserMiddleware`). La session SHALL être créée avec le TTL utilisateur (`user_session_ttl_days`) et non le TTL anonyme.

#### Scenario: Création dans la limite du quota
- **WHEN** un utilisateur connecté ayant 7 sessions sur 10 crée une nouvelle session
- **THEN** la session est créée, liée à son `user_id`, avec le TTL utilisateur, et visible immédiatement dans son dashboard

#### Scenario: Dépassement du quota
- **WHEN** un utilisateur connecté ayant atteint la limite `max_sessions_per_user` tente de créer une session
- **THEN** le backend retourne HTTP 422 avec le message d'erreur de quota dépassé ; aucune session n'est créée

#### Scenario: Session connectée visible immédiatement dans le dashboard
- **WHEN** un utilisateur connecté crée une session via `POST /api/v1/sessions`
- **THEN** la session apparaît dans `GET /api/sessions` sans action supplémentaire (pas besoin de claiming)

#### Scenario: Session anonyme inchangée
- **WHEN** un visiteur non connecté crée une session via `POST /api/v1/sessions`
- **THEN** la session est créée avec `user_id = NULL` et le TTL anonyme, comportement identique à avant
