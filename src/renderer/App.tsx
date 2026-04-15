import React from 'react'

type DraggableStyle = React.CSSProperties & {
  WebkitAppRegion?: 'drag' | 'no-drag'
}

function WindowControls() {
  return (
    <div style={{ WebkitAppRegion: 'no-drag' } as DraggableStyle}>
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          type="button"
          aria-label="Minimizar"
          title="Minimizar"
          onClick={() => window.electronAPI?.minimize?.()}
          style={{
            height: 28,
            width: 36,
            borderRadius: 6,
            border: '1px solid rgba(0,0,0,0.12)',
            background: 'white',
          }}
        >
          –
        </button>
        <button
          type="button"
          aria-label="Maximizar / Restaurar"
          title="Maximizar / Restaurar"
          onClick={() => window.electronAPI?.maximizeToggle?.()}
          style={{
            height: 28,
            width: 36,
            borderRadius: 6,
            border: '1px solid rgba(0,0,0,0.12)',
            background: 'white',
          }}
        >
          □
        </button>
        <button
          type="button"
          aria-label="Cerrar"
          title="Cerrar"
          onClick={() => window.electronAPI?.close?.()}
          style={{
            height: 28,
            width: 36,
            borderRadius: 6,
            border: '1px solid rgba(0,0,0,0.12)',
            background: 'white',
          }}
        >
          ×
        </button>
      </div>
    </div>
  )
}

function UpdateButton() {
  const [updateReady, setUpdateReady] = React.useState(false)
  const [status, setStatus] = React.useState<string | null>(null)
  const [progress, setProgress] = React.useState<number | null>(null)

  React.useEffect(() => {
    const au = window.electronAPI?.autoUpdate
    if (!au) return

    const offChecking = au.onChecking?.(() => {
      setStatus('Buscando actualizaciones...')
      setProgress(null)
      setUpdateReady(false)
    })
    const offNotAvailable = au.onNotAvailable?.(() => {
      setStatus('Sin actualizaciones')
      setProgress(null)
      setUpdateReady(false)
    })
    const offAvailable = au.onAvailable?.(() => {
      setStatus('Actualización disponible')
      setProgress(null)
      setUpdateReady(false)
    })
    const offProgress = au.onProgress?.((p) => {
      setStatus('Descargando...')
      setProgress(typeof p?.percent === 'number' ? p.percent : null)
    })
    const offDownloaded = au.onDownloaded?.(() => {
      setStatus('Lista para instalar')
      setProgress(100)
      setUpdateReady(true)
    })
    const offError = au.onError?.((err) => {
      setStatus(err || 'Error de actualización')
      setProgress(null)
      setUpdateReady(false)
    })

    return () => {
      offChecking?.()
      offNotAvailable?.()
      offAvailable?.()
      offProgress?.()
      offDownloaded?.()
      offError?.()
    }
  }, [])

  const isDownloading =
    status === 'Descargando...' &&
    typeof progress === 'number' &&
    progress < 100

  const label = updateReady
    ? 'Reiniciar para actualizar'
    : isDownloading
      ? `Descargando ${Math.round(progress ?? 0)}%`
      : 'Update'

  return (
    <button
      type="button"
      style={
        {
          WebkitAppRegion: 'no-drag',
          borderRadius: 999,
          border: '1px solid rgba(0,0,0,0.12)',
          background: 'white',
          padding: '6px 10px',
          fontSize: 12,
          height: 28,
        } as DraggableStyle
      }
      aria-label={label}
      title={status ?? label}
      disabled={isDownloading}
      onClick={async () => {
        const au = window.electronAPI?.autoUpdate
        if (!au) return

        if (updateReady) {
          await au.quitAndInstall?.({ isSilent: false, isForceRunAfter: true })
          return
        }

        const result = await au.checkForUpdates?.()
        if (!result?.ok) {
          setStatus(
            result?.error === 'dev-mode'
              ? 'Updates solo en producción'
              : result?.error ?? 'No se pudo buscar updates',
          )
        }
      }}
    >
      {label}
    </button>
  )
}

export default function App() {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div
        style={
          {
            WebkitAppRegion: 'drag',
            height: 44,
            display: 'flex',
            alignItems: 'center',
            padding: '0 10px',
            gap: 10,
            borderBottom: '1px solid rgba(0,0,0,0.08)',
            background: '#f8fafc',
          } as DraggableStyle
        }
      >
        <div style={{ fontSize: 13, opacity: 0.75 }}>ElectronBase</div>
        <div style={{ flex: 1 }} />
        <UpdateButton />
        <WindowControls />
      </div>
      <main
        style={{
          flex: 1,
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <h1 style={{ margin: 0, fontSize: 42 }}>hola mundo</h1>
      </main>
    </div>
  )
}
