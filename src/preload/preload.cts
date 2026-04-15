import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.send('window:minimize'),
  maximizeToggle: () => ipcRenderer.send('window:maximize-toggle'),
  close: () => ipcRenderer.send('window:close'),
  autoUpdate: {
    checkForUpdates: () => ipcRenderer.invoke('autoUpdate:check'),
    quitAndInstall: (options?: { isSilent?: boolean; isForceRunAfter?: boolean }) =>
      ipcRenderer.invoke('autoUpdate:quitAndInstall', options),
    onChecking: (cb: () => void) => {
      const h = () => cb()
      ipcRenderer.on('autoUpdate:checking', h)
      return () => ipcRenderer.removeListener('autoUpdate:checking', h)
    },
    onAvailable: (cb: (info: unknown) => void) => {
      const h = (_e: Electron.IpcRendererEvent, info: unknown) => cb(info)
      ipcRenderer.on('autoUpdate:update-available', h)
      return () => ipcRenderer.removeListener('autoUpdate:update-available', h)
    },
    onNotAvailable: (cb: (info: unknown) => void) => {
      const h = (_e: Electron.IpcRendererEvent, info: unknown) => cb(info)
      ipcRenderer.on('autoUpdate:update-not-available', h)
      return () => ipcRenderer.removeListener('autoUpdate:update-not-available', h)
    },
    onProgress: (cb: (progress: { percent?: number }) => void) => {
      const h = (_e: Electron.IpcRendererEvent, p: { percent?: number }) => cb(p)
      ipcRenderer.on('autoUpdate:download-progress', h)
      return () => ipcRenderer.removeListener('autoUpdate:download-progress', h)
    },
    onDownloaded: (cb: (info: unknown) => void) => {
      const h = (_e: Electron.IpcRendererEvent, info: unknown) => cb(info)
      ipcRenderer.on('autoUpdate:update-downloaded', h)
      return () => ipcRenderer.removeListener('autoUpdate:update-downloaded', h)
    },
    onError: (cb: (error: string) => void) => {
      const h = (_e: Electron.IpcRendererEvent, err: unknown) =>
        cb(String((err as Error)?.message ?? err))
      ipcRenderer.on('autoUpdate:error', h)
      return () => ipcRenderer.removeListener('autoUpdate:error', h)
    },
  },
})
