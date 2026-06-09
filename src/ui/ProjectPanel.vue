<script setup lang="ts">
import { computed } from "vue";
import type { HawkProjectSummary } from "../core/project";
import type { ProjectTreeEntry } from "../bridge/files";

const props = defineProps<{
  project: HawkProjectSummary;
  tree: ProjectTreeEntry[];
}>();

const emit = defineEmits<{
  openFile: [path: string];
  openSidecar: [path: string];
}>();

interface VisibleTreeEntry {
  path: string;
  label: string;
  type: ProjectTreeEntry["type"];
}

const visibleEntries = computed(() => flattenTree(props.tree));

function flattenTree(entries: ProjectTreeEntry[], depth = 0): VisibleTreeEntry[] {
  return entries.flatMap((entry) => {
    const label = `${"  ".repeat(depth)}${entry.type === "directory" ? "> " : ""}${entry.name}`;
    const visible = [{ path: entry.path, label, type: entry.type }];
    return entry.children ? [...visible, ...flattenTree(entry.children, depth + 1)] : visible;
  });
}

function entryId(path: string): string {
  return `project-entry-${path.replace(/[^A-Za-z0-9_-]/g, "-")}`;
}

function openEntry(entry: VisibleTreeEntry) {
  if (entry.type === "file") emit("openFile", entry.path);
}
</script>

<template>
  <hawk-view id="project-panel-body">
    <hawk-text id="project-name">{{ project.name }}</hawk-text>
    <hawk-text id="project-id" class="muted">{{ project.packageId }}</hawk-text>
    <hawk-text id="project-framework">Framework: {{ project.framework }}</hawk-text>
    <hawk-text id="project-targets">Targets: {{ project.targets.join(", ") }}</hawk-text>
    <hawk-view id="project-tree">
      <hawk-button
        v-for="entry in visibleEntries"
        :id="entryId(entry.path)"
        :key="entry.path"
        @pointer-press="openEntry(entry)"
      >
        {{ entry.label }}
      </hawk-button>
    </hawk-view>
    <hawk-button id="open-app-vue-sidecar" @pointer-press="emit('openSidecar', 'src/App.vue')">
      Open src/App.vue in sidecar editor
    </hawk-button>
  </hawk-view>
</template>
