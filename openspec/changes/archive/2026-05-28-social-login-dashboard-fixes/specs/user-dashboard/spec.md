## MODIFIED Requirements

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

### Requirement: Le dashboard permet d'effectuer les actions de gestion de session
Depuis le dashboard, l'utilisateur connecté SHALL pouvoir effectuer les actions suivantes sur chaque session : ouvrir l'éditeur, renommer, dupliquer, modifier le TTL, archiver, supprimer définitivement, générer un lien de partage, et exporter en ZIP.

#### Scenario: Ouverture de l'éditeur depuis le dashboard
- **WHEN** l'utilisateur clique sur une session active dans le dashboard
- **THEN** il est redirigé vers `/studio?session={id}` où `{id}` est l'UUID de la session

#### Scenario: Renommage depuis le dashboard
- **WHEN** l'utilisateur clique sur "Renommer" pour une session
- **THEN** un champ de saisie inline ou un dialog apparaît ; à la confirmation le nouveau nom est sauvegardé sans rechargement de page

#### Scenario: Suppression définitive d'une session
- **WHEN** l'utilisateur clique sur "Supprimer" et confirme dans un dialog de confirmation
- **THEN** la session est supprimée de la DB et ses fichiers filesystem sont supprimés ; la liste se met à jour

#### Scenario: Actions sur une session archivée
- **WHEN** l'utilisateur consulte l'onglet Archivées
- **THEN** seules les actions "Restaurer", "Exporter" et "Supprimer définitivement" sont disponibles (pas de renommage ni de partage)
