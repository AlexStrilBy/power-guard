import type { PowerAction } from './power'

export interface AppSettings {
  targetIp: string
  action: PowerAction
  failureSeconds: number
  confirmCountdown: number
  startWithWindows: boolean
  enabled: boolean
  snoozeMinutes: number
}
