## Why

The admin interface is functional but visually clinical. Native `confirm()` and `alert()` calls block the UI thread and break the design language, status badges bypass the design token system, stat cards lack visual anchors, and tables have no meaningful empty states. These small friction points accumulate into a noticeably rough experience for anyone operating the admin.

## What Changes

- Replace `confirm()` / `alert()` calls in the Sessions page with a styled `ConfirmDialog` component built on the existing Radix UI Dialog primitive
- Add post-action inline feedback for the purge result (replacing the `alert('Purged N sessions')` pattern)
- Extract a `Badge` component in `components/ui/` using design tokens (`--color-error-subtle`, `--color-error-text`, `--color-success-subtle`, `--color-success-text`) replacing hardcoded Tailwind classes across Sessions and System pages
- Add icons to `StatCard` on the Dashboard using `@radix-ui/react-icons` (already installed)
- Add proper empty states to the Sessions table, distinguishing "no data" from "no search results"

## Capabilities

### New Capabilities

- `admin-ui-components`: Shared UI primitives for the admin interface — `Badge`, `ConfirmDialog`, `EmptyState` components scoped to the admin layer

### Modified Capabilities

<!-- No spec-level behavior changes — these are purely UI/UX improvements to existing admin functionality -->

## Impact

- `frontend/src/components/ui/Badge.tsx` — new file
- `frontend/src/components/ui/ConfirmDialog.tsx` — new file (wraps existing `Dialog.tsx`)
- `frontend/src/pages/admin/Dashboard.tsx` — StatCard updated with icons
- `frontend/src/pages/admin/Sessions.tsx` — confirm/alert replaced, badge tokens fixed, empty state added
- `frontend/src/pages/admin/System.tsx` — badge tokens fixed
- No API changes, no backend changes, no new dependencies
