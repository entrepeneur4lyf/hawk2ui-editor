<script setup lang="ts">
import type { PanelState } from "../core/workspace";

defineProps<{
  idPrefix: string;
  title: string;
  panel: PanelState;
}>();

const emit = defineEmits<{
  close: [];
  nudge: [dx: number, dy: number];
  minimize: [];
  dockLeft: [];
  dockRight: [];
  restore: [];
  pin: [];
  unpin: [];
}>();

function panelClass(panel: PanelState): string {
  const classes = ["panel", `panel-${panel.mode}`];
  if (panel.dockEdge) classes.push(`panel-${panel.dockEdge}`);
  if (panel.pinned) classes.push("panel-pinned");
  return classes.join(" ");
}
</script>

<template>
  <hawk-view :id="`${idPrefix}-panel`" :class="panelClass(panel)" :width="panel.width" :height="panel.height">
    <hawk-view :id="`${idPrefix}-header`" class="panel-header">
      <hawk-text :id="`${idPrefix}-title`" class="panel-title">{{ title }}</hawk-text>
      <hawk-button v-if="panel.mode === 'floating'" :id="`${idPrefix}-left`" @pointer-press="emit('nudge', -24, 0)">
        Left
      </hawk-button>
      <hawk-button v-if="panel.mode === 'floating'" :id="`${idPrefix}-right`" @pointer-press="emit('nudge', 24, 0)">
        Right
      </hawk-button>
      <hawk-button v-if="panel.mode === 'floating'" :id="`${idPrefix}-up`" @pointer-press="emit('nudge', 0, -24)">
        Up
      </hawk-button>
      <hawk-button v-if="panel.mode === 'floating'" :id="`${idPrefix}-down`" @pointer-press="emit('nudge', 0, 24)">
        Down
      </hawk-button>
      <hawk-button v-if="panel.mode === 'floating'" :id="`${idPrefix}-dock-left`" @pointer-press="emit('dockLeft')">
        Dock L
      </hawk-button>
      <hawk-button v-if="panel.mode === 'floating'" :id="`${idPrefix}-dock-right`" @pointer-press="emit('dockRight')">
        Dock R
      </hawk-button>
      <hawk-button v-if="panel.mode === 'floating'" :id="`${idPrefix}-minimize`" @pointer-press="emit('minimize')">
        Min
      </hawk-button>
      <hawk-button v-if="panel.mode !== 'floating'" :id="`${idPrefix}-restore`" @pointer-press="emit('restore')">
        Float
      </hawk-button>
      <hawk-button v-if="panel.mode !== 'floating' && !panel.pinned" :id="`${idPrefix}-pin`" @pointer-press="emit('pin')">
        Pin
      </hawk-button>
      <hawk-button v-if="panel.mode !== 'floating' && panel.pinned" :id="`${idPrefix}-unpin`" @pointer-press="emit('unpin')">
        Unpin
      </hawk-button>
      <hawk-button :id="`${idPrefix}-close`" @pointer-press="emit('close')">Close</hawk-button>
    </hawk-view>
    <slot />
  </hawk-view>
</template>
