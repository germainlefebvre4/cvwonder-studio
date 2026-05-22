## ADDED Requirements

### Requirement: L'utilisateur connecté peut supprimer son compte immédiatement
Le système SHALL permettre à l'utilisateur connecté de supprimer définitivement son compte depuis la page de paramètres. La suppression SHALL être immédiate et irréversible : ligne `users` supprimée, toutes les sessions (actives, archivées) et leurs fichiers filesystem supprimés, cookie `user_session` invalidé. Une confirmation explicite SHALL être demandée avant la suppression.

#### Scenario: Suppression de compte avec confirmation
- **WHEN** un utilisateur connecté confirme la suppression de son compte dans le dialog de confirmation
- **THEN** le backend supprime en séquence : fichiers filesystem de toutes ses sessions, lignes `sessions` liées à son `user_id`, ligne `users` ; puis supprime le cookie `user_session` et redirige vers la page d'accueil

#### Scenario: Les liens partagés deviennent inactifs après suppression
- **WHEN** un visiteur accède à `/p/{session_id}` ou `/s/{session_id}/{token}` après suppression du compte propriétaire
- **THEN** le système retourne HTTP 404 (session introuvable en DB)

#### Scenario: Suppression sans confirmation
- **WHEN** l'utilisateur clique "Supprimer mon compte" sans confirmer dans le dialog
- **THEN** aucune action n'est effectuée ; le dialog se ferme

### Requirement: L'utilisateur connecté peut exporter toutes ses données personnelles
Le système SHALL permettre à l'utilisateur connecté de télécharger un ZIP contenant toutes ses données personnelles. L'export SHALL inclure : un fichier `account.json` (sans `google_sub`), et un dossier par session avec son YAML, son HTML généré (si présent), et ses métadonnées.

#### Scenario: Export de données complet
- **WHEN** un utilisateur connecté demande l'export de ses données
- **THEN** le backend génère et retourne un ZIP avec la structure : `account.json` (id, email, name, avatar_url, created_at), `sessions/{session_name}/resume.yaml`, `sessions/{session_name}/cv.html` (si généré), `sessions/{session_name}/metadata.json` (name, theme_slug, tags, created_at, expires_at, is_archived, view_count), `README.txt`

#### Scenario: Export incluant les sessions archivées avec YAML encore présent
- **WHEN** l'utilisateur exporte ses données et possède des sessions archivées dont le YAML n'a pas encore été purgé
- **THEN** ces sessions sont incluses dans l'export avec leur YAML

#### Scenario: Export incluant les sessions archivées avec YAML purgé
- **WHEN** l'utilisateur exporte ses données et possède des sessions archivées dont le YAML a été purgé (> 30j)
- **THEN** le dossier de session est inclus avec uniquement `metadata.json` ; `resume.yaml` est absent et `metadata.json` contient `"yaml_purged": true`

#### Scenario: Export proposé avant la suppression de compte
- **WHEN** l'utilisateur ouvre le dialog de suppression de compte
- **THEN** un lien "Télécharger mes données avant de continuer" est affiché dans le dialog avant la confirmation

### Requirement: La page de paramètres de compte est accessible depuis le dashboard
Le système SHALL proposer une section "Mon compte" dans le dashboard permettant d'accéder aux actions RGPD (export et suppression) et aux préférences utilisateur.

#### Scenario: Accès aux paramètres de compte
- **WHEN** un utilisateur connecté navigue vers la section "Paramètres" du dashboard
- **THEN** la page affiche : informations du compte (nom, email, avatar), bouton "Télécharger mes données", zone de danger avec bouton "Supprimer mon compte"
