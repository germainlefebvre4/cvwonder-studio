---
name: project-context
description: Route to the correct domain skill(s) based on what you're working on. Use this when unsure which domain skill to invoke, or when the task spans multiple domains.
license: MIT
metadata:
  author: cvwonder-studio
  version: "1.0"
---

Analyze the task and load the appropriate domain skill(s) to provide spec context before implementing.

**Input**: A description of what needs to be implemented (from task description, change proposal, or user request).

**Steps**

1. **Identify the domain(s)** from the task description using these routing rules:

   | Keywords / signals | Domain skill to invoke |
   |---|---|
   | Go, Gin, gin, handler, usecase, repository, sqlc, migration, PostgreSQL, OAuth, cookie, JWT, `backend/` | `backend-context` |
   | React, TSX, component, hook, Vite, Zustand, store, page, UI, frontend, `frontend/src/` | `frontend-context` |
   | admin, Admin, `/admin`, dashboard (admin), theme management (admin) | `admin-context` |
   | Kubernetes, k8s, Docker, Gotenberg, PDF, theme registry, session export, session sharing, starter template, `infra/` | `infra-context` |

2. **Handle ambiguous cases**

   - `user-*` capabilities: read the spec name to resolve:
     - `user-auth`, `user-sessions` → `backend-context`
     - `user-dashboard`, `user-account-management` → `frontend-context`
   - Cross-cutting tasks (e.g., "add PDF export endpoint AND a download button"): invoke **both** `backend-context` and `frontend-context`
   - Still unsure: invoke ALL domain skills

3. **Invoke the selected domain skill(s)**

   Run each selected skill in sequence. Do not skip any that are relevant.

4. **If a change name is known**, also read:
   ```bash
   cat openspec/changes/<name>/proposal.md
   cat openspec/changes/<name>/design.md
   cat openspec/changes/<name>/tasks.md
   ```

5. **Confirm readiness**

   ```
   ## Project Context Loaded

   Domain(s): backend-context, frontend-context
   Reason: task involves both Go handler and React download button

   Specs and change artifacts loaded. Ready to implement.
   ```
