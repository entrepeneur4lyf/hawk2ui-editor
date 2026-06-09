<script setup lang="ts">
import { computed, ref } from "vue";
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
  activeEditorTab,
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

const workspace = ref(defaultWorkspaceDocument("/home/shawn/workspace/hawk2ui-editor"));
const workbench = ref(createWorkbenchState(workspace.value.project.root));
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
const activeTab = computed(() => activeEditorTab(workbench.value));
const statusItems = computed(() => statusItemsWithPreview(workbench.value.statusItems, preview.value.state));

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
  workbench.value.activeEditorTabId = id;
}

function saveEditorTab(id: string) {
  workbench.value.editorTabs = workbench.value.editorTabs.map((tab) => {
    return tab.id === id ? { ...tab, dirty: false } : tab;
  });
}

function requestSidecar(path: string) {
  preview.value.output = [...preview.value.output, `sidecar requested: ${path}`];
  workbench.value.drawer = selectDrawerTab(setDrawerMode(workbench.value.drawer, "compact"), "logs");
}

function setDrawer(mode: DrawerMode) {
  workbench.value.drawer = setDrawerMode(workbench.value.drawer, mode);
}

function selectDrawer(tab: DrawerTab) {
  workbench.value.drawer = selectDrawerTab(workbench.value.drawer, tab);
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
        :tabs="workbench.editorTabs"
        :active-tab-id="workbench.activeEditorTabId"
        :sidecar-available="false"
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
      <ProjectPanel :project="project" />
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
      <DocsPanel :source="workspace.docs.source" />
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
