import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import type { BridgeMainHandle } from "../bridge/server";
import { startDevMain } from "./main";

describe("editor dev main", () => {
  test("starts the bridge main before launching Hawk dev", async () => {
    const events: string[] = [];
    const bridge: BridgeMainHandle = {
      server: { stop: () => events.push("bridge stopped") },
      sidecar: Promise.resolve({
        state: "open",
        filePath: "/workspace/src/App.vue",
        relativePath: "src/App.vue",
        dirty: false,
        line: 1,
        column: 1,
        lastSavedAt: null,
        lastError: null,
        message: "Editor sidecar is open.",
      }),
    };

    const dev = startDevMain({
      cwd: "/workspace",
      env: { HAWK2UI_EDITOR_INITIAL_FILE: "src/WorkbenchEntry.vue" },
      exit: (code) => events.push(`exit ${code}`),
      log: (message) => events.push(message),
      closeEditorSidecar: () => events.push("editor sidecar closed"),
      closeTerminalSidecar: () => events.push("terminal sidecar closed"),
      startBridge: (options) => {
        events.push(`bridge ${options.root}`);
        return bridge;
      },
      spawn: (options) => {
        events.push(`${options.cmd.join(" ")} ${options.cwd}`);
        return {
          exited: Promise.resolve(0),
          kill: () => events.push("hawk killed"),
        };
      },
    });

    await dev.exited;

    expect(events).toEqual([
      "bridge /workspace",
      "hawk2ui-cli dev /workspace",
      "editor sidecar closed",
      "terminal sidecar closed",
      "bridge stopped",
      "exit 0",
    ]);
  });

  test("package dev script uses the editor dev main", async () => {
    const packageJson = JSON.parse(await readFile(new URL("../../package.json", import.meta.url), "utf8"));

    expect(packageJson.scripts.dev).toBe("bun src/dev/main.ts");
  });
});
