import { app, Menu, nativeImage, Tray } from 'electron'
import { BaseTrayComposable, BaseTrayProps } from './types'
import { useAppSettingStore } from '../store/useAppSettingStore'

type UseTrayProps = BaseTrayProps & {
  onOpenSettings: () => void
  onSimulateOutage: () => void
  onMonitorStart: () => void
  onMonitorStop: () => void
}

export const useTray: BaseTrayComposable<UseTrayProps> = ({
  icon,
  onOpenSettings,
  onSimulateOutage,
  onMonitorStart,
  onMonitorStop
}) => {
  let tray: Tray | null = null

  const { store } = useAppSettingStore()

  const updateMenu = (): void => {
    const enabled = store.get('enabled')
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

  const handleMonitoringStateUpdated = (): void => {
    const newState = !store.get('enabled')
    store.set('enabled', newState)
    if (newState) onMonitorStart()
    else onMonitorStop()
    updateMenu()
  }

  function createTray(): void {
    // Use your PNG/ICO if available; fallback to empty image to avoid errors
    const trayIcon = icon ? nativeImage.createFromPath(icon) : nativeImage.createEmpty()
    tray = new Tray(trayIcon)

    tray.setToolTip('Power Guard')
    tray.on('click', onOpenSettings)
    updateMenu()
  }

  return {
    createTray
  }
}
