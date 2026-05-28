## MODIFIED Requirements

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
