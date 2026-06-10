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

    const statusIds = [
      "status-project",
      "status-manifest",
      "status-bridge",
      "status-preview",
      "status-lsp",
      "status-terminal",
      "status-cpu",
      "status-mem",
      "status-gpu",
    ];

    for (const id of statusIds) {
      expect(nodes.find((candidate) => candidate.id === id)?.kind).toBe("text");
    }
  });

  test("exposes interactive editor tabs and a sidecar entry point", () => {
    const source = readFileSync(join(import.meta.dir, "WorkbenchEntry.vue"), "utf8");
    const output = compileHawkVue({ filename: "src/WorkbenchEntry.vue", source });
    const nodes = flattenNodes(output.compilerArtifact.root as CompiledNode);
    const artifact = output.compilerArtifact as CompiledArtifact;

    for (const id of ["editor-tab-app", "editor-tab-readme", "editor-tab-manifest", "editor-open-sidecar"]) {
      const node = nodes.find((candidate) => candidate.id === id);
      expect(node?.kind).toBe("button");
      expect(node?.events?.some((event) => event.kind === "pointer.press")).toBe(true);
    }

    expect(dynamicInitialString(artifact, "editorPath")).toBe("src/App.vue");
    expect(dynamicInitialString(artifact, "sidecarState")).toBe("auto-starting");
    expect(handlerSetString(artifact, "selectReadmeTab", "editorPath")).toBe("README.md");
    expect(handlerSetString(artifact, "selectManifestTab", "editorPath")).toBe("hawk.json");
    expect(handlerSetString(artifact, "openEditorSidecar", "sidecarState")).toBe("requested");
  });

  test("exposes bottom drawer tabs as stateful controls", () => {
    const source = readFileSync(join(import.meta.dir, "WorkbenchEntry.vue"), "utf8");
    const output = compileHawkVue({ filename: "src/WorkbenchEntry.vue", source });
    const nodes = flattenNodes(output.compilerArtifact.root as CompiledNode);
    const artifact = output.compilerArtifact as CompiledArtifact;

    for (const id of ["drawer-tab-terminal", "drawer-tab-logs", "drawer-tab-debug", "drawer-tab-problems"]) {
      const node = nodes.find((candidate) => candidate.id === id);
      expect(node?.kind).toBe("button");
      expect(node?.events?.some((event) => event.kind === "pointer.press")).toBe(true);
    }

    expect(dynamicInitialString(artifact, "drawerTab")).toBe("Logs");
    expect(handlerSetString(artifact, "selectProblemsTab", "drawerTab")).toBe("Problems");
    expect(handlerSetString(artifact, "selectProblemsTab", "drawerBody")).toBe("No validation problems.");
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

  test("starts dock gutters hidden and reveals them from dock and minimize actions", () => {
    const source = readFileSync(join(import.meta.dir, "WorkbenchEntry.vue"), "utf8");
    const output = compileHawkVue({ filename: "src/WorkbenchEntry.vue", source });
    const artifact = output.compilerArtifact as CompiledArtifact;

    expect(dynamicInitialBoolean(artifact, "leftDockVisible")).toBe(false);
    expect(dynamicInitialBoolean(artifact, "rightDockVisible")).toBe(false);
    expect(hasVisibilityBinding(artifact, "dock-gutter-left", "leftDockVisible")).toBe(true);
    expect(hasVisibilityBinding(artifact, "dock-gutter-right", "rightDockVisible")).toBe(true);
    expect(handlerSetBoolean(artifact, "minimizePanel", "leftDockVisible")).toBe(true);
    expect(handlerSetBoolean(artifact, "dockLeft", "leftDockVisible")).toBe(true);
    expect(handlerSetBoolean(artifact, "dockRight", "rightDockVisible")).toBe(true);
    expect(handlerSetBoolean(artifact, "dockChatRight", "rightDockVisible")).toBe(true);
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

function dynamicInitialBoolean(artifact: CompiledArtifact, name: string): boolean | undefined {
  const value = artifact.initial_dynamic_values.find((entry) => entry.name === name)?.value;
  return value?.type === "bool" && typeof value.value === "boolean" ? value.value : undefined;
}

function dynamicInitialString(artifact: CompiledArtifact, name: string): string | undefined {
  const value = artifact.initial_dynamic_values.find((entry) => entry.name === name)?.value;
  return value?.type === "string" && typeof value.value === "string" ? value.value : undefined;
}

function handlerSetBoolean(artifact: CompiledArtifact, handlerName: string, dynamicName: string): boolean | undefined {
  const value = artifact.event_handlers
    .find((handler) => handler.name === handlerName)
    ?.actions.find((action) => action.type === "set_dynamic_value" && action.name === dynamicName)?.value;
  return value?.type === "bool" && typeof value.value === "boolean" ? value.value : undefined;
}

function handlerSetString(artifact: CompiledArtifact, handlerName: string, dynamicName: string): string | undefined {
  const value = artifact.event_handlers
    .find((handler) => handler.name === handlerName)
    ?.actions.find((action) => action.type === "set_dynamic_value" && action.name === dynamicName)?.value;
  return value?.type === "string" && typeof value.value === "string" ? value.value : undefined;
}

function hasVisibilityBinding(artifact: CompiledArtifact, nodeId: string, dependency: string): boolean {
  return artifact.dynamic_bindings.some((binding) => {
    return (
      binding.node_id === nodeId &&
      binding.target.type === "prop" &&
      binding.target.name === "visible" &&
      binding.dependencies.includes(dependency)
    );
  });
}
