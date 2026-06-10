import { describe, expect, test } from "bun:test";
import { compileHawkVue } from "@hawk2ui/vue";
import { readFileSync } from "node:fs";
import { join } from "node:path";

interface CompiledNode {
  id: string;
  kind: string;
  props?: { name: string; value: { type: string; value: unknown } }[];
  events?: { kind: string; handler: string }[];
  children?: { node: CompiledNode }[];
}

interface CompiledArtifact {
  initial_dynamic_values: { name: string; value: { type: string; value: unknown } }[];
  dynamic_bindings: {
    node_id: string;
    target: { type: string; name: string };
    dependencies: string[];
  }[];
  event_handlers: {
    name: string;
    actions: { type: string; name: string; value?: { type: string; value: unknown } }[];
  }[];
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

  test("exposes planned drawer, dock, panel, and status affordances in the compiled entry", () => {
    const source = readFileSync(join(import.meta.dir, "WorkbenchEntry.vue"), "utf8");
    const output = compileHawkVue({ filename: "src/WorkbenchEntry.vue", source });
    const nodes = flattenNodes(output.compilerArtifact.root as CompiledNode);
    const interactiveIds = [
      "drawer-collapse",
      "drawer-compact",
      "drawer-expand",
      "dock-left-project",
      "dock-right-chat",
      "panel-restore",
      "panel-unpin",
    ];

    for (const id of interactiveIds) {
      const node = nodes.find((candidate) => candidate.id === id);
      expect(node?.kind).toBe("button");
      expect(node?.events?.some((event) => event.kind === "pointer.press")).toBe(true);
    }

    for (const id of ["status-cpu", "status-mem", "status-gpu"]) {
      expect(nodes.find((candidate) => candidate.id === id)?.kind).toBe("text");
    }
  });

  test("groups topbar commands into project, run, panel, and overflow clusters", () => {
    const source = readFileSync(join(import.meta.dir, "WorkbenchEntry.vue"), "utf8");
    const output = compileHawkVue({ filename: "src/WorkbenchEntry.vue", source });
    const nodes = flattenNodes(output.compilerArtifact.root as CompiledNode);
    const groupIds = ["command-project-group", "command-run-group", "panel-launchers", "command-overflow-group"];

    for (const id of groupIds) {
      const node = nodes.find((candidate) => candidate.id === id);
      expect(node?.kind).toBe("view");
      expect(sumChildWidths(node)).toBeLessThanOrEqual(numberProp(node, "width"));
    }

    const topbar = nodes.find((candidate) => candidate.id === "topbar");
    expect(sumChildWidths(topbar)).toBeLessThanOrEqual(numberProp(topbar, "width"));
  });

  test("binds drawer mode controls to explicit collapsed, compact, and expanded heights", () => {
    const source = readFileSync(join(import.meta.dir, "WorkbenchEntry.vue"), "utf8");
    const output = compileHawkVue({ filename: "src/WorkbenchEntry.vue", source });
    const artifact = output.compilerArtifact as CompiledArtifact;

    expect(dynamicInitialNumber(artifact, "drawerHeight")).toBe(150);
    expect(
      artifact.dynamic_bindings.some((binding) => {
        return (
          binding.node_id === "bottom-drawer" &&
          binding.target.type === "prop" &&
          binding.target.name === "height" &&
          binding.dependencies.includes("drawerHeight")
        );
      }),
    ).toBe(true);
    expect(handlerSetNumber(artifact, "collapseDrawer", "drawerHeight")).toBe(36);
    expect(handlerSetNumber(artifact, "compactDrawer", "drawerHeight")).toBe(150);
    expect(handlerSetNumber(artifact, "expandDrawer", "drawerHeight")).toBe(260);
  });

  test("keeps fixed desktop chrome widths within their parent regions", () => {
    const source = readFileSync(join(import.meta.dir, "WorkbenchEntry.vue"), "utf8");
    const output = compileHawkVue({ filename: "src/WorkbenchEntry.vue", source });
    const nodes = flattenNodes(output.compilerArtifact.root as CompiledNode);

    for (const id of ["workspace", "status-bar"]) {
      const node = nodes.find((candidate) => candidate.id === id);
      expect(sumChildWidths(node)).toBeLessThanOrEqual(numberProp(node, "width"));
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

function numberProp(node: CompiledNode | undefined, name: string): number {
  const value = node?.props?.find((prop) => prop.name === name)?.value;
  if (value?.type !== "number" || typeof value.value !== "number") return 0;
  return value.value;
}

function sumChildWidths(node: CompiledNode | undefined): number {
  return (node?.children ?? []).reduce((total, child) => total + numberProp(child.node, "width"), 0);
}

function dynamicInitialNumber(artifact: CompiledArtifact, name: string): number | undefined {
  const value = artifact.initial_dynamic_values.find((entry) => entry.name === name)?.value;
  return value?.type === "number" && typeof value.value === "number" ? value.value : undefined;
}

function handlerSetNumber(artifact: CompiledArtifact, handlerName: string, dynamicName: string): number | undefined {
  const value = artifact.event_handlers
    .find((handler) => handler.name === handlerName)
    ?.actions.find((action) => action.type === "set_dynamic_value" && action.name === dynamicName)?.value;
  return value?.type === "number" && typeof value.value === "number" ? value.value : undefined;
}
