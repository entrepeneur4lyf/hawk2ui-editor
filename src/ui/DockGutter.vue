<script setup lang="ts">
import type { DockEdge, PanelMode, WorkbenchPanelName } from "../core/workbench";

export interface DockPanelItem {
  id: WorkbenchPanelName;
  label: string;
  mode: PanelMode;
  open: boolean;
  pinned: boolean;
}

defineProps<{
  edge: DockEdge;
  panels: DockPanelItem[];
  activePanelId: WorkbenchPanelName | null;
  peekedPanelId: WorkbenchPanelName | null;
  width: number;
  height: number;
}>();

const emit = defineEmits<{
  openPanel: [name: WorkbenchPanelName];
  peekPanel: [name: WorkbenchPanelName];
  closePeek: [name: WorkbenchPanelName];
  pinPanel: [name: WorkbenchPanelName];
  unpinPanel: [name: WorkbenchPanelName];
  undockPanel: [name: WorkbenchPanelName];
}>();

function iconLabel(label: string): string {
  if (label === "Project") return "P";
  if (label === "Docs") return "D";
  if (label === "Chat") return "C";
  if (label === "Editor Settings") return "E";
  if (label === "Chat Settings") return "S";
  return label.slice(0, 1).toUpperCase();
}

function iconClass(item: DockPanelItem, activePanelId: WorkbenchPanelName | null, peekedPanelId: WorkbenchPanelName | null): string {
  const classes = ["dock-icon", `dock-icon-${item.mode}`];
  if (item.id === activePanelId) classes.push("dock-icon-active");
  if (item.id === peekedPanelId) classes.push("dock-icon-peeked");
  if (item.pinned) classes.push("dock-icon-pinned");
  return classes.join(" ");
}
</script>

<template>
  <hawk-view :id="`dock-gutter-${edge}`" :class="`dock-gutter dock-gutter-${edge}`" :width="width" :height="height">
    <hawk-button
      v-for="item in panels"
      :id="`dock-${edge}-${item.id}`"
      :key="item.id"
      :class="iconClass(item, activePanelId, peekedPanelId)"
      :tooltip="item.label"
      :width="30"
      :height="30"
      @pointerdown="emit('openPanel', item.id)"
      @pointerenter="emit('peekPanel', item.id)"
      @pointerleave="emit('closePeek', item.id)"
    >
      {{ iconLabel(item.label) }}
    </hawk-button>

    <hawk-view
      v-for="item in panels"
      :id="`dock-${edge}-${item.id}-actions`"
      :key="`${item.id}-actions`"
      class="dock-actions"
    >
      <hawk-button
        v-if="item.open && item.pinned"
        :id="`dock-${edge}-${item.id}-unpin`"
        :width="30"
        :height="24"
        @pointerdown="emit('unpinPanel', item.id)"
      >
        U
      </hawk-button>
      <hawk-button
        v-if="item.open && !item.pinned"
        :id="`dock-${edge}-${item.id}-pin`"
        :width="30"
        :height="24"
        @pointerdown="emit('pinPanel', item.id)"
      >
        P
      </hawk-button>
      <hawk-button
        v-if="item.open"
        :id="`dock-${edge}-${item.id}-restore`"
        :width="30"
        :height="24"
        @pointerdown="emit('undockPanel', item.id)"
      >
        F
      </hawk-button>
    </hawk-view>
  </hawk-view>
</template>
