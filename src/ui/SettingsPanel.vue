<script setup lang="ts">
import type { AssistantProfile } from "../core/workspace";
import { normalizeThemePreference, type ThemePreference } from "../theme/workbenchTheme";

const props = defineProps<{
  kind: "editor" | "chat";
  theme: string;
  profile: AssistantProfile;
}>();

const emit = defineEmits<{
  updateTheme: [theme: ThemePreference];
}>();

const themeChoices: { label: string; value: ThemePreference }[] = [
  { label: "Black", value: "black" },
  { label: "System", value: "system" },
  { label: "Light", value: "light" },
];

function activeThemeLabel(): string {
  const theme = normalizeThemePreference(props.theme);
  return themeChoices.find((choice) => choice.value === theme)?.label ?? "Black";
}
</script>

<template>
  <hawk-view :id="`${kind}-settings-panel-body`">
    <hawk-text :id="`${kind}-settings-title`">{{ kind === "editor" ? "Editor Settings" : "Chat Settings" }}</hawk-text>
    <hawk-view v-if="kind === 'editor'" id="editor-theme-settings" class="settings-group">
      <hawk-text id="editor-theme" class="muted">Theme: {{ activeThemeLabel() }}</hawk-text>
      <hawk-button
        v-for="choice in themeChoices"
        :id="`editor-theme-${choice.value}`"
        :key="choice.value"
        class="settings-choice"
        @pointer-press="emit('updateTheme', choice.value)"
      >
        {{ choice.label }}
      </hawk-button>
    </hawk-view>
    <hawk-text v-if="kind === 'editor'" id="editor-font" class="muted">Font: system mono</hawk-text>
    <hawk-text v-if="kind === 'editor'" id="editor-tab-size" class="muted">Tab size: 2</hawk-text>
    <hawk-text v-if="kind === 'chat'" id="chat-provider" class="muted">Provider: {{ profile.label }}</hawk-text>
    <hawk-text v-if="kind === 'chat'" id="chat-model" class="muted">Model: {{ profile.model }}</hawk-text>
  </hawk-view>
</template>
