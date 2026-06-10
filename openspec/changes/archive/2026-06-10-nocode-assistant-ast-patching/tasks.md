## 1. Setup & Store Extensions

- [x] 1.1 Add `yaml` (v2.x) to `frontend/package.json` dependencies and run install
- [x] 1.2 Extend `StudioState` in `frontend/src/store/studio.ts` to include `formData` object, `isYamlValid` boolean, and `viewLayout` string ('split' | 'code' | 'visual')
- [x] 1.3 Implement `setYamlFromCode` in `frontend/src/store/studio.ts` to parse raw YAML, check syntax, update `formData` via `doc.toJS()`, and set `isYamlValid`
- [x] 1.4 Implement `updateFormField` in `frontend/src/store/studio.ts` to surgically patch AST nodes with `setIn` and output updated YAML via `doc.toString()`
- [x] 1.5 Add `setViewLayout` action to toggle layouts and persist choice in sessionStorage

## 2. Core AST Synchronization Layer

- [x] 2.1 Create AST helper utility `frontend/src/lib/ast-patcher.ts` with typed methods for updating simple values (`setIn`)
- [x] 2.2 Add helper methods for list insertions, deletions, and item re-ordering in `ast-patcher.ts`
- [x] 2.3 Implement unit tests in `frontend/src/lib/ast-patcher.test.ts` to verify AST mutations preserve adjacent comments, custom order, and formatting styles
- [x] 2.4 Verify that extremely long strings are formatted cleanly without hard wrap limits (by passing `{ lineWidth: 0 }` to `toString()`)

## 3. Visual Form Components (Radix UI)

- [x] 3.1 Create directory `frontend/src/components/features/editor/form/`
- [x] 3.2 Implement `FormWizard.tsx` (the parent container) using `@radix-ui/react-accordion` with styled headers
- [x] 3.3 Implement `PersonalInfoSection.tsx` with inputs mapped to the `person` schema block (name, depiction, email, phone, location)
- [x] 3.4 Implement `SocialNetworksSection.tsx` with input fields mapped to `socialNetworks` profiles
- [x] 3.5 Implement `CareerSection.tsx` supporting expandable accordion items for each career position and a nested list of missions
- [x] 3.6 Implement array manipulation controls (Add, Delete, drag-and-drop or Up/Down buttons) in the Career, Skills, and Projects sections
- [x] 3.7 Implement `TechnicalSkillsSection.tsx` with domains and competency level sliders (0-100)
- [x] 3.8 Implement `SidebarSections.tsx` for languages, education, certifications, and side-projects

## 4. Layout & UI Integration

- [x] 4.1 Update `frontend/src/app/studio/page.tsx` to read the layout mode (`viewLayout`) from the store and display panels conditionally
- [x] 4.2 Replace the dual-panel `PanelGroup` in `StudioPage` with a three-panel or dynamic-panel `PanelGroup` representing layout choices (Code, Visual, or Split)
- [x] 4.3 Add a dual-mode/tri-mode visual toggle group (button group) in the header of `frontend/src/app/studio/page.tsx`
- [x] 4.4 Create and style the syntax error warning banner component `SyntaxErrorBanner.tsx` and render it above the visual form when `isYamlValid` is false
- [x] 4.5 Ensure that when the visual form is frozen, all inputs are disabled, displaying an interactive overlay explaining how to fix the error in the editor
- [x] 4.6 Implement a centralized debounced `useEffect` auto-save in `StudioPage` to synchronize `yamlContent` changes (originating from Visual Assistant edits) to the backend database
- [x] 4.7 Provide a unique `key={viewLayout}` on the `PanelGroup` component in `StudioPage` to force a clean re-initialization of the layout state when toggling layouts

## 5. Testing & Verification

- [x] 5.1 Write unit tests for Zustand store AST updates in `frontend/src/store/studio.test.ts`
- [x] 5.2 Write integration/component tests for `FormWizard.tsx` verifying that typing in inputs updates the mock session store correctly
- [x] 5.3 Write UI tests in `StudioPage.test.tsx` verifying layout toggles show and hide panels as expected
- [x] 5.4 Verify backward compatibility: ensure that direct YAML-only editing and template onboarding still function flawlessly without regressions
- [x] 5.5 Write integration tests or update existing ones to verify that Visual Assistant edits successfully trigger backend saving and preview updates
- [x] 5.6 Verify that `PanelGroup` has the correct dynamic key and resets cleanly when `viewLayout` changes
