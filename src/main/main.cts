import { app, BrowserWindow, ipcMain } from 'electron'
import { autoUpdater } from 'electron-updater'
import log from 'electron-log'
import path from 'node:path'

let mainWindow: BrowserWindow | null = null
let autoUpdateInitialized = false

function getWindowFromEvent(event: Electron.IpcMainEvent) {
  return BrowserWindow.fromWebContents(event.sender)
}

function createMainWindow() {
  const win = new BrowserWindow({
    width: 1100,
    height: 750,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  mainWindow = win

  if (app.isPackaged) {
    win.loadFile(path.join(__dirname, '../renderer/index.html'))
  } else {
    win.loadURL('http://localhost:5173')
  }

  return win
}

function sendUpdate(channel: string, payload: unknown) {
  const win = BrowserWindow.getFocusedWindow() ?? mainWindow
  if (!win) return
  win.webContents.send(channel, payload)
}

function initAutoUpdater() {
  if (!app.isPackaged) return
  if (autoUpdateInitialized) return
  autoUpdateInitialized = true

  log.transports.file.level = 'info'
  autoUpdater.logger = log

  autoUpdater.on('checking-for-update', () => sendUpdate('autoUpdate:checking', null))
  autoUpdater.on('update-available', (info) =>
    sendUpdate('autoUpdate:update-available', info),
  )
  autoUpdater.on('update-not-available', (info) =>
    sendUpdate('autoUpdate:update-not-available', info),
  )
  autoUpdater.on('download-progress', (p) =>
    sendUpdate('autoUpdate:download-progress', p),
  )
  autoUpdater.on('update-downloaded', (info) =>
    sendUpdate('autoUpdate:update-downloaded', info),
  )
  autoUpdater.on('error', (err) =>
    sendUpdate('autoUpdate:error', String((err as Error)?.message ?? err)),
  )
}

ipcMain.on('window:minimize', (event) => getWindowFromEvent(event)?.minimize())

ipcMain.on('window:maximize-toggle', (event) => {
  const win = getWindowFromEvent(event)
  if (!win) return
  win.isMaximized() ? win.restore() : win.maximize()
})

ipcMain.on('window:close', (event) => getWindowFromEvent(event)?.close())

ipcMain.handle('autoUpdate:check', async () => {
  if (!app.isPackaged) return { ok: false, error: 'dev-mode' }
  try {
    initAutoUpdater()
    await autoUpdater.checkForUpdates()
    return { ok: true }
  } catch (e) {
    return { ok: false, error: String((e as Error)?.message ?? e) }
  }
})

ipcMain.handle(
  'autoUpdate:quitAndInstall',
  async (_event, options?: { isSilent?: boolean; isForceRunAfter?: boolean }) => {
    if (!app.isPackaged) return { ok: false, error: 'dev-mode' }
    try {
      const isSilent = options?.isSilent ?? false
      const isForceRunAfter = options?.isForceRunAfter ?? true
      autoUpdater.quitAndInstall(isSilent, isForceRunAfter)
      return { ok: true }
    } catch (e) {
      return { ok: false, error: String((e as Error)?.message ?? e) }
    }
  },
)

app.whenReady().then(() => {
  initAutoUpdater()
  createMainWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
})
