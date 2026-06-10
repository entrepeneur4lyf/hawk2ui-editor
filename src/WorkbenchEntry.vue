<script setup lang="ts">
import { ref } from "vue";

const status = ref("Ready");
const drawerTab = ref("Logs");
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
      <hawk-button id="command-open-project" width="56" @pointerdown="openProject">Open</hawk-button>
      <hawk-button id="command-new-file" width="50" @pointerdown="newFile">New</hawk-button>
      <hawk-button id="command-save" width="56" @pointerdown="saveFile">Save</hawk-button>
      <hawk-button id="command-validate" width="78" @pointerdown="validateProject">Validate</hawk-button>
      <hawk-button id="command-build" width="58" @pointerdown="buildProject">Build</hawk-button>
      <hawk-button id="command-run" width="48" @pointerdown="runPreview">Run</hawk-button>
      <hawk-button id="command-stop" width="50" @pointerdown="stopPreview">Stop</hawk-button>
      <hawk-button id="command-palette" width="72" @pointerdown="openPalette">Palette</hawk-button>
      <hawk-button id="toggle-project" width="60" @pointerdown="showProject">Project</hawk-button>
      <hawk-button id="toggle-chat" width="44" @pointerdown="showChat">Chat</hawk-button>
      <hawk-button id="toggle-docs" width="44" @pointerdown="showDocs">Docs</hawk-button>
      <hawk-button id="toggle-editor-settings" width="54" @pointerdown="showEditorSettings">Editor</hawk-button>
      <hawk-button id="toggle-chat-settings" width="88" @pointerdown="showChatSettings">Chat Cfg</hawk-button>
    </hawk-view>

    <hawk-view id="workspace" class="workspace" width="1280" height="574">
      <hawk-view id="editor-workspace" class="editor-workspace" width="860" height="574">
        <hawk-text id="editor-tabs" class="mono" width="860" height="34">App.vue    README.md    hawk.json</hawk-text>
        <hawk-text id="editor-path" class="muted" width="860" height="28">src/App.vue / interactive Hawk entry</hawk-text>
        <hawk-text id="editor-line-1" class="code-line" width="860" height="28">1  &lt;script setup lang="ts"&gt;</hawk-text>
        <hawk-text id="editor-line-2" class="code-line" width="860" height="28">2  const workbench = "interactive";</hawk-text>
        <hawk-text id="editor-line-3" class="code-line" width="860" height="28">3  &lt;/script&gt;</hawk-text>
        <hawk-text id="editor-notice" class="muted" width="860" height="32">{{ editorNotice }}</hawk-text>
      </hawk-view>

      <hawk-view id="active-panel" class="panel" width="360" height="360">
        <hawk-text id="active-panel-title" class="panel-title" width="360" height="30">{{ activePanel }}</hawk-text>
        <hawk-text id="active-panel-mode" class="muted" width="360" height="28">Mode: {{ panelMode }}</hawk-text>
        <hawk-button id="panel-minimize" width="72" @pointerdown="minimizePanel">Min</hawk-button>
        <hawk-button id="panel-dock-left" width="72" @pointerdown="dockLeft">Dock L</hawk-button>
        <hawk-button id="panel-dock-right" width="72" @pointerdown="dockRight">Dock R</hawk-button>
        <hawk-button id="panel-pin" width="72" @pointerdown="pinPanel">Pin</hawk-button>
        <hawk-button id="drawer-open-terminal" width="132" @pointerdown="openTerminal">Terminal</hawk-button>
      </hawk-view>
    </hawk-view>

    <hawk-view id="bottom-drawer" class="bottom-drawer" width="1280" height="150">
      <hawk-text id="drawer-tabs" width="1280" height="28">Terminal | Logs | Debug | Problems</hawk-text>
      <hawk-text id="drawer-active" class="mono" width="1280" height="28">Active: {{ drawerTab }}</hawk-text>
      <hawk-text id="drawer-body" class="mono" width="1280" height="44">{{ drawerBody }}</hawk-text>
    </hawk-view>

    <hawk-view id="status-bar" class="status-bar" width="1280" height="24">
      <hawk-text id="status-project" width="210">Project: hawk2ui-editor</hawk-text>
      <hawk-text id="status-manifest" width="150">Manifest: valid</hawk-text>
      <hawk-text id="status-lsp" width="170">LSP: bridge ready</hawk-text>
      <hawk-text id="status-terminal" width="190">Terminal: bridge ready</hawk-text>
      <hawk-text id="status-preview" width="160">Preview: {{ previewState }}</hawk-text>
      <hawk-text id="status-current" width="300">Status: {{ status }}</hawk-text>
    </hawk-view>
  </hawk-view>
</template>
