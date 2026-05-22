## Context

cvwonder-studio utilise un backend Go/Gin + SPA React/Vite. Les sessions sont aujourd'hui entièrement anonymes — la table `sessions` n'a pas de colonne `user_id`. L'admin est un modèle mono-utilisateur basé sur des variables d'env (bcrypt + cookie HMAC-signé). Il n'existe aucune table `users`, aucun flux OAuth, et aucune notion de "session protégée" ou "session partagée".

Le `system_config` (clé/valeur) existe déjà pour les réglages admin. Le backend utilise sqlc + pgx/v5, les migrations golang-migrate.

## Goals / Non-Goals

**Goals:**
- Authentification Google OAuth pour les utilisateurs finaux (flux séparé de l'admin)
- Table `users` liée aux sessions existantes
- Gestion de cycle de vie des sessions pour utilisateurs connectés (nommage, TTL, archivage, duplication, changement de thème)
- Partage de session via lien ; protection optionnelle par mot de passe
- URL publique pour consulter le CV rendu sans éditeur
- Export ZIP (YAML + HTML)
- Tableau de bord `/dashboard` pour les utilisateurs connectés

**Non-Goals:**
- Authentification autre que Google (GitHub, email/password) — v1 uniquement Google
- Multi-provider OAuth simultané
- Collaboration temps réel (WebSocket, CRDT)
- Historique de versions YAML (git-like) — complexité trop grande pour v1
- Notifications (email, push) à l'expiration de session
- Profil public avec galerie de CVs

## Decisions

### D1 — OAuth Google via `golang.org/x/oauth2` (pas de lib tierce lourde)

**Décision :** Utiliser `golang.org/x/oauth2` + `golang.org/x/oauth2/google` pour le flux Authorization Code. Échange du code en token via le tokeninfo endpoint Google pour obtenir le `sub` (identifiant stable), l'email et le nom.

**Alternatives :**
- `github.com/markbates/goth` : trop de providers inutiles, complexité de session supplémentaire
- Implémentation manuelle `net/http` : duplication de code OAuth standard, gestion d'erreur fragile

**Rationale :** `golang.org/x/oauth2` est le package canonique Go pour OAuth2, minimaliste, sans dépendances indirectes lourdes.

### D2 — Cookie utilisateur : HMAC-signé, même pattern que l'admin

**Décision :** Payload `{sub: "<user_uuid>", exp: <unix>}` signé HMAC-SHA256 avec `USER_TOKEN_SECRET` env var. Cookie `user_session` HttpOnly, Secure, SameSite=Lax (Lax vs Strict pour permettre les callbacks OAuth cross-site).

**Alternatives :**
- JWT avec lib externe : inutile, même résultat avec le pattern HMAC déjà en place
- Session DB (table `user_sessions`) : nécessaire uniquement si révocation de session utilisateur individuelle est requise — pas dans le scope v1

**Rationale :** Cohérence avec le pattern admin existant. `SameSite=Lax` requis pour que le callback OAuth (redirect depuis Google) dépose le cookie correctement.

### D3 — Limite session anonyme via token localStorage (pas IP)

**Décision :** À la création d'une session anonyme, le backend retourne le `session_token` brut (déjà le cas). Le frontend le persiste en `localStorage`. Avant toute création de session anonyme, le frontend vérifie si un token existe et redirige vers la session existante.

**Alternatives :**
- Limite IP : contournable avec IPv6/CGNAT, problèmes RGPD de logging d'IP
- Fingerprinting navigateur : privacy-invasive, peu fiable

**Rationale :** La limite est UX, pas sécurité. Si l'utilisateur efface son localStorage, il peut recréer — c'est acceptable. L'objectif est d'éviter l'accumulation involontaire, pas d'empêcher l'abus (l'admin peut purger via l'interface admin).

### D4 — États de session : colonnes DB (pas enum)

**Décision :** Modéliser les états via deux colonnes sur `sessions` :
- `is_archived BOOLEAN DEFAULT FALSE` — archivée explicitement par l'utilisateur
- `archived_at TIMESTAMPTZ NULL` — horodatage d'archivage (pour calculer la rétention 30j)
- `expires_at` existant — TTL de la session active

La "session inactive" = `is_archived = TRUE` OU `expires_at < NOW()`. Purge automatique : `archived_at < NOW() - INTERVAL '30 days'` OU `expires_at < NOW() - INTERVAL '30 days'`.

**Alternatives :**
- Enum `status` (active/archived/expired/purged) : plus expressif mais rigide à faire évoluer, et `expires_at` fait déjà le travail pour l'expiration

**Rationale :** Minimal, compatible avec les queries sqlc existantes, extensible.

### D5 — Share token : hashé en DB, plain retourné une seule fois

**Décision :** À la création d'un lien de partage, générer 32 bytes aléatoires, retourner `base64url(token)` au client **une seule fois**, stocker `sha256(token)` en DB colonne `share_token_hash TEXT NULL`. Le lien de partage = `/s/{session_id}/{plain_token}`.

**Alternatives :**
- Token en clair en DB : risque si dump DB
- UUID comme share ID : moins entropique, mais suffisant — rejeté par cohérence avec le pattern `token_hash` existant sur les sessions

**Rationale :** Même pattern que le `token_hash` existant. Cohérence maximale avec le code existant.

### D6 — Protection du partage : bcrypt du mot de passe

**Décision :** Si l'utilisateur protège son lien, stocker `bcrypt(password, cost=12)` dans `share_password_hash TEXT NULL`. Le visiteur doit saisir le mot de passe avant d'accéder à la session partagée.

**Alternatives :**
- Token d'accès séparé (2 tokens) : complexité inutile
- Chiffrement du YAML : lourd, inutile si l'objectif est juste de restreindre l'accès à l'éditeur

**Rationale :** Pattern bcrypt déjà utilisé pour l'admin. Minimal et éprouvé.

### D7 — URL publique CV : `/p/{session_id}` — HTML pré-généré servi depuis filesystem

**Décision :** `/p/{session_id}` lit le fichier HTML pré-généré dans `sessions/{id}/output.html` (ou équivalent) et le retourne directement avec `Content-Type: text/html`. Pas de re-génération à la demande.

**Alternatives :**
- Génération à la demande sur `/p/` : latence, load CVWonder binary à chaque visite
- Stockage du HTML en DB : BLOB lourd, sessions déjà volumineuses

**Rationale :** Le HTML est déjà généré et stocké sur le filesystem lors de l'édition. Servir ce fichier est trivial et performant.

### D8 — Changement de thème : autorisé post-création pour les utilisateurs connectés

**Décision :** Ajouter une mutation PATCH `/api/sessions/{id}` avec champ `theme_id` pour les sessions appartenant à un utilisateur connecté. Invalider le cache de génération et reconstruire le preview.

**Alternatives :**
- Rester immuable : simplifie la logique mais dégrade l'UX connectée
- Duplication automatique : crée une nouvelle session — trop lourd pour un simple changement de thème

**Rationale :** Le changement de thème est une opération fréquente pour les utilisateurs qui ont plusieurs CVs. La contrainte d'immutabilité était une simplification pour les sessions anonymes.

### D9 — Sessions anonymes : TTL 24h, suppression immédiate à expiration

**Décision :** Les sessions dont `user_id IS NULL` ont un TTL de 24h (configurable via `system_config` clé `anon_session_ttl_hours`, défaut `24`). À l'expiration, elles sont **entièrement supprimées** (ligne DB + fichiers filesystem). Pas de rétention 30j pour les anonymes.

**Alternatives :**
- Rétention 30j pour tous (anonymes inclus) : surcharge le stockage, encourage la passivité vis-à-vis de la connexion
- TTL fixe non configurable : moins flexible pour l'opérateur

**Rationale :** La suppression immédiate renforce la confidentialité (PII minimisée), crée une incitation naturelle à se connecter, et simplifie la logique de purge. Les utilisateurs connectés bénéficient de la rétention 30j uniquement pour leurs sessions archivées.

### D10 — Session claiming : transfert de session anonyme au login

**Décision :** Si le frontend détecte un token de session anonyme valide en `localStorage` au moment du clic "Se connecter avec Google", il l'inclut dans le paramètre `state` du flux OAuth (encodé dans le cookie `oauth_state`). À la réception du callback, le backend tente de lier `user_id` à la session anonyme si elle existe encore et n'a pas expiré. Le token localStorage est ensuite supprimé.

**Alternatives :**
- POST séparé après login : nécessite une coordination frontend complexe post-callback
- Paramètre query string sur le callback URL : expose le token dans les logs serveur

**Rationale :** Inclure la référence dans le cookie HMAC `oauth_state` est sécurisé (cookie HttpOnly, signé), ne modifie pas le flux OAuth standard, et simplifie la coordination backend.

### D11 — Rate limiting IP via `golang.org/x/time/rate` (in-process)

**Décision :** Middleware Gin utilisant un `map[string]*rate.Limiter` indexé par IP (extrait de `X-Forwarded-For` ou `RemoteAddr`). Nettoyage périodique des entrées inactives (ticker 10min). Limite par défaut : 3 créations de session / heure / IP, configurable via `system_config`.

**Alternatives :**
- Rate limiting au niveau nginx/ingress : plus robuste en multi-replica mais nécessite config infra
- Redis-backed rate limiter : pas de Redis dans le stack actuel, surcharge d'infrastructure

**Rationale :** Pour un usage mono-replica (cas courant en self-hosted), `time/rate` in-process est suffisant et zéro-dépendance. En multi-replica K8s, l'opérateur peut compléter avec les annotations nginx-ingress (`nginx.ingress.kubernetes.io/limit-rps`).

### D12 — Rate limit génération : `last_generated_at` en DB, différencié anon/connecté

**Décision :** Ajouter `last_generated_at TIMESTAMPTZ NULL` à la table `sessions`. À chaque requête de génération, le backend vérifie `NOW() - last_generated_at < throttle_interval`. Deux clés `system_config` : `anon_generation_rate_limit_seconds` (défaut `5`) et `connected_generation_rate_limit_seconds` (défaut `2`). Compatible multi-replica.

**Alternatives :**
- Rate limit in-memory par session : perdu au redémarrage du process, pas multi-replica
- Compteur de générations max : limite absolue vs limite temporelle — la limite temporelle est moins frustrante

**Rationale :** Utiliser la DB est cohérent avec l'architecture existante (sqlc + pgx). `last_generated_at` est utile aussi pour le bandeau "aperçu non à jour" de `/p/{id}`.

### D13 — Avertissements progressifs d'expiration : timings via `system_config`

**Décision :** Deux clés configurables : `anon_expiry_warn_1_hours` (défaut `2`) et `anon_expiry_warn_2_hours` (défaut `0.5`). Le frontend calcule `expires_at - now()` à chaque chargement de l'éditeur et affiche le bandeau approprié. Pas de polling serveur — le frontend lit `expires_at` depuis la réponse GET session.

**Alternatives :**
- Polling WebSocket : overkill pour un simple bandeau
- Server-Sent Events : inutile, l'utilisateur rafraîchit naturellement la page ou sauvegarde

**Rationale :** Simple, sans infrastructure supplémentaire. Le frontend calcule localement le temps restant à partir de `expires_at` déjà exposé par l'API.

### D14 — RGPD suppression de compte : suppression immédiate en cascade

**Décision :** `DELETE /api/auth/account` (authentifié) déclenche en séquence : suppression filesystem de tous les dossiers `sessions/{id}/` liés à l'utilisateur, suppression de toutes les lignes `sessions` avec `user_id = user_id`, suppression de la ligne `users`, suppression du cookie `user_session`. Pas de délai de grâce, pas de soft-delete.

**Alternatives :**
- Délai de grâce 14 jours : protection contre suppression accidentelle, mais complexité état `pending_deletion`
- Soft-delete : conserve les données en DB — incompatible avec le droit à l'effacement effectif

**Rationale :** Suppression immédiate = conformité RGPD Art. 17 sans ambiguïté. Le bouton "Télécharger mes données" (export) doit être proposé juste avant la suppression dans l'UI pour éviter les regrets.

### D15 — Analytics view_count : exclusion propriétaire + filtre User-Agent basique

**Décision :** `GET /p/{session_id}` incrémente `view_count` et met à jour `last_viewed_at` sur la session, **sauf si** : (a) le cookie `user_session` décodé correspond au `user_id` propriétaire de la session, ou (b) le header `User-Agent` contient un token de bot connu (`Googlebot`, `bingbot`, `facebookexternalhit`, etc.). Pas de stockage d'IP ni d'identifiant du visiteur.

**Alternatives :**
- Redis HyperLogLog (comptage unique) : sans IP du visiteur, le comptage unique est impossible de toute façon
- Stockage par jour (time-series) : overkill pour un compteur simple

**Rationale :** Zéro donnée personnelle du visiteur collectée → exempt de consentement RGPD. L'exclusion propriétaire évite le gonflement artificiel lors de ses propres vérifications.

### D16 — Labels/tags : `TEXT[]` PostgreSQL avec GIN index, validation backend

**Décision :** Colonne `tags TEXT[] NOT NULL DEFAULT '{}'` sur `sessions`. Index `GIN` sur `tags`. Validation backend : max 10 tags par session, max 30 caractères par tag, tag = chaîne alphanumériqueé avec tirets et underscores, unicité dans le tableau enforced côté backend (pas de doublon). Renommage global = opération client (supprimer + ajouter).

**Alternatives :**
- Table `session_tags` (normalisée) : requêtes plus complexes, JOIN supplémentaire — inutile pour max 10 tags
- Enum prédéfini : trop rigide pour des tags personnels

**Rationale :** Le `TEXT[]` PostgreSQL avec GIN est la solution canonique pour ce cas. Simple à requêter (`@>`, `&&`, `ANY`). La validation est entièrement côté backend pour éviter l'injection de valeurs arbitraires.

### D17 — Bandeau viewer `/p/{id}` : toujours affiché, PDF conditionnel

**Décision :** Toutes les pages `/p/{id}` affichent un bandeau non-intrusif en bas (footer sticky) : logo CVWonder + lien vers la home avec CTA "Créer mon CV". Le bouton "Télécharger le PDF" est affiché uniquement si la feature flag PDF export est activée (clé `system_config` `pdf_export_enabled = true`, intégration avec le change `pdf-export-k8s`). Pas d'opt-out possible pour l'owner en v1.

**Alternatives :**
- Bandeau en header : trop intrusif, couvre le CV
- Opt-out (branding premium) : feature future, pas en scope

**Rationale :** Footer sticky = visible sans gêner la lecture du CV. Le PDF conditionnel évite d'afficher un bouton non fonctionnel sur les instances sans PDF export.

### D18 — Préférence thème par défaut : colonne nullable sur `users`

**Décision :** Colonne `default_theme_id UUID NULL REFERENCES themes(id) ON DELETE SET NULL` sur `users`. Définie uniquement via la page profil/settings dans le dashboard. À la création de session, le frontend lit `user.default_theme_id` depuis le store et pré-sélectionne le sélecteur de thème. L'utilisateur peut surcharger à la création.

**Alternatives :**
- Checkbox "mémoriser" sur la page de création : surprenant à chaque utilisation
- Stockage en localStorage : perdu à chaque navigateur, incohérent avec le compte

**Rationale :** `ON DELETE SET NULL` gère automatiquement la suppression du thème par défaut (l'admin peut supprimer un thème sans casser le compte utilisateur).

## Risks / Trade-offs

- **[Risque] Révocation de session utilisateur impossible** → Mitigation : rotation de `USER_TOKEN_SECRET` invalide toutes les sessions ; acceptable pour v1
- **[Risque] Limite anonyme contournable** (effacer localStorage) → Mitigation : accepté volontairement (cf. D3) ; l'admin peut purger les sessions orphelines
- **[Risque] Callback OAuth bloqué par SameSite=Strict** → Mitigation : décision D2 utilise SameSite=Lax explicitement
- **[Trade-off] `/p/{id}` ne reflète pas les modifications récentes** si le HTML n'a pas été régénéré depuis la dernière sauvegarde YAML → Mitigation : afficher un bandeau "Aperçu peut ne pas être à jour" si `yaml updated_at > last_generated_at`
- **[Risque] Migration `user_id` nullable sur sessions existantes** → Mitigation : colonne nullable, sessions anonymes existantes conservées sans user_id ; pas de backfill requis
- **[Risque] Rate limiting IP inefficace en multi-replica** → Mitigation : documenté (cf. D11) ; opérateur peut compléter avec annotations nginx-ingress
- **[Risque] Session claiming échoue si session anonyme expire pendant le flux OAuth** (> 24h) → Mitigation : silently ignored — le claiming est best-effort ; l'utilisateur repart d'une session vide
- **[Trade-off] Timings d'expiration calculés côté frontend** → sans polling, un utilisateur qui laisse son éditeur ouvert plusieurs heures peut ne pas voir le bandeau se mettre à jour ; Mitigation : le bandeau est recalculé à chaque interaction (sauvegarde, génération)

## Open Questions

- ~~Le `state` CSRF OAuth est-il stocké en DB ou en cookie signé ?~~ → **Décidé** : cookie `oauth_state` signé HMAC (D10)
- Quelle durée par défaut pour le TTL d'une session connectée ? (Proposition : 90 jours par défaut vs 24h pour les anonymes)
- Le lien de partage donne-t-il accès à l'éditeur complet en lecture seule, ou seulement à `/p/{id}` (vue rendue) ? (Proposition : deux modes distincts — "Partager l'éditeur en lecture seule" vs "Partager le CV rendu")
