## Context

The admin interface is built with React + Tailwind v4 + Radix UI. Design tokens are defined in `globals.css` using semantic CSS custom properties (`--color-error-subtle`, `--color-success-text`, etc.) mapped to Radix Colors. The `Button`, `Dialog`, `Select`, and `Tooltip` components already exist in `components/ui/` using these tokens. `@radix-ui/react-icons` is installed and used in `SplitButton.tsx`.

Current problems:
- `Sessions.tsx` uses 3× `confirm()` and 2× `alert()` — blocking, unstyled, inaccessible
- Status badges in `Sessions.tsx` and `System.tsx` use raw Tailwind classes (`bg-red-50 text-red-600`) that don't follow the design token system and will break in dark mode
- `Dashboard.tsx` StatCards have no visual anchor — purely textual
- Sessions table shows bare text on empty results with no distinction between "no data" and "no search results"

## Goals / Non-Goals

**Goals:**
- Replace `confirm()`/`alert()` with a styled, accessible `ConfirmDialog` built on Radix Dialog
- Fix badge token usage by extracting a reusable `Badge` component
- Add icons to StatCards using the already-installed `@radix-ui/react-icons`
- Add two distinct empty states to the Sessions table

**Non-Goals:**
- Adding new dependencies (no `lucide-react`, no `sonner`, no toast library)
- Toast/notification infrastructure — inline feedback is sufficient for the purge result
- Dark mode testing (tokens already handle it, no explicit work needed)
- Admin themes page — scoped to Dashboard, Sessions, System only

## Decisions

### D1: `ConfirmDialog` wraps existing `Dialog`, not a new primitive
The `Dialog.tsx` component is already complete and Radix-backed. `ConfirmDialog` is a thin wrapper that accepts `title`, `description`, `confirmLabel`, `variant` ('danger' | 'default'), and `onConfirm: () => Promise<void>`. It manages its own open state internally via a trigger pattern.

**Alternative considered**: inline `useState` open flag per-action. Rejected — requires lifting state for each of 3 actions, results in repetitive boilerplate in Sessions.tsx.

### D2: Purge result shown as inline feedback, not toast
After purge, show a dismissible message inline in the Sessions header (`"3 sessions purged"` in `--color-success-text`). Auto-dismiss after 4s via `setTimeout`. No global toast infrastructure.

**Alternative considered**: Radix `react-toast` — would require installing a new package and setting up a provider. Over-engineered for a single use case currently.

### D3: `Badge` component in `components/ui/`
A simple `Badge` component accepting `variant: 'success' | 'error' | 'warning' | 'neutral'`. Maps variants to design tokens. Replaces all hardcoded `bg-green-50 text-green-700` / `bg-red-50 text-red-600` patterns.

**Why not just fix inline?** The themes page (`InstalledThemes.tsx`) already uses `--color-warning` inline. A `Badge` component creates a single fix point for future theming.

### D4: StatCard icon — option B layout (icon beside label)
Icon renders at 14px beside the label text in `--color-text-muted`. The value remains the main visual element. This is more scannable than a decorative corner icon.

### D5: Two empty state variants in Sessions
- **Default** (no `q`): icon + "No sessions yet" 
- **Search** (`q !== ''`): icon + "No sessions match '{q}'" + "Clear search" button
Implemented inline in `Sessions.tsx`, no separate component needed (single use case for now).

## Risks / Trade-offs

- [Risk] `ConfirmDialog` async `onConfirm` — unhandled rejections if the caller forgets try/catch → Mitigation: catch errors inside `ConfirmDialog` and surface them via a local error state within the dialog
- [Risk] Inline purge feedback overlaps with the error state display → Mitigation: make them mutually exclusive (success clears error, error clears success)
- [Trade-off] No `EmptyState` component extracted — keeps it simple, revisit if themes/other tables need it

## Open Questions

- None — all decisions are settled based on existing codebase patterns.
