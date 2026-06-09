import type { PanelState } from "./workspace";
import type { EditorDocument } from "./documents";

export type WorkbenchPanelName = "project" | "assistant" | "docs" | "editorSettings" | "chatSettings";
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
    project: { open: true, x: 20, y: 56, width: 360, height: 560 },
    assistant: { open: false, x: 428, y: 56, width: 440, height: 620 },
    docs: { open: false, x: 888, y: 56, width: 420, height: 560 },
    editorSettings: { open: false, x: 700, y: 92, width: 360, height: 420 },
    chatSettings: { open: false, x: 760, y: 116, width: 360, height: 420 },
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
  return {
    ...panels,
    [name]: { ...panels[name], open: !panels[name].open },
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
