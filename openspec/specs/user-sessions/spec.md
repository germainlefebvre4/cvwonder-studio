## ADDED Requirements

### Requirement: Les utilisateurs anonymes sont limités à 1 session active
Le système SHALL empêcher la création d'une seconde session anonyme si un token de session valide est déjà présent dans le `localStorage` du navigateur. Le frontend SHALL vérifier avant toute tentative de création et rediriger vers la session existante.

#### Scenario: Création d'une première session anonyme
- **WHEN** un visiteur non connecté sans token localStorage crée une session
- **THEN** la session est créée, le token est stocké en localStorage, et l'utilisateur est redirigé vers l'éditeur

#### Scenario: Tentative de création d'une seconde session anonyme
- **WHEN** un visiteur non connecté ayant déjà un token localStorage tente de créer une nouvelle session
- **THEN** le frontend affiche un message proposant de retourner à la session existante ou de se connecter pour créer plus de sessions

### Requirement: Les sessions anonymes expirent après 24h et sont supprimées immédiatement
Le système SHALL créer les sessions anonymes (`user_id IS NULL`) avec un TTL de 24h (configurable via `system_config` clé `anon_session_ttl_hours`, défaut `24`). À l'expiration, la session SHALL être entièrement supprimée (ligne DB et fichiers filesystem). Aucune rétention n'est appliquée aux sessions anonymes expirées.

#### Scenario: Session anonyme créée avec TTL 24h
- **WHEN** un visiteur non connecté crée une session
- **THEN** `expires_at` est fixé à `NOW() + anon_session_ttl_hours`

#### Scenario: Accès à une session anonyme expirée
- **WHEN** un visiteur accède à l'URL d'une session anonyme dont `expires_at < NOW()`
- **THEN** le système retourne HTTP 404 et affiche la page 404 "fun"

#### Scenario: Purge des sessions anonymes expirées
- **WHEN** le job de purge s'exécute
- **THEN** toutes les sessions avec `user_id IS NULL` et `expires_at < NOW()` sont entièrement supprimées de la DB et leurs fichiers filesystem supprimés

### Requirement: L'éditeur affiche des avertissements progressifs d'expiration pour les sessions anonymes
Le système SHALL afficher des bandeaux de notification dans l'éditeur lorsque la session anonyme approche de son expiration. Les seuils SHALL être configurables via `system_config` (`anon_expiry_warn_1_hours` défaut `2`, `anon_expiry_warn_2_hours` défaut `0.5`). Le frontend calcule le temps restant à partir de `expires_at` à chaque chargement ou interaction.

#### Scenario: Bandeau avertissement T-2h (configurable)
- **WHEN** le temps restant avant expiration est inférieur à `anon_expiry_warn_1_hours`
- **THEN** un bandeau discret s'affiche : "Votre session expire dans moins de 2h — Connectez-vous pour la conserver"

#### Scenario: Bandeau avertissement T-30min (configurable)
- **WHEN** le temps restant avant expiration est inférieur à `anon_expiry_warn_2_hours`
- **THEN** un bandeau urgent s'affiche : "30 minutes restantes — Connectez-vous maintenant pour ne pas perdre votre travail"

#### Scenario: Bandeau mis à jour après une action utilisateur
- **WHEN** l'utilisateur sauvegarde ou génère après qu'un bandeau était affiché
- **THEN** le bandeau est recalculé avec le temps restant à jour

### Requirement: L'éditeur propose un bouton de téléchargement du YAML
Le système SHALL afficher dans la toolbar de l'éditeur un bouton "Télécharger le YAML" accessible à tous les utilisateurs (anonymes et connectés). Le clic SHALL déclencher le téléchargement du contenu YAML courant sous forme de fichier `resume.yaml`.

#### Scenario: Téléchargement du YAML depuis l'éditeur
- **WHEN** un utilisateur (anonyme ou connecté) clique sur "Télécharger le YAML"
- **THEN** le navigateur télécharge un fichier `resume.yaml` contenant le contenu courant de l'éditeur sans appel serveur supplémentaire

### Requirement: La page 404 dédiée aux sessions expirées guide l'utilisateur
Le système SHALL afficher une page 404 spécifique (et non générique) lorsqu'une session anonyme expirée est accédée. La page SHALL afficher le logo CVWonder, un message empathique et humoristique, un bouton "Créer une nouvelle session", et un CTA vers `/login` pour bénéficier de sessions persistantes.

#### Scenario: Affichage de la 404 session expirée
- **WHEN** un visiteur accède à l'URL d'une session dont l'ID n'existe plus en DB (session anonyme purgée)
- **THEN** la page affiche le logo, le message "Ce CV a expiré... comme un contrat CDD.", un bouton primaire "Créer une nouvelle session", et un lien secondaire "Se connecter pour des sessions jusqu'à 90 jours"

#### Scenario: 404 générique pour les autres ressources introuvables
- **WHEN** un visiteur accède à une URL inexistante non liée à une session (ex. `/foo/bar`)
- **THEN** la 404 générique est affichée (distincte de la 404 session)

### Requirement: L'éditeur affiche un message de confidentialité sur les données stockées
Le système SHALL afficher un message de confidentialité visible dans l'interface, indiquant que le contenu du CV est stocké temporairement sur les serveurs (24h pour les anonymes, durée configurée pour les connectés) et n'est pas partagé.

#### Scenario: Affichage du message de confidentialité pour un anonyme
- **WHEN** un utilisateur non connecté ouvre l'éditeur
- **THEN** un message discret indique "Votre CV est stocké pendant 24h sur nos serveurs et supprimé automatiquement. Connectez-vous pour le conserver plus longtemps."

#### Scenario: Message adapté pour un utilisateur connecté
- **WHEN** un utilisateur connecté ouvre l'éditeur
- **THEN** le message indique la durée de rétention applicable à son compte (ex. "jusqu'au {date_expiration}")

### Requirement: Les utilisateurs connectés peuvent créer jusqu'à N sessions
Le système SHALL permettre aux utilisateurs connectés de créer jusqu'à la limite définie par la clé `max_sessions_per_user` de `system_config` (défaut : 10). Le backend SHALL refuser la création si le nombre de sessions actives non archivées atteint cette limite. Lors de la création, le backend SHALL lier `user_id` à la session en extrayant l'identité depuis le cookie `user_session` (déjà vérifié par `UserMiddleware`). La session SHALL être créée avec le TTL utilisateur (`user_session_ttl_days`) et non le TTL anonyme.

#### Scenario: Création dans la limite du quota
- **WHEN** un utilisateur connecté ayant 7 sessions sur 10 crée une nouvelle session
- **THEN** la session est créée, liée à son `user_id`, avec le TTL utilisateur, et visible immédiatement dans son dashboard

#### Scenario: Dépassement du quota
- **WHEN** un utilisateur connecté ayant atteint la limite `max_sessions_per_user` tente de créer une session
- **THEN** le backend retourne HTTP 422 avec le message d'erreur de quota dépassé ; aucune session n'est créée

#### Scenario: Session connectée visible immédiatement dans le dashboard
- **WHEN** un utilisateur connecté crée une session via `POST /api/v1/sessions`
- **THEN** la session apparaît dans `GET /api/sessions` sans action supplémentaire (pas besoin de claiming)

#### Scenario: Session anonyme inchangée
- **WHEN** un visiteur non connecté crée une session via `POST /api/v1/sessions`
- **THEN** la session est créée avec `user_id = NULL` et le TTL anonyme, comportement identique à avant

### Requirement: Les sessions des utilisateurs connectés peuvent être nommées
Le système SHALL permettre à l'utilisateur connecté de donner un nom textuel à chacune de ses sessions. Le nom SHALL être stocké dans la colonne `name` de la table `sessions` et affiché dans le dashboard et l'éditeur.

#### Scenario: Attribution d'un nom à une session
- **WHEN** un utilisateur connecté saisit un nom pour sa session et confirme
- **THEN** le nom est sauvegardé et affiché à la place de l'identifiant UUID dans toutes les vues

#### Scenario: Session sans nom
- **WHEN** une session n'a pas de nom défini
- **THEN** le système affiche un nom de substitution comme "Session du {date de création}"

### Requirement: Les utilisateurs connectés peuvent modifier le TTL d'une session
Le système SHALL permettre à l'utilisateur connecté de définir une date d'expiration personnalisée pour ses sessions, dans une plage [1 jour, 365 jours à partir d'aujourd'hui]. Le backend SHALL valider et mettre à jour `expires_at`.

#### Scenario: Extension du TTL
- **WHEN** un utilisateur connecté choisit une nouvelle date d'expiration future
- **THEN** `expires_at` est mis à jour et la nouvelle date est affichée dans le dashboard

#### Scenario: TTL invalide (date passée)
- **WHEN** un utilisateur soumet une date d'expiration dans le passé
- **THEN** le backend retourne HTTP 422 et la mise à jour est rejetée

### Requirement: Les utilisateurs connectés peuvent archiver une session
Le système SHALL permettre à l'utilisateur connecté de marquer une session comme archivée. Une session archivée SHALL être inaccessible en édition mais son contenu YAML SHALL être récupérable pendant 30 jours.

#### Scenario: Archivage d'une session active
- **WHEN** un utilisateur connecté archive une session
- **THEN** `is_archived = TRUE` et `archived_at = NOW()` sont enregistrés ; la session n'apparaît plus dans les sessions actives ; le quota actif est libéré d'une unité

#### Scenario: Accès à l'éditeur d'une session archivée
- **WHEN** un utilisateur tente d'accéder à l'éditeur d'une session archivée
- **THEN** le système affiche un message "Session archivée" avec une option de restauration et de téléchargement du YAML

### Requirement: Les sessions inactives ou archivées des utilisateurs connectés sont purgées après 30 jours
Le système SHALL supprimer le contenu YAML et les fichiers générés des sessions connectées dont `is_archived = TRUE` et `archived_at < NOW() - INTERVAL '30 days'`. Les sessions anonymes expirées sont supprimées immédiatement (cf. requirement précédent).

#### Scenario: Purge d'une session archivée depuis plus de 30 jours
- **WHEN** un job de purge s'exécute
- **THEN** les sessions connectées archivées depuis plus de 30 jours ont leur `yaml_content` vidé et leurs fichiers filesystem supprimés ; la ligne DB est conservée pour audit

#### Scenario: Session anonyme non concernée par la rétention 30 jours
- **WHEN** le job de purge s'exécute
- **THEN** les sessions avec `user_id IS NULL` et `expires_at < NOW()` sont entièrement supprimées, sans délai de grâce

### Requirement: Les utilisateurs connectés peuvent dupliquer une session
Le système SHALL permettre de créer une nouvelle session à partir du contenu YAML et du thème d'une session existante appartenant à l'utilisateur.

#### Scenario: Duplication d'une session
- **WHEN** un utilisateur connecté duplique une session nommée "CV Senior"
- **THEN** une nouvelle session est créée avec le même YAML, le même thème, et le nom "Copie de CV Senior" ; elle est liée au même `user_id`

#### Scenario: Duplication dépassant le quota
- **WHEN** la duplication ferait dépasser la limite `max_sessions_per_user`
- **THEN** le backend retourne HTTP 422 avec un message indiquant le quota atteint

### Requirement: Les utilisateurs connectés peuvent changer le thème d'une session existante
Le système SHALL permettre de modifier le `theme_id` d'une session appartenant à un utilisateur connecté. Après le changement, la prochaine génération de preview utilisera le nouveau thème.

#### Scenario: Changement de thème réussi
- **WHEN** un utilisateur connecté sélectionne un nouveau thème pour une session existante
- **THEN** `theme_id` est mis à jour en DB et le preview est régénéré avec le nouveau thème

#### Scenario: Thème inexistant ou supprimé
- **WHEN** l'utilisateur sélectionne un thème qui n'existe plus en DB
- **THEN** le backend retourne HTTP 404 et le thème n'est pas modifié

### Requirement: Les utilisateurs connectés peuvent ajouter des labels/tags à leurs sessions
Le système SHALL permettre aux utilisateurs connectés de tagger leurs sessions avec des étiquettes textuelles créées à la volée. Les tags SHALL être stockés dans la colonne `tags TEXT[]` de la table `sessions`. Limites : max 10 tags par session, max 30 caractères par tag. Les tags sont disponibles sur les sessions actives et archivées.

#### Scenario: Ajout d'un tag à la volée
- **WHEN** un utilisateur connecté saisit un nouveau tag sur une session (ex. "freelance")
- **THEN** le tag est ajouté au tableau `tags` de la session ; si le tag existe déjà sur d'autres sessions, il est suggéré en auto-complétion

#### Scenario: Retrait d'un tag
- **WHEN** un utilisateur connecté supprime un tag d'une session
- **THEN** le tag est retiré du tableau `tags` sans affecter les autres sessions

#### Scenario: Dépassement de la limite de 10 tags
- **WHEN** un utilisateur connecté tente d'ajouter un tag à une session qui en possède déjà 10
- **THEN** le backend retourne HTTP 422 et le tag n'est pas ajouté

#### Scenario: Tag trop long
- **WHEN** un utilisateur saisit un tag dépassant 30 caractères
- **THEN** le backend retourne HTTP 422 et le tag n'est pas ajouté

#### Scenario: Tag en doublon
- **WHEN** un utilisateur tente d'ajouter un tag déjà présent sur la session
- **THEN** le backend retourne HTTP 422 (ou le frontend déduplique avant envoi)

#### Scenario: Tags sur une session archivée
- **WHEN** un utilisateur connecté ajoute ou retire un tag d'une session archivée
- **THEN** l'opération réussit normalement (les tags sont modifiables même en état archivé)

#### Scenario: Filtrage par tag dans le dashboard
- **WHEN** un utilisateur sélectionne un ou plusieurs tags dans la barre de filtre du dashboard
- **THEN** seules les sessions ayant TOUS les tags sélectionnés (logique AND) sont affichées

#### Scenario: Renommage de tag (pattern Notion)
- **WHEN** un utilisateur veut "renommer" un tag "ancien" en "nouveau" sur toutes ses sessions
- **THEN** il n'existe pas d'opération de renommage global : il doit retirer "ancien" et ajouter "nouveau" sur chaque session concernée (pas de renommage global en v1)
