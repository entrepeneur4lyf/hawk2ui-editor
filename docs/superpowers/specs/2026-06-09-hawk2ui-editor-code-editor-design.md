# Hawk2UI Editor Code Editor Design

Date: 2026-06-09
Status: Draft for user review

## Purpose

The editor must be a real developer surface, not a placeholder. A code editor without syntax highlighting, reliable input behavior, file state, and a path to LSP integration is not useful.

This spec defines the code editor architecture for Hawk2UI Editor. It uses Hawk2UI for the native workbench shell and a WebviewJS-backed editor island for mature DOM editor functionality.

## Goals

- Provide a working code editor for real Hawk2UI projects.
- Demonstrate how Hawk2UI developers can use a webview when they need DOM-heavy tooling.
- Keep WebviewJS optional and example-scoped, not a required Hawk2UI framework dependency.
- Support file tabs, open/save, dirty state, syntax highlighting, and editor focus.
- Define a bridge contract for file operations, diagnostics, selections, and future inline edits.
- Preserve a path to LSP integration without blocking the first editor slice.

## Non-Goals

- No AI chat implementation.
- No assistant-applied edits in this phase.
- No full LSP implementation in the first editor slice.
- No claim that WebviewJS is bundled with or required by the Hawk2UI framework.
- No attempt to make arbitrary browser DOM components work inside the Hawk native scene tree.

## Architecture

The editor uses an **editor island**:

- **Hawk2UI native shell**: command bar, floating panels, bottom drawer, status bar, file tree, and app state.
- **WebviewJS editor island**: DOM editor surface for CodeMirror or an equivalent editor engine.
- **Local bridge**: trusted process for filesystem access, preview control, diagnostics, LSP processes, and IPC routing.

The webview must communicate through a narrow protocol. It should not receive broad filesystem, shell, environment, or secret access.

## Candidate Stack

WebviewJS is the current candidate for the editor island because it provides Node-facing window and webview APIs backed by `tao` and `wry`. It supports IPC and broad desktop targets, but its README marks the library as still in development. The first implementation must treat it as a spike with explicit verification.

CodeMirror is the initial editor-engine candidate because it is lighter than Monaco and has mature support for syntax highlighting, extensions, selections, transactions, and diagnostics.

## Editor Features

The first editor slice should include:

- Tabbed files.
- Open file from project tree.
- Open docs as read-only editor tabs.
- Save active file.
- Dirty indicator per tab.
- Close tab with unsaved-change confirmation.
- Syntax highlighting for TypeScript, Vue, JSON, Markdown, and CSS.
- Read-only mode for generated artifacts or docs.
- Status bar data: path, language, line, column, dirty state.

## IPC Contract

The bridge should expose structured messages instead of ad hoc strings.

Host to editor:

- `openDocument`: load a document id, path, language, content, and read-only flag.
- `updateDiagnostics`: publish diagnostics for a document.
- `applyTextEdit`: apply a range-based edit.
- `focusDocument`: focus an already-open document.
- `setTheme`: update editor theme.

Editor to host:

- `documentChanged`: content changed and dirty state changed.
- `saveRequested`: user requested save.
- `selectionChanged`: cursor or selection changed.
- `editorReady`: editor island initialized.
- `editorError`: editor island failed.

Messages should include document ids so tabs and diagnostics are stable across renames and refreshes.

## LSP Boundary

LSP servers should run in the bridge or host layer, not inside the sealed Hawk frontend. The editor island sends document open/change/save events to the bridge. The bridge owns language-server processes, workspace root, diagnostics, completion requests, hover requests, and code actions.

The first implementation should reserve UI and message shapes for diagnostics and selections, even if full LSP arrives in a later phase.

## Security Boundary

The webview receives only the active document content and narrow editor commands. Filesystem writes go through the bridge. Secrets and provider credentials never enter the webview. Project content loaded into the webview should be treated as untrusted text, not executable HTML.

## Error States

The editor must surface:

- Webview launch failure.
- Editor engine load failure.
- File read failure.
- Save failure.
- Dirty file close conflict.
- Bridge disconnected.
- Unsupported language mode.

Failures should report both in the editor area and in the bottom Problems or Logs surface.

## Verification

The first implementation plan should verify:

- WebviewJS installs on the current platform.
- The editor island launches from the bridge.
- IPC works in both directions.
- Keyboard input, focus, clipboard, scrolling, and high-DPI rendering are acceptable.
- Opening and saving a real file works.
- `bun test`, `bun run build`, and `hawk2ui-cli validate` still pass.

## Acceptance Criteria

- A user can open a project file into a tabbed editor.
- The editor shows syntax highlighting.
- The user can edit and save a file through the bridge.
- Dirty state is visible in tabs and status.
- Docs can open as read-only tabs.
- The implementation demonstrates a clear WebviewJS island pattern without making WebviewJS a core Hawk2UI dependency.

## References

- WebviewJS: https://github.com/webviewjs/webview
- CodeMirror: https://codemirror.net/
