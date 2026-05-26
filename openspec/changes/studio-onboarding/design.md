## Context

Le Studio (`/studio/:token`) est le cœur du produit. Aujourd'hui, à l'arrivée :
- Si aucun thème n'est sélectionné, `usePreview` ne déclenche jamais de génération (`!debouncedTheme` court-circuite le hook)
- Si YAML et thème sont présents, un debounce de 1s s'écoule avant la première preview
- L'état vide de PreviewFrame est un texte plain non actionnable
- Si le YAML est vide (session sans template), l'utilisateur fait face à un éditeur CodeMirror vide sans guidance

La change `starter-templates` a introduit les templates côté backend et un SplitButton sur la landing page, mais n'a pas traité l'expérience *dans* le Studio.

## Goals / Non-Goals

**Goals:**
- Zéro état "Preview will appear here" visible pour les nouvelles sessions avec template
- L'utilisateur peut démarrer avec un template *depuis le Studio* (sans retourner sur la landing page)
- Un placeholder visuel (skeleton CV) remplace le texte plain dans l'empty state de PreviewFrame
- Le bug de non-déclenchement de preview quand `theme_id = null` est corrigé

**Non-Goals:**
- Modifier l'expérience des sessions existantes / returning users (scope : nouvelles sessions uniquement)
- Implémenter un browser de thèmes avec preview visuelle des thèmes
- Rendu PDF ou export au moment de la création

## Decisions

### D1 — Auto-sélection côté frontend, pas de pré-rendu serveur

**Contexte** : Le pré-rendu serveur au `POST /api/v1/sessions` nécessite un thème, mais les templates n'embarquent pas de `theme_id`. Injecter un thème par défaut côté serveur crée un couplage `templates ↔ themes` et ralentirait la réponse HTTP de création.

**Décision** : L'auto-sélection du thème et le déclenchement immédiat de la preview se font **côté frontend, au moment du chargement du Studio** :
1. `getSession()` retourne la session (YAML rempli, `theme_id = null`)
2. `listThemes()` est appelé immédiatement en parallèle
3. Le premier thème disponible est sélectionné automatiquement (`setSelectedThemeId`) et persisté via `PATCH /api/v1/sessions/:token`
4. Une génération est déclenchée immédiatement (bypass du debounce, une seule fois) dès que YAML + thème sont disponibles

**Alternatif écarté** : pré-rendu dans le handler HTTP — trop couplé, ralentit la création, nécessite un thème par défaut hardcodé.

### D2 — Immediate first-generation flag dans usePreview

**Contexte** : `usePreview` déclenche sur `debouncedYaml` + `debouncedTheme`. Ces deux valeurs debounced arrivent 1s après le chargement. Il n'existe pas de mécanisme "fire once on ready".

**Décision** : Ajouter un `hasTriggeredInitial` ref dans `usePreview`. Quand YAML et thème deviennent disponibles pour la première fois (via un effet sur les valeurs non-debounced), déclencher une génération avec overlay (`showOverlay: true`). Les générations suivantes continuent via le debounce classique.

Alternativement, `StudioPage` peut appeler `forceRefresh()` directement après avoir sélectionné le thème, mais cela viole la séparation entre le hook preview et la page.

### D3 — TemplatePicker : overlay dans le panel gauche, pas une page séparée

**Contexte** : Quand YAML est vide à l'arrivée, l'éditeur CodeMirror affiche un champ vide. Il n'y a pas de guidage.

**Décision** : Quand `yamlContent === ''` après le chargement de la session, le panel gauche remplace l'éditeur par un `TemplatePicker` component. Ce composant :
- Appelle `GET /api/v1/templates` (données déjà disponibles via le service existant)
- Affiche les templates sous forme de cartes sélectionnables
- Sur sélection : appelle `PATCH /api/v1/sessions/:token` avec le YAML du template + thème auto-sélectionné, puis disparaît pour laisser place à l'éditeur
- Propose une option "Partir de zéro" qui pré-remplit l'éditeur avec un YAML minimal commenté

Le `TemplatePicker` disparaît dès que `yamlContent !== ''` dans le store — il n'y a pas d'état dédié "onboarding mode".

**Alternatif écarté** : modal / overlay plein écran — trop intrusif, masque l'éditeur.

### D4 — CV Skeleton dans PreviewFrame

**Décision** : Remplacer le texte "Preview will appear here after the first generation" par un placeholder SVG/div qui évoque la mise en page d'un CV (blocs de texte simulés). Ce placeholder est visible uniquement si `previewUrl === null && !isGenerating`.

Aucun framework de skeleton externe — implémenté avec des `div` Tailwind animés (`animate-pulse`).

## Risks / Trade-offs

- **[Risque] listThemes() peut échouer** → Mitigation : si la liste est vide ou en erreur, le flow continue sans auto-sélection ; le `TemplatePicker` affiche un message d'erreur non bloquant
- **[Risque] La première génération avec overlay prend >2s** → Le `MIN_ANIMATION_MS = 1000` garantit un minimum visuel ; au-delà, c'est la performance du backend qui est en cause (hors scope)
- **[Trade-off] Auto-select thème persisté en DB** : chaque nouvelle session avec template génère un PATCH supplémentaire. Acceptable car c'est une seule requête en arrière-plan.
- **[Trade-off] TemplatePicker appelle listTemplates() depuis le Studio** : doublon avec l'appel de la landing page. Acceptable — données légères, pas de cache nécessaire à ce stade.

## Open Questions

- Quel YAML montrer pour "Partir de zéro" dans le TemplatePicker ? Un YAML minimal commenté type `# Nom: ...` suffit, ou utiliser le template `minimal` embarqué ?
  → Utiliser le template `minimal` existant pour cohérence.
