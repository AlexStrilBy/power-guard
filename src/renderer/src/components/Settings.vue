<script setup lang="ts">
import { AppSettings } from '../../../main/types'
import { onBeforeMount, ref } from 'vue'

const appSettings = ref<AppSettings>()

const save = (): void => {
  if (!appSettings.value) return

  appSettings.value.failureSeconds = Math.max(2, Math.min(120, appSettings.value.failureSeconds))
  appSettings.value.confirmCountdown = Math.max(
    5,
    Math.min(300, appSettings.value.confirmCountdown)
  )
  appSettings.value.snoozeMinutes = Math.max(1, Math.min(120, appSettings.value.snoozeMinutes))
  window.api.saveSettings({ ...appSettings.value })
}

const performOutageTest = (): void => {
  window.api.testOutage()
}

onBeforeMount(async () => {
  appSettings.value = await window.api.getSettings()

  window.api.onSettingsLoad((updated) => {
    appSettings.value = updated
  })
})
</script>

<template>
  <div v-if="!appSettings">
    <h2>Loading...</h2>
  </div>
  <div v-else class="wrap">
    <h2>Power Guard</h2>
    <div class="row">
      <label>Target IP (mains-only device)</label>
      <input v-model="appSettings.targetIp" placeholder="192.168.1.50" />
      <small>Put the device BEFORE the UPS so it goes offline when the grid drops.</small>
    </div>

    <div class="row">
      <label>Ping interval (seconds)</label>
      <input
        v-model.number="appSettings.pingIntervalSeconds"
        type="number"
        min="30"
        max="600"
        step="10"
      />
      <small>How often to ping the target device.</small>
    </div>

    <div class="row">
      <label>Consecutive failure seconds</label>
      <input
        v-model.number="appSettings.failureSeconds"
        type="number"
        min="0"
        max="600"
        step="10"
      />
      <small>
        How long the target must be offline before an outage is detected. 0 - Immediate reaction,
        not recommended cause can be false-positive. If your <b>Ping interval</b> >
        <b>Consecutive failure seconds</b>
        then failure will be detected only after the next ping.
      </small>
    </div>

    <div class="row">
      <label>Action on outage</label>
      <select v-model="appSettings.action">
        <option value="sleep">Sleep (recommended)</option>
        <option value="hibernate">Hibernate</option>
        <option value="shutdown">Shutdown</option>
      </select>
    </div>

    <div class="row">
      <label>Confirm countdown (seconds)</label>
      <input v-model.number="appSettings.confirmCountdown" type="number" min="5" max="300" />
      <small>
        How long to wait before performing the action. At this time the user can cancel the action
        or perform it immediately.
      </small>
    </div>

    <div class="row">
      <label>Snooze (minutes) after cancel</label>
      <input v-model.number="appSettings.snoozeMinutes" type="number" min="1" max="120" />
      <small>
        How long to wait before the next outage check after the user cancels the action.
      </small>
    </div>

    <div class="row checkbox">
      <label> <input v-model="appSettings.enabled" type="checkbox" /> Enable monitoring </label>
    </div>
    <div class="row checkbox">
      <label>
        <input v-model="appSettings.startWithWindows" type="checkbox" /> Start with Windows
      </label>
    </div>

    <div class="row flex items-space-between actions">
      <button @click="save">Save</button>
      <button @click="performOutageTest">Test outage</button>
    </div>

    <p class="hint">
      Tip: give the target device a <b>static DHCP reservation</b> so its IP never changes.
    </p>
  </div>
</template>

<style scoped></style>
