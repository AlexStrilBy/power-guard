import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  // Settings
  getSettings: () => ipcRenderer.invoke('settings:get'),
  onSettingsLoad: (cb: (s: any) => void) => ipcRenderer.on('settings:load', (_e, s) => cb(s)),
  saveSettings: (s: any) => ipcRenderer.invoke('settings:save', s),

  // Confirm dialog
  onConfirm: (cb: (d: { action: string; countdown: number }) => void) =>
    ipcRenderer.on('confirm:show', (_e, d) => cb(d)),
  confirmAccept: () => ipcRenderer.invoke('confirm:accept'),
  confirmCancel: () => ipcRenderer.invoke('confirm:cancel'),

  // Optional: simulate outage from UI
  testOutage: () => ipcRenderer.invoke('confirm:test'),
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore
  window.electron = electronAPI
  // @ts-ignore
  window.api = api
}
