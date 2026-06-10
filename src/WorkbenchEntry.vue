<script setup lang="ts">
import { ref } from "vue";

const status = ref("Ready");
const drawerTab = ref("Logs");
const drawerMode = ref("compact");
const drawerBody = ref("Bridge idle. Use Validate, Build, Run, or Terminal.");
const activePanel = ref("Project");
const panelMode = ref("floating");
const editorNotice = ref("App.vue is open. Use Open Sidecar for selectable CodeMirror editing.");
const previewState = ref("stopped");

function openProject() {
  activePanel.value = "Project";
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
  status.value = "Project panel active";
}

function showChat() {
  activePanel.value = "Chat";
  panelMode.value = "floating";
  status.value = "Chat panel active";
}

function showDocs() {
  activePanel.value = "Docs";
  panelMode.value = "floating";
  status.value = "Docs panel active";
}

function showEditorSettings() {
  activePanel.value = "Editor Settings";
  panelMode.value = "floating";
  status.value = "Editor settings active";
}

function showChatSettings() {
  activePanel.value = "Chat Settings";
  panelMode.value = "floating";
  status.value = "Chat settings active";
}

function minimizePanel() {
  panelMode.value = "minimized";
  status.value = `${activePanel.value} minimized`;
}

function dockLeft() {
  panelMode.value = "docked left";
  status.value = `${activePanel.value} docked left`;
}

function dockRight() {
  panelMode.value = "docked right";
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

function collapseDrawer() {
  drawerMode.value = "collapsed";
  status.value = "Drawer collapsed";
}

function compactDrawer() {
  drawerMode.value = "compact";
  status.value = "Drawer compact";
}

function expandDrawer() {
  drawerMode.value = "expanded";
  status.value = "Drawer expanded";
}

function dockProjectLeft() {
  activePanel.value = "Project";
  panelMode.value = "docked left";
  status.value = "Project docked left";
}

function dockChatRight() {
  activePanel.value = "Chat";
  panelMode.value = "docked right";
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

    <hawk-view id="workspace" class="workspace" width="1280" height="574">
      <hawk-view id="dock-gutter-left" class="dock-gutter dock-gutter-left" width="34" height="574">
        <hawk-button id="dock-left-project" class="dock-icon" width="30" height="30" @pointerdown="dockProjectLeft">
          P
        </hawk-button>
      </hawk-view>

      <hawk-view id="editor-workspace" class="editor-workspace" width="852" height="574">
        <hawk-text id="editor-tabs" class="mono" width="852" height="34">App.vue    README.md    hawk.json</hawk-text>
        <hawk-text id="editor-path" class="muted" width="852" height="28">src/App.vue / interactive Hawk entry</hawk-text>
        <hawk-text id="editor-line-1" class="code-line" width="852" height="28">1  &lt;script setup lang="ts"&gt;</hawk-text>
        <hawk-text id="editor-line-2" class="code-line" width="852" height="28">2  const workbench = "interactive";</hawk-text>
        <hawk-text id="editor-line-3" class="code-line" width="852" height="28">3  &lt;/script&gt;</hawk-text>
        <hawk-text id="editor-notice" class="muted" width="852" height="32">{{ editorNotice }}</hawk-text>
      </hawk-view>

      <hawk-view id="active-panel" class="panel" width="360" height="360">
        <hawk-text id="active-panel-title" class="panel-title" width="360" height="30">{{ activePanel }}</hawk-text>
        <hawk-text id="active-panel-mode" class="muted" width="360" height="28">Mode: {{ panelMode }}</hawk-text>
        <hawk-button id="panel-minimize" width="72" @pointerdown="minimizePanel">Min</hawk-button>
        <hawk-button id="panel-dock-left" width="72" @pointerdown="dockLeft">Dock L</hawk-button>
        <hawk-button id="panel-dock-right" width="72" @pointerdown="dockRight">Dock R</hawk-button>
        <hawk-button id="panel-pin" width="72" @pointerdown="pinPanel">Pin</hawk-button>
        <hawk-button id="panel-unpin" width="72" @pointerdown="unpinPanel">Unpin</hawk-button>
        <hawk-button id="panel-restore" width="72" @pointerdown="restorePanel">Float</hawk-button>
        <hawk-button id="drawer-open-terminal" width="132" @pointerdown="openTerminal">Terminal</hawk-button>
      </hawk-view>

      <hawk-view id="dock-gutter-right" class="dock-gutter dock-gutter-right" width="34" height="574">
        <hawk-button id="dock-right-chat" class="dock-icon" width="30" height="30" @pointerdown="dockChatRight">
          C
        </hawk-button>
      </hawk-view>
    </hawk-view>

    <hawk-view id="bottom-drawer" class="bottom-drawer" width="1280" height="150">
      <hawk-view id="drawer-toolbar" class="drawer-toolbar" width="1280" height="34">
        <hawk-text id="drawer-tabs" width="392" height="28">Terminal | Logs | Debug | Problems</hawk-text>
        <hawk-button id="drawer-collapse" width="86" @pointerdown="collapseDrawer">Collapse</hawk-button>
        <hawk-button id="drawer-compact" width="78" @pointerdown="compactDrawer">Compact</hawk-button>
        <hawk-button id="drawer-expand" width="72" @pointerdown="expandDrawer">Expand</hawk-button>
      </hawk-view>
      <hawk-text id="drawer-active" class="mono" width="1280" height="28">Active: {{ drawerTab }}</hawk-text>
      <hawk-text id="drawer-mode" class="mono" width="1280" height="28">Mode: {{ drawerMode }}</hawk-text>
      <hawk-text id="drawer-body" class="mono" width="1280" height="44">{{ drawerBody }}</hawk-text>
    </hawk-view>

    <hawk-view id="status-bar" class="status-bar" width="1280" height="24">
      <hawk-text id="status-project" width="170">Project: hawk2ui-editor</hawk-text>
      <hawk-text id="status-manifest" width="120">Manifest: valid</hawk-text>
      <hawk-text id="status-lsp" width="130">LSP: ready</hawk-text>
      <hawk-text id="status-terminal" width="150">Terminal: ready</hawk-text>
      <hawk-text id="status-preview" width="140">Preview: {{ previewState }}</hawk-text>
      <hawk-text id="status-cpu" class="mono" width="70">CPU: --</hawk-text>
      <hawk-text id="status-mem" class="mono" width="70">MEM: --</hawk-text>
      <hawk-text id="status-gpu" class="mono" width="90">GPU: pending</hawk-text>
      <hawk-text id="status-current" width="300">Status: {{ status }}</hawk-text>
    </hawk-view>
  </hawk-view>
</template>
