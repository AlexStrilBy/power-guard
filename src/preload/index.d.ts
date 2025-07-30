import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      getSettings(): Promise<any>;
      onSettingsLoad(cb: (s: any) => void): void;
      saveSettings(s: any): Promise<void>;
      onConfirm(cb: (d: { action: string; countdown: number }) => void): void;
      confirmAccept(): Promise<void>;
      confirmCancel(): Promise<void>;
      testOutage(): Promise<void>;
    };
  }
}
