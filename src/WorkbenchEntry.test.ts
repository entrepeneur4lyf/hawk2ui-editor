import { describe, expect, test } from "bun:test";
import { compileHawkVue } from "@hawk2ui/vue";
import { readFileSync } from "node:fs";
import { join } from "node:path";

interface CompiledNode {
  id: string;
  kind: string;
  events?: { kind: string; handler: string }[];
  children?: { node: CompiledNode }[];
}

describe("interactive workbench entry", () => {
  test("compiles to a framework artifact with clickable command buttons", () => {
    const source = readFileSync(join(import.meta.dir, "WorkbenchEntry.vue"), "utf8");
    const output = compileHawkVue({ filename: "src/WorkbenchEntry.vue", source });
    const nodes = flattenNodes(output.compilerArtifact.root as CompiledNode);
    const commandIds = [
      "command-open-project",
      "command-save",
      "command-validate",
      "command-build",
      "command-run",
      "command-stop",
      "toggle-project",
      "toggle-chat",
      "panel-dock-left",
      "drawer-open-terminal",
    ];

    expect(output.framework).toBe("vue");
    for (const id of commandIds) {
      const node = nodes.find((candidate) => candidate.id === id);
      expect(node?.kind).toBe("button");
      expect(node?.events?.some((event) => event.kind === "pointer.press")).toBe(true);
    }
  });

  test("hawk manifest points at the interactive framework entry", () => {
    const manifest = JSON.parse(readFileSync(join(import.meta.dir, "..", "hawk.json"), "utf8")) as {
      app: { entry: string; framework: string };
      build?: { output?: string };
    };

    expect(manifest.app.entry).toBe("src/WorkbenchEntry.vue");
    expect(manifest.app.framework).toBe("vue");
    expect(manifest.build?.output).toBeUndefined();
  });
});

function flattenNodes(node: CompiledNode): CompiledNode[] {
  return [node, ...(node.children ?? []).flatMap((child) => flattenNodes(child.node))];
}
