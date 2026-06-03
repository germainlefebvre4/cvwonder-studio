## ADDED Requirements

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
