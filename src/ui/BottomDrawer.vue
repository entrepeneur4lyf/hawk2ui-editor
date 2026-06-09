<script setup lang="ts">
import type { DrawerMode, DrawerTab } from "../core/workbench";
import type { PreviewStatus } from "../preview/previewClient";
import { previewStatusLabel } from "../preview/previewClient";

defineProps<{
  mode: DrawerMode;
  activeTab: DrawerTab;
  preview: PreviewStatus;
}>();

const emit = defineEmits<{
  selectTab: [tab: DrawerTab];
  setMode: [mode: DrawerMode];
  startPreview: [];
  stopPreview: [];
}>();

const tabs: DrawerTab[] = ["terminal", "logs", "debug", "problems"];
</script>

<template>
  <hawk-view id="bottom-drawer" class="bottom-drawer">
    <hawk-view id="drawer-toolbar" class="drawer-toolbar">
      <hawk-button
        v-for="tab in tabs"
        :id="`drawer-tab-${tab}`"
        :key="tab"
        class="drawer-tab"
        @pointer-press="emit('selectTab', tab)"
      >
        {{ tab }}
      </hawk-button>
      <hawk-button id="drawer-collapse" @pointer-press="emit('setMode', 'collapsed')">Collapse</hawk-button>
      <hawk-button id="drawer-compact" @pointer-press="emit('setMode', 'compact')">Compact</hawk-button>
      <hawk-button id="drawer-expand" @pointer-press="emit('setMode', 'expanded')">Expand</hawk-button>
    </hawk-view>

    <hawk-view v-if="mode !== 'collapsed'" id="drawer-body" class="drawer-body">
      <hawk-text v-if="activeTab === 'terminal'" id="drawer-terminal" class="mono">
        $ hawk2ui-cli dev
      </hawk-text>
      <hawk-view v-if="activeTab === 'logs'" id="drawer-log-list">
        <hawk-text id="drawer-logs" class="mono">{{ previewStatusLabel(preview) }}</hawk-text>
        <hawk-text
          v-for="(line, index) in preview.output"
          :id="`drawer-log-${index}`"
          :key="`${index}-${line}`"
          class="mono"
        >
          {{ line }}
        </hawk-text>
      </hawk-view>
      <hawk-view v-if="activeTab === 'debug'" id="drawer-debug">
        <hawk-text id="drawer-debug-preview" class="mono">{{ preview.command }}</hawk-text>
        <hawk-button id="drawer-run-preview" @pointer-press="emit('startPreview')">Run</hawk-button>
        <hawk-button id="drawer-stop-preview" @pointer-press="emit('stopPreview')">Stop</hawk-button>
      </hawk-view>
      <hawk-text v-if="activeTab === 'problems'" id="drawer-problems" class="mono">
        No validation problems.
      </hawk-text>
    </hawk-view>
  </hawk-view>
</template>
