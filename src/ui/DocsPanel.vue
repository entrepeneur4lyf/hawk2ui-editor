<script setup lang="ts">
import type { DocsSource } from "../docs/githubDocs";

defineProps<{
  source: DocsSource;
}>();

const emit = defineEmits<{
  openDoc: [path: string];
}>();

function docId(path: string): string {
  return `docs-entry-${path.replace(/[^A-Za-z0-9_-]/g, "-")}`;
}
</script>

<template>
  <hawk-view id="docs-panel-body">
    <hawk-text id="docs-title">Live Docs</hawk-text>
    <hawk-text id="docs-source" class="muted">
      {{ source.owner }}/{{ source.repo }}@{{ source.ref }}
    </hawk-text>
    <hawk-button id="docs-refresh">Refresh</hawk-button>
    <hawk-button
      v-for="path in source.paths"
      :id="docId(path)"
      :key="path"
      @pointerdown="emit('openDoc', path)"
    >
      {{ path }}
    </hawk-button>
  </hawk-view>
</template>
