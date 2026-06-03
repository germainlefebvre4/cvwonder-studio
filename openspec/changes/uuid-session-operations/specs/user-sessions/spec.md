## ADDED Requirements

### Requirement: Les propriétaires peuvent mettre à jour le contenu YAML via UUID
Le système SHALL exposer un endpoint `PATCH /api/sessions/:id` accessible uniquement à l'utilisateur propriétaire de la session (authentifié via cookie `user_session`). Cet endpoint SHALL accepter les champs `yaml_content` (string) et `theme_id` (UUID) et mettre à jour la session en base de données.

#### Scenario: Mise à jour du YAML via UUID
- **WHEN** un utilisateur authentifié appelle `PATCH /api/sessions/:id` avec `{"yaml_content": "..."}` pour une session lui appartenant
- **THEN** le backend met à jour `yaml_content` dans la base de données et retourne HTTP 200 avec la session mise à jour

#### Scenario: Mise à jour du thème via UUID
- **WHEN** un utilisateur authentifié appelle `PATCH /api/sessions/:id` avec `{"theme_id": "uuid-du-theme"}` pour une session lui appartenant
- **THEN** le backend met à jour `theme_id` dans la base de données et retourne HTTP 200

#### Scenario: Mise à jour combinée YAML et thème via UUID
- **WHEN** un utilisateur authentifié appelle `PATCH /api/sessions/:id` avec `{"yaml_content": "...", "theme_id": "..."}` pour une session lui appartenant
- **THEN** le backend met à jour les deux champs atomiquement et retourne HTTP 200

#### Scenario: Mise à jour refusée pour une session d'un autre utilisateur
- **WHEN** un utilisateur authentifié appelle `PATCH /api/sessions/:id` pour une session appartenant à un autre utilisateur
- **THEN** le backend retourne HTTP 404 (indiscernable d'une session inexistante)

#### Scenario: Mise à jour refusée sans authentification
- **WHEN** un visiteur non authentifié appelle `PATCH /api/sessions/:id`
- **THEN** le backend retourne HTTP 401

### Requirement: Les propriétaires peuvent générer des previews via UUID
Le système SHALL exposer un endpoint `POST /api/sessions/:id/preview` accessible uniquement à l'utilisateur propriétaire de la session (authentifié via cookie `user_session`). Cet endpoint SHALL générer un preview HTML à partir du contenu YAML de la session et du thème sélectionné, identique au comportement de `POST /api/v1/sessions/:token/preview`.

#### Scenario: Génération de preview via UUID
- **WHEN** un utilisateur authentifié appelle `POST /api/sessions/:id/preview` pour une session lui appartenant
- **THEN** le backend génère un fichier HTML dans `sessions/:id/preview/index.html`, retourne HTTP 200 avec l'URL du preview (`/preview/:id/index.html`)

#### Scenario: Génération de preview avec erreur de rendu
- **WHEN** un utilisateur authentifié appelle `POST /api/sessions/:id/preview` et le rendu échoue (YAML invalide, thème manquant)
- **THEN** le backend retourne HTTP 400 avec un message d'erreur décrivant le problème

#### Scenario: Génération de preview refusée pour une session d'un autre utilisateur
- **WHEN** un utilisateur authentifié appelle `POST /api/sessions/:id/preview` pour une session appartenant à un autre utilisateur
- **THEN** le backend retourne HTTP 404

#### Scenario: Génération de preview refusée sans authentification
- **WHEN** un visiteur non authentifié appelle `POST /api/sessions/:id/preview`
- **THEN** le backend retourne HTTP 401

### Requirement: Les propriétaires peuvent valider le YAML via UUID
Le système SHALL exposer un endpoint `POST /api/sessions/:id/validate` accessible uniquement à l'utilisateur propriétaire de la session (authentifié via cookie `user_session`). Cet endpoint SHALL valider le contenu YAML de la session contre le schéma CVWonder et retourner les erreurs de validation éventuelles, identique au comportement de `POST /api/v1/sessions/:token/validate`.

#### Scenario: Validation réussie via UUID
- **WHEN** un utilisateur authentifié appelle `POST /api/sessions/:id/validate` pour une session lui appartenant avec du YAML valide
- **THEN** le backend retourne HTTP 200 avec `{"valid": true}`

#### Scenario: Validation échouée via UUID
- **WHEN** un utilisateur authentifié appelle `POST /api/sessions/:id/validate` pour une session lui appartenant avec du YAML invalide
- **THEN** le backend retourne HTTP 200 avec `{"valid": false, "errors": [...]}` contenant les détails des erreurs de validation

#### Scenario: Validation refusée pour une session d'un autre utilisateur
- **WHEN** un utilisateur authentifié appelle `POST /api/sessions/:id/validate` pour une session appartenant à un autre utilisateur
- **THEN** le backend retourne HTTP 404

#### Scenario: Validation refusée sans authentification
- **WHEN** un visiteur non authentifié appelle `POST /api/sessions/:id/validate`
- **THEN** le backend retourne HTTP 401

### Requirement: L'éditeur fonctionne en mode UUID pour les sessions authentifiées
Le système SHALL permettre au frontend d'accéder à l'éditeur via `/studio?session=:uuid` et d'utiliser les endpoints UUID-based (`/api/sessions/:id/*`) au lieu des endpoints token-based (`/api/v1/sessions/:token/*`) pour toutes les opérations (lecture, mise à jour, preview, validation). Le frontend SHALL détecter la présence du paramètre `?session=:uuid` et adapter ses appels d'API en conséquence.

#### Scenario: Chargement de l'éditeur en mode UUID
- **WHEN** un utilisateur authentifié navigue vers `/studio?session=:uuid`
- **THEN** le frontend appelle `GET /api/sessions/:uuid`, charge le YAML, et active les hooks de preview et validation en mode UUID

#### Scenario: Sauvegarde automatique du YAML en mode UUID
- **WHEN** un utilisateur modifie le YAML dans l'éditeur ouvert via `/studio?session=:uuid`
- **THEN** le frontend appelle `PATCH /api/sessions/:uuid` avec le nouveau contenu au lieu de `PATCH /api/v1/sessions/:token`

#### Scenario: Génération de preview en mode UUID
- **WHEN** un utilisateur dans l'éditeur en mode UUID modifie le YAML ou le thème
- **THEN** le hook `usePreview` appelle `POST /api/sessions/:uuid/preview` automatiquement

#### Scenario: Validation en temps réel en mode UUID
- **WHEN** un utilisateur dans l'éditeur en mode UUID modifie le YAML
- **THEN** le hook `useValidation` appelle `POST /api/sessions/:uuid/validate` automatiquement

#### Scenario: Liens depuis le dashboard vers l'éditeur
- **WHEN** un utilisateur clique sur "Ouvrir dans le studio" depuis le dashboard
- **THEN** le lien redirige vers `/studio?session=:uuid` et l'éditeur fonctionne en mode UUID avec toutes les fonctionnalités actives (preview, validation, sauvegarde)
