import { ElectronAPI } from '@electron-toolkit/preload'
import { AppConfig, AppSettings, ConfirmData } from "../main/types";

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      getSettings(): Promise<AppSettings>
      onSettingsLoad(cb: (s: AppSettings) => void): void
      saveSettings(s: AppSettings): Promise<void>
      onConfirm(cb: (d: ConfirmData) => void): void
      confirmAccept(): Promise<void>
      confirmCancel(): Promise<void>
      testOutage(): Promise<void>
    },
    appConfig: AppConfig
  }
}
