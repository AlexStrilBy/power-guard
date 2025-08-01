import type { PowerAction } from './power'

export interface AppSettings {
  targetIp: string
  action: PowerAction
  failureSeconds: number
  pingIntervalSeconds: number
  confirmCountdown: number
  startWithWindows: boolean
  enabled: boolean
  snoozeMinutes: number
}

export interface ConfirmData {
  action: PowerAction
  countdown: number
}
