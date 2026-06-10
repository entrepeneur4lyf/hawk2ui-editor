<script setup lang="ts">
import { ref } from "vue";

const status = ref("Ready");
const drawerTab = ref("Logs");
const drawerMode = ref("compact");
const drawerHeight = ref(150);
const workspaceHeight = ref(324);
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
  status.value = "Drawer collapsed";
}

function compactDrawer() {
  drawerMode.value = "compact";
  drawerHeight.value = 150;
  status.value = "Drawer compact";
}

function expandDrawer() {
  drawerMode.value = "expanded";
  drawerHeight.value = 260;
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

function dockDocsLeft() {
  activePanel.value = "Docs";
  panelMode.value = "docked left";
  leftDockVisible.value = true;
  panelBodyPrimary.value = "Docs browser: specs and plans open as editor tabs.";
  panelBodySecondary.value = "Use docs tabs for workbench UX, editor, and AI chat specifications.";
  status.value = "Docs docked left";
}

function dockChatRight() {
  activePanel.value = "Chat";
  panelMode.value = "docked right";
  rightDockVisible.value = true;
  panelBodyPrimary.value = "Checkpoint chat: current implementation slice is active.";
  panelBodySecondary.value = "Assistant tools can create checkpoints and mark work complete later.";
  status.value = "Chat docked right";
}

function dockEditorSettingsRight() {
  activePanel.value = "Editor Settings";
  panelMode.value = "docked right";
  rightDockVisible.value = true;
  panelBodyPrimary.value = "Editor settings: black theme, monospace code, sidecar auto-start.";
  panelBodySecondary.value = "Future controls: font size, wrapping, tab width, and diagnostics.";
  status.value = "Editor settings docked right";
}

function dockChatSettingsRight() {
  activePanel.value = "Chat Settings";
  panelMode.value = "docked right";
  rightDockVisible.value = true;
  panelBodyPrimary.value = "Chat settings: provider profiles stay behind the bridge.";
  panelBodySecondary.value = "Profiles can switch Codex, Claude Code, NIM, or local-compatible endpoints.";
  status.value = "Chat settings docked right";
}

function openTerminal() {
  drawerTab.value = "Terminal";
  drawerBody.value = "Terminal bridge ready. Webview terminal opens through the bridge sidecar.";
  status.value = "Terminal bridge ready";
}
</script>

<template>
  <hawk-view id="editor-root" class="theme-black" width="960" height="540">
    <hawk-view id="topbar" class="topbar" :x="0" :y="0" width="960" height="42">
      <hawk-text id="app-title" :x="6" :y="8" width="164" height="28">Hawk2UI Editor</hawk-text>
      <hawk-view id="command-project-group" class="command-group" :x="174" :y="0" width="162" height="42">
        <hawk-button id="command-open-project" :x="0" :y="5" width="56" height="32" @pointerdown="openProject">Open</hawk-button>
        <hawk-button id="command-new-file" :x="56" :y="5" width="50" height="32" @pointerdown="newFile">New</hawk-button>
        <hawk-button id="command-save" :x="106" :y="5" width="56" height="32" @pointerdown="saveFile">Save</hawk-button>
      </hawk-view>
      <hawk-view id="command-run-group" class="command-group" :x="338" :y="0" width="234" height="42">
        <hawk-button id="command-validate" :x="0" :y="5" width="78" height="32" @pointerdown="validateProject">Validate</hawk-button>
        <hawk-button id="command-build" :x="78" :y="5" width="58" height="32" @pointerdown="buildProject">Build</hawk-button>
        <hawk-button id="command-run" :x="136" :y="5" width="48" height="32" @pointerdown="runPreview">Run</hawk-button>
        <hawk-button id="command-stop" :x="184" :y="5" width="50" height="32" @pointerdown="stopPreview">Stop</hawk-button>
      </hawk-view>
      <hawk-view id="panel-launchers" class="command-group" :x="574" :y="0" width="290" height="42">
        <hawk-button id="toggle-project" :x="0" :y="5" width="60" height="32" @pointerdown="showProject">Project</hawk-button>
        <hawk-button id="toggle-chat" :x="60" :y="5" width="44" height="32" @pointerdown="showChat">Chat</hawk-button>
        <hawk-button id="toggle-docs" :x="104" :y="5" width="44" height="32" @pointerdown="showDocs">Docs</hawk-button>
        <hawk-button id="toggle-editor-settings" :x="148" :y="5" width="54" height="32" @pointerdown="showEditorSettings">Editor</hawk-button>
        <hawk-button id="toggle-chat-settings" :x="202" :y="5" width="88" height="32" @pointerdown="showChatSettings">Chat Cfg</hawk-button>
      </hawk-view>
      <hawk-view id="command-overflow-group" class="command-group" :x="866" :y="0" width="72" height="42">
        <hawk-button id="command-palette" :x="0" :y="5" width="72" height="32" @pointerdown="openPalette">Palette</hawk-button>
      </hawk-view>
    </hawk-view>

    <hawk-view id="workspace" class="workspace" :x="0" :y="42" width="960" :height="workspaceHeight">
      <hawk-view
        v-show="leftDockVisible"
        id="dock-gutter-left"
        class="dock-gutter dock-gutter-left"
        :x="0"
        :y="0"
        width="34"
        :height="workspaceHeight"
      >
        <hawk-button id="dock-left-project" class="dock-icon" :x="2" :y="8" width="30" height="30" @pointerdown="dockProjectLeft">
          P
        </hawk-button>
        <hawk-button id="dock-left-docs" class="dock-icon" :x="2" :y="44" width="30" height="30" @pointerdown="dockDocsLeft">
          D
        </hawk-button>
      </hawk-view>

      <hawk-view id="editor-workspace" class="editor-workspace" :x="0" :y="0" width="960" :height="workspaceHeight">
        <hawk-view id="editor-tabs" class="editor-tabs" :x="0" :y="0" width="960" height="34">
          <hawk-button id="editor-tab-app" :x="0" :y="2" width="86" height="30" @pointerdown="selectAppTab">App.vue</hawk-button>
          <hawk-button id="editor-tab-readme" :x="86" :y="2" width="102" height="30" @pointerdown="selectReadmeTab">README.md</hawk-button>
          <hawk-button id="editor-tab-manifest" :x="188" :y="2" width="96" height="30" @pointerdown="selectManifestTab">hawk.json</hawk-button>
        </hawk-view>
        <hawk-text id="editor-path" class="muted" :x="44" :y="42" width="870" height="28">{{ editorPath }} / {{ editorLanguage }}</hawk-text>
        <hawk-text id="editor-line-1" class="code-line" :x="44" :y="80" width="870" height="28">{{ editorLine1 }}</hawk-text>
        <hawk-text id="editor-line-2" class="code-line" :x="44" :y="108" width="870" height="28">{{ editorLine2 }}</hawk-text>
        <hawk-text id="editor-line-3" class="code-line" :x="44" :y="136" width="870" height="28">{{ editorLine3 }}</hawk-text>
        <hawk-view id="editor-actions" class="editor-actions" :x="44" :y="176" width="320" height="34">
          <hawk-button id="editor-open-sidecar" :x="0" :y="0" width="132" height="32" @pointerdown="openEditorSidecar">Open Sidecar</hawk-button>
          <hawk-text id="editor-sidecar-state" class="muted" :x="146" :y="6" width="180" height="24">Sidecar: {{ sidecarState }}</hawk-text>
        </hawk-view>
        <hawk-text id="editor-notice" class="muted" :x="44" :y="220" width="520" height="32">{{ editorNotice }}</hawk-text>
      </hawk-view>

      <hawk-view
        v-show="rightDockVisible"
        id="dock-gutter-right"
        class="dock-gutter dock-gutter-right"
        :x="926"
        :y="0"
        width="34"
        :height="workspaceHeight"
      >
        <hawk-button id="dock-right-chat" class="dock-icon" :x="2" :y="8" width="30" height="30" @pointerdown="dockChatRight">
          C
        </hawk-button>
        <hawk-button
          id="dock-right-editor-settings"
          class="dock-icon"
          :x="2"
          :y="44"
          width="30"
          height="30"
          @pointerdown="dockEditorSettingsRight"
        >
          E
        </hawk-button>
        <hawk-button
          id="dock-right-chat-settings"
          class="dock-icon"
          :x="2"
          :y="80"
          width="30"
          height="30"
          @pointerdown="dockChatSettingsRight"
        >
          S
        </hawk-button>
      </hawk-view>

      <hawk-view id="panel-overlay-layer" class="panel-overlay-layer" :x="0" :y="0" width="960" :height="workspaceHeight">
        <hawk-view id="active-panel" class="panel floating-panel-overlay" :x="590" :y="18" width="340" height="286">
          <hawk-text id="active-panel-title" class="panel-title" :x="14" :y="10" width="220" height="30">{{ activePanel }}</hawk-text>
          <hawk-text id="active-panel-mode" class="muted" :x="14" :y="42" width="220" height="26">Mode: {{ panelMode }}</hawk-text>
          <hawk-button id="panel-minimize" :x="14" :y="76" width="58" height="30" @pointerdown="minimizePanel">Min</hawk-button>
          <hawk-button id="panel-dock-left" :x="78" :y="76" width="66" height="30" @pointerdown="dockLeft">Dock L</hawk-button>
          <hawk-button id="panel-dock-right" :x="150" :y="76" width="68" height="30" @pointerdown="dockRight">Dock R</hawk-button>
          <hawk-button id="panel-pin" :x="224" :y="76" width="46" height="30" @pointerdown="pinPanel">Pin</hawk-button>
          <hawk-button id="panel-unpin" :x="276" :y="76" width="58" height="30" @pointerdown="unpinPanel">Unpin</hawk-button>
          <hawk-button id="panel-restore" :x="14" :y="112" width="58" height="30" @pointerdown="restorePanel">Float</hawk-button>
          <hawk-button id="drawer-open-terminal" :x="78" :y="112" width="96" height="30" @pointerdown="openTerminal">Terminal</hawk-button>
          <hawk-text id="active-panel-primary" class="mono" :x="14" :y="154" width="312" height="42">{{ panelBodyPrimary }}</hawk-text>
          <hawk-text id="active-panel-secondary" class="muted" :x="14" :y="198" width="312" height="42">{{ panelBodySecondary }}</hawk-text>
          <hawk-button id="panel-open-app" :x="14" :y="246" width="72" height="30" @pointerdown="selectAppTab">App.vue</hawk-button>
          <hawk-button id="panel-open-readme" :x="92" :y="246" width="92" height="30" @pointerdown="selectReadmeTab">README.md</hawk-button>
          <hawk-button id="panel-open-manifest" :x="190" :y="246" width="92" height="30" @pointerdown="selectManifestTab">hawk.json</hawk-button>
        </hawk-view>
      </hawk-view>
    </hawk-view>

    <hawk-view id="bottom-drawer" class="bottom-drawer" :x="0" :y="366" width="960" :height="drawerHeight">
      <hawk-view id="drawer-toolbar" class="drawer-toolbar" :x="0" :y="0" width="960" height="34">
        <hawk-view id="drawer-tabs" class="drawer-tabs" :x="4" :y="0" width="392" height="34">
          <hawk-button id="drawer-tab-terminal" :x="0" :y="2" width="98" height="30" @pointerdown="selectTerminalTab">Terminal</hawk-button>
          <hawk-button id="drawer-tab-logs" :x="98" :y="2" width="78" height="30" @pointerdown="selectLogsTab">Logs</hawk-button>
          <hawk-button id="drawer-tab-debug" :x="176" :y="2" width="80" height="30" @pointerdown="selectDebugTab">Debug</hawk-button>
          <hawk-button id="drawer-tab-problems" :x="256" :y="2" width="104" height="30" @pointerdown="selectProblemsTab">Problems</hawk-button>
        </hawk-view>
        <hawk-button id="drawer-collapse" :x="410" :y="2" width="86" height="30" @pointerdown="collapseDrawer">Collapse</hawk-button>
        <hawk-button id="drawer-compact" :x="500" :y="2" width="78" height="30" @pointerdown="compactDrawer">Compact</hawk-button>
        <hawk-button id="drawer-expand" :x="582" :y="2" width="72" height="30" @pointerdown="expandDrawer">Expand</hawk-button>
      </hawk-view>
      <hawk-text id="drawer-active" class="mono" :x="10" :y="42" width="260" height="28">Active: {{ drawerTab }}</hawk-text>
      <hawk-text id="drawer-mode" class="mono" :x="10" :y="70" width="260" height="28">Mode: {{ drawerMode }}</hawk-text>
      <hawk-text id="drawer-body" class="mono" :x="10" :y="102" width="760" height="44">{{ drawerBody }}</hawk-text>
    </hawk-view>

    <hawk-view id="status-bar" class="status-bar" :x="0" :y="516" width="960" height="24">
      <hawk-text id="status-project" :x="4" :y="3" width="126" height="18">Project: hawk2ui-editor</hawk-text>
      <hawk-text id="status-manifest" :x="132" :y="3" width="96" height="18">Manifest: valid</hawk-text>
      <hawk-text id="status-bridge" :x="230" :y="3" width="96" height="18">Bridge: ready</hawk-text>
      <hawk-text id="status-lsp" :x="328" :y="3" width="82" height="18">LSP: ready</hawk-text>
      <hawk-text id="status-terminal" :x="412" :y="3" width="100" height="18">Terminal: ready</hawk-text>
      <hawk-text id="status-preview" :x="514" :y="3" width="104" height="18">Preview: {{ previewState }}</hawk-text>
      <hawk-text id="status-cpu" class="mono" :x="620" :y="3" width="54" height="18">CPU: --</hawk-text>
      <hawk-text id="status-mem" class="mono" :x="676" :y="3" width="54" height="18">MEM: --</hawk-text>
      <hawk-text id="status-gpu" class="mono" :x="732" :y="3" width="76" height="18">GPU: pending</hawk-text>
      <hawk-text id="status-current" :x="810" :y="3" width="146" height="18">Status: {{ status }}</hawk-text>
    </hawk-view>
  </hawk-view>
</template>
