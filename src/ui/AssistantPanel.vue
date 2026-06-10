<script setup lang="ts">
import { ref } from "vue";
import type { AssistantProfile } from "../core/workspace";
import { providerBadges } from "../assistant/providers";

const props = defineProps<{
  profile: AssistantProfile;
}>();

const prompt = ref("Review this Hawk2UI project and suggest the next useful change.");
const response = ref("Assistant idle.");
</script>

<template>
  <hawk-view id="assistant-panel-body">
    <hawk-text id="assistant-provider">{{ profile.label }}</hawk-text>
    <hawk-text
      v-for="(badge, index) in providerBadges(props.profile)"
      :id="`assistant-badge-${index}`"
      :key="`${badge.label}-${badge.value}`"
      class="muted"
    >
      {{ badge.label }}: {{ badge.value }}
    </hawk-text>
    <hawk-input id="assistant-prompt" v-model="prompt" />
    <hawk-button id="assistant-send" @pointerdown="response = 'Bridge request queued.'">Send</hawk-button>
    <hawk-text id="assistant-response">{{ response }}</hawk-text>
  </hawk-view>
</template>
