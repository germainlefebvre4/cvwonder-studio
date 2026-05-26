## MODIFIED Requirements

### Requirement: La page de paramètres de compte est accessible depuis le dashboard
Le système SHALL proposer une page "Mon compte" accessible depuis le dashboard. La page SHALL utiliser une largeur de `max-w-6xl` (cohérente avec le dashboard et la landing page) et les design tokens CSS du système de design (`var(--color-*)`, `var(--radius-*)`) pour toutes ses couleurs et arrondis.

#### Scenario: Accès aux paramètres de compte
- **WHEN** un utilisateur connecté navigue vers la section "Paramètres" du dashboard
- **THEN** la page affiche : informations du compte (nom, email, avatar), bouton "Télécharger mes données", zone de danger avec bouton "Supprimer mon compte"

#### Scenario: Cohérence visuelle de la page compte
- **WHEN** un utilisateur connecté navigue entre le dashboard et la page Mon compte
- **THEN** les deux pages présentent la même largeur de contenu (`max-w-6xl`) et utilisent les mêmes tokens de couleur et de bordure
