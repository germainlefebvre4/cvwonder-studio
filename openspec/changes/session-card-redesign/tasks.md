## 1. Tokens CSS warning

- [ ] 1.1 Importer `@radix-ui/colors/amber.css` et `@radix-ui/colors/amber-dark.css` dans `frontend/src/app/globals.css`
- [ ] 1.2 Ajouter les tokens `--color-warning`, `--color-warning-text`, `--color-warning-subtle` dans le bloc `@theme {}` de `globals.css`

## 2. Utilitaires

- [ ] 2.1 Créer la fonction `formatRelativeDate(iso: string | null | undefined): string` dans un fichier utilitaire (`frontend/src/lib/date.ts` ou similaire)
- [ ] 2.2 Créer la fonction `getSessionBorderStatus(session: UserSession): 'expiring' | 'shared' | 'default'` (logique : expiry < 30j > partagée > défaut)

## 3. Refonte SessionCard

- [ ] 3.1 Remplacer le bouton de renommage inline par un lien `<a href="/studio/:token">` pour le nom de la session
- [ ] 3.2 Ajouter le menu `⋯` (Radix DropdownMenu) avec les items : Renommer, Dupliquer, Exporter ZIP, séparateur, Supprimer (rouge)
- [ ] 3.3 Déplacer la logique de renommage inline dans le menu `⋯` (item "Renommer" ouvre un champ inline comme avant)
- [ ] 3.4 Ajouter le CTA pleine largeur "Ouvrir dans le studio →" en bas de card (bouton primary)
- [ ] 3.5 Appliquer la bordure gauche colorée selon `getSessionBorderStatus()` (3px : warning / accent / border standard)
- [ ] 3.6 Remplacer `formatDate()` par `formatRelativeDate()` pour la date d'expiration, avec couleur dynamique selon urgence
- [ ] 3.7 Ajouter la row d'indicateur de partage (conditionnel : `share_token_hash !== null`) avec vues et date relative de dernière visite
- [ ] 3.8 Adapter le label du bouton secondaire "Partager" → "Partager" ou "Gérer le partage" selon `share_token_hash`
- [ ] 3.9 Déplacer "Exporter ZIP" du bas de card vers le menu `⋯`
- [ ] 3.10 Déplacer "Supprimer" du bas de card vers le menu `⋯` (item destructif rouge)
- [ ] 3.11 Adapter les actions des sessions archivées : conserver "Restaurer" visible, mettre "Exporter ZIP" et "Supprimer" dans le menu `⋯`

## 4. Vérification

- [ ] 4.1 Vérifier le rendu visuel des 3 statuts de bordure (expiring, shared, default) sur des sessions de test
- [ ] 4.2 Vérifier que le menu `⋯` est accessible (clavier, focus) et correctement positionné dans la grille 3 colonnes
- [ ] 4.3 Vérifier les cas limites de `formatRelativeDate` : null, aujourd'hui, demain, dépassé
- [ ] 4.4 Vérifier que les tests existants de `Dashboard.test.tsx` passent toujours
