import { app, Menu, nativeImage, Tray } from 'electron'
import { BaseTrayComposable, BaseTrayProps } from './types'
import ElectronStore from 'electron-store'
import { AppSettings } from '../types'

type UseTrayProps = BaseTrayProps & {
  onOpenSettings: () => void
  onSimulateOutage: () => void
  appSettingsStore: ElectronStore<AppSettings>
}

export const useTray: BaseTrayComposable<UseTrayProps> = ({
  icon,
  onOpenSettings,
  onSimulateOutage,
  appSettingsStore
}) => {
  let enabled = appSettingsStore.get('enabled')
  let tray: Tray | null = null

  appSettingsStore.onDidChange('enabled', (value) => {
    enabled = value || false
    updateMenu()
  })

  const updateMenu = (): void => {
    const menu = Menu.buildFromTemplate([
      { label: 'Open Settings', click: onOpenSettings },
      { type: 'separator' },
      { label: 'Simulate Outage (test)', click: onSimulateOutage },
      {
        label: enabled ? 'Pause Monitoring' : 'Resume Monitoring',
        click: handleMonitoringStateUpdated
      },
      { type: 'separator' },
      { label: 'Quit', click: () => app.exit(0) }
    ])
    tray?.setContextMenu(menu)
  }

  /**
   * Yeah some stupid stuff here, but this is the only way to toggle the monitoring state
   * For some reason appSettingsStore.set doesn't trigger the onDidChange event
   */
  const handleMonitoringStateUpdated = (): void => {
    enabled = !enabled
    appSettingsStore.set('enabled', enabled)
    updateMenu()
  }

  function createTray(): void {
    const trayIcon = icon ? nativeImage.createFromPath(icon) : nativeImage.createEmpty()
    tray = new Tray(trayIcon)

    tray.setToolTip(process.env.APP_NAME || '')
    tray.on('click', onOpenSettings)
    updateMenu()
  }

  return {
    createTray
  }
}
