<script setup lang="ts">
import { computed } from "vue";
import type { EditorDocument } from "../core/documents";

const props = defineProps<{
  tabs: EditorDocument[];
  activeTabId: string;
  sidecarAvailable: boolean;
  width: number;
  height: number;
}>();

const emit = defineEmits<{
  select: [id: string];
  save: [id: string];
  openSidecar: [path: string];
}>();

const activeTab = computed(() => {
  return props.tabs.find((tab) => tab.id === props.activeTabId) ?? props.tabs[0];
});

const contentLines = computed(() => {
  return (activeTab.value?.content ?? "").split("\n").slice(0, 18);
});

const tabBarHeight = 34;
const actionBarHeight = 36;
const metaHeight = 28;
const surfaceHeight = computed(() => Math.max(120, props.height - tabBarHeight));
const bufferHeight = computed(() => Math.max(80, surfaceHeight.value - metaHeight - actionBarHeight));

function tabState(tab: EditorDocument): string {
  const flags = [tab.language];
  if (tab.readOnly) flags.push("read-only");
  if (tab.dirty) flags.push("dirty");
  return flags.join(" / ");
}

function tabDomId(tab: EditorDocument): string {
  return `editor-tab-${tab.id.replace(/[^A-Za-z0-9_-]/g, "-")}`;
}
</script>

<template>
  <hawk-view id="editor-workspace" class="editor-workspace" :width="width" :height="height">
    <hawk-view id="editor-tabs" class="editor-tabs" :width="width" :height="tabBarHeight">
      <hawk-button
        v-for="tab in tabs"
        :id="tabDomId(tab)"
        :key="tab.id"
        class="editor-tab"
        @pointer-press="emit('select', tab.id)"
      >
        {{ tab.dirty ? "* " : "" }}{{ tab.title }}
      </hawk-button>
    </hawk-view>

    <hawk-view v-if="activeTab" id="editor-surface" class="editor-surface" :width="width" :height="surfaceHeight">
      <hawk-view id="editor-meta" class="editor-meta" :width="width" :height="metaHeight">
        <hawk-text id="editor-path">{{ activeTab.path }}</hawk-text>
        <hawk-text id="editor-language" class="muted">{{ tabState(activeTab) }}</hawk-text>
      </hawk-view>

      <hawk-view id="editor-buffer" class="editor-buffer" :width="width" :height="bufferHeight">
        <hawk-text
          v-for="(line, index) in contentLines"
          :id="`editor-line-${index + 1}`"
          :key="`${activeTab.id}-${index}`"
          class="code-line"
        >
          {{ index + 1 }}  {{ line }}
        </hawk-text>
      </hawk-view>

      <hawk-view id="editor-actions" class="editor-actions" :width="width" :height="actionBarHeight">
        <hawk-button id="editor-save-active" @pointer-press="emit('save', activeTab.id)">Save</hawk-button>
        <hawk-button id="editor-open-sidecar" @pointer-press="emit('openSidecar', activeTab.path)">
          Open Sidecar
        </hawk-button>
        <hawk-text id="editor-sidecar-state" class="muted">
          {{ sidecarAvailable ? "sidecar enabled" : "sidecar disabled" }}
        </hawk-text>
      </hawk-view>
    </hawk-view>
  </hawk-view>
</template>
