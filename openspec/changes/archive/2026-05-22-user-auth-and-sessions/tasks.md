## 1. DB — Migrations et modèles

- [x] 1.1 Créer la migration `000005_create_users.up.sql` : table `users` (id, google_sub UNIQUE, email, name, avatar_url, default_theme_id UUID NULL REFERENCES themes(id) ON DELETE SET NULL, created_at)
- [x] 1.2 Créer la migration `000005_create_users.down.sql`
- [x] 1.3 Créer la migration `000006_extend_sessions_for_users.up.sql` : ajouter `user_id UUID REFERENCES users(id) ON DELETE SET NULL`, `name TEXT`, `is_archived BOOLEAN DEFAULT FALSE`, `archived_at TIMESTAMPTZ`, `share_token_hash TEXT`, `share_password_hash TEXT`, `last_generated_at TIMESTAMPTZ`, `tags TEXT[] NOT NULL DEFAULT '{}'`, `view_count INTEGER NOT NULL DEFAULT 0`, `last_viewed_at TIMESTAMPTZ` sur `sessions`
- [x] 1.4 Créer la migration `000006_extend_sessions_for_users.down.sql`
- [x] 1.5 Ajouter les index : `idx_sessions_user_id`, `idx_sessions_is_archived`, `idx_sessions_archived_at`, `idx_sessions_tags` (GIN index sur `tags`)
- [x] 1.6 Ajouter les clés `system_config` au démarrage (défauts) : `max_sessions_per_user=10`, `anon_session_ttl_hours=24`, `anon_expiry_warn_1_hours=2`, `anon_expiry_warn_2_hours=0.5`, `session_creation_rate_limit_per_hour=3`, `max_yaml_size_kb=100`, `anon_generation_rate_limit_seconds=5`, `connected_generation_rate_limit_seconds=2`

## 2. DB — Queries sqlc

- [x] 2.1 Écrire les queries `users` : `CreateUser`, `GetUserByGoogleSub`, `UpdateUser`, `UpdateUserDefaultTheme`, `DeleteUser`
- [x] 2.2 Écrire les queries sessions étendues : `ListSessionsByUser`, `CountActiveSessionsByUser`, `UpdateSessionName`, `UpdateSessionTTL`, `UpdateSessionTheme`, `ArchiveSession`, `DuplicateSession`, `UpdateSessionTags`, `IncrementViewCount` (met à jour `view_count + 1` et `last_viewed_at = NOW()`), `ListAllSessionsByUser` (toutes sessions pour export RGPD)
- [x] 2.3 Écrire les queries de partage : `SetShareToken`, `RevokeShareToken`, `SetSharePassword`, `GetSessionByShareToken`
- [x] 2.4 Écrire les queries de purge : `PurgeExpiredAnonymousSessions` (suppression immédiate, user_id IS NULL + expires_at < NOW()) et `PurgeArchivedConnectedSessions` (archived_at < NOW() - 30j, vide yaml_content)
- [x] 2.5 Régénérer le code sqlc (`sqlc generate`)
- [x] 2.6 Écrire la query `ClaimAnonymousSession` : met à jour `user_id` sur une session anonyme non expirée

## 3. Backend — Auth Google OAuth

- [x] 3.1 Ajouter les variables d'env `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `USER_TOKEN_SECRET` dans `config.go`
- [x] 3.2 Créer le package `backend/internal/userauth/` avec : `oauth.go` (config OAuth2 Google), `token.go` (SignUserToken / VerifyUserToken HMAC, pattern identique à admin), `middleware.go` (extrait user_id du cookie, non-bloquant)
- [x] 3.3 Implémenter `GET /api/auth/login` → redirect vers Google avec state CSRF (cookie `oauth_state` signé HMAC, 5 min)
- [x] 3.4 Implémenter `GET /api/auth/callback` → échange code → token Google → upsert user → session claiming (si token anon dans oauth_state, lier user_id à la session anonyme si encore valide) → signe cookie `user_session` → redirect `/dashboard`
- [x] 3.5 Implémenter `POST /api/auth/logout` → supprime cookie `user_session`
- [x] 3.6 Ajouter le middleware utilisateur sur les routes `/api/sessions/*` et `/api/auth/*` dans `main.go`
- [x] 3.7 Écrire les tests unitaires `userauth` : SignUserToken, VerifyUserToken, validation state CSRF

## 4. Backend — Sessions utilisateur

- [x] 4.1 Modifier `POST /api/sessions` : si utilisateur connecté, lier `user_id` et vérifier le quota `max_sessions_per_user` (HTTP 422 si dépassé) ; si anonyme, ne pas lier
- [x] 4.2 Implémenter `PATCH /api/sessions/{id}/name` : renomme la session (propriétaire uniquement)
- [x] 4.3 Implémenter `PATCH /api/sessions/{id}/ttl` : modifie `expires_at` (propriétaire, validation 1j–365j)
- [x] 4.4 Implémenter `PATCH /api/sessions/{id}/theme` : change `theme_id` (propriétaire connecté uniquement)
- [x] 4.5 Implémenter `POST /api/sessions/{id}/archive` : archive la session (propriétaire)
- [x] 4.6 Implémenter `POST /api/sessions/{id}/restore` : restaure une session archivée si < 30j (propriétaire)
- [x] 4.7 Implémenter `POST /api/sessions/{id}/duplicate` : crée une copie de la session (propriétaire, vérification quota)
- [x] 4.8 Implémenter `DELETE /api/sessions/{id}` : suppression définitive (propriétaire)
- [x] 4.9 Ajouter l'autorisation propriétaire sur `PATCH /api/sessions/{id}` existant (yaml_content)

## 5. Backend — Partage et URL publique

- [x] 5.1 Implémenter `POST /api/sessions/{id}/share` : génère et retourne le share token (propriétaire) ; stocke `sha256(token)` en DB
- [x] 5.2 Implémenter `DELETE /api/sessions/{id}/share` : révoque le share token (propriétaire)
- [x] 5.3 Implémenter `PUT /api/sessions/{id}/share/password` : définit/met à jour `share_password_hash` (bcrypt, propriétaire)
- [x] 5.4 Implémenter `GET /api/sessions/shared/{id}/{token}` : valide share token + password si protégé → retourne session en lecture seule
- [x] 5.5 Implémenter `GET /p/{session_id}` : sert le HTML généré depuis le filesystem ; bandeau si YAML > HTML en date

## 6. Backend — Export et purge

- [x] 6.1 Implémenter `GET /api/sessions/{id}/export` : génère et retourne un ZIP (resume.yaml + cv.html si présent)
- [x] 6.2 Implémenter `GET /api/sessions` (liste) : retourne les sessions actives de l'utilisateur connecté avec quota info
- [x] 6.3 Implémenter `GET /api/sessions?archived=true` : retourne les sessions archivées de l'utilisateur connecté
- [x] 6.4 Créer un job de purge périodique (ticker Go, lancé dans `main.go`) : deux passes — purge immédiate des sessions anonymes expirées (toutes) ; purge des sessions archivées connectées > 30j (vide yaml_content + fichiers)

## 7. Frontend — Auth et routing

- [x] 7.1 Créer la page `/login` : bouton "Se connecter avec Google" → redirect vers `GET /api/auth/login` ; aucun lien vers `/admin/login`
- [x] 7.2 Créer un store Zustand `useUserStore` : `user` (id, name, email, avatarUrl), `isAuthenticated`, `logout()`
- [x] 7.3 Créer le hook `useCurrentUser` : lit le profil depuis `GET /api/auth/me` (nouvel endpoint) au montage de l'app
- [x] 7.4 Ajouter le `RequireUser` guard component (analogue à `RequireAdmin`) : redirige vers `/login` si non connecté
- [x] 7.5 Protéger la route `/dashboard` avec `RequireUser`

## 8. Frontend — Dashboard

- [x] 8.1 Créer la page `/dashboard` avec deux onglets : "Actives" et "Archivées"
- [x] 8.2 Créer le composant `SessionCard` : affiche nom, thème, dates, quota, et menu d'actions (renommer, dupliquer, archiver, supprimer, partager, exporter)
- [x] 8.3 Créer le composant `SessionList` : liste paginée ou défilante de `SessionCard`
- [x] 8.4 Implémenter le bandeau de quota : barre de progression "N / max sessions utilisées", désactiver "Créer" si quota atteint
- [x] 8.5 Implémenter le header utilisateur (avatar, nom, email, bouton déconnexion) dans le layout global
- [x] 8.6 Implémenter l'action "Renommer" (champ inline ou dialog)
- [x] 8.7 Implémenter l'action "Dupliquer" (appel API + refresh liste)
- [x] 8.8 Implémenter l'action "Modifier TTL" (date picker dans un dialog)
- [x] 8.9 Implémenter l'action "Archiver" (confirmation + appel API)
- [x] 8.10 Implémenter l'action "Supprimer définitivement" (confirmation avec texte de mise en garde)

## 9. Frontend — Partage et export

- [x] 9.1 Créer le composant `ShareDialog` : génère le lien, affiche le token (une seule fois), option protection par mot de passe, bouton de révocation
- [x] 9.2 Créer le composant `ExportButton` : déclenche le download ZIP
- [x] 9.3 Créer la page `/s/{id}/{token}` : charge la session partagée via `GET /api/sessions/shared/{id}/{token}` ; affiche le formulaire de mot de passe si protégée ; ouvre l'éditeur en mode readonly
- [x] 9.4 Créer la page `/p/{id}` : iframe ou rendu direct du HTML généré ; affiche bandeau "aperçu non à jour" si applicable
- [x] 9.5 Ajouter le mode readonly à `YamlEditor` (prop `readOnly`) pour les sessions partagées

## 10. Frontend — Éditeur enrichi pour utilisateurs connectés

- [x] 10.1 Afficher le nom de la session dans le header de l'éditeur (éditable inline pour les propriétaires)
- [x] 10.2 Afficher la date d'expiration dans l'éditeur avec lien vers modification du TTL
- [x] 10.3 Ajouter le sélecteur de thème dans l'éditeur (accessible uniquement aux utilisateurs connectés propriétaires)
- [x] 10.4 Intégrer les boutons "Partager" et "Exporter" dans la toolbar de l'éditeur pour les utilisateurs connectés

## 12. Anonymous protections — Backend

- [x] 12.1 Implémenter le middleware rate limit IP sur `POST /api/sessions` : `golang.org/x/time/rate`, map IP → limiter, nettoyage périodique, lecture limite depuis `system_config`, retourne HTTP 429 + `Retry-After`
- [x] 12.2 Implémenter le middleware de taille YAML sur `PATCH /api/sessions/{id}` : lit `max_yaml_size_kb` depuis `system_config`, retourne HTTP 413 si dépassé
- [x] 12.3 Ajouter la vérification `last_generated_at` dans `POST /api/generate` : lire le délai applicable (anon vs connecté) depuis `system_config`, retourner HTTP 429 si trop tôt, mettre à jour `last_generated_at` après génération réussie
- [x] 12.4 Exposer `GET /api/config/limits` (public) : retourne les valeurs des limites configurées (anon TTL, rate limits, YAML max size) pour que le frontend puisse les afficher

## 13. Anonymous UX — Frontend

- [x] 13.1 Implémenter le composant `ExpiryWarningBanner` : calcule le temps restant depuis `expires_at`, affiche le bandeau approprié selon les seuils, recalculé à chaque sauvegarde / génération
- [x] 13.2 Implémenter le bouton `YamlDownloadButton` dans la toolbar de l'éditeur : déclenche `blob:` download du contenu courant de l'éditeur sans appel API
- [x] 13.3 Créer la page 404 session expirée (`/404-session`) : logo CVWonder, message humoristique, bouton "Créer une nouvelle session", lien vers `/login`
- [x] 13.4 Distinguer la 404 session de la 404 générique dans le router : les routes `/studio?session={id}` et `/s/{id}/{token}` avec réponse 404 backend redirigent vers `/404-session`
- [x] 13.5 Implémenter le composant `PrivacyNotice` : message discret en bas de l'éditeur, texte adapté selon statut connecté/anonyme, lecture de `anon_session_ttl_hours` depuis `GET /api/config/limits`
- [x] 13.6 Désactiver temporairement le bouton "Générer" après génération : durée = délai applicable (anon ou connecté) récupéré depuis `GET /api/config/limits`

## 14. Session claiming — Frontend

- [x] 14.1 Avant de rediriger vers `GET /api/auth/login`, lire le token de session anonyme en localStorage et l'inclure dans le paramètre de claiming transmis au backend via le cookie `oauth_state`
- [x] 14.2 Après redirection post-login vers `/dashboard`, supprimer le token de session anonyme du localStorage
- [x] 14.3 Afficher dans `/dashboard` la session claimée avec un badge "Récupérée depuis votre session temporaire" si la session a été claimée lors de ce login

## 15. RGPD — Backend

- [x] 15.1 Implémenter `GET /api/auth/me` : retourne `{id, email, name, avatar_url, default_theme_id, created_at}` de l'utilisateur connecté (authentifié)
- [x] 15.2 Implémenter `DELETE /api/auth/account` : supprime en séquence — fichiers filesystem de toutes les sessions (`sessions/{id}/`), lignes `sessions` avec `user_id`, ligne `users` ; invalide le cookie `user_session` ; redirige vers la page d'accueil
- [x] 15.3 Implémenter `GET /api/auth/account/export` : génère un ZIP RGPD — `account.json` (id, email, name, avatar_url, created_at — **sans** google_sub), `README.txt`, et pour chaque session un dossier `sessions/{name}/` avec `metadata.json`, `resume.yaml` (si non purgé), `cv.html` (si présent) ; retourner en `Content-Disposition: attachment`

## 16. RGPD — Frontend

- [x] 16.1 Créer la page / section "Mon compte" dans le dashboard : affiche avatar, nom, email, date d'inscription
- [x] 16.2 Implémenter le bouton "Télécharger mes données" : appelle `GET /api/auth/account/export` et déclenche le téléchargement du ZIP
- [x] 16.3 Implémenter la zone de danger "Supprimer mon compte" : ouvre un dialog de confirmation avec le texte de mise en garde, un lien "Télécharger mes données avant de continuer", et deux boutons "Annuler" / "Supprimer définitivement"
- [x] 16.4 Après confirmation de suppression, appeler `DELETE /api/auth/account`, vider le store Zustand utilisateur, et rediriger vers la page d'accueil

## 17. Bandeau viewer (/p/{id})

- [x] 17.1 Backend — Injecter le bandeau HTML dans la réponse `/p/{session_id}` : footer sticky avec logo CVWonder + CTA "Créer mon CV" ; inclure le bouton PDF uniquement si `pdf_export_enabled = true` dans `system_config`
- [x] 17.2 Frontend — Créer le composant `ViewerBandeau` (affiché sur la page `/p/{id}`) : logo CVWonder cliquable, CTA "Créer mon CV" → `/`, bouton PDF conditionnel
- [x] 17.3 S'assurer que le bandeau est visible sans gêner la lecture du CV (z-index, fond semi-transparent ou opaque)

## 18. Analytics — Compteur de vues

- [x] 18.1 Backend — Middleware `IncrementViewCount` sur `GET /p/{session_id}` : exclure le propriétaire (décoder cookie `user_session`, comparer `user_id` au `user_id` de la session) ; exclure les User-Agents bots connus (`Googlebot`, `bingbot`, `facebookexternalhit`, `Twitterbot`, `LinkedInBot`, `Slackbot`) ; incrémenter `view_count` et `last_viewed_at` pour tous les autres
- [x] 18.2 Frontend — Afficher `view_count` et `last_viewed_at` dans `SessionCard` du dashboard lorsque la session possède un `share_token_hash` (icône œil + compteur + date)

## 19. Labels/tags

- [x] 19.1 Backend — Implémenter `PATCH /api/sessions/{id}/tags` : body `{action: "add"|"remove", tag: string}` ; validation max 10 tags, max 30 chars, unicité ; propriétaire uniquement ; retourne HTTP 422 avec message si limite atteinte
- [x] 19.2 Backend — Valider les caractères autorisés dans le tag (alphanumérique, tirets, underscores) pour éviter l'injection
- [x] 19.3 Frontend — Créer le composant `TagInput` : champ de saisie avec auto-complétion des tags existants de l'utilisateur (requête `GET /api/users/me/tags` — liste dédupliquée des tags de toutes ses sessions) ; ajout par Entrée ou virgule ; suppression par croix
- [x] 19.4 Frontend — Intégrer `TagInput` dans `SessionCard` (édition inline) et dans le formulaire de création de session
- [x] 19.5 Frontend — Créer le composant `TagFilter` dans le dashboard : barre de chips de tags ; sélection multiple avec logique AND ; désélection par clic
- [x] 19.6 Backend — Exposer `GET /api/users/me/tags` : retourne la liste dédupliquée et triée de tous les tags de l'utilisateur connecté (toutes sessions confondues)

## 20. Préférence thème par défaut

- [x] 20.1 Backend — Implémenter `PATCH /api/users/me/default-theme` : body `{theme_id: string|null}` ; vérifie que le thème existe si non null ; met à jour `default_theme_id` sur `users` ; propriétaire uniquement
- [x] 20.2 Frontend — Ajouter une section "Thème par défaut" dans la page paramètres de compte : sélecteur de thème identique à celui de l'éditeur, bouton "Réinitialiser"
- [x] 20.3 Frontend — Au montage du formulaire de création de session, lire `user.default_theme_id` depuis le store et pré-sélectionner le thème correspondant dans le sélecteur de thème

## 11. Config et déploiement

- [x] 11.1 Ajouter `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `USER_TOKEN_SECRET` dans `docker-compose.yml` et `infra/k8s/deployment.yaml`
- [x] 11.2 Mettre à jour `infra/k8s/deployment.yaml` : ajouter les nouvelles variables en référence à un Secret K8s `cvwonder-user-auth`
- [x] 11.3 Documenter la procédure de création des credentials Google OAuth dans le README (section "Configuration")
- [x] 11.4 Vérifier que le job de purge ne tourne qu'une seule fois en cas de déploiement multi-replicas (idempotence requise)
