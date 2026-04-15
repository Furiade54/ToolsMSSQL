export {}

declare global {
  interface Window {
    electronAPI?: {
      minimize?: () => void
      maximizeToggle?: () => void
      close?: () => void
      autoUpdate?: {
        checkForUpdates?: () => Promise<{ ok: boolean; error?: string }>
        quitAndInstall?: (options?: {
          isSilent?: boolean
          isForceRunAfter?: boolean
        }) => Promise<{ ok: boolean; error?: string }>
        onChecking?: (cb: () => void) => void | (() => void)
        onAvailable?: (cb: (info: unknown) => void) => void | (() => void)
        onNotAvailable?: (cb: (info: unknown) => void) => void | (() => void)
        onProgress?: (
          cb: (progress: { percent?: number }) => void,
        ) => void | (() => void)
        onDownloaded?: (cb: (info: unknown) => void) => void | (() => void)
        onError?: (cb: (error: string) => void) => void | (() => void)
      }
    }
  }
}
