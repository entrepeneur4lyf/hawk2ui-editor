import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { handleBridgeRequest } from "./server";
import { currentPreviewStatus, stopPreview } from "./preview";

let root = "";

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "hawk2ui-editor-server-"));
  await mkdir(join(root, "src"), { recursive: true });
  await writeFile(join(root, "src", "App.vue"), "<template />");
});

afterEach(async () => {
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
      message: "Editor sidecar is closed.",
    });
  });
});
