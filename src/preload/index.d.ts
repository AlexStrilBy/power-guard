import { ElectronAPI } from '@electron-toolkit/preload'
import { AppSettings } from '../main/types'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      getSettings(): Promise<AppSettings>
      onSettingsLoad(cb: (s: any) => void): void
      saveSettings(s: any): Promise<void>
      onConfirm(cb: (d: { action: string; countdown: number }) => void): void
      confirmAccept(): Promise<void>
      confirmCancel(): Promise<void>
      testOutage(): Promise<void>
    }
  }
}
