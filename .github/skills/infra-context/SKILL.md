---
name: infra-context
description: Load infrastructure and platform specs before implementing deployment, PDF export, theme registry, or session sharing features. Use when working on Kubernetes manifests, Docker Compose, Gotenberg integration, or cross-cutting platform capabilities.
license: MIT
metadata:
  author: cvwonder-studio
  version: "1.0"
---

Load infrastructure capability specs and active change context before implementing.

**Use this skill when working on:**
- Kubernetes manifests (`infra/k8s/`)
- Docker Compose configuration
- Gotenberg / PDF export (`backend/internal/adapters/gotenberg/`, `backend/internal/ports/pdf.go`)
- Theme registry (built-in themes, `themes/`)
- Session export (PDF, ZIP download)
- Session sharing (public share links)
- Starter templates (`backend/internal/templates/`)

---

## Specs

Read each spec below before implementing. Specs use `WHEN / THEN` BDD scenarios that define the expected behavior.

- openspec/specs/k8s-deployment/spec.md
- openspec/specs/session-export/spec.md
- openspec/specs/session-sharing/spec.md
- openspec/specs/theme-registry/spec.md
- openspec/specs/starter-templates/spec.md

**Steps**

1. **Read all specs listed above** using the file reading tool.

2. **Check for active infra-related changes**
   ```bash
   ls openspec/changes/
   ```
   For each non-`archive` directory, check if its `proposal.md` touches infra capabilities:
   ```bash
   cat openspec/changes/<name>/proposal.md
   cat openspec/changes/<name>/tasks.md
   ```
   Read the artifacts of any relevant active change.

3. **Summarize context loaded**

   Output a brief summary:
   ```
   ## Infra Context Loaded

   Specs read: k8s-deployment, session-export, session-sharing,
               theme-registry, starter-templates

   Active changes touching infra:
   - <change-name>: <one-line summary from proposal>

   Ready to implement.
   ```

**Key conventions (from specs)**
- PDF export uses Gotenberg (HTTP push of HTML); enabled only when `GOTENBERG_URL` is set
- When `GOTENBERG_URL` is absent, the PDF endpoint returns HTTP 501 (Null Object pattern)
- K8s manifests use `readOnlyRootFilesystem` and non-root security contexts
- Session files are stored pod-local under `sessions/<id>/`; multi-replica setups require shared storage
- Starter templates are embedded Go resources (not fetched at runtime)
- Theme slugs are the directory name under `themes/`
