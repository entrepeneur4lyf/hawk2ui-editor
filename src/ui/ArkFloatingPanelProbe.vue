<script setup lang="ts">
import { FloatingPanel } from "@ark-ui/vue/floating-panel";
</script>

<template>
  <FloatingPanel.Root
    id="probe-root"
    :default-open="true"
    :default-position="{ x: 24, y: 24 }"
    :default-size="{ width: 320, height: 240 }"
    :ids="{
      trigger: 'probe-trigger',
      positioner: 'probe-positioner',
      content: 'probe-content',
      title: 'probe-title',
      header: 'probe-header'
    }"
  >
    <FloatingPanel.Trigger as-child>
      <hawk-button id="probe-trigger-button">Panel</hawk-button>
    </FloatingPanel.Trigger>
    <FloatingPanel.Positioner as-child>
      <hawk-view id="probe-positioner-view">
        <FloatingPanel.Content as-child>
          <hawk-view id="probe-content-view">
            <FloatingPanel.DragTrigger as-child>
              <hawk-view id="probe-drag-view">
                <FloatingPanel.Header as-child>
                  <hawk-view id="probe-header-view">
                    <FloatingPanel.Title as-child>
                      <hawk-text id="probe-title-text">Probe</hawk-text>
                    </FloatingPanel.Title>
                  </hawk-view>
                </FloatingPanel.Header>
              </hawk-view>
            </FloatingPanel.DragTrigger>
            <FloatingPanel.Body as-child>
              <hawk-view id="probe-body-view">
                <hawk-text id="probe-body-text">Ark UI probe</hawk-text>
              </hawk-view>
            </FloatingPanel.Body>
          </hawk-view>
        </FloatingPanel.Content>
      </hawk-view>
    </FloatingPanel.Positioner>
  </FloatingPanel.Root>
</template>
