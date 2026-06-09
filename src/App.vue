<script setup lang="ts">
import { onMounted, ref } from "vue";
import { readParameter, writeParameter } from "hawk:plugin";

const gain = ref(0);

onMounted(async () => {
  gain.value = await readParameter("gain");
});

async function boost() {
  await writeParameter("gain", 0.75);
  gain.value = await readParameter("gain");
}
</script>

<template>
  <hawk-view id="vue-plugin-root">
    <hawk-text id="gain">{{ gain.toFixed(2) }}</hawk-text>
    <hawk-button id="boost" @pointer-press="boost">Boost</hawk-button>
  </hawk-view>
</template>
