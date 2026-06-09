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
}>();
</script>

<template>
  <hawk-view :id="`${idPrefix}-panel`" class="panel" :width="panel.width" :height="panel.height">
    <hawk-view :id="`${idPrefix}-header`">
      <hawk-text :id="`${idPrefix}-title`" class="panel-title">{{ title }}</hawk-text>
      <hawk-button :id="`${idPrefix}-left`" @pointer-press="emit('nudge', -24, 0)">Left</hawk-button>
      <hawk-button :id="`${idPrefix}-right`" @pointer-press="emit('nudge', 24, 0)">Right</hawk-button>
      <hawk-button :id="`${idPrefix}-up`" @pointer-press="emit('nudge', 0, -24)">Up</hawk-button>
      <hawk-button :id="`${idPrefix}-down`" @pointer-press="emit('nudge', 0, 24)">Down</hawk-button>
      <hawk-button :id="`${idPrefix}-close`" @pointer-press="emit('close')">Close</hawk-button>
    </hawk-view>
    <slot />
  </hawk-view>
</template>
