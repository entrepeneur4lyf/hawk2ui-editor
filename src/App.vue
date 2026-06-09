<script setup lang="ts">
import { computed, ref } from "vue";
import AssistantPanel from "./ui/AssistantPanel.vue";
import DocsPanel from "./ui/DocsPanel.vue";
import HawkFloatingPanel from "./ui/HawkFloatingPanel.vue";
import PreviewPanel from "./ui/PreviewPanel.vue";
import ProjectPanel from "./ui/ProjectPanel.vue";
import { activeProfile, defaultWorkspaceDocument, type PanelState } from "./core/workspace";
import { summarizeHawkManifest } from "./core/project";
import type { PreviewStatus } from "./preview/previewClient";

const workspace = ref(defaultWorkspaceDocument("/home/shawn/workspace/hawk2ui-editor"));
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

function closePanel(name: string) {
  workspace.value.panels[name].open = false;
}

function nudgePanel(name: string, dx: number, dy: number) {
  const panel = workspace.value.panels[name];
  workspace.value.panels[name] = { ...panel, x: panel.x + dx, y: panel.y + dy };
}

function panel(name: string): PanelState {
  return workspace.value.panels[name];
}
</script>

<template>
  <hawk-view id="editor-root" class="editor-root">
    <hawk-view id="topbar" class="topbar">
      <hawk-text id="app-title">Hawk2UI Editor</hawk-text>
      <hawk-text id="app-subtitle" class="muted">Single-project workbench</hawk-text>
    </hawk-view>

    <hawk-view id="workspace" class="workspace">
      <ProjectPanel :project="project" />
    </hawk-view>

    <HawkFloatingPanel
      v-if="panel('assistant').open"
      id-prefix="assistant"
      title="Assistant"
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
      v-if="panel('preview').open"
      id-prefix="preview"
      title="Preview"
      :panel="panel('preview')"
      @close="closePanel('preview')"
      @nudge="(dx, dy) => nudgePanel('preview', dx, dy)"
    >
      <PreviewPanel
        :status="preview"
        @start="preview.state = 'starting'"
        @stop="preview.state = 'stopped'"
      />
    </HawkFloatingPanel>
  </hawk-view>
</template>
