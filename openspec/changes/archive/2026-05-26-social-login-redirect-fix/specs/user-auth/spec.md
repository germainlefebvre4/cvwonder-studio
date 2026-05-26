## MODIFIED Requirements

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
