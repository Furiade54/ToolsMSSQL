import React from 'react'

type DraggableStyle = React.CSSProperties & {
  WebkitAppRegion?: 'drag' | 'no-drag'
}

type AuthMode = 'login' | 'register'

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

function AuthCard({
  onAuthenticated,
}: {
  onAuthenticated: (user: { id: number; username: string }) => void
}) {
  const [mode, setMode] = React.useState<AuthMode>('login')
  const [username, setUsername] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const canSubmit = username.trim().length >= 3 && password.length >= 6

  const submit = async () => {
    setError(null)
    setBusy(true)
    try {
      const auth = window.electronAPI?.auth
      if (!auth) {
        setError('Auth no disponible')
        return
      }

      const result =
        mode === 'register'
          ? await auth.register?.({ username, password })
          : await auth.login?.({ username, password })

      if (!result?.ok) {
        const code = result?.error ?? 'unknown'
        if (code === 'username-too-short') setError('El usuario debe tener 3+ caracteres')
        else if (code === 'password-too-short') setError('La contraseña debe tener 6+ caracteres')
        else if (code === 'username-exists') setError('Ese usuario ya existe')
        else if (code === 'invalid-credentials') setError('Usuario o contraseña incorrectos')
        else if (code === 'invalid-input') setError('Completa usuario y contraseña')
        else setError('No se pudo completar la operación')
        return
      }

      onAuthenticated(result.user)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      style={{
        width: 360,
        border: '1px solid rgba(0,0,0,0.12)',
        borderRadius: 12,
        background: 'white',
        padding: 16,
        boxShadow: '0 12px 30px rgba(15,23,42,0.08)',
      }}
    >
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button
          type="button"
          onClick={() => {
            setMode('login')
            setError(null)
          }}
          style={{
            flex: 1,
            height: 34,
            borderRadius: 10,
            border: '1px solid rgba(0,0,0,0.12)',
            background: mode === 'login' ? '#0f172a' : 'white',
            color: mode === 'login' ? 'white' : '#0f172a',
          }}
        >
          Iniciar sesión
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('register')
            setError(null)
          }}
          style={{
            flex: 1,
            height: 34,
            borderRadius: 10,
            border: '1px solid rgba(0,0,0,0.12)',
            background: mode === 'register' ? '#0f172a' : 'white',
            color: mode === 'register' ? 'white' : '#0f172a',
          }}
        >
          Registrarse
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 12, opacity: 0.75 }}>Usuario</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            style={{
              height: 36,
              borderRadius: 10,
              border: '1px solid rgba(0,0,0,0.12)',
              padding: '0 10px',
              outline: 'none',
            }}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 12, opacity: 0.75 }}>Contraseña</span>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            style={{
              height: 36,
              borderRadius: 10,
              border: '1px solid rgba(0,0,0,0.12)',
              padding: '0 10px',
              outline: 'none',
            }}
          />
        </label>

        {error ? (
          <div style={{ fontSize: 12, color: '#b91c1c' }}>{error}</div>
        ) : null}

        <button
          type="button"
          disabled={!canSubmit || busy}
          onClick={submit}
          style={{
            height: 38,
            borderRadius: 10,
            border: '1px solid rgba(0,0,0,0.12)',
            background: !canSubmit || busy ? 'rgba(15,23,42,0.15)' : '#0f172a',
            color: !canSubmit || busy ? '#0f172a' : 'white',
          }}
        >
          {mode === 'register' ? 'Crear cuenta' : 'Entrar'}
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
      if (typeof offChecking === 'function') offChecking()
      if (typeof offNotAvailable === 'function') offNotAvailable()
      if (typeof offAvailable === 'function') offAvailable()
      if (typeof offProgress === 'function') offProgress()
      if (typeof offDownloaded === 'function') offDownloaded()
      if (typeof offError === 'function') offError()
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
  const [user, setUser] = React.useState<{ id: number; username: string } | null>(
    null,
  )

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
        <div style={{ fontSize: 13, opacity: 0.75 }}>ToolsMSSQL</div>
        <div style={{ flex: 1 }} />
        {user ? (
          <div
            style={
              {
                WebkitAppRegion: 'no-drag',
                fontSize: 12,
                opacity: 0.8,
              } as DraggableStyle
            }
          >
            {user.username}
          </div>
        ) : null}
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
        {user ? (
          <h1 style={{ margin: 0, fontSize: 42 }}>hola mundo</h1>
        ) : (
          <AuthCard onAuthenticated={(u) => setUser(u)} />
        )}
      </main>
    </div>
  )
}
