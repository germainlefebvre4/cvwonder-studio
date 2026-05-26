---
name: admin-context
description: Load admin panel specs and active changes before implementing admin features. Use when working on admin UI, admin API routes, session management, or theme management from an admin perspective.
license: MIT
metadata:
  author: cvwonder-studio
  version: "1.0"
---

Load admin capability specs and active change context before implementing.

**Use this skill when working on:**
- Admin authentication and access control
- Admin session management (listing, deleting, inspecting user sessions)
- Admin theme management (listing, enabling, disabling themes)
- Admin system dashboard (metrics, health, configuration)
- Shared admin UI components

---

## Specs

Read each spec below before implementing. Specs use `WHEN / THEN` BDD scenarios that define the expected behavior.

- openspec/specs/admin-auth/spec.md
- openspec/specs/admin-session-management/spec.md
- openspec/specs/admin-theme-management/spec.md
- openspec/specs/admin-system-dashboard/spec.md
- openspec/specs/admin-ui-components/spec.md

**Steps**

1. **Read all specs listed above** using the file reading tool.

2. **Check for active admin-related changes**
   ```bash
   ls openspec/changes/
   ```
   For each non-`archive` directory, check if its `proposal.md` touches admin capabilities:
   ```bash
   cat openspec/changes/<name>/proposal.md
   cat openspec/changes/<name>/tasks.md
   ```
   Read the artifacts of any relevant active change.

3. **Summarize context loaded**

   Output a brief summary:
   ```
   ## Admin Context Loaded

   Specs read: admin-auth, admin-session-management, admin-theme-management,
               admin-system-dashboard, admin-ui-components

   Active changes touching admin:
   - <change-name>: <one-line summary from proposal>

   Ready to implement.
   ```

**Key conventions (from specs)**
- Admin access is controlled separately from user auth — admin routes are under `/api/v1/admin/`
- Admin UI components are shared across all admin pages and follow the same Radix UI design system
- Admin actions (delete session, disable theme) require confirmation
