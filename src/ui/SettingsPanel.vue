<script setup lang="ts">
import type { AssistantProfile } from "../core/workspace";

defineProps<{
  kind: "editor" | "chat";
  theme: string;
  profile: AssistantProfile;
}>();
</script>

<template>
  <hawk-view :id="`${kind}-settings-panel-body`">
    <hawk-text :id="`${kind}-settings-title`">{{ kind === "editor" ? "Editor Settings" : "Chat Settings" }}</hawk-text>
    <hawk-text v-if="kind === 'editor'" id="editor-theme" class="muted">Theme: {{ theme }}</hawk-text>
    <hawk-text v-if="kind === 'editor'" id="editor-font" class="muted">Font: system mono</hawk-text>
    <hawk-text v-if="kind === 'editor'" id="editor-tab-size" class="muted">Tab size: 2</hawk-text>
    <hawk-text v-if="kind === 'chat'" id="chat-provider" class="muted">Provider: {{ profile.label }}</hawk-text>
    <hawk-text v-if="kind === 'chat'" id="chat-model" class="muted">Model: {{ profile.model }}</hawk-text>
  </hawk-view>
</template>
