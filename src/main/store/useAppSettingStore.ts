import { AppSettings } from '../types'
import Store from 'electron-store'

interface UseAppSettingStoreReturn {
  store: Store<AppSettings>
}

export const useAppSettingStore = (): UseAppSettingStoreReturn => {
  const defaults: AppSettings = {
    targetIp: '192.168.1.1',
    action: 'sleep',
    failureSeconds: 60,
    pingIntervalSeconds: 30,
    confirmCountdown: 90,
    launchOnStartup: true,
    enabled: true,
    snoozeMinutes: 5,
    snoozeActiveUntil: null
  }

  const store = new Store<AppSettings>({ defaults })

  return {
    store
  }
}
