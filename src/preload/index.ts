import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { AppSettings, ConfirmData } from '../main/types'

// Custom APIs for renderer
const api = {
  // Settings
  getSettings: () => ipcRenderer.invoke('settings:get'),
  onSettingsLoad: (cb: (s: AppSettings) => void) =>
    ipcRenderer.on('settings:load', (_e, s) => cb(s)),
  saveSettings: (s: AppSettings) => ipcRenderer.invoke('settings:save', s),

  onConfirm: (cb: (d: ConfirmData) => void) => ipcRenderer.on('confirm:show', (_e, d) => cb(d)),
  confirmAccept: () => ipcRenderer.invoke('confirm:accept'),
  confirmCancel: () => ipcRenderer.invoke('confirm:cancel'),

  testOutage: () => ipcRenderer.invoke('confirm:test')
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore Missing window types
  window.electron = electronAPI
  // @ts-ignore Missing window types
  window.api = api
}
