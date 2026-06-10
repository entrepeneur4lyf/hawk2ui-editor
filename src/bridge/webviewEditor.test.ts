import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  closeEditorSidecar,
  createEditorSidecarPayload,
  currentEditorSidecarState,
  handleEditorSidecarMessage,
  openEditorSidecar,
  webviewPackageName,
} from "./webviewEditor";

let directory = "";

beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), "hawk2ui-editor-"));
});

afterEach(() => {
  closeEditorSidecar();
  rmSync(directory, { recursive: true, force: true });
  delete process.env.HAWK2UI_EDITOR_WEBVIEW_SIDECAR;
});

describe("webview editor sidecar", () => {
  test("loads the Hawk2UI scoped webview package", () => {
    expect(webviewPackageName).toBe("@hawk2ui/editor-webview");
  });

  test("starts closed", () => {
    expect(currentEditorSidecarState()).toEqual({
      state: "closed",
      filePath: null,
      relativePath: null,
      dirty: false,
      line: 1,
      column: 1,
      lastSavedAt: null,
      lastError: null,
      message: "Editor sidecar is closed.",
    });
  });

  test("honors an explicit disable flag", async () => {
    const filePath = join(directory, "sample.ts");
    writeFileSync(filePath, "export const value = 1;\n");
    const messages: string[] = [];

    process.env.HAWK2UI_EDITOR_WEBVIEW_SIDECAR = "0";

    expect(await openEditorSidecar(directory, "sample.ts", "black", (message) => messages.push(message))).toEqual({
      state: "failed",
      filePath,
      relativePath: "sample.ts",
      dirty: false,
      line: 1,
      column: 1,
      lastSavedAt: null,
      lastError: "Editor sidecar is disabled by HAWK2UI_EDITOR_WEBVIEW_SIDECAR=0.",
      message: "Editor sidecar is disabled by HAWK2UI_EDITOR_WEBVIEW_SIDECAR=0.",
    });
    expect(messages).toEqual([
      `[editor] launch requested: sample.ts (${filePath}) theme=black`,
      "[editor] launch blocked: HAWK2UI_EDITOR_WEBVIEW_SIDECAR=0",
    ]);
  });

  test("rejects paths that escape the project root", async () => {
    expect(await openEditorSidecar(directory, "../secret.ts")).toEqual({
      state: "failed",
      filePath: null,
      relativePath: null,
      dirty: false,
      line: 1,
      column: 1,
      lastSavedAt: null,
      lastError: "project path escapes root: ../secret.ts",
      message: "project path escapes root: ../secret.ts",
    });
  });

  test("creates launch payloads with explicit theme and black fallback", () => {
    expect(
      createEditorSidecarPayload({
        projectRoot: directory,
        relativePath: "sample.ts",
        filePath: join(directory, "sample.ts"),
        initialText: "export const value = 1;\n",
        scriptPath: "/tmp/editor.js",
        theme: "light",
      }),
    ).toMatchObject({ theme: "light" });

    expect(
      createEditorSidecarPayload({
        projectRoot: directory,
        relativePath: "sample.ts",
        filePath: join(directory, "sample.ts"),
        initialText: "",
        scriptPath: "/tmp/editor.js",
      }),
    ).toMatchObject({ theme: "black" });
  });

  test("closes the active sidecar state", () => {
    expect(closeEditorSidecar()).toEqual({
      state: "closed",
      filePath: null,
      relativePath: null,
      dirty: false,
      line: 1,
      column: 1,
      lastSavedAt: null,
      lastError: null,
      message: "Editor sidecar is closed.",
    });
  });

  test("tracks lifecycle messages from the editor sidecar", () => {
    handleEditorSidecarMessage({ type: "editorReady", path: "src/App.vue", line: 1, column: 1 });
    handleEditorSidecarMessage({ type: "documentChanged", path: "src/App.vue", dirty: true });
    handleEditorSidecarMessage({ type: "selectionChanged", path: "src/App.vue", line: 12, column: 8 });
    handleEditorSidecarMessage({ type: "saveRequested", path: "src/App.vue" });
    handleEditorSidecarMessage({ type: "documentSaved", path: "src/App.vue", savedAt: "2026-06-10T10:00:00.000Z" });

    expect(currentEditorSidecarState()).toMatchObject({
      relativePath: "src/App.vue",
      dirty: false,
      line: 12,
      column: 8,
      lastSavedAt: "2026-06-10T10:00:00.000Z",
      lastError: null,
    });

    handleEditorSidecarMessage({ type: "editorError", path: "src/App.vue", message: "save failed" });
    expect(currentEditorSidecarState().lastError).toBe("save failed");
  });
});
