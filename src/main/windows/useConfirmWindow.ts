import { BrowserWindow } from 'electron'
import { join } from 'path'
import { BaseWindowComposable, BaseWindowProps } from './types'

type ConfirmWindowProps = BaseWindowProps

export const useConfirmWindow: BaseWindowComposable = ({
  rendererUrl,
  preloadFile,
  icon
}: ConfirmWindowProps) => {
  let window: BrowserWindow | null = null

  const createWindow = (): BrowserWindow => {
    if (window) return window

    window = new BrowserWindow({
      width: 420,
      height: 230,
      frame: false,
      alwaysOnTop: true,
      resizable: false,
      autoHideMenuBar: true,
      ...(process.platform === 'linux' ? { icon } : {}),
      webPreferences: {
        preload: preloadFile,
        sandbox: false
      }
    })

    // Route renderer to a confirm view (hash-based)
    if (rendererUrl) window.loadURL(rendererUrl + '#/confirm')
    else window.loadFile(join(__dirname, '../renderer/index.html'), { hash: 'confirm' })

    window.on('closed', () => (window = null))
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
