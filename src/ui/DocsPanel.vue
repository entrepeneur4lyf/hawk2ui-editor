<script setup lang="ts">
import type { DocsSource } from "../docs/githubDocs";

defineProps<{
  source: DocsSource;
}>();
</script>

<template>
  <hawk-view id="docs-panel-body">
    <hawk-text id="docs-title">Live Docs</hawk-text>
    <hawk-text id="docs-source" class="muted">
      {{ source.owner }}/{{ source.repo }}@{{ source.ref }}
    </hawk-text>
    <hawk-button id="docs-refresh">Refresh</hawk-button>
    <hawk-text id="docs-content">manual/README.md will load through the bridge.</hawk-text>
  </hawk-view>
</template>
