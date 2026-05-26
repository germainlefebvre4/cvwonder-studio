## Why

Quand un utilisateur anonyme dépasse la limite de création de sessions (3/heure par IP), le backend retourne HTTP 429 mais le frontend avale silencieusement l'erreur — l'utilisateur voit le bouton se figer sans aucune explication. En développement local, cette limite gêne les itérations rapides sans moyen simple de la désactiver.

## What Changes

- Le frontend affiche un message clair (toast ou inline) quand la création de session échoue avec un 429, incluant le délai avant nouvelle tentative issu du header `Retry-After`
- Le bouton "Start Building" est désactivé le temps du cooldown, avec un compte à rebours visible
- Ajout d'une variable d'environnement `SESSION_CREATION_RATE_LIMIT_DISABLED=true` (backend) pour bypasser le middleware en développement local
- Le fichier `.env.example` est mis à jour pour documenter cette variable

## Capabilities

### New Capabilities
<!-- aucune nouvelle capability — c'est du polish sur l'existant -->

### Modified Capabilities
- `anonymous-protections` : ajout des exigences frontend sur le feedback visuel lors d'un 429, et du mécanisme de bypass local via variable d'environnement

## Impact

- **Frontend** : `frontend/src/services/sessions.ts` (createSession), `frontend/src/app/page.tsx` (LandingPage handleStart), potentiellement un composant de feedback inline
- **Backend** : `backend/internal/adapters/http/ratelimit.go` (SessionCreationRateLimitMiddleware — ajout du bypass env), `backend/cmd/api/main.go` ou config
- **Config** : `.env.example`, variables d'environnement backend
