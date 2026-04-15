import { app, BrowserWindow, ipcMain } from 'electron'
import { autoUpdater } from 'electron-updater'
import log from 'electron-log'
import crypto from 'node:crypto'
import path from 'node:path'
import Database from 'better-sqlite3'

let mainWindow: BrowserWindow | null = null
let autoUpdateInitialized = false
let db: Database.Database | null = null

function getWindowFromEvent(event: Electron.IpcMainEvent) {
  return BrowserWindow.fromWebContents(event.sender)
}

function ensureDb() {
  if (db) return db

  const dbPath = path.join(app.getPath('userData'), 'toolsmssql.db')
  const database = new Database(dbPath)

  database.pragma('journal_mode = WAL')
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_salt TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `)

  db = database
  return database
}

function hashPassword(password: string, saltHex: string) {
  const salt = Buffer.from(saltHex, 'hex')
  const derivedKey = crypto.scryptSync(password, salt, 64)
  return derivedKey.toString('hex')
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

ipcMain.handle(
  'auth:register',
  async (
    _event,
    payload?: { username?: string; password?: string },
  ): Promise<
    | { ok: true; user: { id: number; username: string } }
    | { ok: false; error: string }
  > => {
    try {
      const username = String(payload?.username ?? '').trim()
      const password = String(payload?.password ?? '')

      if (username.length < 3) return { ok: false, error: 'username-too-short' }
      if (password.length < 6) return { ok: false, error: 'password-too-short' }

      const database = ensureDb()
      const saltHex = crypto.randomBytes(16).toString('hex')
      const passwordHash = hashPassword(password, saltHex)
      const createdAt = new Date().toISOString()

      const stmt = database.prepare(
        'INSERT INTO users (username, password_salt, password_hash, created_at) VALUES (?, ?, ?, ?)',
      )
      const info = stmt.run(username, saltHex, passwordHash, createdAt)

      return {
        ok: true,
        user: { id: Number(info.lastInsertRowid), username },
      }
    } catch (e) {
      const msg = String((e as Error)?.message ?? e)
      if (msg.includes('UNIQUE') || msg.includes('unique')) {
        return { ok: false, error: 'username-exists' }
      }
      return { ok: false, error: 'register-failed' }
    }
  },
)

ipcMain.handle(
  'auth:login',
  async (
    _event,
    payload?: { username?: string; password?: string },
  ): Promise<
    | { ok: true; user: { id: number; username: string } }
    | { ok: false; error: string }
  > => {
    try {
      const username = String(payload?.username ?? '').trim()
      const password = String(payload?.password ?? '')

      if (!username || !password) return { ok: false, error: 'invalid-input' }

      const database = ensureDb()
      const row = database
        .prepare(
          'SELECT id, username, password_salt as passwordSalt, password_hash as passwordHash FROM users WHERE username = ?',
        )
        .get(username) as
        | {
            id: number
            username: string
            passwordSalt: string
            passwordHash: string
          }
        | undefined

      if (!row) return { ok: false, error: 'invalid-credentials' }

      const computed = hashPassword(password, row.passwordSalt)
      if (computed !== row.passwordHash)
        return { ok: false, error: 'invalid-credentials' }

      return { ok: true, user: { id: row.id, username: row.username } }
    } catch (e) {
      return { ok: false, error: 'login-failed' }
    }
  },
)

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
  ensureDb()
  initAutoUpdater()
  createMainWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
})
