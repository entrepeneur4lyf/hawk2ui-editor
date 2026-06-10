# Hawk2UI Editor Dock Gutters Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add thin left and right dock gutters where minimized or docked floating panels can be reopened, peeked, pinned, and restored without creating permanent sidebars.

**Architecture:** Dock gutters are Hawk-native Vue components layered above the editor shell. They read normalized panel layout state from the workbench model and emit high-level panel actions back to `App.vue`. Docked and peeked panels overlay the editor and do not resize the central editor in this first pass.

**Tech Stack:** Hawk2UI Vue, TypeScript, Hawk CSS, existing floating panel fallback, Bun tests.

**Dependency:** Implement `2026-06-10-hawk2ui-editor-panel-layout-state.md` first.

---

## Task 1: Dock Gutter Component Contract

- [x] Create `src/ui/DockGutter.vue` with props for `edge`, `panels`, `activePanelId`, and `peekedPanelId`.
- [x] Emit semantic events such as `open-panel`, `peek-panel`, `pin-panel`, `unpin-panel`, `undock-panel`, and `close-peek`.
- [x] Use Hawk host elements and current event patterns first, especially `@pointerdown`.
- [x] Verify the Vue adapter event name for pointer enter/leave before adding hover peek. If unsupported, ship click/focus peek first.

## Task 2: Gutter Rendering

- [x] Update `src/App.vue` to render left and right gutters only when at least one panel is minimized or docked on that edge.
- [x] Keep gutter width between 28px and 36px.
- [x] Use compact icon-like labels until a verified icon set exists in the Hawk renderer.
- [x] Add accessible text labels or tooltips for Project, Docs, Chat, Editor Settings, and Chat Settings.
- [x] Ensure the gutter overlays the workbench edge and does not change editor layout dimensions.

## Task 3: Panel Actions

- [x] Add command bar actions for minimize, dock left, dock right, pin, unpin, and restore where they naturally fit in panel chrome or overflow controls.
- [x] Update `src/ui/HawkFloatingPanel.vue` to expose panel chrome controls for minimize, dock, pin, and close.
- [x] Clicking a gutter icon should open the panel immediately as a docked overlay.
- [x] Escape or clicking the editor should close an unpinned peek without closing pinned panels.
- [x] Drag-to-dock and drag-away restore should be implemented only after current pointer/move event support is verified locally.

## Task 4: Peek And Pin Behavior

- [x] Add pure tests in `src/core/workbench.test.ts` for peek, pin, unpin, escape close, and restore behavior.
- [x] Implement a short delayed hover peek only after adapter event support is confirmed.
- [x] Ensure hover peek never becomes the only access path; click and keyboard command paths must remain available.
- [x] Ensure pinned docked panels stay visible until explicitly unpinned, closed, or restored to floating mode.

## Task 5: Styling And Recovery

- [x] Update `styles/main.hawk.css` with black-theme gutter, dock icon, active, hover, pinned, and peek overlay styles.
- [x] Add viewport recovery logic so docked panels remain reachable after window size changes.
- [x] Keep panel overlays below the top command bar and above the bottom drawer/status bar.
- [x] Confirm no state creates a permanent left or right sidebar.

## Task 6: Verification

- [x] Run `bun test src/core/workbench.test.ts src/core/workspace.test.ts`.
- [x] Run `bun run build`.
- [x] Run `bun run validate`.
- [x] Run `bun run verify` before committing.
- [ ] Manually verify open, minimize, dock left, dock right, click open, pin, unpin, escape close, and restore.

Verification note: `bun run verify` passed on 2026-06-10 with 110 tests, Vite build, and `hawk2ui-cli validate`. `timeout 12s env HAWK2UI_EDITOR_WEBVIEW_SIDECAR=0 bun run dev` attached the native desktop surface. Drag-to-dock remains intentionally deferred; no drag UI was added in this slice.
