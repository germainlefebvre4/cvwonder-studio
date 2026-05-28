## Context

Le dashboard utilisateur est fonctionnel en apparence mais cassé en pratique pour tout utilisateur connecté via Google OAuth. Trois bugs structurellement liés empêchent l'usage normal :

1. `GET /api/sessions` ne retourne pas `active` / `max` → quota bar affiche NaN
2. La session list ne retourne jamais le raw token (stocké uniquement en hash) → lien "Ouvrir" pointe vers `/studio/undefined`
3. `claimAnonSession` ne prolonge pas le TTL → sessions réclamées expirent en 24h

La racine commune des bugs 1 et 2 est l'absence d'un endpoint `GET /api/sessions/:id` (owner-only, avec `yaml_content`) qui permettrait l'accès au studio par UUID plutôt que par raw token.

## Goals / Non-Goals

**Goals:**
- Quota bar fonctionnelle avec valeurs réelles depuis `system_config`
- Quota enforced de façon cohérente dans Create, Duplicate, et exposé dans List
- Lien "Ouvrir" fonctionnel via `?session=:uuid` (accès studio authentifié)
- Sessions réclamées lors du login prolongées au TTL utilisateur (30j par défaut)

**Non-Goals:**
- Pagination du dashboard
- Changements de schéma DB ou migrations sqlc
- Stocker le raw token en DB (dégradation sécurité, rejeté en exploration)
- Modifier l'accès `/studio/:token` pour les sessions anonymes/partagées

## Decisions

### D1 — Accès studio authentifié via `?session=:uuid` (Option A du spec)

**Choix** : Ajouter le query param `?session=:uuid` dans l'URL studio pour les sessions propriétaires.

**Rationale** : Le spec dit explicitement `"/studio?session={id}"`. L'alternative (UUID dans le path param `:token`) est ambiguë et non conforme. Le query param est sémantiquement explicite : `?session=` = mode auth, `:token` = mode anon.

**Alternatif rejeté** : Stocker le raw token en DB — change le modèle de sécurité, casse les sessions existantes (pas de backfill possible).

**Alternatif rejeté** : UUID dans `/studio/:token` — non conforme spec, moins lisible.

### D2 — `configRepo` injecté dans `UserSessionHandler`

**Choix** : Passer `configRepo *repository.ConfigRepository` au constructeur de `UserSessionHandler`.

**Rationale** : Cohérent avec `GenerationHandler` qui fait déjà la même chose. Permet que les changements de `max_sessions_per_user` via le panel admin soient reflétés sans restart. Une query SQL triviale indexée par clé sur `system_config` est négligeable en performance.

**Alternatif rejeté** : Config statique au constructeur — ne reflète pas les changements admin en live.

### D3 — Claiming TTL via deux appels séquentiels (Option B)

**Choix** : Après `ClaimAnonymousSession`, appeler `UpdateTTL` séparément avec `NOW() + userSessionTTLDays`.

**Rationale** : Réutilise `UpdateTTL` qui existe déjà. Évite de toucher sqlc (pas de `make sqlc-gen` nécessaire). La claiming est une opération rare (une fois par login) — deux DB writes sont parfaitement acceptables.

**Alternatif rejeté** : Modifier la SQL `ClaimAnonymousSession` pour ajouter `expires_at = $3` — atomique mais requiert sqlc-regen sans autre bénéfice notable.

### D4 — Suppression de `queries *db.Queries` dans `AuthHandler`

**Choix** : Supprimer la dépendance morte `queries *db.Queries` de `AuthHandler` lors du changement de constructeur.

**Rationale** : Ce champ n'est jamais utilisé (aucune occurrence de `h.queries` dans `auth.go`). Le constructeur est déjà modifié pour ajouter `userSessionTTLDays` — c'est le bon moment pour nettoyer.

### D5 — Nouveau endpoint `GET /api/sessions/:id` (owner-only, yaml_content inclus)

**Choix** : Ajouter un handler `GetSession(c)` dans `UserSessionHandler` qui vérifie l'ownership et retourne la session complète incluant `yaml_content`.

**Rationale** : C'est la seule pièce manquante côté backend pour le lien "Ouvrir". Le studio page charge les données via cet endpoint quand `?session=:uuid` est présent, avec les mêmes champs que `GET /api/v1/sessions/:token`.

### D6 — Redirect-first dans le callback OAuth

**Choix** : Tout chemin d'erreur "utilisateur" dans `Callback()` retourne une redirection HTTP 302 vers `frontendBaseURL + "/login?error=..."` plutôt qu'un `c.JSON(4xx)`.

**Rationale** : Le callback OAuth est un endpoint navigateur. Quand Google redirige le browser vers `/api/auth/callback`, si le backend retourne du JSON, le navigateur affiche du texte brut — l'utilisateur est bloqué sans retour possible. Les erreurs serveur (500 : DB down, réseau Google) peuvent rester en JSON puisqu'elles ne sont pas dues à une action utilisateur et nécessitent un diagnostic différent.

**Cas traités** : `c.Query("error") != ""` (Google refuse ou access_denied), cookie `oauth_state` manquant (expiré en 5min), state mismatch (CSRF échoué), signature state invalide, `code` absent (fallback), `Exchange()` échoué (code expiré/déjà utilisé).

**Alternatif rejeté** : Garder les JSON 400/401 — UX cassée (page blanche JSON dans le navigateur).

## Risks / Trade-offs

**[Race condition claiming]** Entre `ClaimAnonymousSession` et `UpdateTTL`, la session pourrait théoriquement être supprimée (purge job). → Mitigation : `UpdateTTL` sur une session inexistante retourne simplement no-rows, loggé silencieusement. Fonctionnellement sans impact.

**[`ClaimAnonymousSession` retourne `ErrNoRows` comme erreur]** Si la session expire entre `GetByTokenHash` et le `UPDATE`, sqlc retourne `pgx.ErrNoRows` qui est loggué comme warning parasite. → Mitigation : distinguer `pgx.ErrNoRows` (silent ignore) des vraies erreurs DB dans `claimAnonSession`.

**[Quota enforced dans Create mais pas dans le usecase]** Le check quota dans `SessionHandler.Create` est dans la couche HTTP, pas dans `CreateUsecase`. Une API directe (tests, future CLI) pourrait contourner. → Acceptable pour l'instant ; non-goal de refactorer le usecase dans ce changement.

## Migration Plan

Aucune migration DB requise. Aucun changement sqlc. Déploiement direct — les changements sont addictifs (nouveau endpoint, nouveaux champs en réponse JSON). Les clients qui ne lisent pas `active`/`max` sont inaffectés.
