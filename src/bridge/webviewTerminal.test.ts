import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  closeTerminalSidecar,
  createTerminalSidecarPayload,
  currentTerminalSidecarState,
  handleTerminalSidecarMessage,
  openTerminalSidecar,
  terminalRendererPackageName,
  webviewPackageName,
} from "./webviewTerminal";

let directory = "";

beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), "hawk2ui-terminal-"));
});

afterEach(() => {
  closeTerminalSidecar();
  rmSync(directory, { recursive: true, force: true });
  delete process.env.HAWK2UI_EDITOR_TERMINAL;
});

describe("webview terminal sidecar", () => {
  test("uses the Hawk2UI webview package and wterm DOM renderer", () => {
    expect(webviewPackageName).toBe("@hawk2ui/editor-webview");
    expect(terminalRendererPackageName).toBe("@wterm/dom");
  });

  test("starts closed", () => {
    expect(currentTerminalSidecarState()).toEqual({
      state: "closed",
      root: null,
      cols: 80,
      rows: 24,
      lastError: null,
      message: "Terminal sidecar is closed.",
    });
  });

  test("requires an explicit feature flag", async () => {
    delete process.env.HAWK2UI_EDITOR_TERMINAL;

    expect(await openTerminalSidecar(directory)).toEqual({
      state: "failed",
      root: directory,
      cols: 80,
      rows: 24,
      lastError: "Terminal sidecar is disabled. Set HAWK2UI_EDITOR_TERMINAL=1 to enable the wterm WebviewJS example.",
      message: "Terminal sidecar is disabled. Set HAWK2UI_EDITOR_TERMINAL=1 to enable the wterm WebviewJS example.",
    });
  });

  test("rejects roots that do not exist", async () => {
    expect(await openTerminalSidecar(join(directory, "missing"))).toMatchObject({
      state: "failed",
      root: null,
      lastError: `project root does not exist: ${join(directory, "missing")}`,
    });
  });

  test("creates launch payloads with explicit theme and black fallback", () => {
    expect(
      createTerminalSidecarPayload({
        projectRoot: directory,
        scriptPath: "/tmp/terminal.js",
        terminalUrl: "ws://127.0.0.1:47321/terminal",
        cols: 100,
        rows: 30,
        theme: "light",
      }),
    ).toMatchObject({ theme: "light" });

    expect(
      createTerminalSidecarPayload({
        projectRoot: directory,
        scriptPath: "/tmp/terminal.js",
        terminalUrl: "ws://127.0.0.1:47321/terminal",
        cols: 80,
        rows: 24,
      }),
    ).toMatchObject({ theme: "black" });
  });

  test("closes the active sidecar state", () => {
    expect(closeTerminalSidecar()).toEqual({
      state: "closed",
      root: null,
      cols: 80,
      rows: 24,
      lastError: null,
      message: "Terminal sidecar is closed.",
    });
  });

  test("tracks lifecycle messages from the terminal sidecar", () => {
    handleTerminalSidecarMessage({ type: "terminalReady", root: directory, cols: 120, rows: 32 });

    expect(currentTerminalSidecarState()).toMatchObject({
      state: "open",
      root: directory,
      cols: 120,
      rows: 32,
      lastError: null,
      message: "Terminal sidecar is ready.",
    });

    handleTerminalSidecarMessage({ type: "terminalError", root: directory, message: "socket failed" });
    expect(currentTerminalSidecarState()).toMatchObject({
      state: "failed",
      lastError: "socket failed",
      message: "socket failed",
    });
  });
});
