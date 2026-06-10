import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { closeEditorSidecar, currentEditorSidecarState, openEditorSidecar, webviewPackageName } from "./webviewEditor";

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
      message: "Editor sidecar is closed.",
    });
  });

  test("requires an explicit feature flag", async () => {
    const filePath = join(directory, "sample.ts");
    writeFileSync(filePath, "export const value = 1;\n");

    delete process.env.HAWK2UI_EDITOR_WEBVIEW_SIDECAR;

    expect(await openEditorSidecar(directory, "sample.ts")).toEqual({
      state: "failed",
      filePath,
      message: "Editor sidecar is disabled. Set HAWK2UI_EDITOR_WEBVIEW_SIDECAR=1 to enable the WebviewJS example.",
    });
  });

  test("rejects paths that escape the project root", async () => {
    expect(await openEditorSidecar(directory, "../secret.ts")).toEqual({
      state: "failed",
      filePath: null,
      message: "project path escapes root: ../secret.ts",
    });
  });

  test("closes the active sidecar state", () => {
    expect(closeEditorSidecar()).toEqual({
      state: "closed",
      filePath: null,
      message: "Editor sidecar is closed.",
    });
  });
});
