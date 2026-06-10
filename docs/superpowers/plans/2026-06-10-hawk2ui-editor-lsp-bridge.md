# Hawk2UI Editor LSP Bridge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the first real LSP bridge path so the CodeMirror sidecar can connect to a bridge-owned TypeScript language server and the Hawk workbench can observe diagnostics.

**Architecture:** CodeMirror runs `@codemirror/lsp-client` inside the WebviewJS editor island. The Bun bridge exposes a `/lsp` WebSocket endpoint, owns language-server stdio processes, translates WebSocket JSON-RPC messages to LSP stdio framing, and mirrors `textDocument/publishDiagnostics` into bridge state. The Hawk frontend reads diagnostics through HTTP status routes and never spawns language servers or receives filesystem authority.

**Tech Stack:** Bun, TypeScript, WebSocket, `@codemirror/lsp-client`, `typescript-language-server --stdio`, CodeMirror, WebviewJS sidecar.

---

## Task 1: LSP Protocol Primitives

- [x] Add `src/bridge/lsp/protocol.ts` with JSON-RPC, diagnostic, status, URI, and stdio framing helpers.
- [x] Add `src/bridge/lsp/protocol.test.ts` covering file URI creation, project-root confinement, `Content-Length` framing, partial frame parsing, and diagnostics extraction.
- [x] Run `bun test src/bridge/lsp/protocol.test.ts` and verify the tests fail before implementing.
- [x] Implement only the helpers required by the tests.

## Task 2: Bridge Session And Server Process

- [x] Add `src/bridge/lsp/session.ts` to manage one TypeScript LSP session per project root.
- [x] Track status fields: `state`, `root`, `server`, `message`, `diagnostics`, `lastError`, and `startedAt`.
- [x] Spawn `typescript-language-server --stdio` only after a WebSocket client connects with a root inside the project.
- [x] Convert language-server stdout frames into WebSocket messages and update diagnostics state when `textDocument/publishDiagnostics` arrives.
- [x] Convert WebSocket client messages into stdio frames written to the language-server stdin.
- [x] Add tests using a fake process adapter so process lifecycle and diagnostics mirroring are covered without launching a real server.

## Task 3: Bridge Routes And WebSocket Upgrade

- [x] Extend `src/bridge/server.ts` with `GET /lsp/status?root=...`.
- [x] Extend `createBridgeServer()` with Bun WebSocket upgrade handling for `/lsp?root=...`.
- [x] Keep `handleBridgeRequest()` testable for regular HTTP routes.
- [x] Add server tests for diagnostics status and invalid root handling.

## Task 4: CodeMirror LSP Client Wiring

- [x] Add dependencies: `@codemirror/lsp-client` and `typescript-language-server`.
- [x] Add `src/webview-editor/lspClient.ts` with a WebSocket-backed CodeMirror LSP transport.
- [x] Pass `projectRoot`, `relativePath`, `languageId`, and `lspUrl` into the sidecar preload payload.
- [x] Register the LSP client extension in `src/webview-editor/main.ts` for TypeScript-like files first.
- [x] Keep the sidecar usable when `/lsp` is unavailable by reporting an `editorError` event instead of crashing.

## Task 5: Workbench Diagnostics Surface

- [x] Add periodic polling of `/lsp/status` in `src/App.vue`.
- [x] Mirror diagnostic counts into the existing `Problems` drawer and status bar.
- [x] Keep the UI compact: one status item count plus drawer log entries for the active file is enough for this slice.

## Task 6: Verification And Commit

- [x] Run targeted LSP tests.
- [x] Run `bun run verify`.
- [x] Smoke test `typescript-language-server --version`.
- [x] Smoke test the bridge `/lsp` WebSocket route.
- [ ] Commit with `feat: add lsp bridge groundwork`.
- [ ] Fast-forward `main` after verification passes.
