# Hawk2UI Editor Terminal Bridge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the first real terminal bridge path so Hawk2UI Editor can host a webview terminal backed by a bridge-owned PTY session.

**Architecture:** Hawk2UI keeps the native workbench shell and bottom drawer. A WebviewJS terminal island renders `wterm`, connects to the Bun bridge over `/terminal`, and sends typed input/resize/control messages. The bridge owns Bun terminal process lifecycle, cwd/root confinement, shell selection, output fanout, status, and shutdown.

**Tech Stack:** Bun, TypeScript, WebSocket, Bun Terminal API (`Bun.spawn({ terminal })`), `@wterm/dom`, WebviewJS sidecar, Hawk2UI Vue.

**Decision:** `node-pty` imports and exits under Bun, but local smoke tests did not receive terminal output. Bun's native terminal API emitted output correctly, so this slice uses Bun as the PTY owner instead of adding a Node-only dependency.

---

## Task 1: Terminal Message Protocol

- [x] Create `src/bridge/terminal/protocol.ts` with message types for `input`, `resize`, `kill`, `output`, `started`, `exit`, and `error`.
- [x] Create `src/bridge/terminal/protocol.test.ts` covering parse/serialize behavior, resize clamping, and invalid message rejection.
- [x] Run `bun test src/bridge/terminal/protocol.test.ts` and verify it fails before implementation.
- [x] Implement only the protocol helpers needed by the tests.

## Task 2: Terminal Session Manager

- [x] Verify Bun terminal output, input, resize, and shutdown methods locally.
- [x] Create `src/bridge/terminal/session.ts` that manages one terminal session per project root.
- [x] Track status fields: `state`, `root`, `shell`, `cwd`, `cols`, `rows`, `exitCode`, `message`, `lastError`, and `startedAt`.
- [x] Use a process adapter in tests so lifecycle, input, resize, output fanout, and exit status are covered without launching a real shell.
- [x] Stop the terminal process when the final WebSocket client disconnects.

## Task 3: Bridge Routes And WebSocket

- [x] Create `src/bridge/terminal/manager.ts` to store sessions by normalized root.
- [x] Extend `src/bridge/server.ts` with `GET /terminal/status?root=...`.
- [x] Extend `createBridgeServer()` with WebSocket upgrade handling for `/terminal?root=...`.
- [x] Add tests in `src/bridge/server.test.ts` for stopped terminal status and missing root handling.

## Task 4: wterm Terminal Island

- [x] Add `@wterm/dom` first; use `@wterm/vue` only if the vanilla DOM package does not fit the sidecar bundle cleanly.
- [x] Create `src/webview-terminal/main.ts` to mount `WTerm`, connect to `/terminal`, forward data, handle output, and send resize messages.
- [x] Create `src/webview-terminal/terminal.css` for webview-only terminal styling.
- [x] Create `src/bridge/webviewTerminalProcess.ts` by extending the existing sidecar pattern with a terminal-specific WebviewJS process.
- [x] Feature-gate terminal launch with `HAWK2UI_EDITOR_TERMINAL=1` until PTY packaging is verified on all intended targets.

## Task 5: Workbench Surface

- [x] Add a `terminal` status item in `src/core/workbench.ts`.
- [x] Add a bridge call in `src/App.vue` to request/open the terminal sidecar from the bottom drawer.
- [x] Poll `/terminal/status` and show terminal state in the status bar.
- [x] Keep the bottom drawer compact; the real terminal rendering lives in the webview island for this slice.

## Task 6: Verification And Commit

- [x] Run targeted terminal protocol/session/server tests.
- [x] Run `bun run verify`.
- [x] Smoke test Bun terminal output/input and a local shell launch.
- [x] Smoke test `/terminal` WebSocket input/output.
- [x] Smoke test the terminal sidecar browser bundle behind `HAWK2UI_EDITOR_TERMINAL=1`.
- [x] Commit with `feat: add terminal bridge groundwork`.
- [x] Fast-forward `main` after verification passes.
