<script setup lang="ts">
import { ref } from "vue";

const status = ref("Ready");
const drawerTab = ref("Logs");
const drawerMode = ref("compact");
const drawerHeight = ref(150);
const workspaceHeight = ref(604);
const drawerBody = ref("Bridge idle. Use Validate, Build, Run, or Terminal.");
const activePanel = ref("Project");
const panelMode = ref("floating");
const panelBodyPrimary = ref("Project files: App.vue, WorkbenchEntry.vue, README.md.");
const panelBodySecondary = ref("Open files into editor tabs; CodeMirror sidecar follows the active file.");
const leftDockVisible = ref(false);
const rightDockVisible = ref(false);
const editorNotice = ref("App.vue is open. CodeMirror sidecar starts automatically from the bridge main process.");
const editorPath = ref("src/App.vue");
const editorLanguage = ref("Vue / TypeScript");
const editorLine1 = ref('1  &lt;script setup lang="ts"&gt;');
const editorLine2 = ref('2  const workbench = "interactive";');
const editorLine3 = ref("3  &lt;/script&gt;");
const sidecarState = ref("auto-starting");
const previewState = ref("stopped");

function openProject() {
  activePanel.value = "Project";
  panelBodyPrimary.value = "Project files: App.vue, WorkbenchEntry.vue, README.md.";
  panelBodySecondary.value = "Open files into editor tabs; CodeMirror sidecar follows the active file.";
  status.value = "Project panel active";
}

function newFile() {
  editorNotice.value = "New file command queued.";
  status.value = "New file";
}

function saveFile() {
  status.value = "Saved App.vue";
}

function validateProject() {
  drawerTab.value = "Problems";
  drawerBody.value = "No validation problems.";
  status.value = "Manifest valid";
}

function buildProject() {
  drawerTab.value = "Logs";
  drawerBody.value = "Build queued for Hawk2UI artifact.";
  status.value = "Build queued";
}

function runPreview() {
  previewState.value = "starting";
  drawerTab.value = "Debug";
  drawerBody.value = "Preview starting with hawk2ui-cli dev.";
  status.value = "Preview starting";
}

function stopPreview() {
  previewState.value = "stopped";
  drawerTab.value = "Debug";
  drawerBody.value = "Preview stopped.";
  status.value = "Preview stopped";
}

function openPalette() {
  drawerTab.value = "Logs";
  drawerBody.value = "Command palette requested.";
  status.value = "Palette";
}

function showProject() {
  activePanel.value = "Project";
  panelMode.value = "floating";
  panelBodyPrimary.value = "Project files: App.vue, WorkbenchEntry.vue, README.md.";
  panelBodySecondary.value = "Open files into editor tabs; CodeMirror sidecar follows the active file.";
  status.value = "Project panel active";
}

function showChat() {
  activePanel.value = "Chat";
  panelMode.value = "floating";
  panelBodyPrimary.value = "Checkpoint chat: current implementation slice is active.";
  panelBodySecondary.value = "Assistant tools can create checkpoints and mark work complete later.";
  status.value = "Chat panel active";
}

function showDocs() {
  activePanel.value = "Docs";
  panelMode.value = "floating";
  panelBodyPrimary.value = "Docs browser: specs and plans open as editor tabs.";
  panelBodySecondary.value = "Use docs tabs for workbench UX, editor, and AI chat specifications.";
  status.value = "Docs panel active";
}

function showEditorSettings() {
  activePanel.value = "Editor Settings";
  panelMode.value = "floating";
  panelBodyPrimary.value = "Editor settings: black theme, monospace code, sidecar auto-start.";
  panelBodySecondary.value = "Future controls: font size, wrapping, tab width, and diagnostics.";
  status.value = "Editor settings active";
}

function showChatSettings() {
  activePanel.value = "Chat Settings";
  panelMode.value = "floating";
  panelBodyPrimary.value = "Chat settings: provider profiles stay behind the bridge.";
  panelBodySecondary.value = "Profiles can switch Codex, Claude Code, NIM, or local-compatible endpoints.";
  status.value = "Chat settings active";
}

function minimizePanel() {
  panelMode.value = "minimized";
  leftDockVisible.value = true;
  status.value = `${activePanel.value} minimized`;
}

function dockLeft() {
  panelMode.value = "docked left";
  leftDockVisible.value = true;
  status.value = `${activePanel.value} docked left`;
}

function dockRight() {
  panelMode.value = "docked right";
  rightDockVisible.value = true;
  status.value = `${activePanel.value} docked right`;
}

function pinPanel() {
  panelMode.value = "pinned";
  status.value = `${activePanel.value} pinned`;
}

function unpinPanel() {
  panelMode.value = "docked";
  status.value = `${activePanel.value} unpinned`;
}

function restorePanel() {
  panelMode.value = "floating";
  status.value = `${activePanel.value} restored`;
}

function selectAppTab() {
  editorPath.value = "src/App.vue";
  editorLanguage.value = "Vue / TypeScript";
  editorLine1.value = '1  &lt;script setup lang="ts"&gt;';
  editorLine2.value = '2  const workbench = "interactive";';
  editorLine3.value = "3  &lt;/script&gt;";
  editorNotice.value = "App.vue is open. CodeMirror sidecar starts automatically from the bridge main process.";
  status.value = "App.vue selected";
}

function selectReadmeTab() {
  editorPath.value = "README.md";
  editorLanguage.value = "Markdown";
  editorLine1.value = "1  # Hawk2UI Editor";
  editorLine2.value = "2";
  editorLine3.value = "3  Local dogfood app for building a Hawk2UI single-project editor.";
  editorNotice.value = "README.md is open. Docs can be edited through the sidecar when writable.";
  status.value = "README.md selected";
}

function selectManifestTab() {
  editorPath.value = "hawk.json";
  editorLanguage.value = "JSON";
  editorLine1.value = "1  {";
  editorLine2.value = '2    "app": { "entry": "src/WorkbenchEntry.vue", "framework": "vue" },';
  editorLine3.value = '3    "targets": { "desktop": [{ "name": "main" }] }';
  editorNotice.value = "hawk.json is open. Manifest edits should stay portable.";
  status.value = "hawk.json selected";
}

function openEditorSidecar() {
  sidecarState.value = "requested";
  drawerTab.value = "Logs";
  drawerBody.value = "Editor sidecar request queued for the active file.";
  editorNotice.value = "Sidecar focus/retry request queued. CodeMirror provides selectable editing.";
  status.value = "Editor sidecar requested";
}

function selectTerminalTab() {
  drawerTab.value = "Terminal";
  drawerBody.value = "Terminal bridge ready. Webview terminal opens through the bridge sidecar.";
  status.value = "Terminal drawer active";
}

function selectLogsTab() {
  drawerTab.value = "Logs";
  drawerBody.value = "Bridge idle. Use Validate, Build, Run, or Terminal.";
  status.value = "Logs drawer active";
}

function selectDebugTab() {
  drawerTab.value = "Debug";
  drawerBody.value = "Preview debugger idle.";
  status.value = "Debug drawer active";
}

function selectProblemsTab() {
  drawerTab.value = "Problems";
  drawerBody.value = "No validation problems.";
  status.value = "Problems drawer active";
}

function collapseDrawer() {
  drawerMode.value = "collapsed";
  drawerHeight.value = 36;
  workspaceHeight.value = 718;
  status.value = "Drawer collapsed";
}

function compactDrawer() {
  drawerMode.value = "compact";
  drawerHeight.value = 150;
  workspaceHeight.value = 604;
  status.value = "Drawer compact";
}

function expandDrawer() {
  drawerMode.value = "expanded";
  drawerHeight.value = 260;
  workspaceHeight.value = 494;
  status.value = "Drawer expanded";
}

function dockProjectLeft() {
  activePanel.value = "Project";
  panelMode.value = "docked left";
  leftDockVisible.value = true;
  panelBodyPrimary.value = "Project files: App.vue, WorkbenchEntry.vue, README.md.";
  panelBodySecondary.value = "Open files into editor tabs; CodeMirror sidecar follows the active file.";
  status.value = "Project docked left";
}

function dockChatRight() {
  activePanel.value = "Chat";
  panelMode.value = "docked right";
  rightDockVisible.value = true;
  panelBodyPrimary.value = "Checkpoint chat: current implementation slice is active.";
  panelBodySecondary.value = "Assistant tools can create checkpoints and mark work complete later.";
  status.value = "Chat docked right";
}

function openTerminal() {
  drawerTab.value = "Terminal";
  drawerBody.value = "Terminal bridge ready. Webview terminal opens through the bridge sidecar.";
  status.value = "Terminal bridge ready";
}
</script>

<template>
  <hawk-view id="editor-root" class="theme-black" width="1280" height="820">
    <hawk-view id="topbar" class="topbar" width="1280" height="42">
      <hawk-text id="app-title" width="180">Hawk2UI Editor</hawk-text>
      <hawk-view id="command-project-group" class="command-group" width="162" height="42">
        <hawk-button id="command-open-project" width="56" @pointerdown="openProject">Open</hawk-button>
        <hawk-button id="command-new-file" width="50" @pointerdown="newFile">New</hawk-button>
        <hawk-button id="command-save" width="56" @pointerdown="saveFile">Save</hawk-button>
      </hawk-view>
      <hawk-view id="command-run-group" class="command-group" width="234" height="42">
        <hawk-button id="command-validate" width="78" @pointerdown="validateProject">Validate</hawk-button>
        <hawk-button id="command-build" width="58" @pointerdown="buildProject">Build</hawk-button>
        <hawk-button id="command-run" width="48" @pointerdown="runPreview">Run</hawk-button>
        <hawk-button id="command-stop" width="50" @pointerdown="stopPreview">Stop</hawk-button>
      </hawk-view>
      <hawk-view id="panel-launchers" class="command-group" width="290" height="42">
        <hawk-button id="toggle-project" width="60" @pointerdown="showProject">Project</hawk-button>
        <hawk-button id="toggle-chat" width="44" @pointerdown="showChat">Chat</hawk-button>
        <hawk-button id="toggle-docs" width="44" @pointerdown="showDocs">Docs</hawk-button>
        <hawk-button id="toggle-editor-settings" width="54" @pointerdown="showEditorSettings">Editor</hawk-button>
        <hawk-button id="toggle-chat-settings" width="88" @pointerdown="showChatSettings">Chat Cfg</hawk-button>
      </hawk-view>
      <hawk-view id="command-overflow-group" class="command-group" width="72" height="42">
        <hawk-button id="command-palette" width="72" @pointerdown="openPalette">Palette</hawk-button>
      </hawk-view>
    </hawk-view>

    <hawk-view id="workspace" class="workspace" width="1280" :height="workspaceHeight">
      <hawk-view
        v-show="leftDockVisible"
        id="dock-gutter-left"
        class="dock-gutter dock-gutter-left"
        width="34"
        :height="workspaceHeight"
      >
        <hawk-button id="dock-left-project" class="dock-icon" width="30" height="30" @pointerdown="dockProjectLeft">
          P
        </hawk-button>
      </hawk-view>

      <hawk-view id="editor-workspace" class="editor-workspace" width="1280" :height="workspaceHeight">
        <hawk-view id="editor-tabs" class="editor-tabs" width="1280" height="34">
          <hawk-button id="editor-tab-app" width="86" @pointerdown="selectAppTab">App.vue</hawk-button>
          <hawk-button id="editor-tab-readme" width="102" @pointerdown="selectReadmeTab">README.md</hawk-button>
          <hawk-button id="editor-tab-manifest" width="96" @pointerdown="selectManifestTab">hawk.json</hawk-button>
        </hawk-view>
        <hawk-text id="editor-path" class="muted" width="1280" height="28">{{ editorPath }} / {{ editorLanguage }}</hawk-text>
        <hawk-text id="editor-line-1" class="code-line" width="1280" height="28">{{ editorLine1 }}</hawk-text>
        <hawk-text id="editor-line-2" class="code-line" width="1280" height="28">{{ editorLine2 }}</hawk-text>
        <hawk-text id="editor-line-3" class="code-line" width="1280" height="28">{{ editorLine3 }}</hawk-text>
        <hawk-view id="editor-actions" class="editor-actions" width="1280" height="34">
          <hawk-button id="editor-open-sidecar" width="132" @pointerdown="openEditorSidecar">Open Sidecar</hawk-button>
          <hawk-text id="editor-sidecar-state" class="muted" width="180">Sidecar: {{ sidecarState }}</hawk-text>
        </hawk-view>
        <hawk-text id="editor-notice" class="muted" width="1280" height="32">{{ editorNotice }}</hawk-text>
      </hawk-view>

      <hawk-view
        v-show="rightDockVisible"
        id="dock-gutter-right"
        class="dock-gutter dock-gutter-right"
        width="34"
        :height="workspaceHeight"
      >
        <hawk-button id="dock-right-chat" class="dock-icon" width="30" height="30" @pointerdown="dockChatRight">
          C
        </hawk-button>
      </hawk-view>

      <hawk-view id="panel-overlay-layer" class="panel-overlay-layer" width="1280" :height="workspaceHeight">
        <hawk-view id="active-panel" class="panel floating-panel-overlay" width="360" height="360">
          <hawk-text id="active-panel-title" class="panel-title" width="360" height="30">{{ activePanel }}</hawk-text>
          <hawk-text id="active-panel-mode" class="muted" width="360" height="28">Mode: {{ panelMode }}</hawk-text>
          <hawk-button id="panel-minimize" width="72" @pointerdown="minimizePanel">Min</hawk-button>
          <hawk-button id="panel-dock-left" width="72" @pointerdown="dockLeft">Dock L</hawk-button>
          <hawk-button id="panel-dock-right" width="72" @pointerdown="dockRight">Dock R</hawk-button>
          <hawk-button id="panel-pin" width="72" @pointerdown="pinPanel">Pin</hawk-button>
          <hawk-button id="panel-unpin" width="72" @pointerdown="unpinPanel">Unpin</hawk-button>
          <hawk-button id="panel-restore" width="72" @pointerdown="restorePanel">Float</hawk-button>
          <hawk-button id="drawer-open-terminal" width="132" @pointerdown="openTerminal">Terminal</hawk-button>
          <hawk-text id="active-panel-primary" class="mono" width="340" height="42">{{ panelBodyPrimary }}</hawk-text>
          <hawk-text id="active-panel-secondary" class="muted" width="340" height="42">{{ panelBodySecondary }}</hawk-text>
          <hawk-button id="panel-open-app" width="72" @pointerdown="selectAppTab">App.vue</hawk-button>
          <hawk-button id="panel-open-readme" width="92" @pointerdown="selectReadmeTab">README.md</hawk-button>
          <hawk-button id="panel-open-manifest" width="92" @pointerdown="selectManifestTab">hawk.json</hawk-button>
        </hawk-view>
      </hawk-view>
    </hawk-view>

    <hawk-view id="bottom-drawer" class="bottom-drawer" width="1280" :height="drawerHeight">
      <hawk-view id="drawer-toolbar" class="drawer-toolbar" width="1280" height="34">
        <hawk-view id="drawer-tabs" class="drawer-tabs" width="392" height="34">
          <hawk-button id="drawer-tab-terminal" width="98" @pointerdown="selectTerminalTab">Terminal</hawk-button>
          <hawk-button id="drawer-tab-logs" width="78" @pointerdown="selectLogsTab">Logs</hawk-button>
          <hawk-button id="drawer-tab-debug" width="80" @pointerdown="selectDebugTab">Debug</hawk-button>
          <hawk-button id="drawer-tab-problems" width="104" @pointerdown="selectProblemsTab">Problems</hawk-button>
        </hawk-view>
        <hawk-button id="drawer-collapse" width="86" @pointerdown="collapseDrawer">Collapse</hawk-button>
        <hawk-button id="drawer-compact" width="78" @pointerdown="compactDrawer">Compact</hawk-button>
        <hawk-button id="drawer-expand" width="72" @pointerdown="expandDrawer">Expand</hawk-button>
      </hawk-view>
      <hawk-text id="drawer-active" class="mono" width="1280" height="28">Active: {{ drawerTab }}</hawk-text>
      <hawk-text id="drawer-mode" class="mono" width="1280" height="28">Mode: {{ drawerMode }}</hawk-text>
      <hawk-text id="drawer-body" class="mono" width="1280" height="44">{{ drawerBody }}</hawk-text>
    </hawk-view>

    <hawk-view id="status-bar" class="status-bar" width="1280" height="24">
      <hawk-text id="status-project" width="160">Project: hawk2ui-editor</hawk-text>
      <hawk-text id="status-manifest" width="112">Manifest: valid</hawk-text>
      <hawk-text id="status-bridge" width="120">Bridge: ready</hawk-text>
      <hawk-text id="status-lsp" width="110">LSP: ready</hawk-text>
      <hawk-text id="status-terminal" width="130">Terminal: ready</hawk-text>
      <hawk-text id="status-preview" width="130">Preview: {{ previewState }}</hawk-text>
      <hawk-text id="status-cpu" class="mono" width="64">CPU: --</hawk-text>
      <hawk-text id="status-mem" class="mono" width="64">MEM: --</hawk-text>
      <hawk-text id="status-gpu" class="mono" width="84">GPU: pending</hawk-text>
      <hawk-text id="status-current" width="280">Status: {{ status }}</hawk-text>
    </hawk-view>
  </hawk-view>
</template>
