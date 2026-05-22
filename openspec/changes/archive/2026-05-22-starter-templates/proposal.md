## Why

Aujourd'hui, créer une session génère un éditeur YAML vide — le "blank page problem" freine l'adoption, surtout pour les utilisateurs qui découvrent le format CVWonder. Des templates pré-remplis par profil métier permettent de démarrer en quelques secondes avec un CV structuré et crédible.

## What Changes

- Ajouter un dossier `backend/internal/templates/` avec un `catalog.yaml` et des fichiers YAML embarqués via `go:embed`
- Exposer un endpoint public `GET /api/v1/templates` retournant la liste des templates disponibles (slug, name, description)
- Étendre `POST /api/v1/sessions` pour accepter un paramètre optionnel `template_id` ; si fourni, le contenu YAML du template est utilisé comme `yaml_content` initial de la session
- Modifier la landing page : transformer le bouton "Créer mon CV" en split button (action principale = session vide, chevron = dropdown avec choix de templates)
- Livrer un premier jeu de templates : `minimal`, `developer-fr`, `developer-en`, `designer-fr`, `devops-fr`

## Capabilities

### New Capabilities

- `starter-templates`: Catalogue de templates YAML embarqués dans le binaire via `go:embed` ; endpoint public de listing ; injection du contenu template à la création de session ; split button sur la landing pour choisir un template ou démarrer vide

### Modified Capabilities

- `go-api-server`: Nouvel endpoint `GET /api/v1/templates` et paramètre optionnel `template_id` sur `POST /api/v1/sessions`
- `react-spa`: Split button sur la landing page ; appel de `GET /api/v1/templates` pour peupler le dropdown

## Impact

- **Backend** : nouveau package `backend/internal/templates/` (catalog.go, catalog.yaml, templates/*.yaml) ; modification de `CreateUsecase` pour accepter et résoudre un `templateID` ; nouvelle route `GET /api/v1/templates` dans le handler de sessions
- **Frontend** : nouveau composant `SplitButton` (ou enrichissement du `Button` existant) ; appel `GET /api/v1/templates` au chargement de la landing ; modification de `createSession()` pour passer `template_id`
- **Aucune migration DB** — les templates sont des fichiers statiques embarqués
- **Versioning** : les templates sont maintenus manuellement dans le repo studio et mis à jour à chaque upgrade du binaire CVWonder (court terme) ; un couplage avec le repo `cvwonder` est envisagé à long terme
