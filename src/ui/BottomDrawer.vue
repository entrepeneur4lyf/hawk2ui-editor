<script setup lang="ts">
import { drawerHeightForMode, type DrawerMode, type DrawerTab } from "../core/workbench";
import type { PreviewStatus } from "../preview/previewClient";
import { previewStatusLabel } from "../preview/previewClient";

export interface ProblemEntry {
  path: string;
  line: number;
  column: number;
  severity: string;
  message: string;
  source?: string;
}

defineProps<{
  mode: DrawerMode;
  activeTab: DrawerTab;
  preview: PreviewStatus;
  problems: ProblemEntry[];
  terminalLabel: string;
  width: number;
}>();

const emit = defineEmits<{
  selectTab: [tab: DrawerTab];
  setMode: [mode: DrawerMode];
  startPreview: [];
  stopPreview: [];
  openTerminal: [];
  closeTerminal: [];
}>();

const tabs: DrawerTab[] = ["terminal", "logs", "debug", "problems"];

function drawerClass(mode: DrawerMode): string {
  return `bottom-drawer drawer-mode-${mode}`;
}

function drawerHeight(mode: DrawerMode): number {
  return drawerHeightForMode(mode);
}

function tabClass(tab: DrawerTab, activeTab: DrawerTab): string {
  return tab === activeTab ? "drawer-tab drawer-tab-active" : "drawer-tab";
}
</script>

<template>
  <hawk-view id="bottom-drawer" :class="drawerClass(mode)" :width="width" :height="drawerHeight(mode)">
    <hawk-view id="drawer-toolbar" class="drawer-toolbar" :width="width" :height="34">
      <hawk-button
        v-for="tab in tabs"
        :id="`drawer-tab-${tab}`"
        :key="tab"
        :class="tabClass(tab, activeTab)"
        :width="92"
        @pointer-press="emit('selectTab', tab)"
      >
        {{ tab }}
      </hawk-button>
      <hawk-button id="drawer-collapse" :width="86" @pointer-press="emit('setMode', 'collapsed')">Collapse</hawk-button>
      <hawk-button id="drawer-compact" :width="78" @pointer-press="emit('setMode', 'compact')">Compact</hawk-button>
      <hawk-button id="drawer-expand" :width="72" @pointer-press="emit('setMode', 'expanded')">Expand</hawk-button>
    </hawk-view>

    <hawk-view
      v-if="mode !== 'collapsed'"
      id="drawer-body"
      class="drawer-body"
      :width="width"
      :height="drawerHeight(mode) - 34"
    >
      <hawk-view v-if="activeTab === 'terminal'" id="drawer-terminal">
        <hawk-text id="drawer-terminal-status" class="mono">{{ terminalLabel }}</hawk-text>
        <hawk-button id="drawer-open-terminal" :width="112" @pointer-press="emit('openTerminal')">Open Terminal</hawk-button>
        <hawk-button id="drawer-close-terminal" :width="116" @pointer-press="emit('closeTerminal')">Close Terminal</hawk-button>
      </hawk-view>
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
        <hawk-button id="drawer-run-preview" :width="64" @pointer-press="emit('startPreview')">Run</hawk-button>
        <hawk-button id="drawer-stop-preview" :width="64" @pointer-press="emit('stopPreview')">Stop</hawk-button>
      </hawk-view>
      <hawk-view v-if="activeTab === 'problems'" id="drawer-problems">
        <hawk-text v-if="problems.length === 0" id="drawer-problems-empty" class="mono">
          No validation problems.
        </hawk-text>
        <template v-else>
          <hawk-text
            v-for="(problem, index) in problems"
            :id="`drawer-problem-${index}`"
            :key="`${problem.path}-${problem.line}-${problem.column}-${problem.message}`"
            class="mono"
          >
            {{ problem.path }}:{{ problem.line }}:{{ problem.column }} {{ problem.severity }}
            {{ problem.source ? `[${problem.source}]` : "" }} {{ problem.message }}
          </hawk-text>
        </template>
      </hawk-view>
    </hawk-view>
  </hawk-view>
</template>
