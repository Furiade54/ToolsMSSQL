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
      scripts?: {
        create?: (payload?: {
          name?: string
          code?: string
          description?: string
        }) => Promise<
          | {
              ok: true
              script: {
                id: number
                name: string
                code: string
                description: string | null
                createdAt: string
              }
            }
          | { ok: false; error: string }
        >
        list?: () => Promise<
          | {
              ok: true
              scripts: Array<{
                id: number
                name: string
                code: string
                description: string | null
                createdAt: string
              }>
            }
          | { ok: false; error: string }
        >
        execute?: (payload?: { id?: number }) => Promise<
          | { ok: true; message: string }
          | { ok: false; error: string; message?: string }
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
