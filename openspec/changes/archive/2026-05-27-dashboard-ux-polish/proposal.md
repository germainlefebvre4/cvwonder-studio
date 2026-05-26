## Why

Les pages connectées (Dashboard, Mon compte) présentent des incohérences visuelles : largeurs différentes, absence de design tokens sur la page Compte. De plus, le bouton "+ Nouvelle session" du Dashboard redirige vers la landing au lieu de créer directement une session, cassant le flux utilisateur.

## What Changes

- Aligner la largeur de la page Mon compte sur `max-w-6xl` (même valeur que Dashboard et Landing)
- Migrer la page Mon compte vers les design tokens CSS (`var(--color-*)`) pour homogénéiser le système de design
- Remplacer le lien `<a href="/">` du bouton "+ Nouvelle session" par une action directe qui appelle `createSession()` et redirige vers `/studio/:token`
- Gérer les cas d'erreur du bouton (quota plein, rate limit) de façon cohérente avec le comportement existant

## Capabilities

### New Capabilities
<!-- Aucune nouvelle capability fonctionnelle -->

### Modified Capabilities
- `user-dashboard`: Le bouton "+ Nouvelle session" crée désormais directement une session au lieu de rediriger vers la landing
- `user-account-management`: La page Compte adopte la largeur `max-w-6xl` et les design tokens CSS cohérents avec le reste de l'UI

## Impact

- `frontend/src/pages/user/Dashboard.tsx` : logique du bouton "+ Nouvelle session"
- `frontend/src/pages/user/Account.tsx` : largeur du layout + design tokens
- Aucun impact backend (l'endpoint `POST /api/v1/sessions` supporte déjà les utilisateurs connectés via cookie)
- Aucun impact API
