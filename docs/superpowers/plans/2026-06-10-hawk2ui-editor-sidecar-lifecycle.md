# Hawk2UI Editor Sidecar Lifecycle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the CodeMirror sidecar report document lifecycle state back to the bridge and surface that state in the Hawk workbench.

**Architecture:** The bridge owns sidecar session state for the active document path, dirty flag, cursor position, and last error/save. The WebviewJS process sends structured IPC lifecycle events from CodeMirror to the bridge process. The Hawk shell reads the existing `/editor/status` route and displays the sidecar document state in logs/status/editor metadata.

**Tech Stack:** Hawk2UI Vue, Bun bridge, TypeScript, WebviewJS IPC, CodeMirror update listeners.

---

## Task 1: Bridge Session State

- [x] Write failing tests in `src/bridge/webviewEditor.test.ts` for lifecycle events: ready, change, selection, save, error, close.
- [x] Implement `EditorSidecarState` fields for `relativePath`, `dirty`, `line`, `column`, `lastSavedAt`, and `lastError`.
- [x] Add `handleEditorSidecarMessage(message)` and keep `currentEditorSidecarState()` copy-safe.
- [x] Run `bun test src/bridge/webviewEditor.test.ts`.

## Task 2: Webview IPC Lifecycle Events

- [x] Update `src/webview-editor/main.ts` to send `editorReady`, `documentChanged`, `selectionChanged`, and local save/error callbacks.
- [x] Update `src/bridge/webviewEditorProcess.ts` to forward lifecycle messages to the parent process and preserve file writes through `writeProjectFile`.
- [x] Update `src/bridge/webviewEditor.ts` to consume structured child stdout events through `handleEditorSidecarMessage`.
- [x] Run `bun test src/bridge/webviewEditor.test.ts`.

## Task 3: Workbench Surface

- [x] Keep `/editor/status` as the typed app-facing contract for sidecar metadata.
- [x] Update `App.vue` to poll sidecar status and show dirty/line/column status.
- [x] Reuse existing `EditorWorkspace.vue` and `StatusBar.vue` props without adding a second editor implementation.
- [x] Run `bun run verify`.

## Task 4: Verification And Commit

- [x] Smoke test `@hawk2ui/editor-webview` import through the sidecar open flow.
- [x] Smoke test `HAWK2UI_EDITOR_WEBVIEW_SIDECAR=1` open/close of `src/App.vue`.
- [ ] Commit with `feat: track sidecar document lifecycle`.
- [ ] Fast-forward `main`.
