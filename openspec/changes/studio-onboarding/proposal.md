## Why

Quand un utilisateur arrive dans le Studio pour la première fois, il fait face à un éditeur vide ou partiellement rempli, une preview qui ne se déclenche jamais si aucun thème n'est sélectionné, et un placeholder texte qui ne guide pas. L'expérience de découverte est absente, ce qui crée un abandon précoce et une confusion sur comment démarrer.

## What Changes

- **Bug fix** : la preview auto-refresh ne se déclenche que si `selectedThemeId` est non-null ; si aucun thème n'est sélectionné à l'arrivée, auto-sélectionner le premier thème disponible
- **Immediate preview on mount** : déclencher une première génération dès que la session est chargée (YAML + thème disponibles), sans attendre le debounce
- **CV skeleton placeholder** : remplacer le texte "Preview will appear here after the first generation" par un placeholder visuel qui ressemble à un CV
- **In-studio template picker** : afficher un écran d'accueil dans le panel gauche quand le YAML est vide à l'arrivée, permettant de choisir un template sans retourner sur la landing page
- **Backend pre-render** : lors d'un `POST /api/v1/sessions` avec `template_id`, déclencher un rendu preview côté serveur et stocker l'URL dans la session avant de répondre

## Capabilities

### New Capabilities

- `studio-onboarding`: Comportement du Studio lors d'une première visite — auto-sélection du thème, preview immédiate au mount, skeleton placeholder, template picker inline quand YAML vide

### Modified Capabilities

- `go-api-server`: La création de session avec `template_id` déclenche désormais un pré-rendu preview côté serveur et retourne une `preview_url` dans la réponse

## Impact

- `frontend/src/app/studio/page.tsx` — logique de chargement (auto-select thème, immediate trigger)
- `frontend/src/components/features/preview/PreviewFrame.tsx` — skeleton placeholder
- `frontend/src/hooks/usePreview.ts` — immediate first-generation
- Nouveau composant : `frontend/src/components/features/onboarding/TemplatePicker.tsx`
- `backend/internal/usecases/sessions/create.go` (ou équivalent) — pre-render lors du createSession avec template
- `backend/internal/domain/session.go` (ou modèle) — champ optionnel `preview_url` dans la réponse de création
- API : `POST /api/v1/sessions` — réponse enrichie avec `preview_url` optionnel
- Store Zustand `studio.ts` — initialisation depuis `preview_url` de la réponse session
