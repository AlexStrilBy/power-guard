import { BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { BaseWindowComposable, BaseWindowProps } from './types'

type SettingsWindowProps = BaseWindowProps

export const useSettingsWindow: BaseWindowComposable = ({
  rendererUrl,
  preloadFile,
  icon
}: SettingsWindowProps) => {
  let window: BrowserWindow | null = null

  const createWindow = (): BrowserWindow => {
    if (window) return window

    window = new BrowserWindow({
      width: 560,
      height: 900,
      show: false, // start hidden; show when user clicks tray
      autoHideMenuBar: true,
      ...(process.platform === 'linux' ? { icon } : {}),
      webPreferences: {
        preload: preloadFile,
        sandbox: false
      }
    })

    if (rendererUrl) window.loadURL(rendererUrl)
    else window.loadFile(join(__dirname, '../renderer/index.html'))

    // Keep app alive in tray when window is closed
    window.on('close', (e) => {
      e.preventDefault()
      window?.hide()
    })

    window.webContents.setWindowOpenHandler((details) => {
      shell.openExternal(details.url)
      return { action: 'deny' }
    })

    return window
  }

  const closeWindow = (): void => {
    if (window) {
      window.close()
      window = null
    }
  }

  return {
    createWindow,
    closeWindow
  }
}
