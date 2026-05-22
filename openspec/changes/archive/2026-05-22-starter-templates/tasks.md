## 1. Backend — Package templates

- [x] 1.1 Créer `backend/internal/templates/catalog.go` avec `//go:embed catalog.yaml` et `//go:embed templates/*`, struct `TemplateEntry`, `init()`, `GetCatalog()`, `GetContent(slug string) string`
- [x] 1.2 Créer `backend/internal/templates/catalog.yaml` avec les 5 entrées (minimal, developer-fr, developer-en, designer-fr, devops-fr)
- [x] 1.3 Créer `backend/internal/templates/templates/minimal.yaml` — structure minimaliste, valeurs réalistes vides
- [x] 1.4 Créer `backend/internal/templates/templates/developer-fr.yaml` — profil développeur complet, français, contenu fictif crédible
- [x] 1.5 Créer `backend/internal/templates/templates/developer-en.yaml` — profil developer complet, anglais, contenu fictif crédible
- [x] 1.6 Créer `backend/internal/templates/templates/designer-fr.yaml` — profil designer UX/UI, français
- [x] 1.7 Créer `backend/internal/templates/templates/devops-fr.yaml` — profil DevOps / Platform Engineer, français
- [x] 1.8 Valider chaque fichier template avec `./bin/cvwonder validate` (ou équivalent)

## 2. Backend — API

- [x] 2.1 Ajouter la route `GET /api/v1/templates` dans le handler de sessions (ou handler dédié) ; retourner `[]{ slug, name, description }` depuis `templates.GetCatalog()`
- [x] 2.2 Modifier `CreateUsecase.Execute` pour accepter un paramètre `templateID *string` ; si non-nil, appeler `templates.GetContent(slug)` et l'utiliser comme `YamlContent` ; retourner une erreur si le slug est inconnu
- [x] 2.3 Modifier le handler `POST /api/v1/sessions` pour désérialiser le champ `template_id` depuis le body et le passer au usecase ; retourner HTTP 400 si le slug est inconnu
- [x] 2.4 Écrire les tests unitaires pour `CreateUsecase` avec et sans `template_id`

## 3. Frontend — Service & état

- [x] 3.1 Ajouter `getTemplates(): Promise<Template[]>` dans `frontend/src/services/sessions.ts` (ou `templates.ts`)
- [x] 3.2 Modifier `createSession(themeId?, templateId?)` pour passer `template_id` dans le body si fourni

## 4. Frontend — Composant SplitButton

- [x] 4.1 Créer `frontend/src/components/ui/SplitButton.tsx` : partie principale (onClick) + chevron (ouvre dropdown) ; fermeture au clic extérieur
- [x] 4.2 Styler le SplitButton en cohérence avec le `Button` existant (même variants, tailles, tokens CSS)

## 5. Frontend — Landing page

- [x] 5.1 Modifier `frontend/src/app/page.tsx` : remplacer les deux `<Button onClick={handleStart}>` par `<SplitButton>` ; appeler `GET /api/v1/templates` au montage de la page
- [x] 5.2 Implémenter le handler de sélection de template : appeler `createSession(undefined, templateId)` puis `navigate(/studio/:token)`
- [x] 5.3 Gérer la dégradation gracieuse : si `GET /api/v1/templates` échoue, masquer le chevron et afficher uniquement le bouton principal

## 6. CI — Smoke test templates

- [x] 6.1 Ajouter un job (ou step) dans la CI qui valide chaque template YAML embarqué après chaque bump de version du binaire CVWonder
