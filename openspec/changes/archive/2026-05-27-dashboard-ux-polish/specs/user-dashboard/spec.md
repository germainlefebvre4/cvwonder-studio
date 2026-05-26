## MODIFIED Requirements

### Requirement: Quota atteint
Le système SHALL afficher clairement le nombre de sessions actives par rapport à la limite configurée pour l'utilisateur.

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
