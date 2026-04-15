import React from 'react'

type DraggableStyle = React.CSSProperties & {
  WebkitAppRegion?: 'drag' | 'no-drag'
}

type AuthMode = 'login' | 'register'
type AuthedUser = { id: number; username: string }

const AUTH_STORAGE_KEY = 'toolsmssql.auth.user'

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
  onAuthenticated: (user: AuthedUser) => void
}) {
  const [mode, setMode] = React.useState<AuthMode>('login')
  const [username, setUsername] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')
  const [showPassword, setShowPassword] = React.useState(false)
  const [busy, setBusy] = React.useState(false)
  const [submitError, setSubmitError] = React.useState<string | null>(null)
  const [didSubmit, setDidSubmit] = React.useState(false)

  const usernameInputRef = React.useRef<HTMLInputElement | null>(null)
  const passwordInputRef = React.useRef<HTMLInputElement | null>(null)
  const confirmInputRef = React.useRef<HTMLInputElement | null>(null)

  React.useEffect(() => {
    usernameInputRef.current?.focus()
  }, [])

  React.useEffect(() => {
    setSubmitError(null)
    setDidSubmit(false)
    setPassword('')
    setConfirmPassword('')
    requestAnimationFrame(() => usernameInputRef.current?.focus())
  }, [mode])

  const usernameTrimmed = username.trim()
  const usernameError =
    (didSubmit || username.length > 0) && usernameTrimmed.length < 3
      ? 'El usuario debe tener 3+ caracteres'
      : null
  const passwordError =
    (didSubmit || password.length > 0) && password.length < 6
      ? 'La contraseña debe tener 6+ caracteres'
      : null
  const confirmError =
    mode === 'register' && (didSubmit || confirmPassword.length > 0)
      ? confirmPassword !== password
        ? 'Las contraseñas no coinciden'
        : null
      : null

  const canSubmit =
    !busy &&
    usernameTrimmed.length >= 3 &&
    password.length >= 6 &&
    (mode === 'login' || confirmPassword === password)

  const submit = async () => {
    setDidSubmit(true)
    setSubmitError(null)

    if (usernameTrimmed.length < 3) {
      usernameInputRef.current?.focus()
      return
    }

    if (password.length < 6) {
      passwordInputRef.current?.focus()
      return
    }

    if (mode === 'register' && confirmPassword !== password) {
      confirmInputRef.current?.focus()
      return
    }

    setBusy(true)
    try {
      const auth = window.electronAPI?.auth
      if (!auth) {
        setSubmitError('Auth no disponible')
        return
      }

      const action = mode === 'register' ? auth.register : auth.login
      if (!action) {
        setSubmitError('Auth no disponible')
        return
      }

      const result = await action({ username: usernameTrimmed, password })

      if (!result.ok) {
        const code =
          'error' in result && typeof result.error === 'string'
            ? result.error
            : 'unknown'
        if (code === 'username-too-short') setSubmitError('El usuario debe tener 3+ caracteres')
        else if (code === 'password-too-short')
          setSubmitError('La contraseña debe tener 6+ caracteres')
        else if (code === 'username-exists') setSubmitError('Ese usuario ya existe')
        else if (code === 'invalid-credentials')
          setSubmitError('Usuario o contraseña incorrectos')
        else if (code === 'invalid-input') setSubmitError('Completa usuario y contraseña')
        else if (code === 'rate-limited')
          setSubmitError('Demasiados intentos. Espera un momento y prueba de nuevo')
        else setSubmitError('No se pudo completar la operación')
        return
      }

      try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(result.user))
      } catch {
        // ignore
      }

      onAuthenticated(result.user as AuthedUser)
    } finally {
      setBusy(false)
    }
  }

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key !== 'Enter') return
    e.preventDefault()
    if (!busy) void submit()
  }

  const colors = {
    bg: '#ffffff',
    fg: '#0f172a',
    muted: 'rgba(15, 23, 42, 0.68)',
    border: 'rgba(15, 23, 42, 0.12)',
    borderStrong: 'rgba(15, 23, 42, 0.18)',
    focusRing: 'rgba(37, 99, 235, 0.35)',
    primary: '#0f172a',
    primaryText: '#ffffff',
    danger: '#b91c1c',
  }

  const inputStyleBase: React.CSSProperties = {
    height: 44,
    borderRadius: 12,
    border: `1px solid ${colors.borderStrong}`,
    padding: '0 12px 0 42px',
    outline: 'none',
    width: '100%',
    fontSize: 14,
    color: colors.fg,
    background: colors.bg,
    boxSizing: 'border-box',
  }

  const fieldLabelStyle: React.CSSProperties = {
    fontSize: 12,
    color: colors.muted,
    marginBottom: 6,
  }

  const linkStyle: React.CSSProperties = {
    border: 'none',
    background: 'transparent',
    padding: 0,
    margin: 0,
    fontSize: 13,
    color: '#2563eb',
    cursor: 'pointer',
  }

  return (
    <div
      style={{
        width: 380,
        border: `1px solid ${colors.border}`,
        borderRadius: 16,
        background: colors.bg,
        padding: 22,
        boxShadow: '0 12px 30px rgba(15,23,42,0.08)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 650, letterSpacing: -0.2, color: colors.fg }}>
            {mode === 'login' ? 'Accede a tu cuenta' : 'Crea tu cuenta'}
          </div>
          <div style={{ fontSize: 13, marginTop: 6, color: colors.muted }}>
            {mode === 'login' ? 'Ingresa tus credenciales para continuar' : 'Completa tus datos para registrarte'}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
          style={linkStyle}
          disabled={busy}
        >
          {mode === 'login' ? 'Registrarse' : 'Iniciar sesión'}
        </button>
      </div>

      <div style={{ height: 18 }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <div style={fieldLabelStyle}>Usuario</div>
          <div style={{ position: 'relative' }}>
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 18,
                height: 18,
                color: colors.muted,
                pointerEvents: 'none',
              }}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                <path
                  d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4.418 0-8 2.015-8 4.5V20h16v-1.5c0-2.485-3.582-4.5-8-4.5Z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={onKeyDown}
              ref={usernameInputRef}
              autoComplete="username"
              aria-invalid={usernameError ? true : undefined}
              style={{
                ...inputStyleBase,
                borderColor: usernameError ? colors.danger : colors.borderStrong,
                boxShadow: usernameError ? `0 0 0 3px rgba(185, 28, 28, 0.12)` : undefined,
              }}
              disabled={busy}
            />
          </div>
          {usernameError ? (
            <div style={{ fontSize: 12, color: colors.danger, marginTop: 6 }}>{usernameError}</div>
          ) : null}
        </div>

        <div>
          <div style={fieldLabelStyle}>Contraseña</div>
          <div style={{ position: 'relative' }}>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={onKeyDown}
              ref={passwordInputRef}
              type={showPassword ? 'text' : 'password'}
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              aria-invalid={passwordError ? true : undefined}
              style={{
                ...inputStyleBase,
                paddingLeft: 12,
                paddingRight: 44,
                borderColor: passwordError ? colors.danger : colors.borderStrong,
                boxShadow: passwordError ? `0 0 0 3px rgba(185, 28, 28, 0.12)` : undefined,
              }}
              disabled={busy}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              style={
                {
                  WebkitAppRegion: 'no-drag',
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  height: 34,
                  width: 34,
                  borderRadius: 10,
                  border: `1px solid ${colors.border}`,
                  background: 'transparent',
                  display: 'grid',
                  placeItems: 'center',
                  color: colors.muted,
                  cursor: 'pointer',
                } as DraggableStyle
              }
              disabled={busy}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? (
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                  <path
                    d="M3 3l18 18"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                  <path
                    d="M10.6 10.6a2 2 0 0 0 2.8 2.8"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                  <path
                    d="M6.1 6.6C4.3 8 3.2 9.8 2.5 12c1.6 5 6 8 9.5 8 1.7 0 3.3-.5 4.7-1.3"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                  <path
                    d="M9.3 4.3A9.8 9.8 0 0 1 12 4c3.5 0 7.9 3 9.5 8-.5 1.6-1.2 3-2.2 4.1"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                  <path
                    d="M2.5 12c1.6-5 6-8 9.5-8s7.9 3 9.5 8c-1.6 5-6 8-9.5 8s-7.9-3-9.5-8Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 15.2A3.2 3.2 0 1 0 8.8 12 3.2 3.2 0 0 0 12 15.2Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                </svg>
              )}
            </button>
          </div>
          {passwordError ? (
            <div style={{ fontSize: 12, color: colors.danger, marginTop: 6 }}>{passwordError}</div>
          ) : null}
          {mode === 'login' ? (
            <div style={{ marginTop: 10 }}>
              <button type="button" style={{ ...linkStyle, fontSize: 12 }} disabled={busy}>
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          ) : null}
        </div>

        {mode === 'register' ? (
          <div>
            <div style={fieldLabelStyle}>Confirmar contraseña</div>
            <div style={{ position: 'relative' }}>
              <input
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={onKeyDown}
                ref={confirmInputRef}
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                aria-invalid={confirmError ? true : undefined}
                style={{
                  ...inputStyleBase,
                  paddingLeft: 12,
                  paddingRight: 12,
                  borderColor: confirmError ? colors.danger : colors.borderStrong,
                  boxShadow: confirmError ? `0 0 0 3px rgba(185, 28, 28, 0.12)` : undefined,
                }}
                disabled={busy}
              />
            </div>
            {confirmError ? (
              <div style={{ fontSize: 12, color: colors.danger, marginTop: 6 }}>{confirmError}</div>
            ) : null}
          </div>
        ) : null}

        {submitError ? (
          <div role="alert" style={{ fontSize: 12, color: colors.danger }}>
            {submitError}
          </div>
        ) : null}

        <button
          type="button"
          disabled={!canSubmit}
          onClick={submit}
          style={{
            height: 44,
            borderRadius: 12,
            border: `1px solid ${colors.primary}`,
            background: !canSubmit ? 'rgba(15,23,42,0.25)' : colors.primary,
            color: colors.primaryText,
            fontSize: 14,
            fontWeight: 650,
            letterSpacing: 0.2,
            cursor: !canSubmit ? 'not-allowed' : 'pointer',
            boxShadow: !canSubmit ? undefined : `0 10px 24px rgba(15,23,42,0.18)`,
          }}
        >
          {busy
            ? 'Procesando...'
            : mode === 'login'
              ? 'Iniciar sesión'
              : 'Registrarse'}
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
  const [user, setUser] = React.useState<AuthedUser | null>(null)

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as Partial<AuthedUser>
      if (typeof parsed?.id !== 'number') return
      if (typeof parsed?.username !== 'string') return
      setUser({ id: parsed.id, username: parsed.username })
    } catch {
      // ignore
    }
  }, [])

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
        {user ? (
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
            onClick={() => {
              try {
                localStorage.removeItem(AUTH_STORAGE_KEY)
              } catch {
                // ignore
              }
              setUser(null)
            }}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
          >
            Salir
          </button>
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
