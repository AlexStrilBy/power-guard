import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer } from '@electron-toolkit/utils'

import { OutageMonitor } from './monitor'

import icon from '../../resources/icon.png?asset'
import { BaseWindowProps } from './windows/types'
import { useSettingsWindow } from './windows/useSettingsWindow'
import { useConfirmWindow } from './windows/useConfirmWindow'
import { useTray } from './tray/useTray'
import { BaseTrayProps } from './tray/types'
import { AppSettings, ConfirmData } from './types'
import { useAppSettingStore } from './store/useAppSettingStore'

// region Globals
let settingsWindow: BrowserWindow | null = null
let confirmWindow: BrowserWindow | null = null
let monitor: OutageMonitor | null = null
const { store } = useAppSettingStore()
// endregion

// region Defaults
const baseWindowProps: BaseWindowProps = {
  rendererUrl: process.env['ELECTRON_RENDERER_URL'],
  preloadFile: join(__dirname, '../preload/index.mjs'),
  icon
}
const baseTrayProps: BaseTrayProps = {
  icon
}
// endregion

const { createWindow: createSettingsWindow } = useSettingsWindow(baseWindowProps)
const { createWindow: createConfirmWindow } = useConfirmWindow(baseWindowProps)

const showSettings = (): void => {
  settingsWindow = createSettingsWindow()
  settingsWindow.show()
  settingsWindow.focus()
}

const showConfirm = (): void => {
  confirmWindow = createConfirmWindow()
  if (confirmWindow.isMinimized()) confirmWindow.restore()
  confirmWindow.show()
  confirmWindow.focus()
  confirmWindow.webContents.send('confirm:show', {
    action: store.get('action'),
    countdown: store.get('confirmCountdown')
  } as ConfirmData)
}

const { createTray } = useTray({
  ...baseTrayProps,
  onOpenSettings: showSettings,
  onSimulateOutage: () => showConfirm(),
  onMonitorStart: () => {
    store.set('enabled', true)
  },
  onMonitorStop: () => {
    store.set('enabled', false)
  }
})

const initMonitorFromStore = (storeState: AppSettings | undefined): void => {
  const monitorConfig = {
    targetIp: store.get('targetIp'),
    failureSeconds: store.get('failureSeconds'),
    intervalMs: store.get('pingIntervalSeconds') * 1000
  }

  if (!monitor) {
    monitor = new OutageMonitor(monitorConfig)
  }

  if (typeof storeState === 'undefined') {
    monitor.stop()
    return
  }

  monitor.update(monitorConfig)

  if (storeState.enabled) {
    monitor.start()
  } else {
    monitor.stop()
  }
}

// Watchers
store.onDidAnyChange((storeState) => {
  settingsWindow?.webContents.send('settings:load', storeState)

  initMonitorFromStore(storeState)
})

// -----------------------------
// Helpers
// -----------------------------
const applyLoginItem = (): void => {
  app.setLoginItemSettings({
    openAtLogin: store.get('startWithWindows')
  })
}

ipcMain.handle('settings:get', () => store.store)

ipcMain.handle('settings:save', (_e, s: Partial<AppSettings>) => {
  const prevStart = store.get('startWithWindows')

  // Persist new settings
  store.set({ ...store.store, ...s })

  // Apply login-at-start toggle
  if (s.startWithWindows !== undefined && s.startWithWindows !== prevStart) {
    applyLoginItem()
  }
})

ipcMain.handle('confirm:accept', async () => {
  console.log('confirm:accept called')
  // closeConfirmWindow()
  // await performAction(store.get('action'))
})

ipcMain.handle('confirm:cancel', async () => {
  console.log('confirm:cancel called')
  // closeConfirmWindow()
  //
  // monitor.stop()
  // setTimeout(() => store.get('enabled') && monitor.start(), store.get('snoozeMinutes') * 60_000)
})

ipcMain.handle('confirm:test', async () => {
  showConfirm()
})

// -----------------------------
// Single-instance & app lifecycle
// -----------------------------
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  if (process.env.NODE_ENV === 'development') {
    console.warn('Second instance in dev — continuing without lock.')
  } else {
    app.quit()
  }
} else {
  app.on('second-instance', () => {
    showSettings()
  })

  app.whenReady().then(() => {
    electronApp.setAppUserModelId('com.power.guard')

    applyLoginItem()
    createTray()
    showSettings()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) showSettings()
    })

    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window)
    })
  })

  // @ts-ignore False Vue event warning
  app.on('window-all-closed', (e: Electron.Event): void => {
    e.preventDefault()
  })
}
