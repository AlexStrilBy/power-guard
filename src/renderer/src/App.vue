<script setup lang="ts">
import { computed } from 'vue'
import Settings from '@renderer/components/Settings.vue'
import Confirm from '@renderer/components/Confirm.vue'

type AvailableViews = 'settings' | 'confirm'
const view = computed<AvailableViews>(() => {
  const hash = window.location.hash.replace(/^#\/?/, '')

  return (hash || 'settings') as AvailableViews
})
</script>

<template>
  <Settings v-if="view === 'settings'" />
  <Confirm v-else-if="view === 'confirm'" />
</template>

<style scoped></style>
