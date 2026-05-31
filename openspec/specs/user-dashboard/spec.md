## ADDED Requirements

### Requirement: Les utilisateurs connectés ont une page de tableau de bord
Le système SHALL exposer la route `/dashboard` accessible uniquement aux utilisateurs connectés. La page SHALL afficher la liste de toutes les sessions de l'utilisateur, réparties en deux onglets : "Actives" et "Archivées".

#### Scenario: Accès au dashboard avec sessions actives
- **WHEN** un utilisateur connecté navigue vers `/dashboard`
- **THEN** la page affiche ses sessions actives triées par `updated_at` décroissant, avec pour chaque session : nom, thème, date de dernière modification, date d'expiration, et actions disponibles

#### Scenario: Onglet Archivées
- **WHEN** l'utilisateur clique sur l'onglet "Archivées"
- **THEN** les sessions archivées sont affichées avec leur date d'archivage et la date de purge estimée (archived_at + 30j)

#### Scenario: Dashboard sans sessions
- **WHEN** l'utilisateur connecté n'a aucune session
- **THEN** un état vide est affiché avec un bouton "Créer ma première session"

### Requirement: Le dashboard affiche le quota de sessions utilisées
Le système SHALL afficher clairement le nombre de sessions actives par rapport à la limite configurée pour l'utilisateur. L'endpoint `GET /api/sessions` SHALL retourner les champs `active` (nombre de sessions actives non archivées), `max` (valeur de `max_sessions_per_user` lue depuis `system_config`), et `total` (nombre de sessions retournées dans la réponse courante) en complément de la liste `sessions`. Ces champs SHALL être présents dans la réponse que l'onglet actif ou archivé soit demandé (`?archived=true` ou non).

#### Scenario: Affichage du quota
- **WHEN** un utilisateur ayant 7 sessions actives sur un maximum de 10 consulte le dashboard
- **THEN** le dashboard affiche "7 / 10 sessions utilisées" avec une barre de progression ; `GET /api/sessions` retourne `{ sessions: [...], total: 7, active: 7, max: 10 }`

#### Scenario: Quota atteint
- **WHEN** l'utilisateur a atteint sa limite de sessions
- **THEN** le bouton "+ Nouvelle session" est masqué ; un message encourage à archiver des sessions existantes

#### Scenario: Quota retourné même sur l'onglet Archivées
- **WHEN** l'utilisateur consulte l'onglet Archivées (`GET /api/sessions?archived=true`)
- **THEN** la réponse inclut `active` (nombre de sessions actives, pas archivées) et `max` ; `total` est le nombre de sessions archivées retournées

### Requirement: Le dashboard permet de créer une nouvelle session directement
Depuis le dashboard, l'utilisateur connecté SHALL pouvoir créer une nouvelle session sans repasser par la landing page. Le bouton "+ Nouvelle session" SHALL appeler directement l'API de création de session et rediriger vers l'éditeur.

#### Scenario: Création de session depuis le dashboard
- **WHEN** l'utilisateur connecté clique sur le bouton "+ Nouvelle session" (quota non atteint)
- **THEN** le système crée une nouvelle session liée à son compte via `POST /api/v1/sessions` et redirige vers `/studio/:token`

#### Scenario: Rate limit sur la création de session
- **WHEN** l'utilisateur dépasse la limite de création de sessions (rate limit)
- **THEN** un message d'erreur est affiché sur le dashboard indiquant qu'il doit attendre avant de créer une nouvelle session ; aucune navigation n'est effectuée

### Requirement: Le dashboard permet d'effectuer les actions de gestion de session
Depuis le dashboard, l'utilisateur connecté SHALL pouvoir effectuer les actions suivantes sur chaque session : ouvrir l'éditeur, renommer, dupliquer, archiver, supprimer définitivement, générer un lien de partage, et exporter en ZIP. Les actions SHALL être hiérarchisées : l'ouverture de l'éditeur est l'action primaire (CTA pleine largeur) ; le partage et l'archivage/restauration sont des actions secondaires visibles ; le renommage, la duplication, l'export ZIP et la suppression sont regroupés dans un menu d'actions secondaires `⋯`.

#### Scenario: Ouverture de l'éditeur depuis le dashboard
- **WHEN** l'utilisateur clique sur le CTA "Ouvrir dans le studio" ou sur le nom de la session
- **THEN** il est redirigé vers `/studio?session={id}` où `{id}` est l'UUID de la session

#### Scenario: Renommage depuis le dashboard
- **WHEN** l'utilisateur ouvre le menu `⋯` d'une session et clique sur "Renommer"
- **THEN** un champ de saisie inline apparaît dans la card ; à la confirmation le nouveau nom est sauvegardé sans rechargement de page

#### Scenario: Suppression définitive d'une session
- **WHEN** l'utilisateur ouvre le menu `⋯` d'une session et clique sur "Supprimer" puis confirme dans un dialog de confirmation
- **THEN** la session est supprimée de la DB et ses fichiers filesystem sont supprimés ; la liste se met à jour

#### Scenario: Actions sur une session archivée
- **WHEN** l'utilisateur consulte l'onglet Archivées
- **THEN** seules les actions "Restaurer" (visible), "Exporter ZIP" et "Supprimer définitivement" (dans le menu `⋯`) sont disponibles (pas de partage ni d'archivage)

### Requirement: Les cards de session affichent un indicateur visuel de statut
Le système SHALL afficher une bordure gauche colorée sur chaque card de session pour indiquer son statut. La priorité est : expiration imminente > partagée > défaut.

#### Scenario: Session avec expiration imminente
- **WHEN** la date d'expiration d'une session est dans moins de 30 jours
- **THEN** la card affiche une bordure gauche de couleur warning (orange)

#### Scenario: Session partagée non imminente
- **WHEN** une session a un `share_token_hash` non-null et expire dans plus de 30 jours
- **THEN** la card affiche une bordure gauche de couleur accent (bleu)

#### Scenario: Session sans statut particulier
- **WHEN** une session n'est ni partagée ni en expiration imminente
- **THEN** la card affiche une bordure gauche neutre (couleur border standard)

### Requirement: Les cards de session affichent des dates relatives
Le système SHALL afficher les dates de la session sous forme relative plutôt qu'absolue pour communiquer l'urgence de façon immédiate.

#### Scenario: Affichage de la date d'expiration
- **WHEN** la card d'une session est affichée
- **THEN** la date d'expiration est formatée de manière relative ("Expire dans 8 mois", "Expire dans 3 jours", "Expirée il y a 2j") et colorée selon l'urgence (muted > 30j, warning ≤ 30j, error si passée)

#### Scenario: Affichage de la dernière visite pour une session partagée
- **WHEN** une session a été vue par un visiteur externe
- **THEN** la date de dernière visite est affichée sous forme relative ("vu il y a 2j", "vu aujourd'hui") dans l'indicateur de partage de la card

### Requirement: Les cards de session partagées affichent un indicateur de partage inline
Le système SHALL afficher, sur la card d'une session partagée, une ligne d'information de partage indiquant le nombre de vues et la date de dernière visite.

#### Scenario: Session partagée avec vues
- **WHEN** une session a `share_token_hash` non-null et `view_count > 0`
- **THEN** la card affiche une row "Partagée · {N} vues · vu {date relative}"

#### Scenario: Session partagée sans vue
- **WHEN** une session a `share_token_hash` non-null et `view_count = 0`
- **THEN** la card affiche une row "Partagée · aucune vue"

#### Scenario: Label du bouton de partage selon l'état
- **WHEN** une session n'a pas encore de lien de partage (`share_token_hash = null`)
- **THEN** le bouton secondaire affiche "Partager"
- **WHEN** une session a déjà un lien de partage (`share_token_hash` non-null)
- **THEN** le bouton secondaire affiche "Gérer le partage"

### Requirement: Le dashboard affiche les informations de profil de l'utilisateur
Le système SHALL afficher dans le dashboard (ou dans un header persistant) le nom, l'avatar Google et l'email de l'utilisateur connecté, ainsi qu'un bouton de déconnexion.

#### Scenario: Affichage du profil
- **WHEN** un utilisateur connecté accède au dashboard
- **THEN** son avatar, nom et email (récupérés lors du login Google) sont affichés dans l'en-tête ou le bandeau de navigation

#### Scenario: Avatar indisponible
- **WHEN** le champ `avatar_url` est NULL ou l'image ne charge pas
- **THEN** un avatar généré (initiales du nom sur fond coloré) est affiché à la place
