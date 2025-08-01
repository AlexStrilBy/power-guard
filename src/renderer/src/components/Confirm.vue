<script setup lang="ts">
import { onBeforeMount, ref } from 'vue'
import { ConfirmData } from '../../../main/types'
import { useCountdown } from '@renderer/composables/useCountdown'

const confirm = ref<ConfirmData>()

const handleConfirmAccept = (): void => {
  window.api.confirmAccept()
}

const handleConfirmCancel = (): void => {
  window.api.confirmCancel()
}

const { startCountdown, timer } = useCountdown({
  onTimerFinish: handleConfirmAccept
})

onBeforeMount(() => {
  window.api.onConfirm((data) => {
    confirm.value = data

    startCountdown(confirm.value?.countdown || 0)
  })
})
</script>

<template>
  <div v-if="confirm" class="confirm">
    <h3>Power outage detected</h3>
    <p>
      Action: <b>{{ confirm.action }}</b> in <b>{{ timer }}</b> seconds…
    </p>
    <div class="actions">
      <button @click="handleConfirmAccept">Do it now</button>
      <button class="secondary" @click="handleConfirmCancel">Cancel / Snooze</button>
    </div>
  </div>
</template>

<style scoped></style>
