<script setup lang="ts">
import type { StatusItem } from "../core/workbench";

defineProps<{
  items: StatusItem[];
  activePath: string;
  providerLabel: string;
}>();

function toneClass(item: StatusItem): string {
  const numeric = /[0-9:-]/.test(item.value) ? " status-mono" : "";
  return `status-item status-${item.tone}${numeric}`;
}
</script>

<template>
  <hawk-view id="status-bar" class="status-bar">
    <hawk-text
      v-for="item in items"
      :id="`status-${item.id}`"
      :key="item.id"
      :class="toneClass(item)"
    >
      {{ item.label }}: {{ item.value }}
    </hawk-text>
    <hawk-text id="status-active-path" class="mono">{{ activePath }}</hawk-text>
    <hawk-text id="status-provider" class="muted">{{ providerLabel }}</hawk-text>
  </hawk-view>
</template>
