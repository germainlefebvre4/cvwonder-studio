## 1. Bug fix — Auto-sélection du thème

- [x] 1.1 Dans `StudioPage.useEffect` (après `getSession()`), si `session.theme_id` est null, appeler `listThemes()` et sélectionner le premier thème : `setSelectedThemeId(first.id)` + `updateSession(token, { theme_id: first.id })`
- [x] 1.2 Gérer le cas où `listThemes()` échoue ou retourne `[]` : log silencieux, pas de crash, le Studio continue sans thème

## 2. Immediate first-generation on mount

- [x] 2.1 Dans `usePreview`, ajouter un ref `hasTriggeredInitialRef` initialisé à `false`
- [x] 2.2 Ajouter un `useEffect` sur les valeurs non-debounced `(yamlContent, selectedThemeId, token)` : si `yamlContent !== ''` ET `selectedThemeId !== null` ET `hasTriggeredInitialRef.current === false`, appeler `triggerGeneration(token, true)` et mettre le ref à `true`
- [x] 2.3 S'assurer que cet effet initial ne court-circuite pas les générations debounced suivantes (le ref empêche les doubles déclenchements)

## 3. CV Skeleton placeholder dans PreviewFrame

- [x] 3.1 Dans `PreviewFrame.tsx`, remplacer le bloc `<div className="flex h-full items-center justify-center ...">Preview will appear here...</div>` par un composant skeleton
- [x] 3.2 Implémenter le skeleton avec des `div` Tailwind `animate-pulse` et tokens design system (`bg-[var(--color-surface-muted)]`, `rounded`) organisés en layout CV : bloc nom en haut, ligne de contact, séparateur, deux colonnes de blocs texte
- [x] 3.3 Vérifier que le skeleton n'apparaît que si `previewUrl === null && !isGenerating` (le reste des conditions restent identiques)

## 4. Composant TemplatePicker

- [x] 4.1 Créer `frontend/src/components/features/onboarding/TemplatePicker.tsx`
- [x] 4.2 Le composant appelle `getTemplates()` au mount et stocke la liste en state local
- [x] 4.3 Afficher les templates sous forme de cartes (`border rounded-lg p-4 cursor-pointer hover`) avec `name` et `description`
- [x] 4.4 Ajouter une carte "Partir de zéro" qui, au clic, appelle `getTemplates()` pour récupérer le slug `minimal` et l'utilise (ou hard-code le slug `'minimal'`)
- [x] 4.5 Sur sélection d'un template : appeler `onSelect(slug)` prop callback (fourni par StudioPage)
- [x] 4.6 Gérer l'état loading (`<p>Loading templates…</p>`) et l'état erreur (message inline + option "Partir de zéro" toujours visible)
- [x] 4.7 Styler en cohérence avec le design system existant (tokens CSS, pas de couleurs hardcodées)

## 5. Intégration TemplatePicker dans StudioPage

- [x] 5.1 Dans `StudioPage`, créer un service `getTemplateContent(slug: string): Promise<string>` qui appelle `GET /api/v1/templates/:slug` — OU utiliser le pattern existant : `createSession` avec `template_id` retourne le YAML en `getSession()`. Choisir la solution la plus simple : appeler `PATCH /api/v1/sessions/:token` avec le YAML issu d'une session temporaire, **OU** ajouter `GET /api/v1/templates/:slug` côté backend pour retourner le contenu brut
- [x] 5.2 Décision d'implémentation pour 5.1 : ajouter `GET /api/v1/templates/:slug` au backend (handler dans `SessionHandler.GetTemplateContent`) qui retourne `{ yaml_content: string }` depuis `templates.GetContent(slug)`
- [x] 5.3 Ajouter la route `GET /api/v1/templates/:slug` dans le router Go
- [x] 5.4 Ajouter `getTemplateContent(slug: string): Promise<string>` dans `frontend/src/services/templates.ts`
- [x] 5.5 Dans `StudioPage`, conditionner le rendu du panel gauche : si `yamlContent === ''` après le chargement de la session ET `!loading`, afficher `<TemplatePicker>` ; sinon afficher `<YamlEditor>`
- [x] 5.6 Implémenter le handler `onSelect` dans `StudioPage` : appeler `getTemplateContent(slug)`, puis `handleYamlChange(content)` (met à jour le store + persiste via PATCH), ce qui rend `yamlContent !== ''` et fait disparaître le picker
- [x] 5.7 S'assurer que le TemplatePicker ne réapparaît pas si l'utilisateur efface son YAML (la condition est évaluée seulement au chargement initial, pas en continu) — utiliser un `ref` `hasShownPickerRef` ou tester `isInitialLoad`

## 6. Tests et vérification

- [x] 6.1 Vérifier manuellement : créer une session vide → StudioPage montre le TemplatePicker
- [x] 6.2 Vérifier manuellement : sélectionner un template dans le picker → éditeur apparaît avec le YAML, preview démarre automatiquement
- [x] 6.3 Vérifier manuellement : créer une session avec template depuis la landing page → StudioPage montre directement l'éditeur + preview immédiate (skeleton → génération → iframe)
- [x] 6.4 Vérifier manuellement : returning user (session avec YAML et thème) → preview immédiate sans flash du skeleton
- [x] 6.5 Vérifier que le skeleton s'affiche correctement en dark mode (tokens CSS adaptatifs)
- [x] 6.6 Vérifier que `listThemes()` en échec ne casse pas le Studio (tester avec network throttling)
