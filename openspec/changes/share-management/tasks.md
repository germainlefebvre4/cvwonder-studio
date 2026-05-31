## 1. Migration DB

- [x] 1.1 Créer la migration SQL : `ADD COLUMN share_expires_at TIMESTAMPTZ NULL DEFAULT NULL` sur la table `sessions`
- [x] 1.2 Mettre à jour la query `SetShareToken` dans `backend/db/queries/sessions.sql` pour inclure le paramètre `share_expires_at`
- [x] 1.3 Mettre à jour la query `RevokeShareToken` pour remettre `share_expires_at = NULL` en plus de `share_token_hash` et `share_password_hash`
- [x] 1.4 Régénérer le code sqlc : `make sqlc-gen`

## 2. Backend : CreateShare et GetShared

- [x] 2.1 Mettre à jour le handler `CreateShare` pour lire `{ duration: "7d" | "30d" | null }` depuis le body JSON
- [x] 2.2 Calculer et transmettre `share_expires_at` au repository selon la durée (`NOW() + 7j`, `NOW() + 30j`, ou `NULL`)
- [x] 2.3 Mettre à jour le domain model `Session` pour inclure le champ `ShareExpiresAt *time.Time`
- [x] 2.4 Ajouter la vérification `share_expires_at < NOW()` dans le handler `GetShared` et retourner HTTP 404 si le lien est expiré

## 3. Frontend : type et service

- [x] 3.1 Ajouter le champ `share_expires_at: string | null` à l'interface `UserSession` dans `frontend/src/services/user.ts`
- [x] 3.2 Mettre à jour la fonction `createShare(id, duration?)` pour transmettre `duration` dans le body de la requête POST

## 4. Frontend : bug fix — seuil de bordure

- [x] 4.1 Corriger le seuil dans `getSessionBorderStatus()` : `diffDays <= 30` → `diffDays <= 7` dans `frontend/src/lib/session.ts`

## 5. Frontend : ShareDialog — session déjà partagée

- [x] 5.1 Ajouter le state `duration: "7d" | "30d" | null` (défaut `null`) dans `ShareDialog`
- [x] 5.2 Ajouter le sélecteur de durée (3 options radio : 7 jours / 30 jours / Illimité) au-dessus du bouton "Créer un lien de partage"
- [x] 5.3 Passer le paramètre `duration` à `handleCreate()` lors de l'appel à `createShare()`
- [x] 5.4 Implémenter `handleRegenerate()` : appel séquentiel `revokeShare()` → `createShare(duration)`, gestion d'erreur si la création échoue après révocation
- [x] 5.5 Afficher le bloc "message + bouton régénération" quand `hasShare && !shareUrl` : message explicatif + bouton "Révoquer et créer un nouveau lien" qui appelle `handleRegenerate()`

## 6. Frontend : SessionCard — lien expiré

- [x] 6.1 Ajouter la logique de détection "lien expiré" dans `frontend/src/lib/session.ts` : helper `isShareExpired(session)` retournant `true` si `share_token_hash !== null && share_expires_at !== null && new Date(share_expires_at) < new Date()`
- [x] 6.2 Mettre à jour l'indicateur de partage dans `SessionCard` : si `isShareExpired`, afficher "🔗 Partagée · lien expiré" avec CTA "Recréer un lien" (ouvre ShareDialog)
- [x] 6.3 Afficher la durée restante dans l'indicateur quand `share_expires_at IS NOT NULL` et non expiré (ex. "🔗 Partagée · expire dans 5 jours")

## 7. Vérification

- [ ] 7.1 Vérifier les 3 statuts de bordure sur des sessions de test : session fraîche (gris), partagée (bleu), expire dans < 7j (orange)
- [ ] 7.2 Tester le flux de régénération : session déjà partagée → ouvrir dialog → "Révoquer et créer un nouveau lien" → nouveau lien affiché
- [ ] 7.3 Vérifier qu'un lien avec `duration: "7d"` retourne HTTP 404 après son expiration simulée en DB
- [ ] 7.4 Vérifier que l'indicateur "lien expiré" s'affiche correctement sur la SessionCard
- [x] 7.5 Vérifier que les tests frontend existants passent après les modifications
