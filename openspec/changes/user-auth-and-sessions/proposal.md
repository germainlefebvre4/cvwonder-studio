## Why

Les sessions sont aujourd'hui entièrement anonymes — un visiteur crée une session et perd toute possibilité de la retrouver ou de la gérer une fois le navigateur fermé. Offrir une authentification Google permet de proposer une expérience nettement plus riche : sessions nommées et persistantes, partage, quotas configurables, tableau de bord personnel, et export — sans sacrifier l'accès anonyme pour les utilisateurs occasionnels.

## What Changes

- Ajouter une table `users` liée à Google OAuth (sub stable comme identifiant)
- Lier les sessions à un utilisateur (nullable — les sessions anonymes restent valides)
- Ajouter un écran de login `/login` dédié aux utilisateurs (Google uniquement), distinct du `/admin/login` existant
- Limiter les sessions anonymes à 1 (enforced par cookie navigateur), les sessions connectées à N (défaut 10, configurable via `system_config`)
- Sessions anonymes limitées à 24h avec suppression immédiate à expiration ; page 404 "fun" dédiée avec CTA de création et de connexion
- Avertissements progressifs d'expiration pour les sessions anonymes (timings configurables via `system_config`)
- Bouton "Télécharger le YAML" dans l'éditeur, accessible à tous les utilisateurs
- Migration automatique session anonyme → compte connecté ("session claiming") lors du premier login Google
- Protection contre les abus : rate limiting IP sur la création de sessions, limite de taille YAML, rate limit temporel de génération par session — tous configurables via `system_config` ; limites différenciées entre anonymes et connectés
- Message de confidentialité explicite dans l'UI (nature des données, durée de rétention)
- Permettre aux utilisateurs connectés de nommer, dupliquer, archiver leurs sessions et d'en modifier le TTL
- Conserver les sessions connectées archivées 30 jours (contenu YAML récupérable) ; sessions anonymes supprimées immédiatement à expiration
- Permettre aux utilisateurs connectés de tagger leurs sessions (labels créés à la volée, max 10 par session, filtrage dans le dashboard)
- Permettre le partage d'une session via lien public, avec protection optionnelle par token
- Ajouter une URL publique pour consulter le CV rendu sans accéder à l'éditeur, avec bandeau branding (CVWonder + PDF si disponible + CTA "Créer mon CV")
- Compter les vues des CVs publics (`/p/{id}`) en excluant le propriétaire et les bots évidents ; afficher le compteur dans le dashboard
- Permettre le changement de thème sur une session existante (utilisateurs connectés uniquement)
- Ajouter la préférence de thème par défaut sur le profil utilisateur (pré-sélection à la création de session)
- Ajouter l'export de session (YAML + HTML généré) en ZIP
- Ajouter une page de tableau de bord utilisateur listant les sessions actives et archivées
- Droit RGPD à l'effacement : suppression immédiate du compte, de toutes les sessions et fichiers associés
- Droit RGPD à la portabilité : export ZIP de toutes les données personnelles (profil + toutes les sessions)

## Capabilities

### New Capabilities

- `user-auth`: Authentification Google OAuth pour les utilisateurs finaux ; table `users` ; association sessions ↔ utilisateur ; écran `/login` distinct de `/admin/login` ; gestion du cookie de session utilisateur ; migration automatique session anonyme → compte (session claiming) au moment du login ; préférence de thème par défaut sur le profil utilisateur
- `user-sessions`: Cycle de vie différencié selon le statut — sessions anonymes 24h supprimées immédiatement à expiration, sessions connectées avec nommage, duplication, changement de thème, modification du TTL, archivage explicite, rétention 30 jours des sessions archivées ; avertissements progressifs d'expiration (timings configurables) ; bouton YAML download ; page 404 fun ; message de confidentialité ; labels/tags créés à la volée (max 10 par session, max 30 chars, filtrage dans le dashboard)
- `anonymous-protections`: Mécanismes de protection contre les abus — rate limiting IP sur création de sessions, limite de taille YAML, rate limit temporel de génération par session ; tous configurables via `system_config` ; limites différenciées entre anonymes et connectés
- `session-sharing`: Partage d'une session via lien public ; protection optionnelle par token/mot de passe ; URL publique `/p/{id}` avec bandeau branding (CVWonder + PDF si disponible + CTA "Créer mon CV") ; compteur de vues excluant le propriétaire et les bots évidents
- `session-export`: Téléchargement d'une session sous forme de ZIP (YAML source + HTML généré)
- `user-dashboard`: Page `/dashboard` listant les sessions actives et archivées de l'utilisateur connecté, affichant le quota utilisé, filtrage par tag, compteurs de vues, et accès aux actions de gestion
- `user-account-management`: Droits RGPD — suppression immédiate du compte (cascade sessions + fichiers) ; export ZIP de toutes les données personnelles (profil sans `google_sub` + toutes sessions avec métadonnées)

### Modified Capabilities

<!-- Aucune spec existante à modifier -->

## Impact

- **DB** : nouvelles migrations — table `users` (avec `default_theme_id`), colonnes `user_id` + `name` + `is_archived` + `archived_at` + `share_token_hash` + `share_password_hash` + `last_generated_at` + `tags TEXT[]` + `view_count` + `last_viewed_at` sur `sessions` ; clés `system_config` : `max_sessions_per_user`, `anon_session_ttl_hours`, `anon_expiry_warn_1_hours`, `anon_expiry_warn_2_hours`, `session_creation_rate_limit_per_hour`, `max_yaml_size_kb`, `anon_generation_rate_limit_seconds`, `connected_generation_rate_limit_seconds`
- **Backend** : nouveau package `backend/internal/userauth/` (Google OAuth callback, cookie utilisateur, session claiming) ; middleware rate limiting IP et YAML size ; nouvelles routes `/api/auth/*`, `/api/sessions/{id}/share`, `/api/sessions/{id}/export`, `/api/sessions/{id}/duplicate`, `/api/sessions/{id}/tags`, `/p/{id}` ; routes RGPD `DELETE /api/auth/account`, `GET /api/auth/account/export` ; middleware utilisateur (optionnel, non-bloquant pour les anonymes) ; purge anonyme immédiate à expiration
- **Frontend** : nouvelles pages `/login`, `/dashboard`, `/p/{id}`, `404` fun ; composants `SessionCard`, `SessionList`, `ShareDialog`, `ExportButton`, `ExpiryWarningBanner`, `YamlDownloadButton`, `PrivacyNotice`, `TagInput`, `TagFilter`, `ViewerBandeau`, `AccountSettings` ; store Zustand pour l'utilisateur connecté
- **Config** : variables d'env `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `USER_TOKEN_SECRET` ; multiples clés `system_config` pour les limites et timings configurables
- **Nouvelle dépendance backend** : `golang.org/x/oauth2` + `golang.org/x/oauth2/google` ; `golang.org/x/time/rate` pour le rate limiting IP in-process
