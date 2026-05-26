---
name: update-domain-skills
description: After applying an OpenSpec change, update domain skills (backend-context, frontend-context, admin-context, infra-context) to include any new capability specs introduced by the change. Run at the end of opsx-apply-change when new specs were created.
license: MIT
metadata:
  author: cvwonder-studio
  version: "1.0"
---

Update domain skill spec lists to reflect newly introduced capabilities after a change is applied.

**Input**: The change name that was just applied.

**Steps**

1. **Check if the change introduced new specs**

   ```bash
   ls openspec/changes/<name>/specs/ 2>/dev/null
   ```

   If the directory is empty or does not exist → **skip all remaining steps** and output:
   ```
   ## Domain Skills Update: skipped
   No new capability specs in this change.
   ```

2. **For each new spec in `openspec/changes/<name>/specs/`**, determine its domain:

   **Routing rules (apply in order):**

   | Spec name starts with… | Target skill file |
   |---|---|
   | `admin-` | `.github/skills/admin-context/SKILL.md` |
   | `backend-` | `.github/skills/backend-context/SKILL.md` |
   | `frontend-` | `.github/skills/frontend-context/SKILL.md` |
   | `k8s-`, `infra-` | `.github/skills/infra-context/SKILL.md` |

   **Fallback for ambiguous names** (e.g. `user-*`, `session-*`, `theme-*`):
   - Read `openspec/specs/<name>/spec.md`
   - If spec mentions Go, Gin, gin, sqlc, repository, handler, usecase, migration → `backend-context`
   - If spec mentions React, TSX, component, hook, Vite, frontend, localStorage → `frontend-context`
   - If spec mentions kubectl, Deployment, Gotenberg, Docker, k8s → `infra-context`
   - If admin panel / admin API → `admin-context`
   - If still ambiguous → add to `backend-context` AND `frontend-context` (cross-cutting)

3. **For each target skill, add the new spec** if not already listed

   The `## Specs` section in each domain skill contains a list of paths:
   ```
   - openspec/specs/<existing>/spec.md
   ```

   Append the new entry after the last line in that section:
   ```
   - openspec/specs/<new-name>/spec.md
   ```

   **Do not duplicate** — check if the path already exists before adding.

4. **Output a summary**

   ```
   ## Domain Skills Updated

   New specs from change: <change-name>
   ┌─────────────────────────────────┬──────────────────────┐
   │ Spec                            │ Added to             │
   ├─────────────────────────────────┼──────────────────────┤
   │ pdf-renderer                    │ backend-context      │
   │ pdf-export-api                  │ backend-context      │
   │ gotenberg-infra                 │ infra-context        │
   └─────────────────────────────────┴──────────────────────┘

   Domain skills are now up to date.
   ```

**Notes**
- This skill edits `.github/skills/*-context/SKILL.md` files directly
- Only the `## Specs` section bullet list is modified; all other content is preserved
- The canonical spec file lives in `openspec/specs/<name>/spec.md` — only that path is added to domain skills (not the delta spec under `openspec/changes/<name>/specs/`)
