import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { listProjectTree, readProjectFile, resolveProjectPath, writeProjectFile } from "./files";

let root = "";

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "hawk2ui-editor-files-"));
  await mkdir(join(root, "src", "core"), { recursive: true });
  await mkdir(join(root, "node_modules", "ignored"), { recursive: true });
  await writeFile(join(root, "hawk.json"), "{}");
  await writeFile(join(root, "src", "App.vue"), "<template />");
  await writeFile(join(root, "src", "core", "project.ts"), "export const name = 'demo';");
  await writeFile(join(root, "node_modules", "ignored", "package.json"), "{}");
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe("bridge file operations", () => {
  test("resolves paths inside the project root only", () => {
    expect(resolveProjectPath(root, "src/App.vue")).toBe(join(root, "src", "App.vue"));
    expect(() => resolveProjectPath(root, "../secret.txt")).toThrow("project path escapes root");
    expect(() => resolveProjectPath(root, "/etc/passwd")).toThrow("project path must be relative");
  });

  test("lists a small project tree and filters dependency folders", async () => {
    const entries = await listProjectTree(root, 3);
    const names = entries.map((entry) => entry.path);

    expect(names).toContain("hawk.json");
    expect(names).toContain("src");
    expect(JSON.stringify(entries)).toContain("src/App.vue");
    expect(JSON.stringify(entries)).not.toContain("node_modules");
  });

  test("reads and writes files through safe relative paths", async () => {
    await expect(readProjectFile(root, "src/App.vue")).resolves.toEqual({
      path: "src/App.vue",
      content: "<template />",
    });

    await writeProjectFile(root, "src/App.vue", "<template><hawk-view /></template>");

    expect(await readFile(join(root, "src", "App.vue"), "utf8")).toBe("<template><hawk-view /></template>");
  });
});
