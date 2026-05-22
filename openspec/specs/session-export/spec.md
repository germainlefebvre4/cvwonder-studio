## ADDED Requirements

### Requirement: Les utilisateurs connectés peuvent exporter une session en ZIP
Le système SHALL permettre de télécharger une session sous forme d'archive ZIP contenant le fichier YAML source (`resume.yaml`) et le HTML généré (`cv.html`). L'export SHALL être disponible uniquement pour les sessions appartenant à l'utilisateur connecté.

#### Scenario: Export réussi d'une session avec HTML généré
- **WHEN** un utilisateur connecté clique sur "Exporter" pour une de ses sessions
- **THEN** le backend génère un ZIP contenant `resume.yaml` (contenu de `yaml_content`) et `cv.html` (fichier pré-généré du filesystem), et le retourne avec `Content-Disposition: attachment; filename="cv-{session_name}.zip"`

#### Scenario: Tentative d'export sans HTML généré
- **WHEN** l'utilisateur tente d'exporter une session pour laquelle aucune génération n'a eu lieu
- **THEN** le ZIP contient uniquement `resume.yaml` ; un header de réponse `X-Export-Partial: true` signal l'absence du HTML

#### Scenario: Export d'une session appartenant à un autre utilisateur
- **WHEN** un utilisateur envoie une requête d'export pour une session ne lui appartenant pas
- **THEN** le backend retourne HTTP 403

#### Scenario: Export d'une session archivée
- **WHEN** l'utilisateur exporte une session archivée (contenu YAML encore présent, < 30j)
- **THEN** l'export fonctionne normalement ; si le YAML a déjà été purgé, HTTP 410 est retourné
