import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { handleBridgeRequest } from "./server";
import { currentPreviewStatus, stopPreview } from "./preview";
import { stopAllLspSessions } from "./lsp/manager";
import { stopAllTerminalSessions } from "./terminal/manager";
import { closeTerminalSidecar } from "./webviewTerminal";

let root = "";

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "hawk2ui-editor-server-"));
  await mkdir(join(root, "src"), { recursive: true });
  await writeFile(join(root, "src", "App.vue"), "<template />");
});

afterEach(async () => {
  stopAllLspSessions();
  stopAllTerminalSessions();
  closeTerminalSidecar();
  await rm(root, { recursive: true, force: true });
});

describe("bridge preview state", () => {
  test("starts stopped", () => {
    stopPreview();
    expect(currentPreviewStatus().state).toBe("stopped");
  });
});

describe("bridge file routes", () => {
  test("returns the project tree", async () => {
    const response = await handleBridgeRequest(new Request(`http://bridge/project/tree?root=${encodeURIComponent(root)}`));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(JSON.stringify(body)).toContain("src/App.vue");
  });

  test("reads and writes project files", async () => {
    const readResponse = await handleBridgeRequest(
      new Request(`http://bridge/files/read?root=${encodeURIComponent(root)}&path=src/App.vue`),
    );
    await expect(readResponse.json()).resolves.toEqual({ path: "src/App.vue", content: "<template />" });

    const writeResponse = await handleBridgeRequest(
      new Request("http://bridge/files/write", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ root, path: "src/App.vue", content: "<template><hawk-view /></template>" }),
      }),
    );

    expect(writeResponse.status).toBe(200);
    expect(await readFile(join(root, "src", "App.vue"), "utf8")).toBe("<template><hawk-view /></template>");
  });
});

describe("bridge editor sidecar routes", () => {
  test("closes the editor sidecar", async () => {
    const response = await handleBridgeRequest(new Request("http://bridge/editor/close", { method: "POST" }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
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
});

describe("bridge LSP routes", () => {
  test("returns stopped LSP status for a project root", async () => {
    const response = await handleBridgeRequest(
      new Request(`http://bridge/lsp/status?root=${encodeURIComponent(root)}`),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      state: "stopped",
      root,
      server: "typescript",
      diagnosticCount: 0,
      lastError: null,
    });
  });

  test("requires a root for LSP status", async () => {
    const response = await handleBridgeRequest(new Request("http://bridge/lsp/status"));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "missing query parameter: root" });
  });
});

describe("bridge terminal routes", () => {
  test("returns stopped terminal status for a project root", async () => {
    const response = await handleBridgeRequest(
      new Request(`http://bridge/terminal/status?root=${encodeURIComponent(root)}`),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      state: "stopped",
      root,
      cols: 80,
      rows: 24,
      exitCode: null,
      lastError: null,
    });
  });

  test("requires a root for terminal status", async () => {
    const response = await handleBridgeRequest(new Request("http://bridge/terminal/status"));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "missing query parameter: root" });
  });

  test("returns terminal sidecar status", async () => {
    const response = await handleBridgeRequest(new Request("http://bridge/terminal/window/status"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      state: "closed",
      root: null,
      message: "Terminal sidecar is closed.",
    });
  });

  test("opens the terminal sidecar behind a feature flag", async () => {
    delete process.env.HAWK2UI_EDITOR_TERMINAL;
    const response = await handleBridgeRequest(
      new Request("http://bridge/terminal/open", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ root }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      state: "failed",
      root,
      lastError: "Terminal sidecar is disabled. Set HAWK2UI_EDITOR_TERMINAL=1 to enable the wterm WebviewJS example.",
    });
  });

  test("closes the terminal sidecar", async () => {
    const response = await handleBridgeRequest(new Request("http://bridge/terminal/close", { method: "POST" }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      state: "closed",
      root: null,
      message: "Terminal sidecar is closed.",
    });
  });
});
