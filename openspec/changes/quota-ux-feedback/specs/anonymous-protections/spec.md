## ADDED Requirements

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
