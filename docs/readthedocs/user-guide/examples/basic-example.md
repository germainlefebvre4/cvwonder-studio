# Basic CV Example

This page provides a basic example of a CV written in YAML format for CVWonder.

## Complete Example

```yaml
person:
  name: Germain
  depiction: profile.png
  profession: Bâtisseur de Plateformes et de Nuages
  location: Lille
  citizenship: FR
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
          - K8s Operrator
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

## Using the Example

1. Copy the YAML example above and paste it in the editor.
2. It will generate the CV in the preview panel.
3. You can modify the YAML to fit your own experience and skills.

## Customizing the Example

This example provides a comprehensive structure that you can adapt to your own needs. Feel free to:

- Remove sections that aren't relevant to your experience
- Add additional items to any section
- Modify the structure to emphasize your strengths

## Next Steps

- Check out the [Advanced Example](advanced-example.md) for more complex CV structures
- Learn more about the [CV structure](https://cvwonder.readthedocs.io/en/latest/getting-started/write-cv/)
- Explore [Gallery](../gallery.md) to customize the appearance
