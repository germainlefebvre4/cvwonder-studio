## ADDED Requirements

### Requirement: L'utilisateur peut se connecter via Google OAuth
Le système SHALL proposer un bouton "Se connecter avec Google" sur la page `/login`. Le flux OAuth Authorization Code SHALL être initié côté backend. À l'issue du callback, si l'utilisateur n'existe pas il SHALL être créé (table `users` avec `google_sub`, `email`, `name`, `avatar_url`) ; sinon mis à jour. Un cookie `user_session` HttpOnly SHALL être déposé. Après dépôt du cookie, le backend SHALL rediriger le navigateur vers l'URL frontend configurée (`FRONTEND_BASE_URL`) suivie du chemin `/dashboard`, garantissant que la redirection pointe vers le SPA React indépendamment de l'origine du backend.

#### Scenario: Connexion réussie pour un nouvel utilisateur
- **WHEN** un utilisateur clique sur "Se connecter avec Google" et autorise l'application
- **THEN** le système crée un enregistrement `users`, dépose le cookie `user_session`, et redirige vers `{FRONTEND_BASE_URL}/dashboard` (résolvant vers le SPA React)

#### Scenario: Connexion réussie pour un utilisateur existant
- **WHEN** un utilisateur déjà enregistré se connecte via Google
- **THEN** le système met à jour `name` et `avatar_url` si différents, dépose le cookie `user_session`, et redirige vers `{FRONTEND_BASE_URL}/dashboard`

#### Scenario: Redirection correcte en environnement de développement split-origin
- **WHEN** `FRONTEND_BASE_URL` est défini à `http://localhost:5173` et le backend tourne sur `http://localhost:8080`
- **THEN** après le callback OAuth, le navigateur est redirigé vers `http://localhost:5173/dashboard` (le SPA Vite), et non vers `http://localhost:8080/dashboard`

#### Scenario: Redirection correcte en production single-origin
- **WHEN** `FRONTEND_BASE_URL` n'est pas défini et `APP_BASE_URL` vaut `https://app.cvwonder.com`
- **THEN** après le callback OAuth, le navigateur est redirigé vers `https://app.cvwonder.com/dashboard`

### Requirement: La session anonyme est transférée au compte lors de la connexion (session claiming)
Le système SHALL, au moment du callback OAuth Google, détecter si l'utilisateur possédait une session anonyme active (token présent dans le cookie `oauth_state` signé). Si la session existe encore en DB et n'a pas expiré, le système SHALL lier `user_id` à cette session ET mettre à jour `expires_at` à `NOW() + user_session_ttl_days`. Le token anonyme en localStorage SHALL être supprimé par le frontend après redirection.

#### Scenario: Claiming d'une session anonyme active lors du login
- **WHEN** un utilisateur se connecte via Google alors qu'il avait une session anonyme active
- **THEN** le backend lie `user_id` à la session anonyme existante ; `expires_at` est prolongé à `NOW() + user_session_ttl_days` (défaut 30j) ; la session devient une session connectée à durée complète ; l'utilisateur retrouve son travail dans `/dashboard`

#### Scenario: Claiming ignoré si la session anonyme a expiré
- **WHEN** un utilisateur se connecte via Google mais sa session anonyme a expiré (déjà supprimée)
- **THEN** le claiming est silencieusement ignoré ; l'utilisateur est redirigé vers `/dashboard` avec une session vide

#### Scenario: Claiming ignoré si aucune session anonyme n'était en cours
- **WHEN** un utilisateur se connecte via Google sans avoir créé de session anonyme au préalable
- **THEN** le flux OAuth se déroule normalement sans claiming

#### Scenario: L'utilisateur refuse l'autorisation Google
- **WHEN** l'utilisateur clique "Annuler" sur la page d'autorisation Google (Google rappelle avec `?error=access_denied`)
- **THEN** le système redirige HTTP 302 vers `/login?error=oauth_denied` ; aucun JSON n'est retourné au navigateur

#### Scenario: Le state CSRF OAuth est invalide ou expiré
- **WHEN** le callback reçoit un cookie `oauth_state` manquant, un `state` qui ne correspond pas, ou une signature invalide
- **THEN** le système redirige HTTP 302 vers `/login?error=invalid_state` ; aucun JSON n'est retourné au navigateur

#### Scenario: Le code d'autorisation OAuth est manquant ou rejeté
- **WHEN** le callback reçoit un `code` absent ou que l'exchange avec Google échoue (code expiré, déjà utilisé)
- **THEN** le système redirige HTTP 302 vers `/login?error=oauth_failed` ; aucun JSON n'est retourné au navigateur

### Requirement: L'utilisateur peut se déconnecter
Le système SHALL exposer une action de déconnexion qui supprime le cookie `user_session`.

#### Scenario: Déconnexion réussie
- **WHEN** l'utilisateur clique sur "Se déconnecter"
- **THEN** le cookie `user_session` est supprimé et l'utilisateur est redirigé vers la page d'accueil

### Requirement: La page de login utilisateur est distincte de la page admin
La route `/login` SHALL uniquement afficher l'authentification Google. La route `/admin/login` SHALL uniquement afficher le formulaire username/password admin. Aucun lien ne SHALL relier les deux pages.

#### Scenario: Accès à /login
- **WHEN** un visiteur navigue vers `/login`
- **THEN** seul un bouton "Se connecter avec Google" est affiché (pas de champ username/password)

#### Scenario: Accès à /admin/login
- **WHEN** un visiteur navigue vers `/admin/login`
- **THEN** seul le formulaire username/password admin est affiché (pas de bouton Google)

### Requirement: Les routes protégées redirigent vers /login si non connecté
Le système SHALL rediriger tout accès à `/dashboard` ou toute opération nécessitant un compte connecté vers `/login` si aucun cookie `user_session` valide n'est présent.

#### Scenario: Accès à /dashboard sans cookie valide
- **WHEN** un utilisateur non connecté navigue vers `/dashboard`
- **THEN** il est redirigé vers `/login`

#### Scenario: Cookie user_session expiré
- **WHEN** un utilisateur présente un cookie `user_session` dont le `exp` est dépassé
- **THEN** le système rejette le cookie, supprime le cookie côté client, et redirige vers `/login`

### Requirement: Le middleware utilisateur est non-bloquant pour les routes publiques
Pour les routes publiques (création de session anonyme, accès à l'éditeur, preview), le middleware utilisateur SHALL enrichir la requête avec l'identité utilisateur si un cookie valide est présent, mais NE SHALL PAS bloquer si le cookie est absent.

#### Scenario: Accès à l'éditeur sans cookie
- **WHEN** un visiteur non connecté accède à `/studio`
- **THEN** la page charge normalement sans redirection vers /login

### Requirement: L'utilisateur connecté peut définir un thème par défaut pour ses sessions
Le système SHALL permettre à l'utilisateur connecté de choisir un thème par défaut dans ses paramètres de profil. Ce thème sera pré-sélectionné lors de la création d'une nouvelle session (remplaceable à la création).

#### Scenario: Définition du thème par défaut dans les paramètres
- **WHEN** un utilisateur connecté sélectionne un thème dans la section "Thème par défaut" de ses paramètres
- **THEN** `default_theme_id` est mis à jour sur la ligne `users` ; la prochaine création de session pré-sélectionne ce thème

#### Scenario: Pré-sélection du thème par défaut à la création de session
- **WHEN** un utilisateur connecté avec `default_theme_id` défini ouvre le formulaire de création de session
- **THEN** le sélecteur de thème pré-sélectionne automatiquement le thème par défaut (l'utilisateur peut en choisir un autre)

#### Scenario: Thème par défaut supprimé par l'admin
- **WHEN** un admin supprime le thème qui était défini comme thème par défaut d'un utilisateur
- **THEN** `default_theme_id` est automatiquement mis à `NULL` (via `ON DELETE SET NULL`) ; le formulaire de création de session n'a plus de pré-sélection

#### Scenario: Réinitialisation du thème par défaut
- **WHEN** un utilisateur connecté supprime sa préférence de thème par défaut
- **THEN** `default_theme_id` est mis à `NULL` ; le formulaire de création de session revient au comportement sans pré-sélection
