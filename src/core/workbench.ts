import type { PanelState } from "./workspace";
import type { EditorDocument } from "./documents";

export type WorkbenchPanelName = "project" | "assistant" | "docs" | "editorSettings" | "chatSettings";
export type PanelMode = "floating" | "minimized" | "docked";
export type DockEdge = "left" | "right";
export type DrawerTab = "terminal" | "logs" | "debug" | "problems";
export type DrawerMode = "collapsed" | "compact" | "expanded";
export type StatusTone = "ok" | "warn" | "error" | "muted";
export type PreviewStateName = "stopped" | "starting" | "running" | "failed";
export type WorkbenchCommandGroupId = "project" | "run" | "panels";
export type WorkbenchCommandId =
  | "open-project"
  | "new-file"
  | "save"
  | "validate"
  | "build"
  | "run-preview"
  | "stop-preview"
  | "command-palette"
  | "toggle-project"
  | "toggle-chat"
  | "toggle-docs"
  | "toggle-editor-settings"
  | "toggle-chat-settings";

export type EditorTab = EditorDocument;

export interface DrawerState {
  mode: DrawerMode;
  activeTab: DrawerTab;
}

export interface StatusItem {
  id: string;
  label: string;
  value: string;
  tone: StatusTone;
}

export interface WorkbenchCommand {
  id: WorkbenchCommandId;
  label: string;
  width: number;
  group: WorkbenchCommandGroupId;
  panel?: WorkbenchPanelName;
}

export interface WorkbenchCommandGroup {
  id: WorkbenchCommandGroupId;
  commands: WorkbenchCommand[];
}

export interface WorkbenchState {
  panels: Record<WorkbenchPanelName, PanelState>;
  editorTabs: EditorTab[];
  activeEditorTabId: string;
  drawer: DrawerState;
  statusItems: StatusItem[];
}

export interface WorkbenchViewport {
  width: number;
  height: number;
  topBarHeight?: number;
  bottomReservedHeight?: number;
  gutterWidth?: number;
}

export interface WorkbenchLayoutMetrics {
  width: number;
  height: number;
  topBarHeight: number;
  drawerHeight: number;
  statusBarHeight: number;
  gutterWidth: number;
  workspaceHeight: number;
}

export interface WorkbenchChromeMetrics {
  brandWidth: number;
  commandWidth: number;
  panelLauncherWidth: number;
}

export interface StatusBarVisibility {
  items: StatusItem[];
  showActivePath: boolean;
  showProviderLabel: boolean;
}

export function defaultWorkbenchPanels(): Record<WorkbenchPanelName, PanelState> {
  return {
    project: normalizePanelState({ open: true, x: 20, y: 56, width: 360, height: 560 }),
    assistant: normalizePanelState({ open: false, x: 428, y: 56, width: 440, height: 620 }),
    docs: normalizePanelState({ open: false, x: 888, y: 56, width: 420, height: 560 }),
    editorSettings: normalizePanelState({ open: false, x: 700, y: 92, width: 360, height: 420 }),
    chatSettings: normalizePanelState({ open: false, x: 760, y: 116, width: 360, height: 420 }),
  };
}

export function createWorkbenchState(projectRoot: string): WorkbenchState {
  const editorTabs: EditorTab[] = [
    {
      id: "file:src/App.vue",
      title: "App.vue",
      path: "src/App.vue",
      language: "vue",
      dirty: false,
      readOnly: false,
      kind: "file",
      content: "<script setup lang=\"ts\">\nconst workbench = \"ready\";\n</script>",
    },
    {
      id: "doc:manual/README.md",
      title: "README.md",
      path: "manual/README.md",
      language: "markdown",
      dirty: false,
      readOnly: true,
      kind: "doc",
      content: "# Hawk2UI Manual",
    },
  ];

  return {
    panels: defaultWorkbenchPanels(),
    editorTabs,
    activeEditorTabId: editorTabs[0].id,
    drawer: { mode: "compact", activeTab: "logs" },
    statusItems: [
      { id: "project", label: "Project", value: basename(projectRoot), tone: "ok" },
      { id: "manifest", label: "Manifest", value: "valid", tone: "ok" },
      { id: "bridge", label: "Bridge", value: "disconnected", tone: "warn" },
      { id: "sidecar", label: "Sidecar", value: "disabled", tone: "muted" },
      { id: "lsp", label: "LSP", value: "off", tone: "muted" },
      { id: "terminal", label: "Terminal", value: "off", tone: "muted" },
      { id: "preview", label: "Preview", value: "stopped", tone: "muted" },
      { id: "cpu", label: "CPU", value: "--", tone: "muted" },
      { id: "mem", label: "MEM", value: "--", tone: "muted" },
      { id: "gpu", label: "GPU", value: "pending", tone: "muted" },
    ],
  };
}

export function togglePanel(
  panels: Record<WorkbenchPanelName, PanelState>,
  name: WorkbenchPanelName,
): Record<WorkbenchPanelName, PanelState> {
  return panels[name].open ? closePanel(panels, name) : openPanel(panels, name);
}

export function openPanel(
  panels: Record<WorkbenchPanelName, PanelState>,
  name: WorkbenchPanelName,
): Record<WorkbenchPanelName, PanelState> {
  const panel = normalizePanelState(panels[name]);
  const mode = panel.mode === "minimized" ? "docked" : panel.mode;
  return setPanel(panels, name, normalizePanelState({ ...panel, open: true, mode }));
}

export function closePanel(
  panels: Record<WorkbenchPanelName, PanelState>,
  name: WorkbenchPanelName,
): Record<WorkbenchPanelName, PanelState> {
  const panel = normalizePanelState(panels[name]);
  return setPanel(panels, name, normalizePanelState({ ...panel, open: false, pinned: false }));
}

export function minimizePanel(
  panels: Record<WorkbenchPanelName, PanelState>,
  name: WorkbenchPanelName,
  dockEdge: DockEdge = "left",
): Record<WorkbenchPanelName, PanelState> {
  const panel = normalizePanelState(panels[name]);
  return setPanel(
    panels,
    name,
    normalizePanelState({
      ...panel,
      open: false,
      mode: "minimized",
      dockEdge,
      pinned: false,
      lastFloating: panel.lastFloating ?? panelRectangle(panel),
    }),
  );
}

export function dockPanel(
  panels: Record<WorkbenchPanelName, PanelState>,
  name: WorkbenchPanelName,
  dockEdge: DockEdge,
): Record<WorkbenchPanelName, PanelState> {
  const panel = normalizePanelState(panels[name]);
  return setPanel(
    panels,
    name,
    normalizePanelState({
      ...panel,
      open: true,
      mode: "docked",
      dockEdge,
      lastFloating: panel.lastFloating ?? panelRectangle(panel),
    }),
  );
}

export function undockPanel(
  panels: Record<WorkbenchPanelName, PanelState>,
  name: WorkbenchPanelName,
): Record<WorkbenchPanelName, PanelState> {
  const panel = normalizePanelState(panels[name]);
  const rectangle = panel.lastFloating ?? panelRectangle(panel);
  return setPanel(
    panels,
    name,
    normalizePanelState({
      ...panel,
      ...rectangle,
      open: true,
      mode: "floating",
      dockEdge: undefined,
      pinned: false,
      lastFloating: undefined,
    }),
  );
}

export function pinPanel(
  panels: Record<WorkbenchPanelName, PanelState>,
  name: WorkbenchPanelName,
): Record<WorkbenchPanelName, PanelState> {
  const panel = normalizePanelState(panels[name]);
  return setPanel(panels, name, normalizePanelState({ ...panel, open: true, mode: "docked", pinned: true }));
}

export function unpinPanel(
  panels: Record<WorkbenchPanelName, PanelState>,
  name: WorkbenchPanelName,
): Record<WorkbenchPanelName, PanelState> {
  const panel = normalizePanelState(panels[name]);
  return setPanel(panels, name, normalizePanelState({ ...panel, pinned: false }));
}

export function peekPanel(
  panels: Record<WorkbenchPanelName, PanelState>,
  name: WorkbenchPanelName,
): Record<WorkbenchPanelName, PanelState> {
  const panel = normalizePanelState(panels[name]);
  return setPanel(panels, name, normalizePanelState({ ...panel, open: true, mode: "docked", pinned: false }));
}

export function closePeekedPanel(
  panels: Record<WorkbenchPanelName, PanelState>,
  name: WorkbenchPanelName,
): Record<WorkbenchPanelName, PanelState> {
  const panel = normalizePanelState(panels[name]);
  if (panel.pinned || panel.mode === "floating") return panels;
  return setPanel(panels, name, normalizePanelState({ ...panel, open: false }));
}

export function normalizePanelState(value: unknown, fallback: PanelState = fallbackPanelState()): PanelState {
  const source = isRecord(value) ? value : {};
  const open = typeof source.open === "boolean" ? source.open : fallback.open;
  const mode = normalizePanelMode(source.mode, fallback.mode);
  const x = finiteNumber(source.x, fallback.x);
  const y = finiteNumber(source.y, fallback.y);
  const width = Math.max(160, finiteNumber(source.width, fallback.width));
  const height = Math.max(120, finiteNumber(source.height, fallback.height));
  const dockEdge = mode === "floating" ? undefined : normalizeDockEdge(source.dockEdge, fallback.dockEdge ?? "left");
  const pinned = typeof source.pinned === "boolean" ? source.pinned : fallback.pinned;
  const lastFloating = normalizeRectangle(source.lastFloating) ?? (mode === "floating" ? undefined : { x, y, width, height });

  return {
    open,
    mode,
    ...(dockEdge ? { dockEdge } : {}),
    pinned,
    x,
    y,
    width,
    height,
    ...(lastFloating ? { lastFloating } : {}),
  };
}

export function recoverPanelsForViewport(
  panels: Record<WorkbenchPanelName, PanelState>,
  viewport: WorkbenchViewport,
): Record<WorkbenchPanelName, PanelState> {
  return Object.fromEntries(
    Object.entries(panels).map(([name, panel]) => [name, recoverPanelForViewport(panel, viewport)]),
  ) as Record<WorkbenchPanelName, PanelState>;
}

export function recoverPanelForViewport(panel: PanelState, viewport: WorkbenchViewport): PanelState {
  const normalized = normalizePanelState(panel);
  const gutterWidth = Math.max(0, finiteNumber(viewport.gutterWidth, 34));
  const topBarHeight = Math.max(0, finiteNumber(viewport.topBarHeight, 42));
  const bottomReservedHeight = Math.max(0, finiteNumber(viewport.bottomReservedHeight, 180));
  const viewportWidth = Math.max(160 + gutterWidth * 2, finiteNumber(viewport.width, 1280));
  const viewportHeight = Math.max(120 + topBarHeight + bottomReservedHeight, finiteNumber(viewport.height, 800));
  const availableWidth = Math.max(160, viewportWidth - gutterWidth * 2);
  const availableHeight = Math.max(120, viewportHeight - topBarHeight - bottomReservedHeight);
  const width = Math.min(normalized.width, availableWidth);
  const height = Math.min(normalized.height, availableHeight);
  const minX = normalized.mode === "floating" ? 0 : gutterWidth;
  const maxX = Math.max(minX, viewportWidth - width - gutterWidth);
  const minY = topBarHeight;
  const maxY = Math.max(minY, viewportHeight - bottomReservedHeight - height);

  if (normalized.mode === "docked") {
    return {
      ...normalized,
      x: normalized.dockEdge === "right" ? maxX : gutterWidth,
      y: minY,
      width,
      height,
    };
  }

  if (normalized.mode === "minimized") {
    return { ...normalized, width, height };
  }

  return {
    ...normalized,
    x: clamp(normalized.x, minX, maxX),
    y: clamp(normalized.y, minY, maxY),
    width,
    height,
  };
}

export function drawerHeightForMode(mode: DrawerMode): number {
  if (mode === "expanded") return 260;
  if (mode === "compact") return 150;
  return 36;
}

export function workbenchLayoutMetrics(
  surface: { width: number; height: number },
  drawerMode: DrawerMode,
): WorkbenchLayoutMetrics {
  const width = Math.max(420, finiteNumber(surface.width, 960));
  const height = Math.max(260, finiteNumber(surface.height, 540));
  const topBarHeight = 42;
  const statusBarHeight = 24;
  const gutterWidth = 34;
  const drawerHeight = drawerHeightForMode(drawerMode);
  const workspaceHeight = Math.max(180, height - topBarHeight - drawerHeight - statusBarHeight);

  return { width, height, topBarHeight, drawerHeight, statusBarHeight, gutterWidth, workspaceHeight };
}

export function workbenchChromeMetrics(width: number): WorkbenchChromeMetrics {
  const viewportWidth = Math.max(0, finiteNumber(width, 1280));
  if (viewportWidth >= 1120) {
    return { brandWidth: 180, commandWidth: 560, panelLauncherWidth: 360 };
  }
  if (viewportWidth >= 960) {
    return { brandWidth: 160, commandWidth: 468, panelLauncherWidth: 300 };
  }
  return { brandWidth: Math.max(120, Math.min(160, viewportWidth)), commandWidth: 0, panelLauncherWidth: 0 };
}

export function workbenchCommandGroups(): WorkbenchCommandGroup[] {
  return [
    {
      id: "project",
      commands: [
        { id: "open-project", label: "Open", width: 56, group: "project" },
        { id: "new-file", label: "New", width: 50, group: "project" },
        { id: "save", label: "Save", width: 56, group: "project" },
      ],
    },
    {
      id: "run",
      commands: [
        { id: "validate", label: "Validate", width: 78, group: "run" },
        { id: "build", label: "Build", width: 58, group: "run" },
        { id: "run-preview", label: "Run", width: 48, group: "run" },
        { id: "stop-preview", label: "Stop", width: 50, group: "run" },
        { id: "command-palette", label: "Palette", width: 72, group: "run" },
      ],
    },
    {
      id: "panels",
      commands: [
        { id: "toggle-project", label: "Project", width: 60, group: "panels", panel: "project" },
        { id: "toggle-chat", label: "Chat", width: 44, group: "panels", panel: "assistant" },
        { id: "toggle-docs", label: "Docs", width: 44, group: "panels", panel: "docs" },
        { id: "toggle-editor-settings", label: "Editor", width: 54, group: "panels", panel: "editorSettings" },
        { id: "toggle-chat-settings", label: "Chat Cfg", width: 88, group: "panels", panel: "chatSettings" },
      ],
    },
  ];
}

export function setDrawerMode(drawer: DrawerState, mode: DrawerMode): DrawerState {
  return { ...drawer, mode };
}

export function selectDrawerTab(drawer: DrawerState, activeTab: DrawerTab): DrawerState {
  return { ...drawer, activeTab };
}

export function statusItemsWithPreview(items: StatusItem[], previewState: PreviewStateName): StatusItem[] {
  return items.map((item) => {
    if (item.id !== "preview") return item;
    return { ...item, value: previewState, tone: previewStatusTone(previewState) };
  });
}

export function statusBarVisibility(items: StatusItem[], width: number): StatusBarVisibility {
  const viewportWidth = Math.max(0, finiteNumber(width, 1280));
  if (viewportWidth >= 1120) {
    return { items, showActivePath: true, showProviderLabel: true };
  }

  const hiddenIds = viewportWidth >= 960 ? new Set(["cpu", "mem", "gpu"]) : new Set(["sidecar", "cpu", "mem", "gpu"]);
  return {
    items: items.filter((item) => !hiddenIds.has(item.id)),
    showActivePath: false,
    showProviderLabel: false,
  };
}

export function activeEditorTab(state: WorkbenchState): EditorTab {
  const tab = state.editorTabs.find((candidate) => candidate.id === state.activeEditorTabId);
  if (!tab) throw new Error(`active editor tab is missing: ${state.activeEditorTabId}`);
  return tab;
}

function basename(path: string): string {
  const parts = path.split("/").filter(Boolean);
  return parts[parts.length - 1] || path;
}

function previewStatusTone(state: PreviewStateName): StatusTone {
  if (state === "running") return "ok";
  if (state === "starting") return "warn";
  if (state === "failed") return "error";
  return "muted";
}

function setPanel(
  panels: Record<WorkbenchPanelName, PanelState>,
  name: WorkbenchPanelName,
  panel: PanelState,
): Record<WorkbenchPanelName, PanelState> {
  return { ...panels, [name]: panel };
}

function fallbackPanelState(): PanelState {
  return {
    open: false,
    mode: "floating",
    pinned: false,
    x: 20,
    y: 56,
    width: 360,
    height: 420,
  };
}

function normalizePanelMode(value: unknown, fallback: PanelMode): PanelMode {
  return value === "floating" || value === "minimized" || value === "docked" ? value : fallback;
}

function normalizeDockEdge(value: unknown, fallback: DockEdge): DockEdge {
  return value === "left" || value === "right" ? value : fallback;
}

function normalizeRectangle(value: unknown): PanelState["lastFloating"] {
  if (!isRecord(value)) return undefined;
  if (!Number.isFinite(value.x) || !Number.isFinite(value.y)) return undefined;
  if (!Number.isFinite(value.width) || !Number.isFinite(value.height)) return undefined;
  return {
    x: Number(value.x),
    y: Number(value.y),
    width: Math.max(160, Number(value.width)),
    height: Math.max(120, Number(value.height)),
  };
}

function panelRectangle(panel: PanelState): NonNullable<PanelState["lastFloating"]> {
  return { x: panel.x, y: panel.y, width: panel.width, height: panel.height };
}

function finiteNumber(value: unknown, fallback: number): number {
  return Number.isFinite(value) ? Number(value) : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
