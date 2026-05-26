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
Le système SHALL afficher clairement le nombre de sessions actives par rapport à la limite configurée pour l'utilisateur.

#### Scenario: Affichage du quota
- **WHEN** un utilisateur ayant 7 sessions actives sur un maximum de 10 consulte le dashboard
- **THEN** le dashboard affiche "7 / 10 sessions utilisées" avec une barre de progression

#### Scenario: Quota atteint
- **WHEN** l'utilisateur a atteint sa limite de sessions
- **THEN** le bouton "+ Nouvelle session" est masqué ; un message encourage à archiver des sessions existantes

### Requirement: Le dashboard permet de créer une nouvelle session directement
Depuis le dashboard, l'utilisateur connecté SHALL pouvoir créer une nouvelle session sans repasser par la landing page. Le bouton "+ Nouvelle session" SHALL appeler directement l'API de création de session et rediriger vers l'éditeur.

#### Scenario: Création de session depuis le dashboard
- **WHEN** l'utilisateur connecté clique sur le bouton "+ Nouvelle session" (quota non atteint)
- **THEN** le système crée une nouvelle session liée à son compte via `POST /api/v1/sessions` et redirige vers `/studio/:token`

#### Scenario: Rate limit sur la création de session
- **WHEN** l'utilisateur dépasse la limite de création de sessions (rate limit)
- **THEN** un message d'erreur est affiché sur le dashboard indiquant qu'il doit attendre avant de créer une nouvelle session ; aucune navigation n'est effectuée

### Requirement: Le dashboard permet d'effectuer les actions de gestion de session
Depuis le dashboard, l'utilisateur connecté SHALL pouvoir effectuer les actions suivantes sur chaque session : ouvrir l'éditeur, renommer, dupliquer, modifier le TTL, archiver, supprimer définitivement, générer un lien de partage, et exporter en ZIP.

#### Scenario: Ouverture de l'éditeur depuis le dashboard
- **WHEN** l'utilisateur clique sur une session active
- **THEN** il est redirigé vers `/studio?session={id}`

#### Scenario: Renommage depuis le dashboard
- **WHEN** l'utilisateur clique sur "Renommer" pour une session
- **THEN** un champ de saisie inline ou un dialog apparaît ; à la confirmation le nouveau nom est sauvegardé sans rechargement de page

#### Scenario: Suppression définitive d'une session
- **WHEN** l'utilisateur clique sur "Supprimer" et confirme dans un dialog de confirmation
- **THEN** la session est supprimée de la DB et ses fichiers filesystem sont supprimés ; la liste se met à jour

#### Scenario: Actions sur une session archivée
- **WHEN** l'utilisateur consulte l'onglet Archivées
- **THEN** seules les actions "Restaurer", "Exporter" et "Supprimer définitivement" sont disponibles (pas de renommage ni de partage)

### Requirement: Le dashboard affiche les informations de profil de l'utilisateur
Le système SHALL afficher dans le dashboard (ou dans un header persistant) le nom, l'avatar Google et l'email de l'utilisateur connecté, ainsi qu'un bouton de déconnexion.

#### Scenario: Affichage du profil
- **WHEN** un utilisateur connecté accède au dashboard
- **THEN** son avatar, nom et email (récupérés lors du login Google) sont affichés dans l'en-tête ou le bandeau de navigation

#### Scenario: Avatar indisponible
- **WHEN** le champ `avatar_url` est NULL ou l'image ne charge pas
- **THEN** un avatar généré (initiales du nom sur fond coloré) est affiché à la place
