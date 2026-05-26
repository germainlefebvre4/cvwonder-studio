## ADDED Requirements

### Requirement: La création de sessions est soumise à un rate limit par IP
Le système SHALL limiter le nombre de créations de sessions par adresse IP. La limite SHALL être configurable via `system_config` (clé `session_creation_rate_limit_per_hour`, défaut `3`). Les requêtes dépassant la limite SHALL recevoir HTTP 429 avec un header `Retry-After`.

#### Scenario: Création dans la limite du rate limit
- **WHEN** une IP crée sa première session dans la fenêtre d'une heure
- **THEN** la session est créée normalement

#### Scenario: Dépassement du rate limit IP
- **WHEN** une IP tente de créer une session au-delà de la limite configurée dans la fenêtre d'une heure
- **THEN** le système retourne HTTP 429 avec un header `Retry-After` indiquant quand la prochaine création sera autorisée

#### Scenario: Rate limit non applicable aux utilisateurs connectés
- **WHEN** un utilisateur connecté crée une session (authentifié via cookie `user_session`)
- **THEN** le rate limit IP ne s'applique pas ; seule la limite de quota `max_sessions_per_user` s'applique

### Requirement: La taille du contenu YAML est limitée
Le système SHALL rejeter les requêtes de mise à jour de session (`PATCH /api/sessions/{id}`) dont le champ `yaml_content` dépasse la taille maximale configurable via `system_config` (clé `max_yaml_size_kb`, défaut `100`). La limite s'applique à tous les utilisateurs (anonymes et connectés).

#### Scenario: YAML dans la limite de taille
- **WHEN** un utilisateur sauvegarde un YAML de 50 Ko
- **THEN** la mise à jour est acceptée normalement

#### Scenario: YAML dépassant la limite de taille
- **WHEN** un utilisateur tente de sauvegarder un YAML supérieur à `max_yaml_size_kb` Ko
- **THEN** le backend retourne HTTP 413 avec un message indiquant la limite en Ko

#### Scenario: Limite de taille configurable par l'admin
- **WHEN** l'admin modifie `max_yaml_size_kb` dans `system_config`
- **THEN** la nouvelle limite est appliquée immédiatement aux requêtes suivantes

### Requirement: La génération de preview est soumise à un rate limit temporel par session
Le système SHALL empêcher les générations trop fréquentes en vérifiant le délai depuis `last_generated_at` de la session. La limite SHALL être différenciée : `anon_generation_rate_limit_seconds` (défaut `5`) pour les anonymes, `connected_generation_rate_limit_seconds` (défaut `2`) pour les utilisateurs connectés. Les deux valeurs SHALL être configurables via `system_config`.

#### Scenario: Génération autorisée après le délai minimum (anonyme)
- **WHEN** un utilisateur anonyme demande une génération plus de 5 secondes après la précédente
- **THEN** la génération est lancée et `last_generated_at` est mis à jour

#### Scenario: Génération refusée avant le délai minimum (anonyme)
- **WHEN** un utilisateur anonyme demande une génération moins de 5 secondes après la précédente
- **THEN** le backend retourne HTTP 429 ; le frontend désactive le bouton "Générer" pendant le délai restant

#### Scenario: Délai plus court pour les utilisateurs connectés
- **WHEN** un utilisateur connecté demande une génération 2 secondes après la précédente
- **THEN** la génération est autorisée (délai connecté = 2s vs 5s pour les anonymes)

#### Scenario: Délai configurable par l'admin
- **WHEN** l'admin modifie `anon_generation_rate_limit_seconds` dans `system_config`
- **THEN** la nouvelle valeur est appliquée aux prochaines requêtes de génération anonyme

### Requirement: Le frontend affiche un feedback visuel lors d'un rate limit de création de session
Quand la création d'une session anonyme échoue avec HTTP 429, le frontend SHALL afficher un message explicatif indiquant combien de temps l'utilisateur doit attendre avant de réessayer. Le bouton de création SHALL être désactivé pendant toute la durée du cooldown et SHALL afficher un compte à rebours en secondes.

#### Scenario: Rate limit atteint sur la landing page
- **WHEN** un utilisateur clique sur "Start Building" et que le backend retourne HTTP 429
- **THEN** le bouton "Start Building" est désactivé et affiche un message de type "Réessayez dans X secondes"
- **THEN** un compte à rebours décrémente chaque seconde jusqu'à 0
- **THEN** le bouton est réactivé automatiquement quand le cooldown expire

#### Scenario: Délai de retry issu du header Retry-After
- **WHEN** la réponse 429 contient un header `Retry-After` avec une valeur en secondes
- **THEN** le compte à rebours utilise cette valeur exacte
- **WHEN** le header `Retry-After` est absent
- **THEN** le frontend utilise une valeur de fallback calculée depuis `session_creation_rate_limit_per_hour` (via `/api/config/limits`)

#### Scenario: Réactivation du bouton après le cooldown
- **WHEN** le compte à rebours atteint 0
- **THEN** le bouton "Start Building" est réactivé sans rechargement de page

### Requirement: Le rate limit de création de sessions est bypassable en développement local
Le middleware de rate limiting de création de sessions SHALL vérifier la variable d'environnement `DISABLE_SESSION_CREATION_RATE_LIMIT`. Si cette variable est définie à `true`, le middleware SHALL bypasser entièrement la vérification et laisser passer la requête.

#### Scenario: Bypass activé via variable d'environnement
- **WHEN** le backend démarre avec `DISABLE_SESSION_CREATION_RATE_LIMIT=true`
- **THEN** toutes les requêtes de création de session passent sans contrôle de rate limit
- **THEN** un message de warning est loggué au démarrage indiquant que le rate limit est désactivé

#### Scenario: Comportement normal sans la variable
- **WHEN** `DISABLE_SESSION_CREATION_RATE_LIMIT` est absent ou différent de `true`
- **THEN** le middleware s'exécute normalement avec les limites configurées

#### Scenario: Variable documentée dans .env.example
- **WHEN** un développeur consulte `.env.example`
- **THEN** il trouve `DISABLE_SESSION_CREATION_RATE_LIMIT=false` commenté avec une note "dev only"
