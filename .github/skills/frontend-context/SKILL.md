---
name: frontend-context
description: Load React frontend specs and active changes before implementing frontend features. Use when working on React components, pages, hooks, stores, or Vite configuration.
license: MIT
metadata:
  author: cvwonder-studio
  version: "1.0"
---

Load frontend capability specs and active change context before implementing.

**Use this skill when working on:**
- React components (`frontend/src/components/`)
- Page-level components (`frontend/src/app/`)
- Custom hooks (`frontend/src/hooks/`)
- API client services (`frontend/src/services/`)
- Zustand stores (`frontend/src/store/`)
- Vite configuration (`frontend/vite.config.ts`)
- Frontend unit tests (Vitest)

---

## Specs

Read each spec below before implementing. Specs use `WHEN / THEN` BDD scenarios that define the expected behavior.

- openspec/specs/react-spa/spec.md
- openspec/specs/studio-onboarding/spec.md
- openspec/specs/user-dashboard/spec.md
- openspec/specs/user-account-management/spec.md
- openspec/specs/frontend-test-infra/spec.md
- openspec/specs/frontend-unit-tests/spec.md

**Steps**

1. **Read all specs listed above** using the file reading tool.

2. **Check for active frontend-related changes**
   ```bash
   ls openspec/changes/
   ```
   For each non-`archive` directory, check if its `proposal.md` touches frontend capabilities:
   ```bash
   cat openspec/changes/<name>/proposal.md
   cat openspec/changes/<name>/tasks.md
   ```
   Read the artifacts of any relevant active change.

3. **Summarize context loaded**

   Output a brief summary:
   ```
   ## Frontend Context Loaded

   Specs read: react-spa, studio-onboarding, user-dashboard,
               user-account-management, frontend-test-infra, frontend-unit-tests

   Active changes touching frontend:
   - <change-name>: <one-line summary from proposal>

   Ready to implement.
   ```

**Key conventions (from specs)**
- Pure SPA built with Vite + React + TypeScript; `dist/` is embedded in the Go binary
- Design system: `@radix-ui/*` primitives (no shadcn), `@radix-ui/colors` blue/slate scales
- Semantic CSS tokens via Tailwind v4 `@theme {}` (e.g. `--color-accent: var(--blue-9)`)
- Dark mode via `prefers-color-scheme: dark` — Radix dark scale vars auto-apply
- Vite dev server proxies `/api/*` and `/preview/*` to `VITE_API_URL` (default `:8080`)
- Anonymous session token stored in `localStorage`; cleared after OAuth login
- Anonymous users: 1 session max enforced client-side before calling `POST /api/v1/sessions`
- Expiry warnings displayed at T-2h and T-30min for anonymous sessions
