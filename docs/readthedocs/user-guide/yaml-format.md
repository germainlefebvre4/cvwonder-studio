# YAML Format Guide

This guide provides details on how to write your CV in YAML format for CVWonder.

## What is YAML?

YAML (YAML Ain't Markup Language) is a human-readable data serialization format. It's designed to be easy to write and read, making it perfect for configuration files and data exchange.

## YAML Basics for CVWonder

### Key-Value Pairs

YAML uses key-value pairs, which are represented as:

```yaml
key: value
```

For example:

```yaml
name: Germain
email: john.doe@example.com
```

### Indentation

YAML uses indentation (spaces, not tabs) to indicate nesting. Consistent indentation is crucial:

```yaml
person:
  name: Germain
  location: Lille
```

### Lists

Lists are created using hyphens:

```yaml
technologies:
  - Python
  - JavaScript
  - Docker
```

### Nested Lists

You can create nested lists by indenting further:

```yaml
languages:
  - name: French
    level: Mother tongue
  - name: English
    level: Fluent
```

### Multi-line Text

For longer text, you can use the pipe symbol (`|`) to maintain line breaks:

```yaml
summary: |
  This is a multi-line summary about me.
  Line breaks will be preserved exactly as written here.
  This is useful for paragraphs of text.
```

Or the greater-than symbol (`>`) to fold line breaks:

```yaml
summary: >
  This is also a multi-line summary but
  line breaks will be converted to spaces.
  This is useful for long sentences.
```

### Special Characters

If your text includes special characters like colons or quotes, you may need to wrap the text in quotes:

```yaml
person:
  profession: "Senior Developer: Frontend Team"
```

### Date Format

For dates in CVWonder, use the ISO format:

```yaml
startDate: 2020-01  # January 2020
endDate: present    # Current position
```

## Common Mistakes to Avoid

### Inconsistent Indentation

```yaml
# Incorrect
person:
  name: Germain
 email: john.doe@example.com  # Wrong indentation

# Correct
person:
  name: Germain
  email: john.doe@example.com  # Same indentation as name
```

### Missing Spaces After Colons

```yaml
# Incorrect
name:Germain  # Missing space after colon

# Correct
name: Germain  # Space after colon
```

### Tabs vs. Spaces

Always use spaces, not tabs. Many YAML parsers don't handle tabs well.

### Forgetting Quotes for Special Characters

```yaml
# Incorrect
profession: Team Lead: Frontend  # Colon causes parsing error

# Correct
profession: "Team Lead: Frontend"  # Quotes protect special characters
```

## YAML Validation

Before using your CV file with CVWonder, you can validate it using:

```bash
cvwonder validate cv.yml
```

This will check for YAML syntax errors and structural issues.

You can also use online YAML validators:

1. Visit a YAML validation website (e.g., [YAMLLint](http://www.yamllint.com/))
2. Paste your CV content
3. Check for any errors

## YAML Comments

You can add comments to your CV file for your own reference. Comments start with `#` and are ignored by CVWonder:

```yaml
person:
  name: Germain
  # TODO: Add LinkedIn profile URL
  email: john.doe@example.com
```

## Complete Example

Here's a minimal valid CV in YAML format:

```yaml
person:
  name: Germain
  profession: Software Engineer
  email: john.doe@example.com
  phone: "+1 (555) 123-4567"

socialNetworks:
  github: germainlefebvre4

abstract:
  - tr: Software engineer with 5 years of experience in web development.

career:
  - companyName: Zatsit
    duration: 10 mois, aujourd'hui
    missions:
        company: Adeo
      - position: Platform Engineer
        company: Adeo
        summary: Construire une IDP, plateforme interne de développement, totalement managée pour aider les développeurs à se focaliser sur le code. Sur base du code source, la plateforme provisionne l'infrastructure sous-jacente, les base de données, la construction des artefact et publication sur la registry, le déploiement dans Kubernetes, l'intégration du monitoring avec Datadog et construction des Monitors.
        technologies:
          - ArgoCD
          - Kubernetes
        description:
          - Développement de l'operator Kubernetes responsable du provisioning des bases de données
          - Développement des Compositions Crossplane pour provisionner les base de données

technicalSkills:
  domains:
    - name: Cloud
      competencies:
        - name: AWS
          level: 80
          level: 40
    - name: Ops
      competencies:
        - name: Linux
          level: 90
        - name: Ansible
          level: 90

education:
  - schoolName: IG2I - Centrale
    location: Lens, France
    dates: 2019 - 2014
```

For more detailed examples and sections, refer to the [CV structure](https://cvwonder.readthedocs.io/en/latest/getting-started/write-cv/) guide.
