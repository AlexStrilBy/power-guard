import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import Store from 'electron-store'

import { OutageMonitor } from './monitor'
import { performAction, type PowerAction } from './power'

import icon from '../../resources/icon.png?asset'
import { BaseWindowProps } from './windows/types'
import { useSettingsWindow } from './windows/useSettingsWindow'
import { useConfirmWindow } from './windows/useConfirmWindow'
import { useTray } from './tray/useTray'
import { BaseTrayProps } from './tray/types'
import { AppSettings } from './types'

// -----------------------------
// Settings & defaults
// -----------------------------
const defaults: AppSettings = {
  targetIp: '192.168.1.1',
  action: 'hibernate',
  failureSeconds: 8,
  confirmCountdown: 20,
  startWithWindows: true,
  enabled: true,
  snoozeMinutes: 5
}

const store = new Store<AppSettings>({ defaults })

// -----------------------------
// Globals
// -----------------------------
const baseWindowProps: BaseWindowProps = {
  rendererUrl: process.env['ELECTRON_RENDERER_URL'],
  preloadFile: join(__dirname, '../preload/index.mjs'),
  icon
}
const baseTrayProps: BaseTrayProps = {
  icon
}

const { createWindow: createSettingsWindow } = useSettingsWindow(baseWindowProps)
const { createWindow: createConfirmWindow, closeWindow: closeConfirmWindow } =
  useConfirmWindow(baseWindowProps)
const { createTray } = useTray(baseTrayProps)

// Monitor instance
const monitor = new OutageMonitor({
  targetIp: store.get('targetIp'),
  failureSeconds: store.get('failureSeconds'),
  intervalMs: 1000
})

// -----------------------------
// Helpers
// -----------------------------
const applyLoginItem = (): void => {
  app.setLoginItemSettings({
    openAtLogin: store.get('startWithWindows')
  })
}

const showSettings = (): void => {
  const win = createSettingsWindow()
  win.show()
  win.focus()
  win.webContents.send('settings:load', store.store)
}

const showConfirm = (action: PowerAction, countdown: number): void => {
  const win = createConfirmWindow()
  if (win.isMinimized()) win.restore()
  win.show()
  win.focus()
  win.webContents.send('confirm:show', { action, countdown })
}

ipcMain.handle('settings:get', () => store.store)

ipcMain.handle('settings:save', (_e, s: Partial<AppSettings>) => {
  const prevStart = store.get('startWithWindows')

  // Persist new settings
  store.set({ ...store.store, ...s })

  // Apply changed monitor parameters
  monitor.update({
    targetIp: store.get('targetIp'),
    failureSeconds: store.get('failureSeconds')
  })

  // Apply login-at-start toggle
  if (s.startWithWindows !== undefined && s.startWithWindows !== prevStart) {
    applyLoginItem()
  }
})

ipcMain.handle('confirm:accept', async () => {
  closeConfirmWindow()
  await performAction(store.get('action'))
})

ipcMain.handle('confirm:cancel', async () => {
  closeConfirmWindow()

  monitor.stop()
  setTimeout(() => store.get('enabled') && monitor.start(), store.get('snoozeMinutes') * 60_000)
})

// Optional: UI test hook
ipcMain.handle('confirm:test', async () => {
  showConfirm(store.get('action'), 5)
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

    if (store.get('enabled')) monitor.start()
  })

  // @ts-ignore False Vue event warning
  app.on('window-all-closed', (e: Electron.Event): void => {
    e.preventDefault()
  })
}
