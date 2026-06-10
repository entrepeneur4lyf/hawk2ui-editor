import { describe, expect, test } from "bun:test";
import {
  closePanel,
  createWorkbenchState,
  defaultWorkbenchPanels,
  dockPanel,
  minimizePanel,
  openPanel,
  peekPanel,
  pinPanel,
  closePeekedPanel,
  recoverPanelsForViewport,
  selectDrawerTab,
  setDrawerMode,
  statusBarVisibility,
  statusItemsWithPreview,
  togglePanel,
  undockPanel,
  unpinPanel,
  workbenchDockGutterMetrics,
  workbenchCommandGroups,
  workbenchChromeMetrics,
  workbenchLayoutMetrics,
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
    expect(state.statusItems.map((item) => item.id)).toContain("terminal");
  });

  test("toggles recoverable floating panels without sidebars", () => {
    const state = createWorkbenchState("/tmp/project");
    const panelName: WorkbenchPanelName = "project";

    const closed = togglePanel(state.panels, panelName);
    expect(closed.project.open).toBe(false);
    expect(closed.project.width).toBe(state.panels.project.width);

    const reopened = togglePanel(closed, panelName);
    expect(reopened.project.open).toBe(true);
    expect(reopened.project.mode).toBe("floating");
  });

  test("minimizes, docks, pins, closes, and restores panels", () => {
    const panels = defaultWorkbenchPanels();

    const minimized = minimizePanel(panels, "project", "left");
    expect(minimized.project).toMatchObject({
      open: false,
      mode: "minimized",
      dockEdge: "left",
      pinned: false,
      lastFloating: { x: 20, y: 56, width: 360, height: 560 },
    });

    const docked = dockPanel(minimized, "project", "right");
    expect(docked.project).toMatchObject({
      open: true,
      mode: "docked",
      dockEdge: "right",
      pinned: false,
      lastFloating: { x: 20, y: 56, width: 360, height: 560 },
    });

    const pinned = pinPanel(docked, "project");
    expect(pinned.project.pinned).toBe(true);

    const unpinned = unpinPanel(pinned, "project");
    expect(unpinned.project.pinned).toBe(false);

    const closed = closePanel(unpinned, "project");
    expect(closed.project).toMatchObject({
      open: false,
      mode: "docked",
      dockEdge: "right",
      lastFloating: { x: 20, y: 56, width: 360, height: 560 },
    });

    const restored = undockPanel(closed, "project");
    expect(restored.project).toMatchObject({
      open: true,
      mode: "floating",
      pinned: false,
      x: 20,
      y: 56,
      width: 360,
      height: 560,
    });
  });

  test("peeks unpinned docked panels without closing pinned panels", () => {
    const panels = minimizePanel(defaultWorkbenchPanels(), "assistant", "right");

    const peeked = peekPanel(panels, "assistant");
    expect(peeked.assistant).toMatchObject({ open: true, mode: "docked", dockEdge: "right", pinned: false });

    const closed = closePeekedPanel(peeked, "assistant");
    expect(closed.assistant).toMatchObject({ open: false, mode: "docked", dockEdge: "right", pinned: false });

    const pinned = pinPanel(peeked, "assistant");
    expect(closePeekedPanel(pinned, "assistant").assistant.open).toBe(true);
  });

  test("opens minimized panels as docked overlays", () => {
    const panels = minimizePanel(defaultWorkbenchPanels(), "docs", "left");

    const opened = openPanel(panels, "docs");
    expect(opened.docs).toMatchObject({ open: true, mode: "docked", dockEdge: "left" });
  });

  test("recovers panels into the visible viewport", () => {
    const panels = {
      ...defaultWorkbenchPanels(),
      project: {
        ...defaultWorkbenchPanels().project,
        open: true,
        x: 3000,
        y: 2000,
        width: 500,
        height: 500,
      },
      docs: dockPanel(defaultWorkbenchPanels(), "docs", "right").docs,
    };

    const recovered = recoverPanelsForViewport(panels, {
      width: 640,
      height: 420,
      topBarHeight: 42,
      bottomReservedHeight: 180,
      gutterWidth: 34,
    });

    expect(recovered.project.x).toBeLessThanOrEqual(106);
    expect(recovered.project.y).toBeLessThanOrEqual(42);
    expect(recovered.project.width).toBe(500);
    expect(recovered.project.height).toBe(198);
    expect(recovered.docs).toMatchObject({
      mode: "docked",
      dockEdge: "right",
      open: true,
      x: 186,
      y: 42,
      width: 420,
      height: 198,
    });
  });

  test("updates bottom drawer state", () => {
    const state = createWorkbenchState("/tmp/project");

    expect(setDrawerMode(state.drawer, "expanded")).toEqual({ mode: "expanded", activeTab: "logs" });
    expect(selectDrawerTab(state.drawer, "problems")).toEqual({ mode: "compact", activeTab: "problems" });
  });

  test("allocates explicit native shell regions", () => {
    expect(workbenchLayoutMetrics({ width: 960, height: 540 }, "compact")).toEqual({
      width: 960,
      height: 540,
      topBarHeight: 42,
      drawerHeight: 150,
      statusBarHeight: 24,
      gutterWidth: 34,
      workspaceHeight: 324,
    });

    expect(workbenchLayoutMetrics({ width: 420, height: 260 }, "expanded")).toEqual({
      width: 420,
      height: 260,
      topBarHeight: 42,
      drawerHeight: 260,
      statusBarHeight: 24,
      gutterWidth: 34,
      workspaceHeight: 180,
    });
  });

  test("derives dock gutter metrics without shrinking the editor workspace", () => {
    const layout = workbenchLayoutMetrics({ width: 1280, height: 820 }, "compact");
    const gutter = workbenchDockGutterMetrics(layout);

    expect(gutter.width).toBeGreaterThanOrEqual(28);
    expect(gutter.width).toBeLessThanOrEqual(36);
    expect(gutter.height).toBe(layout.workspaceHeight);
    expect(gutter.topOffset).toBe(layout.topBarHeight);
    expect(gutter.leftX).toBe(0);
    expect(gutter.rightX).toBe(layout.width - gutter.width);
  });

  test("keeps command chrome inside the minimum desktop width", () => {
    expect(workbenchChromeMetrics(1280)).toEqual({
      brandWidth: 180,
      commandWidth: 560,
      panelLauncherWidth: 360,
    });

    expect(workbenchChromeMetrics(960)).toEqual({
      brandWidth: 160,
      commandWidth: 468,
      panelLauncherWidth: 300,
    });

    const compact = workbenchChromeMetrics(960);
    expect(compact.brandWidth + compact.commandWidth + compact.panelLauncherWidth).toBeLessThanOrEqual(960);
  });

  test("defines deterministic command bar groups within chrome budgets", () => {
    const groups = workbenchCommandGroups();

    expect(groups.map((group) => group.id)).toEqual(["project", "run", "panels"]);
    expect(groups.flatMap((group) => group.commands.map((command) => command.id))).toEqual([
      "open-project",
      "new-file",
      "save",
      "validate",
      "build",
      "run-preview",
      "stop-preview",
      "command-palette",
      "toggle-project",
      "toggle-chat",
      "toggle-docs",
      "toggle-editor-settings",
      "toggle-chat-settings",
    ]);

    const chrome = workbenchChromeMetrics(960);
    const actionWidth = groups
      .filter((group) => group.id !== "panels")
      .flatMap((group) => group.commands)
      .reduce((total, command) => total + command.width, 0);
    const panelWidth = groups.find((group) => group.id === "panels")?.commands.reduce((total, command) => total + command.width, 0) ?? 0;

    expect(actionWidth).toBeLessThanOrEqual(chrome.commandWidth);
    expect(panelWidth).toBeLessThanOrEqual(chrome.panelLauncherWidth);
  });

  test("collapses low-priority status signals at narrow widths", () => {
    const state = createWorkbenchState("/tmp/project");

    expect(statusBarVisibility(state.statusItems, 1280)).toMatchObject({
      items: state.statusItems,
      showActivePath: true,
      showProviderLabel: true,
    });

    const compact = statusBarVisibility(state.statusItems, 960);
    expect(compact.items.map((item) => item.id)).toEqual([
      "project",
      "manifest",
      "bridge",
      "sidecar",
      "lsp",
      "terminal",
      "preview",
    ]);
    expect(compact.showActivePath).toBe(false);
    expect(compact.showProviderLabel).toBe(false);
  });

  test("reflects preview state in status items", () => {
    const state = createWorkbenchState("/tmp/project");

    const items = statusItemsWithPreview(state.statusItems, "running");
    const preview = items.find((item) => item.id === "preview");

    expect(preview).toEqual({ id: "preview", label: "Preview", value: "running", tone: "ok" });
  });
});
