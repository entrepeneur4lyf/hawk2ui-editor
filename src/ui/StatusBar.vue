<script setup lang="ts">
import { computed } from "vue";
import { statusBarVisibility, type StatusItem } from "../core/workbench";

const props = defineProps<{
  items: StatusItem[];
  activePath: string;
  providerLabel: string;
  width: number;
  height: number;
}>();

const visibility = computed(() => statusBarVisibility(props.items, props.width));
const statusItemWidth = computed(() => {
  const reservedWidth = (visibility.value.showActivePath ? 180 : 0) + (visibility.value.showProviderLabel ? 120 : 0);
  const availableWidth = Math.max(320, props.width - reservedWidth);
  return Math.max(72, Math.floor(availableWidth / Math.max(1, visibility.value.items.length)));
});

function toneClass(item: StatusItem): string {
  const numeric = /[0-9:-]/.test(item.value) ? " status-mono" : "";
  return `status-item status-${item.tone}${numeric}`;
}
</script>

<template>
  <hawk-view id="status-bar" class="status-bar" :width="width" :height="height">
    <hawk-text
      v-for="item in visibility.items"
      :id="`status-${item.id}`"
      :key="item.id"
      :class="toneClass(item)"
      :width="statusItemWidth"
    >
      {{ item.label }}: {{ item.value }}
    </hawk-text>
    <hawk-text v-if="visibility.showActivePath" id="status-active-path" class="mono" :width="180">
      {{ activePath }}
    </hawk-text>
    <hawk-text v-if="visibility.showProviderLabel" id="status-provider" class="muted" :width="120">
      {{ providerLabel }}
    </hawk-text>
  </hawk-view>
</template>
