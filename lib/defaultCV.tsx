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
    companyLogo: images/zatsit-logo.webp
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
    companyLogo: images/ineat-logo.webp
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
      - position: Lead Tech Ops
        company: Kiloutou
        project: Kite
        location: Lille, France
        dates: 2023, juin - 2024, février
        summary: Maintenir opérationnellement les infrastructures liées aux applications. Gestion d'une équipe de 3 personnes pour assurer l'infogérance des applications du client. L'une d'entre elle est le site kiloutou.fr.
        technologies:
          - Linux
          - Terraform
          - Gitlab CI
        description:
          - Supervision de la plateforme
          - Amélioration continue de la partie Cloud et Infra
          - Analyse et mitigation sur la partie sécurité
      - position: Formateur Ineat Academy
        company: Ineat
        location: Lille, France
        dates: 2018, novembre - 2023, décembre
        summary: Les formations dispensées sont Linux, Ansible, Docker, Kubernetes, Rancher, Terraform
        technologies:
          - Linux
          - Ansible
          - Docker
          - Kubernetes
          - Rancher
          - Terraform
        description:
          - Création des supports de formation
          - Animation des formations
          - Questionnaire d'évaluation
      - position: Cloud Data Ops
        company: UTB
        location: Lille, France
        dates: 2021, mars - 2021, décembre
        summary: Collecter, ingérer les bons de livraison et les mettre en corrélation avec les données présentes dans l'ERP en vue de détecter les écarts sur les quantités (erreurs fournisseur, erreurs de livraison, perte de produit, etc).
        technologies:
          - GCP
          - Google Document AI
          - Python
        description:
          - Ingestion de bons de livraison dans Google DocumentAI
          - Interprétation des résultats et manipulation des données extraites
          - Réorganisation et correction des résultats pour réduire le taux d'erreur
      - position: Accompagnement Ops
        company: Ineat Group
        location: Lille, France
        dates: 2021, septembre - 2024, février
        summary: Accompagner les équipes techniques sur le projet.
        technologies:
          - Azure
          - Kubernetes
          - Azure Keyvault
          - ArgoCD
        description:
          - Mise en place de la LZ Azure
          - Configuration de Azure Secret Store CSI driver pour connecter Kubernetes à Azure Keyvault
      - position: Ops Builder
        company: Faber Novel
        location: Lille, France
        dates: 2021, juillet - 2024, août
        summary: Construction et déploiement des plateformes applicatives.
        technologies:
          - Azure
          - Kubernetes
          - Jenkins
          - Prometheus
        description:
          - Configuration des Helm Charts applicatifs
          - Configuration des pipeline Jenkins
          - Configuration de Prometheus dans Kubernetes
      - position: Architect Cloud
        company: Everysens
        location: Lille, France
        dates: 2021, avril - 2024, juillet
        summary: Architecte Cloud
        technologies:
          - GCP
          - Kubernetes
          - Nginx
          - modSecurity
          - Monitoring
          - Gitlab CI
        description:
          - Configuration de Nginx avec le WAF modSecurity dans Kubernetes
          - Collecte et création de log-based metrics pour surveiller les logs du WAF
          - Déploiement de GCP OS Lifecycle
          - Déploiement dans Gitlab CI
      - position: Accompagnement technique et organisationnel
        company: Martin Belaysoud
        location: Lille, France
        dates: 2022, février - 2023, mars
        summary: Accompagnement des équipes techniques au changement d'organisation, se diriger vers une approche DevOps.
        technologies:
          - Kubernetes
          - Jenkins
          - Ansible
          - Terraform
          - Kubernetes
        description:
          - Audit des équipes techniques et de l'organisation
          - Acculturation à l'approche DevOps
          - Acculturation sur les technologies d'automatisation
          - Formation sur Terraform et Kubernetes
      - position: Audit technique
        company: Adeo, Leroy Merlin
        location: Lille, France
        dates: 2022, septembre - 2022, septembre
        summary: Audit des applications liées à la gestion des chantiers et des artisans dans tout l'éco-système Adéo et Leroy Merlin.
        technologies:
          - GCP
          - Kubernetes
          - Terraform
        description:
          - Interview de 5 équipes techniques (FR, ES, BR)
          - Audit des infrastructures et des projets Cloud
          - Présentation et retour suite au rapport d'audit
      - position: Accompagnement à la conteneurisation
        company: CGI Finance
        location: Lille, France
        dates: 2019, octobre - 2021, juin
        summary: Accompagnement à la conteneurisation
        technologies:
          - VMWare
          - Kubernetes
          - Rancher
          - Helm
          - Azure DevOps
          - Open Policy Agent
          - Hashicorp Vault
        description:
          - Audit de l'infrastructure
          - Acculturation et accompagnement des équipes techniques
          - Mise en place de la plateforme de conteneurs
          - Mise en place de la chaine de déploiement Dev to Prod
          - Implémentation de Gatekeeper (Open Policy Agent)
          - Acculturation à Hashicorp Vault
      - position: Cloud Architect
        company: Trixit
        location: Lille, France
        dates: 2022, janvier - 2022, septembre
        summary: Déploiement d'une plateforme de paiement en 3x sans frais pour les professionnels.
        technologies:
          - GCP
          - Kubernetes
          - Terraform
          - Trivy
          - Github Actions
          - Gravitee
          - Monitoring
        description:
          - Création des projets Cloud avec Terraform
          - Configuration des pipelines sur Github Actions
          - Déploiement de Gravitee dans Kubernetes
      - position: Audit technique
        company: Finorpa
        location: Lille, France
        dates: 2021, septembre - 2021, septembre
        summary: Audit des applications d'une société sous le mandat de Finorpa.
        technologies:
          - AWS
        description:
          - Interview des équipes techniques
          - Audit des infrastructures et des projets Cloud
          - Présentation et retour suite au rapport d'audit
      - position: Ops Builder
        company: Leroy Merlin
        location: Lille, France
        dates: 2020, juillet - 2021, avril
        summary: Ops Builder
        technologies:
          - GCP
          - Terraform
          - Kubernetes
          - Openshift
          - GKE
          - Helm
          - Gitlab CI
          - Github Actions
        description:
          - Industrialisation de l'infrastructure de Terraform
          - Implémentation de la CI/CD
          - Conteneurisation des applications dans K8s
      - position: Architect Cloud
        company: Adeo
        location: Lille, France
        dates: 2019, septembre - 2020, mars
        summary: Architecte Cloud GCP & DevOps
        technologies:
          - GKE
          - Kubernetes
          - Helm
          - Gitlab CI
        description:
          - Mise en place de la conteneurisation de l'application (micro-services NestJS) de la Dev à la Prod.
          - Implémentation de la CI/CD
          - SAST et sécurité des applications (code et images Docker)
          - Simplification des déploiements sur les environnements
          - Création d'environnements de travail éphémères
      - position: Architecte Cloud GCP
        company: Cooptalis (Anywr)
        location: Lille, France
        dates: 2019, février - 2029, août
        summary: Architecte Cloud GCP
        technologies:
          - GCE
          - GKE
          - Kubernetes
          - Helm
          - Ansible
          - Kafka
          - CircleCI
          - Elastic Cloud
        description:
          - Automatisation d'une plateforme GCE et GKE avec Terraform
          - Déploiement des applications à la volée avec CircleCI
          - Déploiement de Clusters Kafka avec Terraform et Ansible
          - Remontées des logs et métriques dans Elastic Cloud
      - position: Accompagnement infrastructure
        company: Galeries Lafayette
        location: Lille, France
        dates: 2019, décembre - 2019, mars
        summary: Architecte Technique en Infrastructure
        technologies:
          - VMWare
          - Redis
          - RabbitMQ
        description:
          - Accompagnement a la mise en place des briques Redis et RabbitMQ en haute disponibilité
          - Accompagnement sur les axes de supervision technique des briques techniques
      - position: Architecte Cloud
        company: Cofidis
        location: Lille, France
        dates: 2017, septembre - 2017, novembre
        summary: Intervention ponctuelle chez le client dans le but de mettre en place une infrastructure sur AWS.
        technologies:
          - Linux
          - Apache
          - PHP
          - AWS (VPC, EC2, RDS, ELB, CloudWatch, IAM)
          - CloudFormation
        description:
          - Création de la stack avec CloudFormation
          - Scalabilité en fonction du trafic et de la charge
          - Monitoring système et applicatif
      - position: SysOps
        company: Decathlon
        location: Lille, France
        dates: 2019, décembre - 2019, mars
        summary: SysOps
        technologies:
          - Linux
          - RPM
          - Apache
          - Oracle Database
          - LDAP
          - Ansible
          - Rundeck
          - Splunk
          - ELK
          - Docker
          - Rancher
          - Jenkins
          - CDN
        description:
          - Administration système et socle des plateformes
          - Gestion des environnements
          - Intégration technique de la solution Oracle Commerce et automatisation complète de son installation
          - Mise en place d'un cluster OpenLDAP world-wide en mode Multi-Master.
          - "Mise en place d'outils et socles : Jenkins, Sonar, Docker, Rancher"
          - "Mise en place d'outils de Monitoring : Splunk, ELK, Grafana"
          - Gestion du CDN Europe de la plateforme e-commerce
          - Automatisation de "tout ce qui est possible d'automatiser" avec Ansible, Rundeck, Jenkins, scripts Python

  - companyName: CGI
    companyLogo: images/cgi-logo.webp
    missions:
      - position: Intégrateur Système et Applicatif
        company: Auchan
        location: Lille, France
        dates: 2014, juillet- 2016, avril
        summary: Intégrer les livrables fournis par les Centres de Services, assurer leur qualité, documenter leur installation en vue d'être déployé en production. Rationalisation des installation et homogénéisation des livrables.
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
          - Intégration des artefacts projet (jar, war, etc)
          - Documentation de l'installation
          - Rationalisation et homogénéistaion des installations
          - Création d'un SAS de validation des livrables en entrées (sanity check)
          - Migration des données entre les bases Oracle (11g et 12c)

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
    badge: images/aws-certified-cloud-practitioner.png
  - companyName: AWS
    certificationName: Solutions Architect Associate
    issuer: Coursera
    date: Mars 2018
    link: https://www.credly.com/badges/dd09dc40-9ef8-43a4-addb-d861d4dadf26/public_url
    badge: images/aws-certified-solutions-architect-associate.png
  - companyName: AWS
    certificationName: SysOps Administrator Associate
    issuer: Coursera
    date: Août 2017
    link: https://www.credly.com/badges/f0054964-7101-47a0-82b2-16d351eb08f2/public_url
    badge: images/aws-certified-sysops-administrator-associate.png

languages:
  - name: Francais
    level: Maternelle
  - name: Anglais
    level: Aisance professionnelle

education:
  - schoolName: IG2I - Centrale
    schoolLogo: images/centrale-lille-logo.webp
    degree: Titre d'ingénieur (BAC+5)
    location: Lens, France
    dates: 2019 - 2014
    link: https://ig2i.centralelille.fr
`;

export default defaultCV;
