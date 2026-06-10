<script setup lang="ts">
import type { PreviewStatus } from "../preview/previewClient";
import { previewStatusLabel } from "../preview/previewClient";

defineProps<{
  status: PreviewStatus;
}>();

const emit = defineEmits<{
  start: [];
  stop: [];
}>();
</script>

<template>
  <hawk-view id="preview-panel-body">
    <hawk-text id="preview-title">Preview</hawk-text>
    <hawk-text id="preview-state">{{ previewStatusLabel(status) }}</hawk-text>
    <hawk-button id="preview-start" @pointerdown="emit('start')">Start</hawk-button>
    <hawk-button id="preview-stop" @pointerdown="emit('stop')">Stop</hawk-button>
  </hawk-view>
</template>
