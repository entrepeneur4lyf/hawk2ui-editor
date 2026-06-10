import { describe, expect, test } from "bun:test";
import {
  createWorkbenchState,
  selectDrawerTab,
  setDrawerMode,
  statusItemsWithPreview,
  togglePanel,
  type WorkbenchPanelName,
} from "./workbench";

describe("workbench shell", () => {
  test("creates editor-centered defaults", () => {
    const state = createWorkbenchState("/tmp/project");

    expect(state.editorTabs.map((tab) => tab.id)).toEqual(["file:src/App.vue", "doc:manual/README.md"]);
    expect(state.activeEditorTabId).toBe("file:src/App.vue");
    expect(state.drawer).toEqual({ mode: "compact", activeTab: "logs" });
    expect(state.statusItems.map((item) => item.id)).toContain("bridge");
    expect(state.statusItems.map((item) => item.id)).toContain("sidecar");
    expect(state.statusItems.map((item) => item.id)).toContain("lsp");
  });

  test("toggles recoverable floating panels without sidebars", () => {
    const state = createWorkbenchState("/tmp/project");
    const panelName: WorkbenchPanelName = "project";

    const closed = togglePanel(state.panels, panelName);
    expect(closed.project.open).toBe(false);
    expect(closed.project.width).toBe(state.panels.project.width);

    const reopened = togglePanel(closed, panelName);
    expect(reopened.project.open).toBe(true);
  });

  test("updates bottom drawer state", () => {
    const state = createWorkbenchState("/tmp/project");

    expect(setDrawerMode(state.drawer, "expanded")).toEqual({ mode: "expanded", activeTab: "logs" });
    expect(selectDrawerTab(state.drawer, "problems")).toEqual({ mode: "compact", activeTab: "problems" });
  });

  test("reflects preview state in status items", () => {
    const state = createWorkbenchState("/tmp/project");

    const items = statusItemsWithPreview(state.statusItems, "running");
    const preview = items.find((item) => item.id === "preview");

    expect(preview).toEqual({ id: "preview", label: "Preview", value: "running", tone: "ok" });
  });
});
