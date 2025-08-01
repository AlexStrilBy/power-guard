import type { PowerAction } from './power'

export interface AppSettings {
  targetIp: string
  action: PowerAction
  failureSeconds: number
  pingIntervalSeconds: number
  confirmCountdown: number
  launchOnStartup: boolean
  enabled: boolean
  snoozeMinutes: number
  // unix timestamp until which snooze is active, null if snooze is not active
  snoozeActiveUntil: number | null
}

export interface AppConfig {
  appName: string
}

export interface ConfirmData {
  action: PowerAction
  countdown: number
}
