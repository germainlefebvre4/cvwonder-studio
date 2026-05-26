## 1. Badge Component

- [x] 1.1 Create `frontend/src/components/ui/Badge.tsx` with variants `success`, `error`, `warning`, `neutral` mapped to design tokens
- [x] 1.2 Replace hardcoded badge classes in `Sessions.tsx` with `<Badge variant="success|error">`
- [x] 1.3 Replace hardcoded badge classes in `System.tsx` `StatusBadge` with `<Badge>`

## 2. ConfirmDialog Component

- [x] 2.1 Create `frontend/src/components/ui/ConfirmDialog.tsx` wrapping existing `Dialog` with `title`, `description`, `confirmLabel`, `variant`, `onConfirm` props
- [x] 2.2 Add inline error state inside `ConfirmDialog` for `onConfirm` rejections
- [x] 2.3 Replace `confirm()` + `alert()` in `handleExpire` with `ConfirmDialog`
- [x] 2.4 Replace `confirm()` + `alert()` in `handleDelete` with `ConfirmDialog`
- [x] 2.5 Replace `confirm()` + `alert()` in `handlePurge` with `ConfirmDialog`

## 3. Purge Inline Feedback

- [x] 3.1 Add `purgeResult` state to `Sessions.tsx` (count of deleted sessions)
- [x] 3.2 Show inline success message "N session(s) purged" after successful purge using `--color-success-text`
- [x] 3.3 Auto-dismiss purge result message after 4 seconds via `setTimeout`

## 4. StatCard Icons

- [x] 4.1 Update `StatCard` in `Dashboard.tsx` to accept an optional `icon` prop (ReactNode)
- [x] 4.2 Add icons from `@radix-ui/react-icons` to all session stat cards (`PersonIcon`, `TimerIcon`)
- [x] 4.3 Add icons to all theme stat cards (`LayersIcon`, `CubeIcon`, `DownloadIcon`)
- [x] 4.4 Add icons to all system stat cards (`InfoCircledIcon`, `ArchiveIcon`)

## 5. Sessions Empty States

- [x] 5.1 Replace bare "No sessions found." text with a styled empty state block (icon + message)
- [x] 5.2 When `q === ''`: show `PersonIcon` + "No sessions yet"
- [x] 5.3 When `q !== ''`: show `MagnifyingGlassIcon` + "No sessions match '{q}'" + "Clear search" button that resets `q` and `inputQ` to `''`
