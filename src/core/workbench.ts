import type { PanelState } from "./workspace";
import type { EditorDocument } from "./documents";

export type WorkbenchPanelName = "project" | "assistant" | "docs" | "editorSettings" | "chatSettings";
export type PanelMode = "floating" | "minimized" | "docked";
export type DockEdge = "left" | "right";
export type DrawerTab = "terminal" | "logs" | "debug" | "problems";
export type DrawerMode = "collapsed" | "compact" | "expanded";
export type StatusTone = "ok" | "warn" | "error" | "muted";
export type PreviewStateName = "stopped" | "starting" | "running" | "failed";

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

export interface WorkbenchState {
  panels: Record<WorkbenchPanelName, PanelState>;
  editorTabs: EditorTab[];
  activeEditorTabId: string;
  drawer: DrawerState;
  statusItems: StatusItem[];
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
