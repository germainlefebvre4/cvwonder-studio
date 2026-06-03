## Context

Le dashboard présente trois problèmes liés à la gestion du partage :

1. `getSessionBorderStatus()` utilise un seuil de 30 jours pour détecter les sessions "en expiration". Avec un TTL auth de 30 jours, toutes les sessions affichent la bordure orange dès leur création — le seuil capture 100 % de la durée de vie des sessions.
2. Quand `hasShare = true`, `ShareDialog` n'affiche aucun lien (le token brut n'est jamais stocké côté client) ni aucune action utile. L'utilisateur ne peut ni copier ni régénérer le lien.
3. Aucune durée de vie n'est associable à un lien de partage — ils sont permanents jusqu'à révocation explicite.

## Goals / Non-Goals

**Goals:**
- Corriger le seuil de bordure pour qu'il reflète un état "expiration imminente" réel (7 jours)
- Rendre la dialog "Gérer le partage" utile pour les sessions déjà partagées (Option B : message + régénération)
- Permettre la création d'un lien avec une durée de vie optionnelle (7j / 30j / illimité)
- Afficher l'état "lien expiré" sur la SessionCard sans nettoyage automatique en DB

**Non-Goals:**
- Aucun job de nettoyage automatique des liens expirés
- Aucune modification de la logique de protection par mot de passe
- Aucune date de fin personnalisée (pas de date picker)
- Aucun changement à la route `/p/{session_id}`

## Decisions

### 1. Seuil border status : 30j → 7j

Le seuil de 30 jours correspond exactement au TTL des sessions auth, ce qui rend le warning permanent. 7 jours donne une fenêtre d'alerte raisonnable quelle que soit la durée de vie de la session.

_Alternatif envisagé_ : seuil relatif (10 % du TTL). Rejeté : plus complexe à implémenter et à communiquer à l'utilisateur.

### 2. ShareDialog "déjà partagé" — Option B (message + régénération)

Quand `hasShare = true` et `shareUrl = null` (lien non récupérable), afficher :
- Un message explicatif ("Le lien original ne peut plus être affiché")
- Un bouton "Révoquer et créer un nouveau lien" qui chaîne `revokeShare()` → `createShare()` côté frontend sans fermer la dialog
- Le nouveau lien s'affiche immédiatement dans la zone de copie habituelle

_Alternatif envisagé_ : stocker le token plaintext côté serveur. Rejeté : contraire au principe de sécurité (token non stocké = non compromettable par fuite DB).

_Alternatif envisagé_ : fermer la dialog après revoke et demander à rouvrir. Rejeté : UX confuse, deux actions au lieu d'une.

### 3. share_expires_at : NULL = illimité, pas de nettoyage automatique

- Colonne nullable `share_expires_at TIMESTAMPTZ` ajoutée à `sessions`
- `NULL` signifie "aucune expiration"
- Quand `share_expires_at < NOW()`, l'API `/s/{id}/{token}` retourne HTTP 404
- Le `share_token_hash` reste en DB — pas de cron job
- La SessionCard détecte `share_token_hash IS NOT NULL AND share_expires_at < NOW()` et affiche "🔗 Partagée · lien expiré" + CTA "Recréer un lien"

_Alternatif envisagé_ : nettoyage automatique via cron job. Rejeté : complexité opérationnelle, et l'UX "lien expiré visible" est plus informative.

### 4. Durées proposées : 7j / 30j / Illimité (défaut)

L'interface de création propose trois options radio. "Illimité" est le défaut pour ne pas surprendre les utilisateurs existants. L'API accepte `{ duration: "7d" | "30d" | null }`.

### 5. Régénération = deux appels API séquentiels

`handleRegenerate()` dans ShareDialog appelle `revokeShare()` puis `createShare()`. Si `revokeShare()` réussit mais `createShare()` échoue, le lien est révoqué sans nouveau lien. La gestion d'erreur affiche un message clair et propose de réessayer sans fermer la dialog.

## Risks / Trade-offs

- **État incohérent lors d'une régénération partielle** : revoke OK + create KO → session sans lien mais `share_token_hash = NULL`. Mitigation : message d'erreur explicite + le bouton "Partager" reprend le flux normal de création.
- **Liens expirés visibles en DB** : `share_token_hash` reste présent même si le lien est expiré. Acceptable — c'est l'information affichée dans la SessionCard ("lien expiré").
- **Frontend responsable de l'état "expiré"** : la SessionCard doit comparer `share_expires_at` avec `Date.now()`. Risque de drift si les horloges client/serveur divergent. Mitigation : marge de quelques minutes côté serveur (considérer `share_expires_at < NOW() - interval '5 minutes'`).

## Migration Plan

1. Migration DB additive (`share_expires_at TIMESTAMPTZ NULL DEFAULT NULL`) — rétrocompatible, aucun lien existant n'est affecté
2. Régénération sqlc (`make sqlc-gen`)
3. Deploy backend puis frontend (pas de coordination stricte requise)
4. Rollback : `share_expires_at` peut être droppé sans impact car `NULL` = comportement actuel
