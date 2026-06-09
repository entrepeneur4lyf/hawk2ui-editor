# Hawk2UI Editor Document Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the editor shell open project files and docs into central editor tabs with bridge-safe file IO.

**Architecture:** The Hawk UI keeps document state in focused TypeScript helpers and sends file operations through the local Bun bridge. The bridge owns project-root path safety, tree listing, file reading, and file writing. Docs and files share the same tab surface, with docs marked read-only.

**Tech Stack:** Hawk2UI Vue, Bun tests, Bun bridge HTTP routes, TypeScript, existing Hawk host elements.

---

## File Structure

- Create `src/core/documents.ts`: document ids, language detection, tab open/change/save helpers.
- Create `src/core/documents.test.ts`: tab and dirty-state tests.
- Create `src/bridge/files.ts`: project tree, safe path resolution, read/write helpers.
- Create `src/bridge/files.test.ts`: path traversal, tree, read, and write tests.
- Modify `src/bridge/server.ts`: add `/project/tree`, `/files/read`, and `/files/write` routes.
- Modify `src/App.vue`: own opened documents, wire project/docs events, and save active file through the bridge.
- Modify `src/ui/ProjectPanel.vue`: show a small project tree and emit selected file paths.
- Modify `src/ui/DocsPanel.vue`: emit selected doc paths for read-only tabs.
- Modify `src/ui/EditorWorkspace.vue`: render active document content preview and emit content-change/save events.

## Task 1: Document Tab Model

- [x] Write `src/core/documents.test.ts` covering file tabs, docs tabs, dirty changes, save clearing, and language detection.
- [x] Verify the test fails because `src/core/documents.ts` does not exist.
- [x] Implement `src/core/documents.ts` with `openFileDocument`, `openDocsDocument`, `updateDocumentContent`, and `markDocumentSaved`.
- [x] Run `bun test src/core/documents.test.ts` and confirm it passes.

## Task 2: Bridge File Operations

- [x] Write `src/bridge/files.test.ts` covering root-confined paths, ignored directory filtering, tree listing, read, and write.
- [x] Verify the test fails because `src/bridge/files.ts` does not exist.
- [x] Implement `src/bridge/files.ts` using `node:path` and `node:fs/promises`; reject absolute paths and `..` traversal.
- [x] Add bridge routes in `src/bridge/server.ts`:
  - `GET /project/tree?root=/path`
  - `GET /files/read?root=/path&path=src/App.vue`
  - `POST /files/write` with `{ root, path, content }`
- [x] Run `bun test src/bridge/files.test.ts src/bridge/server.test.ts`.

## Task 3: Workbench Integration

- [x] Update `ProjectPanel.vue` to accept tree entries and emit `openFile`.
- [x] Update `DocsPanel.vue` to list configured docs and emit `openDoc`.
- [x] Update `EditorWorkspace.vue` to display active document content and emit save/sidecar events.
- [x] Update `App.vue` to seed tabs from `src/App.vue` and `manual/README.md`, open files/docs into the central editor area, and keep WebviewJS sidecar optional.
- [x] Run `bun run verify`.

## Task 4: Finish

- [ ] Commit with `feat: add document workflow`.
- [ ] Fast-forward `main` after verification.
