## MODIFIED Requirements

### Requirement: Le dashboard permet d'effectuer les actions de gestion de session
Depuis le dashboard, l'utilisateur connecté SHALL pouvoir effectuer les actions suivantes sur chaque session : ouvrir l'éditeur, renommer, dupliquer, archiver, supprimer définitivement, générer un lien de partage, et exporter en ZIP. Les actions SHALL être hiérarchisées : l'ouverture de l'éditeur est l'action primaire (CTA pleine largeur) ; le partage et l'archivage/restauration sont des actions secondaires visibles ; le renommage, la duplication, l'export ZIP et la suppression sont regroupés dans un menu d'actions secondaires `⋯`.

#### Scenario: Ouverture de l'éditeur depuis le dashboard
- **WHEN** l'utilisateur clique sur le CTA "Ouvrir dans le studio" ou sur le nom de la session
- **THEN** il est redirigé vers `/studio/:token`

#### Scenario: Renommage depuis le dashboard
- **WHEN** l'utilisateur ouvre le menu `⋯` d'une session et clique sur "Renommer"
- **THEN** un champ de saisie inline apparaît dans la card ; à la confirmation le nouveau nom est sauvegardé sans rechargement de page

#### Scenario: Suppression définitive d'une session
- **WHEN** l'utilisateur ouvre le menu `⋯` d'une session et clique sur "Supprimer" puis confirme dans un dialog de confirmation
- **THEN** la session est supprimée de la DB et ses fichiers filesystem sont supprimés ; la liste se met à jour

#### Scenario: Actions sur une session archivée
- **WHEN** l'utilisateur consulte l'onglet Archivées
- **THEN** seules les actions "Restaurer" (visible), "Exporter ZIP" et "Supprimer définitivement" (dans le menu `⋯`) sont disponibles (pas de partage ni d'archivage)

## ADDED Requirements

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
