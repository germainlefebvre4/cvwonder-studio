## Why

Les cards de sessions du Dashboard manquent de hiérarchie visuelle : l'action principale (ouvrir une session) est noyée parmi 5-6 boutons de même poids, le statut de partage n'est pas perceptible au premier coup d'œil, et les dates absolues donnent moins d'information utile que des dates relatives. Le Dashboard est le point d'entrée principal des utilisateurs connectés — son ergonomie impacte directement le quotidien d'utilisation.

## What Changes

- **CTA "Ouvrir dans le studio"** : bouton pleine largeur, visuellement primaire, placé en bas de chaque card
- **Statut coloré par border-left** : bordure gauche colorée selon le statut de la session (partagée = accent bleu, expiration imminente < 30j = warning orange, défaut = neutre)
- **Indicateur de partage** : row visible sur la card quand `share_token_hash` est non-null, affichant vues et dernière visite
- **Dates relatives** : remplacement des dates absolues par des dates relatives ("Expire dans 8 mois", "Expire dans 3 jours", "vu il y a 2j")
- **Reorganisation des actions** : actions visibles réduites à l'essentiel (Partager, Archiver/Restaurer) ; actions rares (Renommer, Dupliquer, Exporter ZIP, Supprimer) regroupées dans un menu `⋯` (Radix DropdownMenu)
- **Rename via dropdown** : le clic sur le nom de la session navigue vers le studio ; le renommage se fait via l'item "Renommer" du menu `⋯`
- **Token CSS warning** : ajout de `--color-warning` / `--color-warning-text` / `--color-warning-subtle` dans `globals.css`

## Capabilities

### New Capabilities

<!-- Aucune nouvelle capability API ou domaine — changement purement UI -->

### Modified Capabilities

- `user-dashboard` : les requirements d'affichage des cards de session changent — statut visuel coloré, hiérarchie des actions, dates relatives, indicateur de partage inline

## Impact

- `frontend/src/components/user/SessionCard.tsx` — refonte complète
- `frontend/src/app/globals.css` — ajout tokens warning
- `frontend/src/components/user/SessionList.tsx` — mineur (aucun changement de structure prévu)
- Aucun impact backend, API, ni base de données
