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
import moment from 'moment'
import { performAction } from './power'


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

// region IPC events
const sendConfirmEvent = (): void => {
  confirmWindow?.webContents.send('confirm:show', {
    action: store.get('action'),
    countdown: store.get('confirmCountdown')
  } as ConfirmData)
}

const sendSettingsLoadEvent = (): void => {
  settingsWindow?.webContents.send('settings:load', store.store)
  // tra?.webContents.send('settings:load', store.store)
}
// endregion

// region Windows
const { createWindow: createSettingsWindow } = useSettingsWindow(baseWindowProps)
const { createWindow: createConfirmWindow, closeWindow: closeConfirmWindow } =
  useConfirmWindow(baseWindowProps)

const showSettings = (): void => {
  settingsWindow = createSettingsWindow()
  if (settingsWindow.isMinimized()) settingsWindow.restore()
  settingsWindow.show()
  settingsWindow.focus()

  settingsWindow.webContents.once('did-finish-load', sendSettingsLoadEvent)
}

const showConfirm = (): void => {
  confirmWindow = createConfirmWindow()
  if (confirmWindow.isMinimized()) confirmWindow.restore()
  confirmWindow.show()
  confirmWindow.focus()

  confirmWindow.webContents.once('did-finish-load', sendConfirmEvent)
}

const { createTray } = useTray({
  ...baseTrayProps,
  onOpenSettings: showSettings,
  onSimulateOutage: () => showConfirm(),
  appSettingsStore: store
})
// endregion

const initMonitor = (storeState: AppSettings | undefined): void => {
  const monitorConfig = {
    targetIp: store.get('targetIp'),
    failureSeconds: store.get('failureSeconds'),
    intervalMs: store.get('pingIntervalSeconds') * 1000
  }

  if (!monitor) {
    monitor = new OutageMonitor(monitorConfig)
  }

  monitor.on('outage', () => {
    const snoozeActiveUntil = store.get('snoozeActiveUntil')
    const secondsSnoozeActive = snoozeActiveUntil
      ? moment(snoozeActiveUntil).unix() - moment().unix()
      : 0

    if (secondsSnoozeActive > 0) {
      monitor?.stop()

      setTimeout(() => {
        monitor?.start()
        store.set('snoozeActiveUntil', null)
      }, secondsSnoozeActive * 1000)

      return
    }

    showConfirm()
  })

  if (typeof storeState === 'undefined') {
    monitor.stop()
    return
  }

  monitor.update(monitorConfig)
  monitor.stop()

  if (storeState.enabled) {
    monitor.start()
  }
}

const initAppStartup = (storeState: AppSettings | undefined): void => {
  app.setLoginItemSettings({
    openAtLogin: storeState?.launchOnStartup || false,
    path: app.getPath('exe')
  })
}

// region Store watchers
store.onDidAnyChange((storeState) => {
  sendSettingsLoadEvent()

  initMonitor(storeState)
  initAppStartup(storeState)
})
// endregion

// region IPC Handlers
ipcMain.handle('settings:get', () => store.store)

ipcMain.handle('settings:save', (_e, s: Partial<AppSettings>) => {
  store.set({ ...store.store, ...s })
})

ipcMain.handle('confirm:accept', async () => {
  closeConfirmWindow()
  await performAction(store.get('action'))
})

ipcMain.handle('confirm:cancel', async () => {
  closeConfirmWindow()

  const timestamp = moment().add(store.get('snoozeMinutes'), 'minutes').valueOf()

  store.set('snoozeActiveUntil', timestamp)
})

ipcMain.handle('confirm:test', async () => {
  showConfirm()
})
// endregion

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
  initMonitor(store.store)
  initAppStartup(store.store)

  app.whenReady().then(() => {
    app.setName('Power Guard')
    electronApp.setAppUserModelId('com.power.guard')

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

  app.on('second-instance', () => {
    showSettings()
  })
}
