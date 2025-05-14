---
sidebar_position: 3
---
# Quick Start Guide

---

This guide will help you quickly create your first CV with CVWonder.

## Creating Your First CV

### Step 1: Create a YAML CV File

First, create a file named `cv.yml` with your CV information. Here's a minimal example:

```yaml
person:
  name: Germain
  depiction: profile.png
  profession: Bâtisseur de Plateformes et de Nuages
  location: Lille
  email: germain.lefebvre@mycompany.fr
  site: http://germainlefebvre.fr

socialNetworks:
  github: germainlefebvre4

career:
  - companyName: Zatsit
    companyLogo: https://raw.githubusercontent.com/germainlefebvre4/cvwonder-theme-default/refs/heads/main/images/zatsit-logo.webp
    duration: 10 mois, aujourd'hui
    missions:
      - position: Platform Engineer
        company: Adeo
        location: Ronchin, France
        dates: 2024, mars - 2024, décembre
        summary: Construire une IDP, plateforme interne de développement, totalement managée pour aider les développeurs à se focaliser sur le code. Sur base du code source, la plateforme provisionne l'infrastructure sous-jacente, les base de données, la construction des artefact et publication sur la registry, le déploiement dans Kubernetes, l'intégration du monitoring avec Datadog et construction des Monitors.
        technologies:
          - ArgoCD
          - Kubernetes
        description:
          - Développement de l'operator Kubernetes responsable du provisioning des bases de données
          - Développement des Compositions Crossplane pour provisionner les base de données
languages:
  - name: Francais
    level: Maternelle
  - name: Anglais
    level: Aisance professionnelle

education:
  - schoolName: IG2I - Centrale
    schoolLogo: https://raw.githubusercontent.com/germainlefebvre4/cvwonder-theme-default/refs/heads/main/images/centrale-lille-logo.webp
    degree: Titre d'ingénieur (BAC+5)
    location: Lens, France
    dates: 2019 - 2014
    link: https://ig2i.centralelille.fr
```

### Step 2: Generate Your CV

Copy/paste the above YAML into the YAML Editor.

### Step 3: View Your CV

View the generated CV in the preview panel. You can now make adjustments to your CV content and regenerate the CV to refine it.

### Step 4: Export Your CV

Press the "Export" button to download your CV in the desired format (PDF, ...).

## Next Steps

- Learn more about [CV structure and fields](https://cvwonder.readthedocs.io/en/latest/getting-started/write-cv/)
- Explore available [Themes](https://github.com/topics/cvwonder-theme)
- Check [configuration options](configuration.md) for customizing CVWonder
- See complete [examples](../user-guide/examples/basic-example.md)
