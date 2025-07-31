<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { AppSettings } from '../../main/types'

const view = ref<'settings' | 'confirm'>('settings')
const s = reactive<AppSettings>({
  targetIp: '192.168.1.1',
  action: 'hibernate',
  failureSeconds: 8,
  confirmCountdown: 20,
  startWithWindows: true,
  enabled: true,
  snoozeMinutes: 5
})

// confirm state
const confirm = reactive({ action: 'hibernate', remain: 0 })
let timer: number | null = null

function clamp(): void {
  s.failureSeconds = Math.max(2, Math.min(120, s.failureSeconds))
  s.confirmCountdown = Math.max(5, Math.min(300, s.confirmCountdown))
  s.snoozeMinutes = Math.max(1, Math.min(120, s.snoozeMinutes))
}

function save(): void {
  clamp()
  window.api.saveSettings({ ...s })
}

function startCountdown(sec: number): void {
  confirm.remain = sec
  timer && clearInterval(timer)
  timer = setInterval(() => {
    confirm.remain--
    if (confirm.remain <= 0) {
      window.api.confirmAccept()
      timer && clearInterval(timer)
    }
  }, 1000) as unknown as number
}

onMounted(async () => {
  console.log(window)
  const data = await window.api.getSettings()
  console.log(data)
  Object.assign(s, data)

  // Listen for updates from main after save
  window.api.onSettingsLoad((updated) => Object.assign(s, updated))
})
</script>

<template>
  <div v-if="view === 'settings'" class="wrap">
    <h2>Power Guard</h2>
    <div class="row">
      <label>Target IP (mains-only device)</label>
      <input v-model="s.targetIp" placeholder="192.168.1.50" />
      <small>Put the device BEFORE the UPS so it goes offline when the grid drops.</small>
    </div>

    <div class="row">
      <label>Consecutive failure seconds</label>
      <input v-model.number="s.failureSeconds" type="number" min="2" max="120" />
    </div>

    <div class="row">
      <label>Action on outage</label>
      <select v-model="s.action">
        <option value="hibernate">Hibernate (recommended)</option>
        <option value="sleep">Sleep</option>
        <option value="shutdown">Shutdown</option>
      </select>
    </div>

    <div class="row">
      <label>Confirm countdown (seconds)</label>
      <input v-model.number="s.confirmCountdown" type="number" min="5" max="300" />
    </div>

    <div class="row">
      <label>Snooze (minutes) after cancel</label>
      <input v-model.number="s.snoozeMinutes" type="number" min="1" max="120" />
    </div>

    <div class="row checkbox">
      <label><input v-model="s.enabled" type="checkbox" /> Enable monitoring</label>
    </div>
    <div class="row checkbox">
      <label><input v-model="s.startWithWindows" type="checkbox" /> Start with Windows</label>
    </div>

    <div class="row actions">
      <button @click="save">Save</button>
    </div>

    <p class="hint">
      Tip: give the target device a <b>static DHCP reservation</b> so its IP never changes.
    </p>
  </div>

  <div v-else class="confirm">
    <h3>Power outage detected</h3>
    <p>
      Action: <b>{{ confirm.action }}</b> in <b>{{ confirm.remain }}</b> seconds…
    </p>
    <div class="actions">
      <button @click="() => window.api.confirmAccept()">Do it now</button>
      <button class="secondary" @click="() => window.api.confirmCancel()">Cancel / Snooze</button>
    </div>
  </div>
</template>

<style scoped>
.wrap {
  padding: 16px;
  font-family: ui-sans-serif, system-ui;
}

.row {
  margin-top: 12px;
  display: grid;
  gap: 6px;
}

.row.checkbox {
  display: block;
}

.row.actions {
  margin-top: 16px;
}

input,
select {
  padding: 6px 8px;
}

button {
  padding: 8px 12px;
  cursor: pointer;
}

button.secondary {
  margin-left: 8px;
}

.hint {
  margin-top: 12px;
  color: #666;
  font-size: 12px;
}

.confirm {
  padding: 20px;
  text-align: center;
  font-family: ui-sans-serif, system-ui;
}
</style>
