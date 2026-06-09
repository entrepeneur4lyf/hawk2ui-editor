<script setup lang="ts">
import type { HawkProjectSummary } from "../core/project";

defineProps<{
  project: HawkProjectSummary;
}>();
</script>

<template>
  <hawk-view id="project-panel-body">
    <hawk-text id="project-name">{{ project.name }}</hawk-text>
    <hawk-text id="project-id" class="muted">{{ project.packageId }}</hawk-text>
    <hawk-text id="project-framework">Framework: {{ project.framework }}</hawk-text>
    <hawk-text id="project-targets">Targets: {{ project.targets.join(", ") }}</hawk-text>
    <hawk-button id="open-app-vue">Open src/App.vue in sidecar editor</hawk-button>
  </hawk-view>
</template>
