<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import AssistantPanel from "./ui/AssistantPanel.vue";
import BottomDrawer from "./ui/BottomDrawer.vue";
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
  createWorkbenchState,
  selectDrawerTab,
  setDrawerMode,
  statusItemsWithPreview,
  togglePanel,
  type DrawerMode,
  type DrawerTab,
  type WorkbenchPanelName,
} from "./core/workbench";
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

const workspace = ref(defaultWorkspaceDocument("/home/shawn/workspace/hawk2ui-editor"));
const workbench = ref(createWorkbenchState(workspace.value.project.root));
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
const profile = computed(() => activeProfile(workspace.value));
const activeTab = computed(() => activeDocument(documents.value));
const statusItems = computed(() => statusItemsWithPreview(workbench.value.statusItems, preview.value.state));
const sidecar = ref<EditorSidecarStatus | null>(null);
const sidecarAvailable = computed(() => sidecar.value?.state === "open");
let editorStatusTimer: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  void refreshProjectTree();
  void openProjectFile("src/App.vue");
  void refreshEditorStatus();
  editorStatusTimer = setInterval(() => void refreshEditorStatus(), 1500);
});

onBeforeUnmount(() => {
  if (editorStatusTimer) clearInterval(editorStatusTimer);
});

function closePanel(name: WorkbenchPanelName) {
  const panels = workbench.value.panels;
  workbench.value.panels = { ...panels, [name]: { ...panels[name], open: false } };
}

function nudgePanel(name: WorkbenchPanelName, dx: number, dy: number) {
  const panels = workbench.value.panels;
  const panel = panels[name];
  workbench.value.panels = { ...panels, [name]: { ...panel, x: panel.x + dx, y: panel.y + dy } };
}

function panel(name: WorkbenchPanelName): PanelState {
  return workbench.value.panels[name];
}

function toggleWorkbenchPanel(name: WorkbenchPanelName) {
  workbench.value.panels = togglePanel(workbench.value.panels, name);
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
      body: JSON.stringify({ root: workspace.value.project.root, path }),
    });
    applySidecarStatus(state);
    appendLog(state.message);
    setTimeout(() => void refreshEditorStatus(), 500);
  } catch (error) {
    setStatusItem("sidecar", "failed", "error");
    appendLog(error instanceof Error ? error.message : `sidecar failed: ${path}`);
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
</script>

<template>
  <hawk-view id="editor-root" class="editor-root">
    <hawk-view id="topbar" class="topbar">
      <hawk-view id="app-brand" class="command-group">
        <hawk-text id="app-title">Hawk2UI Editor</hawk-text>
        <hawk-text id="app-subtitle" class="muted">Single-project workbench</hawk-text>
      </hawk-view>

      <hawk-view id="command-actions" class="command-group">
        <hawk-button id="command-open">Open</hawk-button>
        <hawk-button id="command-new-file">New File</hawk-button>
        <hawk-button id="command-save" @pointer-press="saveEditorTab(activeTab.id)">Save</hawk-button>
        <hawk-button id="command-validate" @pointer-press="selectDrawer('problems')">Validate</hawk-button>
        <hawk-button id="command-build" @pointer-press="selectDrawer('logs')">Build</hawk-button>
        <hawk-button id="command-run" @pointer-press="preview.state = 'starting'">Run</hawk-button>
        <hawk-button id="command-stop" @pointer-press="preview.state = 'stopped'">Stop</hawk-button>
      </hawk-view>

      <hawk-view id="panel-launchers" class="command-group">
        <hawk-button id="toggle-project" @pointer-press="toggleWorkbenchPanel('project')">Project</hawk-button>
        <hawk-button id="toggle-chat" @pointer-press="toggleWorkbenchPanel('assistant')">Chat</hawk-button>
        <hawk-button id="toggle-docs" @pointer-press="toggleWorkbenchPanel('docs')">Docs</hawk-button>
        <hawk-button id="toggle-editor-settings" @pointer-press="toggleWorkbenchPanel('editorSettings')">
          Editor
        </hawk-button>
        <hawk-button id="toggle-chat-settings" @pointer-press="toggleWorkbenchPanel('chatSettings')">
          Chat Settings
        </hawk-button>
      </hawk-view>
    </hawk-view>

    <hawk-view id="workspace" class="workspace">
      <EditorWorkspace
        :tabs="documents.documents"
        :active-tab-id="documents.activeDocumentId ?? ''"
        :sidecar-available="sidecarAvailable"
        @select="setActiveEditorTab"
        @save="saveEditorTab"
        @open-sidecar="requestSidecar"
      />
    </hawk-view>

    <BottomDrawer
      :mode="workbench.drawer.mode"
      :active-tab="workbench.drawer.activeTab"
      :preview="preview"
      @select-tab="selectDrawer"
      @set-mode="setDrawer"
      @start-preview="preview.state = 'starting'"
      @stop-preview="preview.state = 'stopped'"
    />

    <StatusBar :items="statusItems" :active-path="activeTab.path" :provider-label="profile.label" />

    <HawkFloatingPanel
      v-if="panel('project').open"
      id-prefix="project"
      title="Project"
      :panel="panel('project')"
      @close="closePanel('project')"
      @nudge="(dx, dy) => nudgePanel('project', dx, dy)"
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
    >
      <SettingsPanel kind="editor" :theme="workspace.editor.theme" :profile="profile" />
    </HawkFloatingPanel>

    <HawkFloatingPanel
      v-if="panel('chatSettings').open"
      id-prefix="chat-settings"
      title="Chat Settings"
      :panel="panel('chatSettings')"
      @close="closePanel('chatSettings')"
      @nudge="(dx, dy) => nudgePanel('chatSettings', dx, dy)"
    >
      <SettingsPanel kind="chat" :theme="workspace.editor.theme" :profile="profile" />
    </HawkFloatingPanel>
  </hawk-view>
</template>
