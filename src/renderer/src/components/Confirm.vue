<script setup lang="ts">
import { onBeforeMount, onMounted, ref } from 'vue'
import { ConfirmData } from '../../../main/types'

const confirm = ref<ConfirmData>()
const timer = ref<number>(0)
let timerInterval: number | null = null

const handleConfirmAccept = (): void => {
  window.api.confirmAccept()
}

const startCountdown = (sec: number): void => {
  timer.value = sec
  timerInterval && clearInterval(timerInterval)
  timerInterval = setInterval(() => {
    timer.value--
    if (timer.value <= 0) {
      handleConfirmAccept()
      timerInterval && clearInterval(timerInterval)
    }
  }, 1000) as unknown as number
}

onMounted(() => {
  window.api.onConfirm((data) => {
    confirm.value = data
  })
})
</script>

<template>
  <div v-if="confirm" class="confirm">
    <h3>Power outage detected</h3>
    <p>
      Action: <b>{{ confirm.action }}</b> in <b>{{ confirm.remain }}</b> seconds…
    </p>
    <div class="actions">
      <button>Do it now</button>
      <button class="secondary">Cancel / Snooze</button>
    </div>
  </div>
</template>

<style scoped></style>
