import { describe, expect, test } from "bun:test";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { currentEditorSidecarState, openEditorSidecar } from "./webviewEditor";

describe("webview editor sidecar", () => {
  test("starts closed", () => {
    expect(currentEditorSidecarState()).toEqual({
      state: "closed",
      filePath: null,
      message: "Editor sidecar is closed.",
    });
  });

  test("requires an explicit feature flag", async () => {
    const directory = mkdtempSync(join(tmpdir(), "hawk2ui-editor-"));
    const filePath = join(directory, "sample.ts");
    writeFileSync(filePath, "export const value = 1;\n");

    delete process.env.HAWK2UI_EDITOR_WEBVIEW_SIDECAR;

    expect(await openEditorSidecar(filePath)).toEqual({
      state: "failed",
      filePath,
      message: "Editor sidecar is disabled. Set HAWK2UI_EDITOR_WEBVIEW_SIDECAR=1 to enable the WebviewJS example.",
    });
  });
});
