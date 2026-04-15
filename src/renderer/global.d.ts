export {}

declare global {
  interface Window {
    electronAPI?: {
      minimize?: () => void
      maximizeToggle?: () => void
      close?: () => void
      auth?: {
        register?: (payload?: {
          username?: string
          password?: string
        }) => Promise<
          | { ok: true; user: { id: number; username: string } }
          | { ok: false; error: string }
        >
        login?: (payload?: {
          username?: string
          password?: string
        }) => Promise<
          | { ok: true; user: { id: number; username: string } }
          | { ok: false; error: string }
        >
      }
      autoUpdate?: {
        checkForUpdates?: () => Promise<{ ok: boolean; error?: string }>
        quitAndInstall?: (options?: {
          isSilent?: boolean
          isForceRunAfter?: boolean
        }) => Promise<{ ok: boolean; error?: string }>
        onChecking?: (cb: () => void) => (() => void) | undefined
        onAvailable?: (cb: (info: unknown) => void) => (() => void) | undefined
        onNotAvailable?: (cb: (info: unknown) => void) => (() => void) | undefined
        onProgress?: (
          cb: (progress: { percent?: number }) => void,
        ) => (() => void) | undefined
        onDownloaded?: (cb: (info: unknown) => void) => (() => void) | undefined
        onError?: (cb: (error: string) => void) => (() => void) | undefined
      }
    }
  }
}
