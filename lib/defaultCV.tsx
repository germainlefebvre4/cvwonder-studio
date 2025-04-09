const defaultCV = `---
company:
  name: Zatsit
  logo: images/zatsit-logo.webp

person:
  name: Germain
  depiction: profile.png
  profession: Bâtisseur de Plateformes et de Nuages
  location: Lille
  citizenship: FR
  email: germain.lefebvre@mycompany.fr
  site: http://germainlefebvre.fr
  phone: +33 6 00 00 00 00

socialNetworks:
  github: germainlefebvre4
  stackoverflow: germainlefebvre4
  linkedin: germainlefebvre4
  twitter: germainlefebvr4

abstract:
  - tr: "J'ai grandi dans l'univers des systèmes Linux. Ma volonté de progression m'a rapidement amené vers des outils automatisation, d'Infra-as-Code, ainsi que les plateformes de CI/CD."
  - tr: "La découverte de l'univers des conteneurs est digne de 'Rencontre avec le 3ème type'. C'est devenu un écosystème que j'aime tester, utiliser et transmettre."
  - tr: "Mon amour pour le logiciel libre m'a amené à contribuer pour des librairies, sqlfluff, libtado, crossplane-assistant ou encore cvwonder."
  - tr: "J'aime passer du temps sur des 'side projects' qui peuvent aider, servir et simplifier le quotidien des Techs. Ce que nous enseigne la sphère de l'open source est vertueux : l'entraide et le partage."

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
          - Crossplane
          - Vault
          - Github Actions
          - JFrog Artifactory
          - Backstage
          - Python
          - Golang
        description:
          - Développement de l'operator Kubernetes responsable du provisioning des bases de données
          - Développement des Compositions Crossplane pour provisionner les base de données
          - Développement de l'API de l'IDP en Golang
          - Déploiement avec ArgoCD
          - Vulgarisation d'une architecture applicative en langage déclaratif (yaml)

  - companyName: Ineat
    companyLogo: https://raw.githubusercontent.com/germainlefebvre4/cvwonder-theme-default/refs/heads/main/images/ineat-logo.webp
    duration: 7 ans, 10 mois
    missions:
      - position: Lead Tech Ops
        company: Siemens
        location: Lille, France
        dates: 2022, juin - 2024, février
        summary: Mettre en place l'infrastructure d'un puit de logs et métriques.
        technologies:
          - Linux
          - Apache Zookeeper
          - Apache Kafka
          - Kafka Streams
          - Clickhouse
          - Prometheus
          - Prometheus Exporters
          - AlertManager
          - Fluentbit
          - Terraform
          - Ansible
          - Gitlab CI
          - Python
          - Pytest testinfra
        description:
          - Création d'un produit déclinable (couches de configuration multiples)
          - Création d'un générateur de configuration pour les déclinaisons clients
          - Développement d'un système de déploiement offline et asynchrone
          - Industrialisation de la plateforme de développement 
          - Création d'environnements éphémères pour rendre les développeurs autonomes
technicalSkills:
  domains:
    - name: Cloud
      competencies:
        - name: AWS
          level: 80
        - name: GCP
          level: 70
        - name: Azure
          level: 40
    - name: Ops
      competencies:
        - name: Linux
          level: 90
        - name: Ansible
          level: 90
        - name: Terraform
          level: 90
        - name: Docker
          level: 90
        - name: Kubernetes
          level: 90
    - name: Others
      competencies:
        - name: Golang
          level: 40
        - name: Python
          level: 70
        - name: Gitlab CI
          level: 80
        - name: Github Actions
          level: 70

sideProjects:
  - name: libtado
    position: maintainer
    description: A Library to control your Tado Smart Thermostat.
    link: germainlefebvre4/libtado
    type: github
    langs: Python
    color: 3572A5

  - name: sqlfluff
    position: contributor
    description: A modular SQL linter and auto-formatter with support for multiple dialects and templated code.
    link: sqlfluff/sqlfluff
    type: github
    langs: Python
    color: 3572A5

  - name: crossplane-assistant
    position: maintainer
    description: A CLI to help you to manage your Crossplane resources.
    link: crossplane-assistant/crossplane-assistant
    type: github
    langs: Go
    color: 3572A5

  - name: cvwonder
    position: maintainer
    description: A CLI to render your CV from a YAML file.
    link: germainlefebvre4/cvwonder
    type: github
    langs: Go
    color: 3572A5

certifications:
  - companyName: AWS
    certificationName: Cloud Practitioner
    issuer: Person View
    date: Février 2022
    link: https://www.credly.com/badges/e7955ad8-1d54-4eb3-ac0f-1f69e644e14c/public_url
    badge: https://raw.githubusercontent.com/germainlefebvre4/cvwonder-theme-default/refs/heads/main/images/aws-certified-cloud-practitioner.png
  - companyName: AWS
    certificationName: Solutions Architect Associate
    issuer: Coursera
    date: Mars 2018
    link: https://www.credly.com/badges/dd09dc40-9ef8-43a4-addb-d861d4dadf26/public_url
    badge: https://raw.githubusercontent.com/germainlefebvre4/cvwonder-theme-default/refs/heads/main/images/aws-certified-solutions-architect-associate.png
  - companyName: AWS
    certificationName: SysOps Administrator Associate
    issuer: Coursera
    date: Août 2017
    link: https://www.credly.com/badges/f0054964-7101-47a0-82b2-16d351eb08f2/public_url
    badge: https://raw.githubusercontent.com/germainlefebvre4/cvwonder-theme-default/refs/heads/main/images/aws-certified-sysops-administrator-associate.png

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

`;

export default defaultCV;
