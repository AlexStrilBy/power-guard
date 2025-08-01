<script setup lang="ts">
import { computed, watch } from 'vue'
import Settings from '@renderer/components/Settings.vue'
import Confirm from '@renderer/components/Confirm.vue'
import { storeToRefs } from 'pinia'
import { useAppConfigStore } from '@renderer/store/useAppConfigStore'

type AvailableViews = 'settings' | 'confirm'

const { appConfig } = storeToRefs(useAppConfigStore())

const view = computed<AvailableViews>(() => {
  const hash = window.location.hash.replace(/^#\/?/, '')

  return (hash || 'settings') as AvailableViews
})

const setWindowTitleFromAppConfig = (): void => {
  document.title = appConfig.value.appName
}

watch(() => appConfig.value.appName, setWindowTitleFromAppConfig)
setWindowTitleFromAppConfig()
</script>

<template>
  <Settings v-if="view === 'settings'" />
  <Confirm v-else-if="view === 'confirm'" />
</template>

<style scoped></style>
