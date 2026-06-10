# Hawk2UI Editor Panel Layout State Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend floating panel state so project, docs, chat, and settings panels can minimize, dock, peek, and pin without breaking existing workspaces.

**Architecture:** Panel behavior is modeled with pure TypeScript helpers in `src/core/workbench.ts` and normalized through workspace loading in `src/core/workspace.ts`. Vue components consume the normalized state, but do not own migration rules or panel state transitions.

**Tech Stack:** TypeScript, Vue 3 `<script setup>`, Hawk2UI host elements, Bun tests.

---

## Task 1: Panel State Types

- [x] Add `PanelMode = "floating" | "minimized" | "docked"` and `DockEdge = "left" | "right"` types in the core workspace/workbench model.
- [x] Expand `PanelState` with `mode`, `dockEdge`, `pinned`, and `lastFloating`.
- [x] Preserve `open`, `x`, `y`, `width`, and `height` so legacy floating panels continue to load.
- [x] Add a `normalizePanelState()` helper that fills missing fields, clamps dimensions, and recovers invalid dock values.

## Task 2: Workbench Transition Helpers

- [x] Add pure helpers in `src/core/workbench.ts`: `openPanel`, `closePanel`, `togglePanel`, `minimizePanel`, `dockPanel`, `undockPanel`, `pinPanel`, and `unpinPanel`.
- [x] Ensure minimizing saves the current rectangle to `lastFloating`.
- [x] Ensure undocking restores `lastFloating` when present and falls back to a safe default rectangle when absent.
- [x] Ensure closing a peeked or docked unpinned panel does not destroy the saved floating rectangle.
- [x] Keep helper names and return values simple enough for Vue event handlers to call directly.

## Task 3: Workspace Migration Tests

- [x] Update `src/core/workspace.test.ts` with fixtures for old floating-only panel records.
- [x] Add tests for invalid `mode`, invalid `dockEdge`, negative sizes, and missing `lastFloating`.
- [x] Add tests proving existing project documents with only `open/x/y/width/height` normalize to floating panels.

## Task 4: App Wiring With Existing UI

- [x] Update `src/App.vue` to use the new helpers for current open, close, toggle, and nudge actions.
- [x] Update `src/ui/HawkFloatingPanel.vue` props/events only as needed to carry the expanded state.
- [x] Keep the visible UI equivalent to the current floating-panel behavior in this plan; dock gutter rendering belongs to the dock gutter plan.
- [x] Confirm command bar panel toggles still work after migration.

## Task 5: Verification

- [x] Run `bun test src/core/workspace.test.ts src/core/workbench.test.ts`.
- [x] Run `bun run build`.
- [x] Run `bun run validate`.
- [x] Run `bun run verify` before committing because this changes persisted workspace state.

Verification note: `bun run verify` passed on 2026-06-10 with 110 tests, Vite build, and `hawk2ui-cli validate`.
