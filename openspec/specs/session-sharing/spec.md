## ADDED Requirements

### Requirement: Les utilisateurs connectés peuvent générer un lien de partage pour une session
Le système SHALL permettre à l'utilisateur connecté de générer un token de partage pour une session lui appartenant. Le token brut SHALL être retourné une seule fois au client. Le lien de partage SHALL avoir la forme `/s/{session_id}/{plain_token}`.

#### Scenario: Génération d'un lien de partage
- **WHEN** un utilisateur connecté clique sur "Partager" pour une de ses sessions
- **THEN** le backend génère 32 bytes aléatoires, stocke `sha256(token)` dans `share_token_hash`, et retourne le lien complet au client une seule fois

#### Scenario: Révocation du lien de partage
- **WHEN** un utilisateur connecté révoque le lien de partage
- **THEN** `share_token_hash` est mis à NULL en DB et le lien précédent cesse de fonctionner (HTTP 404)

#### Scenario: Accès avec un token de partage invalide
- **WHEN** un visiteur accède à `/s/{session_id}/{token}` avec un token incorrect
- **THEN** le système retourne HTTP 403 sans exposer si la session existe

### Requirement: L'accès via lien de partage est en lecture seule
Un visiteur accédant via lien de partage SHALL voir l'éditeur YAML en lecture seule (Monaco en mode readonly) et le preview. Il ne SHALL PAS pouvoir sauvegarder, archiver, supprimer, ou modifier la session.

#### Scenario: Chargement de l'éditeur en mode partagé
- **WHEN** un visiteur accède à `/s/{session_id}/{token}` avec un token valide
- **THEN** l'éditeur est affiché en mode lecture seule ; toutes les actions de modification sont masquées ou désactivées

#### Scenario: Tentative de sauvegarde via API sur une session partagée
- **WHEN** un client envoie PATCH `/api/sessions/{id}` sans être le propriétaire de la session
- **THEN** le backend retourne HTTP 403

### Requirement: Les utilisateurs connectés peuvent protéger un lien de partage par mot de passe
Le système SHALL permettre d'ajouter un mot de passe au lien de partage. Le mot de passe SHALL être stocké sous forme de hash bcrypt dans `share_password_hash`. Les visiteurs du lien SHALL saisir le mot de passe avant d'accéder à la session.

#### Scenario: Activation de la protection par mot de passe
- **WHEN** l'utilisateur définit un mot de passe lors de la génération ou après coup
- **THEN** `share_password_hash` est mis à jour ; le lien de partage reste le même

#### Scenario: Accès à une session protégée par mot de passe
- **WHEN** un visiteur accède à un lien de partage protégé
- **THEN** une invite de saisie du mot de passe est affichée avant l'éditeur

#### Scenario: Mot de passe incorrect
- **WHEN** un visiteur saisit un mot de passe incorrect
- **THEN** le système retourne HTTP 403 ; un délai minimal (rate limiting) est appliqué

#### Scenario: Mot de passe correct
- **WHEN** un visiteur saisit le mot de passe correct
- **THEN** l'éditeur en lecture seule est affiché

### Requirement: Une URL publique permet de consulter le CV rendu sans éditeur
Le système SHALL exposer la route `/p/{session_id}` qui sert le fichier HTML pré-généré de la session. Si le HTML n'a pas encore été généré, la page SHALL afficher un message d'attente. Si la session est protégée par un share token, `/p/{session_id}` SHALL également vérifier le token ou le mot de passe.

#### Scenario: Consultation du CV rendu via /p/{id}
- **WHEN** un visiteur navigue vers `/p/{session_id}` pour une session avec HTML généré
- **THEN** le HTML généré est servi directement avec Content-Type text/html

#### Scenario: Session sans HTML généré
- **WHEN** un visiteur navigue vers `/p/{session_id}` pour une session sans génération
- **THEN** le système affiche un message "Ce CV n'a pas encore été généré"

#### Scenario: Bandeau "aperçu non à jour"
- **WHEN** le YAML a été modifié après la dernière génération HTML
- **THEN** un bandeau informatif est affiché sur la page `/p/{id}` pour signaler que l'aperçu peut ne pas être à jour

### Requirement: La page CV publique affiche un bandeau branding non-intrusif
Le système SHALL afficher un bandeau footer sticky sur toute page `/p/{session_id}` contenant : le logo CVWonder avec lien vers la page d'accueil, un CTA "Créer mon CV". Si la feature `pdf_export_enabled` est activée dans `system_config`, un bouton "Télécharger le PDF" SHALL également être affiché.

#### Scenario: Bandeau affiché sur /p/{id} avec génération HTML disponible
- **WHEN** un visiteur consulte `/p/{session_id}` avec un HTML généré
- **THEN** un bandeau footer sticky est affiché avec le logo CVWonder et le CTA "Créer mon CV"

#### Scenario: Bouton PDF conditionnel à la feature flag
- **WHEN** `pdf_export_enabled = true` dans `system_config` et un visiteur consulte `/p/{session_id}`
- **THEN** le bouton "Télécharger le PDF" est affiché dans le bandeau

#### Scenario: Bouton PDF absent si feature désactivée
- **WHEN** `pdf_export_enabled = false` (ou absent) dans `system_config`
- **THEN** le bandeau s'affiche sans bouton PDF

### Requirement: Les vues de la page CV publique sont comptées
Le système SHALL incrémenter le compteur `view_count` de la session et mettre à jour `last_viewed_at` à chaque accès à `/p/{session_id}`, sauf si l'accès provient du propriétaire de la session (cookie `user_session` valide correspondant au `user_id` de la session) ou d'un agent bot connu.

#### Scenario: Vue comptée pour un visiteur anonyme
- **WHEN** un visiteur sans cookie `user_session` (ou avec un cookie d'un autre utilisateur) accède à `/p/{session_id}`
- **THEN** `view_count` est incrémenté de 1 et `last_viewed_at` est mis à jour

#### Scenario: Vue non comptée pour le propriétaire
- **WHEN** le propriétaire de la session accède à `/p/{session_id}` avec son cookie `user_session` valide
- **THEN** `view_count` n'est pas incrémenté

#### Scenario: Vue non comptée pour un bot connu
- **WHEN** une requête sur `/p/{session_id}` présente un User-Agent identifié comme bot (ex. Googlebot, bingbot)
- **THEN** `view_count` n'est pas incrémenté

#### Scenario: Affichage du compteur dans le dashboard
- **WHEN** un utilisateur connecté consulte le dashboard et qu'une de ses sessions a `share_token_hash IS NOT NULL`
- **THEN** le nombre de vues et la date de dernière vue sont affichés sur la SessionCard

### Requirement: Le lien de partage peut avoir une durée de vie optionnelle
Le système SHALL permettre à l'utilisateur connecté de définir une durée de vie lors de la génération d'un lien de partage. Les durées SHALL être : 7 jours, 30 jours, ou illimitée (défaut). La durée de vie SHALL être stockée dans `share_expires_at TIMESTAMPTZ NULL` sur la session (NULL = illimité). L'API `POST /api/sessions/:id/share` SHALL accepter un paramètre optionnel `{ duration: "7d" | "30d" | null }`.

#### Scenario: Génération d'un lien avec durée de vie définie
- **WHEN** un utilisateur connecté génère un lien de partage avec `duration: "7d"`
- **THEN** le backend stocke `share_expires_at = NOW() + 7 days` et retourne le lien ; le lien est fonctionnel jusqu'à cette date

#### Scenario: Génération d'un lien sans durée de vie (illimité)
- **WHEN** un utilisateur connecté génère un lien de partage sans paramètre `duration` (ou `duration: null`)
- **THEN** le backend stocke `share_expires_at = NULL` et le lien n'expire jamais sauf révocation explicite

#### Scenario: Accès à un lien de partage expiré
- **WHEN** un visiteur accède à `/s/{session_id}/{token}` et que `share_expires_at < NOW()`
- **THEN** le système retourne HTTP 404 (même comportement qu'un token invalide)

#### Scenario: Révocation remet share_expires_at à NULL
- **WHEN** un utilisateur connecté révoque un lien de partage
- **THEN** `share_token_hash`, `share_password_hash` ET `share_expires_at` sont remis à NULL en DB

#### Scenario: Affichage "lien expiré" sur la SessionCard
- **WHEN** un utilisateur connecté consulte le dashboard et qu'une de ses sessions a `share_token_hash IS NOT NULL` et `share_expires_at < NOW()`
- **THEN** la SessionCard affiche l'indicateur "🔗 Partagée · lien expiré" et propose un CTA "Recréer un lien"

#### Scenario: Affichage de la date d'expiration sur la SessionCard
- **WHEN** un utilisateur connecté consulte le dashboard et qu'une de ses sessions a `share_expires_at IS NOT NULL` et `share_expires_at > NOW()`
- **THEN** la SessionCard affiche la durée restante du lien (ex. "🔗 Partagée · expire dans 5 jours")

### Requirement: Les utilisateurs connectés peuvent régénérer un lien de partage existant
Le système SHALL permettre à l'utilisateur connecté de régénérer un nouveau lien de partage pour une session déjà partagée, sans avoir à passer par une révocation manuelle préalable. La dialog "Gérer le partage" SHALL afficher un message explicatif et un bouton "Révoquer et créer un nouveau lien" lorsque la session est déjà partagée et que le lien original n'est plus récupérable.

#### Scenario: Dialog "Gérer le partage" sur une session déjà partagée
- **WHEN** un utilisateur connecté ouvre la dialog "Gérer le partage" sur une session dont `share_token_hash IS NOT NULL`
- **THEN** la dialog affiche un message indiquant que le lien original ne peut plus être affiché, ainsi qu'un bouton "Révoquer et créer un nouveau lien"

#### Scenario: Régénération du lien de partage
- **WHEN** l'utilisateur clique "Révoquer et créer un nouveau lien" dans la dialog
- **THEN** l'ancien token est révoqué, un nouveau token est généré, et le nouveau lien est affiché immédiatement dans la dialog pour copie

#### Scenario: Échec partiel lors de la régénération
- **WHEN** la révocation réussit mais la création du nouveau lien échoue
- **THEN** la dialog affiche un message d'erreur ; le bouton "Partager" reste disponible pour retenter la création
