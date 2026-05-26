# Spec: Admin UI Components

## Purpose

This spec defines reusable UI components and UX patterns for the admin interface, including design-token-based styling, accessible modal dialogs, contextual empty states, and inline feedback patterns.

## Requirements

### Requirement: Badge component uses design tokens
The system SHALL provide a `Badge` component in `components/ui/Badge.tsx` that maps semantic variants to CSS custom property tokens, replacing all hardcoded Tailwind color classes in the admin interface.

#### Scenario: Success variant renders with token colors
- **WHEN** `<Badge variant="success">active</Badge>` is rendered
- **THEN** the badge background uses `--color-success-subtle` and text uses `--color-success-text`

#### Scenario: Error variant renders with token colors
- **WHEN** `<Badge variant="error">expired</Badge>` is rendered
- **THEN** the badge background uses `--color-error-subtle` and text uses `--color-error-text`

#### Scenario: Neutral variant renders with token colors
- **WHEN** `<Badge variant="neutral">unknown</Badge>` is rendered
- **THEN** the badge background uses `--color-surface-overlay` and text uses `--color-text-secondary`

### Requirement: ConfirmDialog replaces native browser dialogs
The system SHALL provide a `ConfirmDialog` component that replaces all `confirm()` and `alert()` calls in the admin interface with an accessible, styled modal dialog.

#### Scenario: Destructive action requires confirmation
- **WHEN** an admin clicks a destructive action (expire, delete, purge)
- **THEN** a modal dialog opens with a title, description, and two buttons: cancel and confirm
- **THEN** the confirm button uses the `danger` variant for destructive actions

#### Scenario: Cancel dismisses without action
- **WHEN** the admin clicks Cancel in the ConfirmDialog
- **THEN** the dialog closes and no action is taken

#### Scenario: Confirm executes the async action
- **WHEN** the admin clicks the confirm button
- **THEN** the dialog shows a loading state and executes the `onConfirm` callback
- **THEN** the dialog closes after the action completes successfully

#### Scenario: Error during action is surfaced in dialog
- **WHEN** the `onConfirm` callback rejects
- **THEN** the dialog displays the error message inline and remains open

### Requirement: StatCards display icons alongside labels
The system SHALL render a relevant `@radix-ui/react-icons` icon beside each stat label in the admin Dashboard, improving scannability.

#### Scenario: Session stats show person and timer icons
- **WHEN** the Dashboard loads with session statistics
- **THEN** the "Active" stat card displays a `PersonIcon` beside the label
- **THEN** the "Expiring within 24h" stat card displays a `TimerIcon` beside the label

#### Scenario: Theme stats show layer and cube icons
- **WHEN** the Dashboard loads with theme statistics
- **THEN** the "Total" stat card displays a `LayersIcon`
- **THEN** the "Built-in" stat card displays a `CubeIcon`
- **THEN** the "Runtime" stat card displays a `DownloadIcon`

#### Scenario: System stats show info and archive icons
- **WHEN** the Dashboard loads with system statistics
- **THEN** the "Binary Version" stat card displays an `InfoCircledIcon`
- **THEN** the "Themes Storage" stat card displays an `ArchiveIcon`

### Requirement: Sessions table has distinct empty states
The system SHALL display contextually appropriate empty states in the Sessions table, distinguishing between no data and no search results.

#### Scenario: No sessions in database
- **WHEN** the Sessions page loads and there are no sessions
- **THEN** the table area shows an icon and the message "No sessions yet"
- **THEN** no "Clear search" control is shown

#### Scenario: Search returns no results
- **WHEN** the admin has entered a search query and no sessions match
- **THEN** the table area shows an icon, the message "No sessions match '{query}'"
- **THEN** a "Clear search" button is shown that resets the search query

### Requirement: Purge result shown as inline feedback
The system SHALL display the count of purged sessions as an inline success message after a successful purge, without using `alert()`.

#### Scenario: Purge success shows count
- **WHEN** the purge action completes successfully
- **THEN** an inline message shows "N session(s) purged" in success color
- **THEN** the message auto-dismisses after 4 seconds
