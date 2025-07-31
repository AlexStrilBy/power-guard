import { app, Menu, nativeImage, Tray } from 'electron'
import { BaseTrayComposable } from './types'

export const useTray: BaseTrayComposable = ({ icon }) => {
  let tray: Tray | null = null

  const onOpenSettings = (): void => {
    console.log('Open settings clicked')
  }

  const onSimulateOutage = (): void => {
    console.log('Simulate outage clicked')

    // showConfirm(store.get('action'), 5)
  }

  const handleMonitoringStateUpdated = (): void => {
    console.log('Monitoring state updated')

    // store.set('enabled', !enabled)
    // if (store.get('enabled')) monitor.start()
    // else monitor.stop()
    // updateMenu()
  }

  function createTray(): void {
    // Use your PNG/ICO if available; fallback to empty image to avoid errors
    const trayIcon = icon ? nativeImage.createFromPath(icon) : nativeImage.createEmpty()
    tray = new Tray(trayIcon)

    const updateMenu = (): void => {
      const enabled = false // store.get('enabled')
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
      tray!.setContextMenu(menu)
    }

    tray.setToolTip('Power Guard')
    tray.on('click', onOpenSettings)
    updateMenu()
  }

  return {
    createTray
  }
}
