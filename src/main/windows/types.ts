export interface BaseWindowProps {
  rendererUrl?: string
  preloadFile?: string
  icon?: string
}

export type BaseWindowComposable = (props: BaseWindowProps) => {
  createWindow: () => Electron.BrowserWindow
  closeWindow: () => void
}
