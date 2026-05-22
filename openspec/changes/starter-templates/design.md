## Context

Actuellement, `POST /api/v1/sessions` crée toujours une session avec `YamlContent: ""` — un éditeur Monaco vide. Les utilisateurs partent de zéro, sans structure ni exemple. Le `sample.yml` présent dans `themes/default/` n'est jamais exposé.

Le pattern technique de référence dans le projet est `backend/internal/admin/catalog.go` : un fichier `catalog.yaml` embarqué via `go:embed`, parsé au démarrage en `init()`, et exposé via des fonctions `GetCatalog()` / `GetCatalogEntry(slug)`. Ce pattern est à répliquer à l'identique pour les templates.

## Goals / Non-Goals

**Goals:**
- Nouveau package `backend/internal/templates/` avec catalog embed
- Endpoint public `GET /api/v1/templates` (liste des templates disponibles)
- Paramètre optionnel `template_id` sur `POST /api/v1/sessions`
- Split button sur la landing page (principal = session vide, chevron = dropdown templates)
- Premier jeu de 5 templates YAML : `minimal`, `developer-fr`, `developer-en`, `designer-fr`, `devops-fr`

**Non-Goals:**
- Gestion des templates via l'interface admin
- Templates liés à un thème spécifique
- Versioning automatique des templates avec le binaire CVWonder (prévu long terme)
- Prévisualisation du template avant création de session

## Decisions

### D1 — Package miroir du catalog admin

**Décision** : `backend/internal/templates/` avec `catalog.go` + `catalog.yaml` + `templates/*.yaml`, tous embarqués via `go:embed`.

**Alternatives considérées** :
- Templates dans le package `session` → couplage inutil entre domaines
- Fichiers lus depuis le filesystem à runtime → non embarqués, dépendance de déploiement

**Rationale** : Isomorphie parfaite avec le pattern `admin/catalog.go` déjà validé dans la codebase. `go:embed` garantit que les templates sont toujours disponibles dans le binaire compilé, sans configuration supplémentaire.

```
backend/internal/templates/
├── catalog.go          // //go:embed catalog.yaml + //go:embed templates/*
├── catalog.yaml        // liste : slug, name, description, file
└── templates/
    ├── minimal.yaml
    ├── developer-fr.yaml
    ├── developer-en.yaml
    ├── designer-fr.yaml
    └── devops-fr.yaml
```

Structure `catalog.yaml` :
```yaml
templates:
  - slug: minimal
    name: "Minimal"
    description: "Structure de base, à compléter"
    file: templates/minimal.yaml
  - slug: developer-fr
    name: "Développeur (FR)"
    description: "Profil développeur complet en français"
    file: templates/developer-fr.yaml
```

### D2 — Endpoint public GET /api/v1/templates

**Décision** : Route publique, sans authentification, retournant `[]TemplateEntry` (slug, name, description uniquement — pas le contenu YAML).

**Rationale** : Le contenu YAML est injecté côté serveur à la création de session, pas côté client. Le frontend n'a besoin que des métadonnées pour peupler le dropdown.

### D3 — Injection du template dans CreateUsecase

**Décision** : `CreateUsecase.Execute` accepte un paramètre `templateID *string` supplémentaire. Si non-nil, le usecase charge le YAML via `templates.GetContent(slug)` et l'utilise comme `YamlContent` initial.

**Alternatives considérées** :
- Passer le contenu YAML brut depuis le handler → viole la séparation des responsabilités
- Résoudre dans un middleware → trop indirect pour une logique de création

### D4 — Split button : clic principal = session vide

**Décision** : Clic sur la partie principale du bouton = comportement actuel (session vide, redirection directe). Clic sur le chevron = dropdown avec la liste des templates. Aucune régression UX.

**Rationale** : Préserve la friction minimale pour l'utilisateur qui veut juste démarrer rapidement.

```
┌──────────────────────────────────────┬────┐
│  Créer mon CV — it's free            │ ▾  │
└──────────────────────────────────────┴────┘
         ↓ clic principal                ↓ clic chevron
   POST /api/v1/sessions {}         ouvre dropdown
   (template_id absent)             ○ Minimal
                                    ○ Développeur (FR)
                                    ○ Développeur (EN)
                                    ○ Designer (FR)
                                    ○ DevOps (FR)
                                         ↓ sélection
                                  POST /api/v1/sessions
                                  { template_id: "developer-fr" }
```

### D5 — Versioning des templates (court terme)

**Décision** : Les templates sont maintenus manuellement dans le repo studio, mis à jour lors de chaque upgrade du binaire CVWonder. Pas de couplage automatique avec le repo `cvwonder` en v1.

**Risque accepté** : Un upgrade du binaire qui change le schéma YAML peut invalider silencieusement les templates existants. Mitigation : tester la génération des templates dans la CI après chaque bump de version du binaire.

## Risks / Trade-offs

- **Templates obsolètes après upgrade du binaire** → Ajouter un test de smoke dans la CI : générer chaque template avec la version du binaire en place et vérifier l'absence d'erreur de validation. Mitigation manuelle acceptable en v1.
- **Dropdown chargé à froid** → `GET /api/v1/templates` est appelé au montage de la landing. Réponse embarquée, donc < 1ms. Aucun spinner nécessaire.
- **Prolifération de templates** → Le catalog est versionné dans le repo, les PR de contribution sont le mécanisme de contrôle. Pas de risque à court terme.
