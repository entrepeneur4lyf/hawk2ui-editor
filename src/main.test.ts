import { describe, expect, test } from "bun:test";
import { mount, type NativeNode } from "./main";

function collectIds(node: NativeNode, ids: string[] = []): string[] {
  ids.push(node.id);
  for (const child of node.children ?? []) {
    collectIds(child, ids);
  }
  return ids;
}

describe("native desktop entry", () => {
  test("mounts a visible workbench shell instead of manifest fallback", () => {
    const tree = mount();
    const ids = collectIds(tree);
    const source = JSON.stringify(tree);

    expect(tree.id).toBe("editor-root");
    expect(ids).toContain("command-bar");
    expect(ids).toContain("editor-workspace");
    expect(ids).toContain("bottom-drawer");
    expect(ids).toContain("status-bar");
    expect(source).toContain("Hawk2UI Editor");
    expect(source).toContain("Terminal");
  });
});
