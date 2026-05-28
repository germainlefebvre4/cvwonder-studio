## ADDED Requirements

### Requirement: Les propriétaires peuvent accéder à leur session via son UUID
Le système SHALL exposer un endpoint `GET /api/sessions/:id` accessible uniquement à l'utilisateur propriétaire de la session (authentifié via cookie `user_session`). Cet endpoint SHALL retourner la session complète incluant le champ `yaml_content`, afin de permettre le chargement de l'éditeur en mode authentifié.

#### Scenario: Accès propriétaire à sa session
- **WHEN** un utilisateur authentifié appelle `GET /api/sessions/:id` avec l'UUID d'une session lui appartenant
- **THEN** le backend retourne HTTP 200 avec la session complète incluant `id`, `name`, `yaml_content`, `expires_at`, `is_archived`

#### Scenario: Accès refusé pour une session d'un autre utilisateur
- **WHEN** un utilisateur authentifié appelle `GET /api/sessions/:id` avec l'UUID d'une session appartenant à un autre utilisateur
- **THEN** le backend retourne HTTP 404 (indiscernable d'une session inexistante, pour ne pas révéler l'existence de la ressource)

#### Scenario: Accès refusé sans authentification
- **WHEN** un visiteur non authentifié appelle `GET /api/sessions/:id`
- **THEN** le backend retourne HTTP 401

#### Scenario: Chargement de l'éditeur via query param session
- **WHEN** un utilisateur authentifié navigue vers `/studio?session=:uuid`
- **THEN** le frontend appelle `GET /api/sessions/:uuid`, charge le YAML dans l'éditeur, et affiche la session normalement sans token en URL

## MODIFIED Requirements

### Requirement: Les utilisateurs connectés peuvent créer jusqu'à N sessions
Le système SHALL permettre aux utilisateurs connectés de créer jusqu'à la limite définie par la clé `max_sessions_per_user` de `system_config` (défaut : 10). Le backend SHALL refuser la création si le nombre de sessions actives non archivées atteint cette limite — ce contrôle SHALL être appliqué de manière cohérente dans tous les handlers concernés : création (`POST /api/v1/sessions`), duplication (`POST /api/sessions/:id/duplicate`), et exposition via la liste (`GET /api/sessions`). La valeur `max_sessions_per_user` SHALL être lue dynamiquement depuis `system_config` à chaque appel (et non mise en cache ou hardcodée). Lors de la création, le backend SHALL lier `user_id` à la session en extrayant l'identité depuis le cookie `user_session` (déjà vérifié par `UserMiddleware`). La session SHALL être créée avec le TTL utilisateur (`user_session_ttl_days`) et non le TTL anonyme.

#### Scenario: Création dans la limite du quota
- **WHEN** un utilisateur connecté ayant 7 sessions sur 10 crée une nouvelle session
- **THEN** la session est créée, liée à son `user_id`, avec le TTL utilisateur, et visible immédiatement dans son dashboard

#### Scenario: Dépassement du quota à la création
- **WHEN** un utilisateur connecté ayant atteint la limite `max_sessions_per_user` tente de créer une session via `POST /api/v1/sessions`
- **THEN** le backend retourne HTTP 422 avec le message d'erreur de quota dépassé ; aucune session n'est créée

#### Scenario: Dépassement du quota à la duplication
- **WHEN** un utilisateur connecté ayant atteint la limite `max_sessions_per_user` tente de dupliquer une session
- **THEN** le backend retourne HTTP 422 avec le message d'erreur de quota dépassé ; aucune session n'est créée

#### Scenario: Session connectée visible immédiatement dans le dashboard
- **WHEN** un utilisateur connecté crée une session via `POST /api/v1/sessions`
- **THEN** la session apparaît dans `GET /api/sessions` sans action supplémentaire (pas besoin de claiming)

#### Scenario: Session anonyme inchangée
- **WHEN** un visiteur non connecté crée une session via `POST /api/v1/sessions`
- **THEN** la session est créée avec `user_id = NULL` et le TTL anonyme, comportement identique à avant
