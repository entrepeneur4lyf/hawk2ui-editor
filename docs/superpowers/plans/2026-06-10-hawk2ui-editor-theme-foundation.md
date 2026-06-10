# Hawk2UI Editor Theme Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the black, functional workbench theme as the default visual foundation while preserving existing workspace settings.

**Architecture:** Theme preference remains workspace-owned state. The Hawk native shell applies a small set of root theme classes and literal Hawk CSS rules. Webview sidecars receive the resolved theme through their launch payload so CodeMirror and the terminal stay visually aligned without moving the app shell into DOM UI.

**Tech Stack:** Hawk2UI Vue, TypeScript, Hawk CSS, CodeMirror sidecar CSS, wterm sidecar CSS, Bun tests.

---

## Task 1: Theme Model And Migration

- [ ] Create `src/theme/workbenchTheme.ts` with `ThemePreference`, `ResolvedWorkbenchTheme`, `normalizeThemePreference()`, and `resolveWorkbenchTheme()`.
- [ ] Support existing `"dark"` workspace values as a legacy alias for the new black theme.
- [ ] Keep `"system"` and `"light"` accepted, but make new workspace defaults resolve to black.
- [ ] Add `src/theme/workbenchTheme.test.ts` covering defaulting, legacy `"dark"` normalization, and invalid value fallback.
- [ ] Update `src/core/workspace.ts` and `src/core/workspace.test.ts` so saved editor settings normalize safely when loaded.

## Task 2: Native Shell Theme Application

- [ ] Update `src/App.vue` to compute the active workbench theme and apply a stable root class such as `theme-black` or `theme-light`.
- [ ] Update `styles/main.hawk.css` with class-scoped colors for root surfaces, command bar, floating panels, editor area, bottom drawer, and status bar.
- [ ] Use near-black base colors, restrained separators, one accent color for focus/active state, and monospace numeric status text.
- [ ] Avoid CSS custom properties unless Hawk CSS support is verified locally; prefer class-scoped literal colors for this slice.

## Task 3: Sidecar Theme Alignment

- [ ] Pass the resolved theme name into the editor webview launch payload.
- [ ] Update `src/webview-editor/editor.css` so CodeMirror uses the same black base, selection, gutter, diagnostic, and active-line treatment.
- [ ] Pass the resolved theme name into the terminal webview launch payload.
- [ ] Update `src/webview-terminal/terminal.css` so terminal background, foreground, cursor, and selection match the native drawer.
- [ ] Keep webview theme code resilient when the sidecar payload is missing or launched by an older bridge.

## Task 4: Settings Surface

- [ ] Update `src/ui/SettingsPanel.vue` to show theme choices that map to the normalized theme model.
- [ ] Label the default as black in user-facing settings while still loading legacy `"dark"` workspace values.
- [ ] Ensure changing the theme updates the current workspace document and immediately refreshes native shell classes.

## Task 5: Verification

- [ ] Run `bun test src/theme/workbenchTheme.test.ts src/core/workspace.test.ts`.
- [ ] Run `bun run build`.
- [ ] Run `bun run validate`.
- [ ] Run `bun run verify` before committing if this plan is implemented with any sidecar or workspace migration changes.
- [ ] Visually check the app with the black theme and confirm no page reads as a landing page, card stack, or permanent-sidebar layout.
