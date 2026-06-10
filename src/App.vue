<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import AssistantPanel from "./ui/AssistantPanel.vue";
import BottomDrawer from "./ui/BottomDrawer.vue";
import DockGutter, { type DockPanelItem } from "./ui/DockGutter.vue";
import DocsPanel from "./ui/DocsPanel.vue";
import EditorWorkspace from "./ui/EditorWorkspace.vue";
import HawkFloatingPanel from "./ui/HawkFloatingPanel.vue";
import ProjectPanel from "./ui/ProjectPanel.vue";
import SettingsPanel from "./ui/SettingsPanel.vue";
import StatusBar from "./ui/StatusBar.vue";
import { activeProfile, defaultWorkspaceDocument, type PanelState } from "./core/workspace";
import { summarizeHawkManifest } from "./core/project";
import {
  activeDocument,
  createDocumentState,
  markDocumentSaved,
  openDocsDocument,
  openFileDocument,
  selectDocument,
} from "./core/documents";
import {
  closePanel as closeWorkbenchPanel,
  closePeekedPanel,
  createWorkbenchState,
  dockPanel,
  minimizePanel,
  openPanel,
  peekPanel,
  pinPanel,
  recoverPanelsForViewport,
  selectDrawerTab,
  setDrawerMode,
  statusItemsWithPreview,
  togglePanel,
  undockPanel,
  unpinPanel,
  workbenchChromeMetrics,
  workbenchLayoutMetrics,
  type DockEdge,
  type DrawerMode,
  type DrawerTab,
  type WorkbenchPanelName,
} from "./core/workbench";
import { resolveWorkbenchTheme, themeClassName, type ThemePreference } from "./theme/workbenchTheme";
import type { PreviewStatus } from "./preview/previewClient";
import type { ProjectTreeEntry } from "./bridge/files";

interface EditorSidecarStatus {
  state: "closed" | "opening" | "open" | "failed";
  filePath: string | null;
  relativePath: string | null;
  dirty: boolean;
  line: number;
  column: number;
  lastSavedAt: string | null;
  lastError: string | null;
  message: string;
}

interface LspDiagnostic {
  range: { start: { line: number; character: number }; end: { line: number; character: number } };
  severity?: number;
  code?: string | number;
  source?: string;
  message: string;
}

interface LspStatus {
  state: "stopped" | "starting" | "running" | "failed";
  root: string;
  server: "typescript";
  message: string;
  diagnostics: Record<string, LspDiagnostic[]>;
  diagnosticCount: number;
  lastError: string | null;
  startedAt: string | null;
}

interface TerminalStatus {
  state: "stopped" | "starting" | "running" | "exited" | "failed";
  root: string;
  shell: string;
  cwd: string;
  cols: number;
  rows: number;
  exitCode: number | null;
  message: string;
  lastError: string | null;
  startedAt: string | null;
}

interface TerminalSidecarState {
  state: "closed" | "opening" | "open" | "failed";
  root: string | null;
  cols: number;
  rows: number;
  lastError: string | null;
  message: string;
}

interface ProblemEntry {
  path: string;
  line: number;
  column: number;
  severity: string;
  message: string;
  source?: string;
}

const workspace = ref(defaultWorkspaceDocument("/home/shawn/workspace/hawk2ui-editor"));
const initialWorkbench = createWorkbenchState(workspace.value.project.root);
initialWorkbench.panels = workspace.value.panels as Record<WorkbenchPanelName, PanelState>;
const workbench = ref(initialWorkbench);
const documents = ref(createDocumentState(workbench.value.editorTabs, workbench.value.activeEditorTabId));
const projectTree = ref<ProjectTreeEntry[]>([
  { name: "hawk.json", path: "hawk.json", type: "file" },
  {
    name: "src",
    path: "src",
    type: "directory",
    children: [
      { name: "App.vue", path: "src/App.vue", type: "file" },
      { name: "main.ts", path: "src/main.ts", type: "file" },
    ],
  },
  { name: "README.md", path: "README.md", type: "file" },
]);
const project = summarizeHawkManifest(
  workspace.value.project.root,
  JSON.stringify({
    package: { id: "com.hawk2ui.editor", name: "Hawk2UI Editor", version: "0.1.0" },
    app: { entry: "src/main.ts", framework: "vue" },
    targets: { desktop: [{ name: "main" }] },
  }),
);
const preview = ref<PreviewStatus>({
  state: "stopped",
  command: workspace.value.preview.command,
  cwd: workspace.value.project.root,
  output: [],
});
const surfaceSize = ref({ width: 960, height: 540 });
const profile = computed(() => activeProfile(workspace.value));
const activeTab = computed(() => activeDocument(documents.value));
const statusItems = computed(() => statusItemsWithPreview(workbench.value.statusItems, preview.value.state));
const sidecar = ref<EditorSidecarStatus | null>(null);
const lsp = ref<LspStatus | null>(null);
const terminal = ref<TerminalStatus | null>(null);
const sidecarAvailable = computed(() => sidecar.value?.state === "open");
const problems = computed(() => lspProblems(lsp.value, workspace.value.project.root));
const terminalLabel = computed(() => terminal.value?.message ?? "Terminal bridge is idle.");
const layout = computed(() => workbenchLayoutMetrics(surfaceSize.value, workbench.value.drawer.mode));
const chrome = computed(() => workbenchChromeMetrics(layout.value.width));
const resolvedTheme = computed(() => resolveWorkbenchTheme(workspace.value.editor.theme));
const rootClass = computed(() => `editor-root ${themeClassName(workspace.value.editor.theme)}`);
const leftDockItems = computed(() => dockItems("left"));
const rightDockItems = computed(() => dockItems("right"));
const activeDockPanelId = computed(() => {
  return panelNames.find((name) => {
    const state = workbench.value.panels[name];
    return state.open && state.mode !== "floating";
  }) ?? null;
});
const peekedPanelId = ref<WorkbenchPanelName | null>(null);
let statusTimer: ReturnType<typeof setInterval> | null = null;
let peekTimer: ReturnType<typeof setTimeout> | null = null;

const panelNames: WorkbenchPanelName[] = ["project", "assistant", "docs", "editorSettings", "chatSettings"];
const panelLabels: Record<WorkbenchPanelName, string> = {
  project: "Project",
  assistant: "Chat",
  docs: "Docs",
  editorSettings: "Editor Settings",
  chatSettings: "Chat Settings",
};

onMounted(() => {
  void refreshProjectTree();
  void openProjectFile("src/App.vue");
  void refreshEditorStatus();
  void refreshLspStatus();
  void refreshTerminalStatus();
  statusTimer = setInterval(() => {
    void refreshEditorStatus();
    void refreshLspStatus();
    void refreshTerminalStatus();
  }, 1500);
});

onBeforeUnmount(() => {
  if (statusTimer) clearInterval(statusTimer);
  if (peekTimer) clearTimeout(peekTimer);
});

function closePanel(name: WorkbenchPanelName) {
  if (peekedPanelId.value === name) peekedPanelId.value = null;
  setWorkbenchPanels(closeWorkbenchPanel(workbench.value.panels, name));
}

function nudgePanel(name: WorkbenchPanelName, dx: number, dy: number) {
  const panels = workbench.value.panels;
  const panel = panels[name];
  setWorkbenchPanels({ ...panels, [name]: { ...panel, x: panel.x + dx, y: panel.y + dy } });
}

function panel(name: WorkbenchPanelName): PanelState {
  return workbench.value.panels[name];
}

function toggleWorkbenchPanel(name: WorkbenchPanelName) {
  setWorkbenchPanels(togglePanel(workbench.value.panels, name));
}

function minimizeWorkbenchPanel(name: WorkbenchPanelName, edge: DockEdge = "left") {
  if (peekedPanelId.value === name) peekedPanelId.value = null;
  setWorkbenchPanels(minimizePanel(workbench.value.panels, name, edge));
}

function dockWorkbenchPanel(name: WorkbenchPanelName, edge: DockEdge) {
  peekedPanelId.value = null;
  setWorkbenchPanels(dockPanel(workbench.value.panels, name, edge));
}

function restoreWorkbenchPanel(name: WorkbenchPanelName) {
  if (peekedPanelId.value === name) peekedPanelId.value = null;
  setWorkbenchPanels(undockPanel(workbench.value.panels, name));
}

function pinWorkbenchPanel(name: WorkbenchPanelName) {
  peekedPanelId.value = null;
  setWorkbenchPanels(pinPanel(workbench.value.panels, name));
}

function unpinWorkbenchPanel(name: WorkbenchPanelName) {
  setWorkbenchPanels(unpinPanel(workbench.value.panels, name));
}

function openDockedPanel(name: WorkbenchPanelName) {
  if (peekTimer) clearTimeout(peekTimer);
  peekedPanelId.value = null;
  setWorkbenchPanels(openPanel(workbench.value.panels, name));
}

function schedulePeekPanel(name: WorkbenchPanelName) {
  if (peekTimer) clearTimeout(peekTimer);
  peekTimer = setTimeout(() => {
    setWorkbenchPanels(peekPanel(workbench.value.panels, name));
    peekedPanelId.value = name;
  }, 240);
}

function closePeek(name: WorkbenchPanelName) {
  if (peekTimer) clearTimeout(peekTimer);
  if (peekedPanelId.value !== name) return;
  setWorkbenchPanels(closePeekedPanel(workbench.value.panels, name));
  peekedPanelId.value = null;
}

function closeActivePeek() {
  if (peekTimer) clearTimeout(peekTimer);
  if (!peekedPanelId.value) return;
  const name = peekedPanelId.value;
  setWorkbenchPanels(closePeekedPanel(workbench.value.panels, name));
  peekedPanelId.value = null;
}

function handleRootKeydown(event: { key?: string }) {
  if (event.key === "Escape") closeActivePeek();
}

function handleRootResize(event: { width?: number; height?: number; detail?: { width?: number; height?: number } }) {
  const width = Number(event.width ?? event.detail?.width);
  const height = Number(event.height ?? event.detail?.height);
  if (!Number.isFinite(width) || !Number.isFinite(height)) return;
  surfaceSize.value = { width, height };
  const nextLayout = workbenchLayoutMetrics({ width, height }, workbench.value.drawer.mode);
  setWorkbenchPanels(
    recoverPanelsForViewport(workbench.value.panels, {
      width: nextLayout.width,
      height: nextLayout.height,
      topBarHeight: nextLayout.topBarHeight,
      bottomReservedHeight: nextLayout.drawerHeight + nextLayout.statusBarHeight,
      gutterWidth: nextLayout.gutterWidth,
    }),
  );
}

function setEditorTheme(theme: ThemePreference) {
  workspace.value = { ...workspace.value, editor: { ...workspace.value.editor, theme } };
}

function setWorkbenchPanels(panels: Record<WorkbenchPanelName, PanelState>) {
  workbench.value.panels = panels;
  workspace.value = { ...workspace.value, panels };
}

function dockItems(edge: DockEdge): DockPanelItem[] {
  return panelNames
    .map((name) => ({ id: name, label: panelLabels[name], ...workbench.value.panels[name] }))
    .filter((item) => item.mode !== "floating" && item.dockEdge === edge);
}

function setActiveEditorTab(id: string) {
  documents.value = selectDocument(documents.value, id);
}

async function saveEditorTab(id: string) {
  const document = documents.value.documents.find((candidate) => candidate.id === id);
  if (!document) return;
  if (document.readOnly) {
    appendLog(`save skipped for read-only document: ${document.path}`);
    return;
  }

  try {
    await bridgeJson("/files/write", {
      method: "POST",
      body: JSON.stringify({ root: workspace.value.project.root, path: document.path, content: document.content }),
    });
    documents.value = markDocumentSaved(documents.value, id);
    appendLog(`saved ${document.path}`);
  } catch (error) {
    appendLog(error instanceof Error ? error.message : `save failed: ${document.path}`);
  }
}

async function requestSidecar(path: string) {
  setStatusItem("sidecar", "opening", "warn");
  try {
    const state = await bridgeJson<EditorSidecarStatus>("/editor/open", {
      method: "POST",
      body: JSON.stringify({ root: workspace.value.project.root, path, theme: resolvedTheme.value }),
    });
    applySidecarStatus(state);
    appendLog(state.message);
    setTimeout(() => void refreshEditorStatus(), 500);
  } catch (error) {
    setStatusItem("sidecar", "failed", "error");
    appendLog(error instanceof Error ? error.message : `sidecar failed: ${path}`);
  }
}

async function requestTerminalSidecar() {
  setStatusItem("terminal", "opening", "warn");
  workbench.value.drawer = selectDrawerTab(setDrawerMode(workbench.value.drawer, "compact"), "terminal");
  try {
    const state = await bridgeJson<TerminalSidecarState>("/terminal/open", {
      method: "POST",
      body: JSON.stringify({ root: workspace.value.project.root, theme: resolvedTheme.value }),
    });
    appendLog(state.message);
    workbench.value.drawer = selectDrawerTab(setDrawerMode(workbench.value.drawer, "compact"), "terminal");
    if (state.state === "failed") {
      setStatusItem("terminal", "disabled", "warn");
    }
    setTimeout(() => void refreshTerminalStatus(), 500);
  } catch (error) {
    setStatusItem("terminal", "failed", "error");
    appendLog(error instanceof Error ? error.message : "terminal sidecar failed");
  }
}

async function closeTerminalSidecar() {
  try {
    const state = await bridgeJson<TerminalSidecarState>("/terminal/close", { method: "POST" });
    appendLog(state.message);
    workbench.value.drawer = selectDrawerTab(setDrawerMode(workbench.value.drawer, "compact"), "terminal");
    void refreshTerminalStatus();
  } catch (error) {
    appendLog(error instanceof Error ? error.message : "terminal close failed");
  }
}

function setDrawer(mode: DrawerMode) {
  workbench.value.drawer = setDrawerMode(workbench.value.drawer, mode);
}

function selectDrawer(tab: DrawerTab) {
  workbench.value.drawer = selectDrawerTab(workbench.value.drawer, tab);
}

async function refreshProjectTree() {
  try {
    const response = await bridgeJson<{ entries: ProjectTreeEntry[] }>(
      `/project/tree?root=${encodeURIComponent(workspace.value.project.root)}`,
    );
    projectTree.value = response.entries;
    setStatusItem("bridge", "connected", "ok");
  } catch (error) {
    setStatusItem("bridge", "disconnected", "warn");
    appendLog(error instanceof Error ? error.message : "project tree unavailable");
  }
}

async function refreshEditorStatus() {
  try {
    applySidecarStatus(await bridgeJson<EditorSidecarStatus>("/editor/status"));
  } catch {
    setStatusItem("sidecar", "unknown", "warn");
  }
}

async function refreshLspStatus() {
  try {
    applyLspStatus(
      await bridgeJson<LspStatus>(`/lsp/status?root=${encodeURIComponent(workspace.value.project.root)}`),
    );
  } catch {
    setStatusItem("lsp", "unknown", "warn");
  }
}

async function refreshTerminalStatus() {
  try {
    applyTerminalStatus(
      await bridgeJson<TerminalStatus>(`/terminal/status?root=${encodeURIComponent(workspace.value.project.root)}`),
    );
  } catch {
    setStatusItem("terminal", "unknown", "warn");
  }
}

async function openProjectFile(path: string) {
  try {
    const file = await bridgeJson<{ path: string; content: string }>(
      `/files/read?root=${encodeURIComponent(workspace.value.project.root)}&path=${encodeURIComponent(path)}`,
    );
    documents.value = openFileDocument(documents.value, file.path, file.content);
    setStatusItem("bridge", "connected", "ok");
  } catch (error) {
    documents.value = openFileDocument(documents.value, path, `Bridge unavailable while loading ${path}.`);
    setStatusItem("bridge", "disconnected", "warn");
    appendLog(error instanceof Error ? error.message : `file unavailable: ${path}`);
  }
}

async function openDoc(path: string) {
  try {
    const page = await bridgeJson<{ path: string; markdown: string }>("/docs/page", {
      method: "POST",
      body: JSON.stringify({ source: workspace.value.docs.source, path }),
    });
    documents.value = openDocsDocument(documents.value, page.path, page.markdown);
    setStatusItem("bridge", "connected", "ok");
  } catch (error) {
    documents.value = openDocsDocument(documents.value, path, `# ${path}\n\nBridge docs unavailable.`);
    appendLog(error instanceof Error ? error.message : `docs unavailable: ${path}`);
  }
}

async function bridgeJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${workspace.value.bridge.baseURL}${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...(init.headers ?? {}) },
  });
  if (!response.ok) throw new Error(`bridge request failed: ${response.status}`);
  return response.json() as Promise<T>;
}

function appendLog(message: string) {
  preview.value.output = [...preview.value.output, message].slice(-30);
  workbench.value.drawer = selectDrawerTab(setDrawerMode(workbench.value.drawer, "compact"), "logs");
}

function setStatusItem(id: string, value: string, tone: "ok" | "warn" | "error" | "muted") {
  workbench.value.statusItems = workbench.value.statusItems.map((item) => {
    return item.id === id ? { ...item, value, tone } : item;
  });
}

function applySidecarStatus(status: EditorSidecarStatus) {
  sidecar.value = status;
  setStatusItem("sidecar", sidecarStatusValue(status), sidecarStatusTone(status));
}

function applyLspStatus(status: LspStatus) {
  lsp.value = status;
  if (status.state === "failed") {
    setStatusItem("lsp", "failed", "error");
    return;
  }

  if (status.diagnosticCount > 0) {
    setStatusItem("lsp", `${status.diagnosticCount} issues`, "warn");
    return;
  }

  setStatusItem("lsp", status.state === "running" ? "ready" : "off", status.state === "running" ? "ok" : "muted");
}

function applyTerminalStatus(status: TerminalStatus) {
  terminal.value = status;
  if (status.state === "failed" || status.lastError) {
    setStatusItem("terminal", "failed", "error");
    return;
  }

  if (status.state === "running") {
    setStatusItem("terminal", `${status.cols}x${status.rows}`, "ok");
    return;
  }

  if (status.state === "starting") {
    setStatusItem("terminal", "starting", "warn");
    return;
  }

  setStatusItem("terminal", status.state === "exited" ? "exited" : "off", "muted");
}

function sidecarStatusValue(status: EditorSidecarStatus): string {
  if (status.state === "open") return `${status.dirty ? "dirty" : "open"} ${status.line}:${status.column}`;
  return status.state;
}

function sidecarStatusTone(status: EditorSidecarStatus): "ok" | "warn" | "error" | "muted" {
  if (status.state === "failed" || status.lastError) return "error";
  if (status.state === "opening" || status.dirty) return "warn";
  if (status.state === "open") return "ok";
  return "muted";
}

function lspProblems(status: LspStatus | null, projectRoot: string): ProblemEntry[] {
  if (!status) return [];

  return Object.entries(status.diagnostics).flatMap(([uri, diagnostics]) => {
    return diagnostics.map((diagnostic) => ({
      path: fileUriLabel(uri, projectRoot),
      line: diagnostic.range.start.line + 1,
      column: diagnostic.range.start.character + 1,
      severity: severityLabel(diagnostic.severity),
      source: diagnostic.source,
      message: diagnostic.message,
    }));
  });
}

function fileUriLabel(uri: string, projectRoot: string): string {
  try {
    const path = decodeURIComponent(new URL(uri).pathname);
    const prefix = projectRoot.endsWith("/") ? projectRoot : `${projectRoot}/`;
    return path.startsWith(prefix) ? path.slice(prefix.length) : path;
  } catch {
    return uri;
  }
}

function severityLabel(severity: number | undefined): string {
  if (severity === 1) return "error";
  if (severity === 2) return "warning";
  if (severity === 3) return "info";
  if (severity === 4) return "hint";
  return "diagnostic";
}
</script>

<template>
  <hawk-view
    id="editor-root"
    :class="rootClass"
    :width="layout.width"
    :height="layout.height"
    @keydown="handleRootKeydown"
    @resize="handleRootResize"
  >
    <hawk-view id="topbar" class="topbar" :width="layout.width" :height="layout.topBarHeight">
      <hawk-view id="app-brand" class="command-group" :width="chrome.brandWidth" :height="layout.topBarHeight">
        <hawk-text id="app-title">Hawk2UI Editor</hawk-text>
        <hawk-text id="app-subtitle" class="muted">Workbench</hawk-text>
      </hawk-view>

      <hawk-view
        v-if="chrome.commandWidth > 0"
        id="command-actions"
        class="command-group"
        :width="chrome.commandWidth"
        :height="layout.topBarHeight"
      >
        <hawk-button id="command-open" :width="56">Open</hawk-button>
        <hawk-button id="command-new-file" :width="50">New</hawk-button>
        <hawk-button id="command-save" :width="56" @pointerdown="saveEditorTab(activeTab.id)">Save</hawk-button>
        <hawk-button id="command-validate" :width="78" @pointerdown="selectDrawer('problems')">Validate</hawk-button>
        <hawk-button id="command-build" :width="58" @pointerdown="selectDrawer('logs')">Build</hawk-button>
        <hawk-button id="command-run" :width="48" @pointerdown="preview.state = 'starting'">Run</hawk-button>
        <hawk-button id="command-stop" :width="50" @pointerdown="preview.state = 'stopped'">Stop</hawk-button>
        <hawk-button id="command-palette" :width="72" @pointerdown="selectDrawer('logs')">Palette</hawk-button>
      </hawk-view>

      <hawk-view
        v-if="chrome.panelLauncherWidth > 0"
        id="panel-launchers"
        class="command-group"
        :width="chrome.panelLauncherWidth"
        :height="layout.topBarHeight"
      >
        <hawk-button id="toggle-project" :width="60" @pointerdown="toggleWorkbenchPanel('project')">Project</hawk-button>
        <hawk-button id="toggle-chat" :width="44" @pointerdown="toggleWorkbenchPanel('assistant')">Chat</hawk-button>
        <hawk-button id="toggle-docs" :width="44" @pointerdown="toggleWorkbenchPanel('docs')">Docs</hawk-button>
        <hawk-button id="toggle-editor-settings" :width="54" @pointerdown="toggleWorkbenchPanel('editorSettings')">
          Editor
        </hawk-button>
        <hawk-button id="toggle-chat-settings" :width="88" @pointerdown="toggleWorkbenchPanel('chatSettings')">
          Chat Cfg
        </hawk-button>
      </hawk-view>
    </hawk-view>

    <DockGutter
      v-if="leftDockItems.length > 0"
      edge="left"
      :panels="leftDockItems"
      :active-panel-id="activeDockPanelId"
      :peeked-panel-id="peekedPanelId"
      :height="layout.workspaceHeight"
      @open-panel="openDockedPanel"
      @peek-panel="schedulePeekPanel"
      @close-peek="closePeek"
      @pin-panel="pinWorkbenchPanel"
      @unpin-panel="unpinWorkbenchPanel"
      @undock-panel="restoreWorkbenchPanel"
    />

    <DockGutter
      v-if="rightDockItems.length > 0"
      edge="right"
      :panels="rightDockItems"
      :active-panel-id="activeDockPanelId"
      :peeked-panel-id="peekedPanelId"
      :height="layout.workspaceHeight"
      @open-panel="openDockedPanel"
      @peek-panel="schedulePeekPanel"
      @close-peek="closePeek"
      @pin-panel="pinWorkbenchPanel"
      @unpin-panel="unpinWorkbenchPanel"
      @undock-panel="restoreWorkbenchPanel"
    />

    <hawk-view
      id="workspace"
      class="workspace"
      :width="layout.width"
      :height="layout.workspaceHeight"
      @pointerdown="closeActivePeek"
    >
      <EditorWorkspace
        :tabs="documents.documents"
        :active-tab-id="documents.activeDocumentId ?? ''"
        :sidecar-available="sidecarAvailable"
        :width="layout.width"
        :height="layout.workspaceHeight"
        @select="setActiveEditorTab"
        @save="saveEditorTab"
        @open-sidecar="requestSidecar"
      />
    </hawk-view>

    <BottomDrawer
      :mode="workbench.drawer.mode"
      :active-tab="workbench.drawer.activeTab"
      :preview="preview"
      :problems="problems"
      :terminal-label="terminalLabel"
      :width="layout.width"
      @select-tab="selectDrawer"
      @set-mode="setDrawer"
      @start-preview="preview.state = 'starting'"
      @stop-preview="preview.state = 'stopped'"
      @open-terminal="requestTerminalSidecar"
      @close-terminal="closeTerminalSidecar"
    />

    <StatusBar
      :items="statusItems"
      :active-path="activeTab.path"
      :provider-label="profile.label"
      :width="layout.width"
      :height="layout.statusBarHeight"
    />

    <HawkFloatingPanel
      v-if="panel('project').open"
      id-prefix="project"
      title="Project"
      :panel="panel('project')"
      @close="closePanel('project')"
      @nudge="(dx, dy) => nudgePanel('project', dx, dy)"
      @minimize="minimizeWorkbenchPanel('project', 'left')"
      @dock-left="dockWorkbenchPanel('project', 'left')"
      @dock-right="dockWorkbenchPanel('project', 'right')"
      @restore="restoreWorkbenchPanel('project')"
      @pin="pinWorkbenchPanel('project')"
      @unpin="unpinWorkbenchPanel('project')"
    >
      <ProjectPanel :project="project" :tree="projectTree" @open-file="openProjectFile" @open-sidecar="requestSidecar" />
    </HawkFloatingPanel>

    <HawkFloatingPanel
      v-if="panel('assistant').open"
      id-prefix="assistant"
      title="Chat"
      :panel="panel('assistant')"
      @close="closePanel('assistant')"
      @nudge="(dx, dy) => nudgePanel('assistant', dx, dy)"
      @minimize="minimizeWorkbenchPanel('assistant', 'right')"
      @dock-left="dockWorkbenchPanel('assistant', 'left')"
      @dock-right="dockWorkbenchPanel('assistant', 'right')"
      @restore="restoreWorkbenchPanel('assistant')"
      @pin="pinWorkbenchPanel('assistant')"
      @unpin="unpinWorkbenchPanel('assistant')"
    >
      <AssistantPanel :profile="profile" />
    </HawkFloatingPanel>

    <HawkFloatingPanel
      v-if="panel('docs').open"
      id-prefix="docs"
      title="Docs"
      :panel="panel('docs')"
      @close="closePanel('docs')"
      @nudge="(dx, dy) => nudgePanel('docs', dx, dy)"
      @minimize="minimizeWorkbenchPanel('docs', 'left')"
      @dock-left="dockWorkbenchPanel('docs', 'left')"
      @dock-right="dockWorkbenchPanel('docs', 'right')"
      @restore="restoreWorkbenchPanel('docs')"
      @pin="pinWorkbenchPanel('docs')"
      @unpin="unpinWorkbenchPanel('docs')"
    >
      <DocsPanel :source="workspace.docs.source" @open-doc="openDoc" />
    </HawkFloatingPanel>

    <HawkFloatingPanel
      v-if="panel('editorSettings').open"
      id-prefix="editor-settings"
      title="Editor Settings"
      :panel="panel('editorSettings')"
      @close="closePanel('editorSettings')"
      @nudge="(dx, dy) => nudgePanel('editorSettings', dx, dy)"
      @minimize="minimizeWorkbenchPanel('editorSettings', 'right')"
      @dock-left="dockWorkbenchPanel('editorSettings', 'left')"
      @dock-right="dockWorkbenchPanel('editorSettings', 'right')"
      @restore="restoreWorkbenchPanel('editorSettings')"
      @pin="pinWorkbenchPanel('editorSettings')"
      @unpin="unpinWorkbenchPanel('editorSettings')"
    >
      <SettingsPanel kind="editor" :theme="workspace.editor.theme" :profile="profile" @update-theme="setEditorTheme" />
    </HawkFloatingPanel>

    <HawkFloatingPanel
      v-if="panel('chatSettings').open"
      id-prefix="chat-settings"
      title="Chat Settings"
      :panel="panel('chatSettings')"
      @close="closePanel('chatSettings')"
      @nudge="(dx, dy) => nudgePanel('chatSettings', dx, dy)"
      @minimize="minimizeWorkbenchPanel('chatSettings', 'right')"
      @dock-left="dockWorkbenchPanel('chatSettings', 'left')"
      @dock-right="dockWorkbenchPanel('chatSettings', 'right')"
      @restore="restoreWorkbenchPanel('chatSettings')"
      @pin="pinWorkbenchPanel('chatSettings')"
      @unpin="unpinWorkbenchPanel('chatSettings')"
    >
      <SettingsPanel kind="chat" :theme="workspace.editor.theme" :profile="profile" @update-theme="setEditorTheme" />
    </HawkFloatingPanel>
  </hawk-view>
</template>
