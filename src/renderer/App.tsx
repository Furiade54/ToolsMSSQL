import React from 'react'

type DraggableStyle = React.CSSProperties & {
  WebkitAppRegion?: 'drag' | 'no-drag'
}

type AuthMode = 'login' | 'register'
type AuthedUser = { id: number; username: string }

const AUTH_STORAGE_KEY = 'toolsmssql.auth.user'

function ScriptFormModal({
  open,
  onClose,
  onSave,
}: {
  open: boolean
  onClose: () => void
  onSave: (payload: { name: string; code: string; description: string }) => Promise<
    | { ok: true; script: { id: number; name: string } }
    | { ok: false; error: string }
  >
}) {
  const [name, setName] = React.useState('')
  const [code, setCode] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [didSubmit, setDidSubmit] = React.useState(false)
  const [busy, setBusy] = React.useState(false)
  const [submitError, setSubmitError] = React.useState<string | null>(null)

  const nameRef = React.useRef<HTMLInputElement | null>(null)

  React.useEffect(() => {
    if (!open) return
    setDidSubmit(false)
    setSubmitError(null)
    setName('')
    setCode('')
    setDescription('')
    requestAnimationFrame(() => nameRef.current?.focus())
  }, [open])

  React.useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  const nameTrimmed = name.trim()
  const nameError =
    (didSubmit || name.length > 0) && nameTrimmed.length === 0
      ? 'Ingresa un nombre'
      : null
  const codeError =
    (didSubmit || code.length > 0) && code.trim().length === 0
      ? 'Ingresa el código del script'
      : null

  const canSave = nameTrimmed.length > 0 && code.trim().length > 0

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={
        {
          WebkitAppRegion: 'no-drag',
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.45)',
          display: 'grid',
          placeItems: 'center',
          padding: 18,
          zIndex: 50,
        } as DraggableStyle
      }
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        style={{
          width: 'min(820px, 100%)',
          borderRadius: 16,
          border: '1px solid rgba(15, 23, 42, 0.12)',
          background: 'white',
          boxShadow: '0 24px 70px rgba(15, 23, 42, 0.25)',
          padding: 18,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 650, color: '#0f172a' }}>
              Nuevo script MSSQL
            </div>
            <div style={{ fontSize: 13, marginTop: 6, color: 'rgba(15, 23, 42, 0.68)' }}>
              Completa los campos para agregar un nuevo script
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              height: 34,
              width: 34,
              borderRadius: 10,
              border: '1px solid rgba(15, 23, 42, 0.12)',
              background: 'white',
              cursor: 'pointer',
              display: 'grid',
              placeItems: 'center',
              color: 'rgba(15, 23, 42, 0.7)',
            }}
            aria-label="Cerrar"
            title="Cerrar"
          >
            ×
          </button>
        </div>

        <div style={{ height: 16 }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, color: 'rgba(15, 23, 42, 0.68)', marginBottom: 6 }}>
              Nombre Scrip
            </div>
            <input
              ref={nameRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={nameError ? true : undefined}
              disabled={busy}
              style={{
                height: 44,
                borderRadius: 12,
                border: `1px solid ${nameError ? '#b91c1c' : 'rgba(15, 23, 42, 0.18)'}`,
                padding: '0 12px',
                outline: 'none',
                width: '100%',
                fontSize: 14,
                boxSizing: 'border-box',
              }}
            />
            {nameError ? (
              <div style={{ fontSize: 12, color: '#b91c1c', marginTop: 6 }}>{nameError}</div>
            ) : null}
          </div>

          <div>
            <div style={{ fontSize: 12, color: 'rgba(15, 23, 42, 0.68)', marginBottom: 6 }}>
              Codigo del Script
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              aria-invalid={codeError ? true : undefined}
              disabled={busy}
              style={{
                minHeight: 220,
                resize: 'vertical',
                borderRadius: 12,
                border: `1px solid ${codeError ? '#b91c1c' : 'rgba(15, 23, 42, 0.18)'}`,
                padding: 12,
                outline: 'none',
                width: '100%',
                fontSize: 13,
                lineHeight: 1.45,
                boxSizing: 'border-box',
                fontFamily:
                  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
              }}
              placeholder="SELECT 1;"
            />
            {codeError ? (
              <div style={{ fontSize: 12, color: '#b91c1c', marginTop: 6 }}>{codeError}</div>
            ) : null}
          </div>

          <div>
            <div style={{ fontSize: 12, color: 'rgba(15, 23, 42, 0.68)', marginBottom: 6 }}>
              Descripción
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={busy}
              style={{
                minHeight: 90,
                resize: 'vertical',
                borderRadius: 12,
                border: '1px solid rgba(15, 23, 42, 0.18)',
                padding: 12,
                outline: 'none',
                width: '100%',
                fontSize: 13,
                lineHeight: 1.45,
                boxSizing: 'border-box',
              }}
              placeholder="Describe qué hace el script…"
            />
          </div>
        </div>

        <div style={{ height: 16 }} />

        {submitError ? (
          <div role="alert" style={{ fontSize: 12, color: '#b91c1c' }}>
            {submitError}
          </div>
        ) : null}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            style={{
              height: 40,
              borderRadius: 12,
              border: '1px solid rgba(15, 23, 42, 0.12)',
              background: 'white',
              padding: '0 12px',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!canSave || busy}
            onClick={async () => {
              setDidSubmit(true)
              setSubmitError(null)
              if (!canSave) return

              setBusy(true)
              try {
                const result = await onSave({
                  name: nameTrimmed,
                  code,
                  description: description.trim(),
                })
                if (!result.ok) {
                  setSubmitError('No se pudo guardar el script')
                  return
                }
                onClose()
              } finally {
                setBusy(false)
              }
            }}
            style={{
              height: 40,
              borderRadius: 12,
              border: '1px solid rgba(15, 23, 42, 1)',
              background: !canSave || busy ? 'rgba(15, 23, 42, 0.25)' : '#0f172a',
              color: 'white',
              padding: '0 14px',
              fontSize: 13,
              fontWeight: 650,
              cursor: !canSave || busy ? 'not-allowed' : 'pointer',
            }}
          >
            {busy ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
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
  const [isScriptFormOpen, setIsScriptFormOpen] = React.useState(false)
  const [scripts, setScripts] = React.useState<
    Array<{
      id: number
      name: string
      code: string
      description: string | null
      createdAt: string
    }>
  >([])
  const [runMessage, setRunMessage] = React.useState<string | null>(null)

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

  React.useEffect(() => {
    if (!user) return
    const api = window.electronAPI?.scripts
    if (!api?.list) return

    ;(async () => {
      const result = await api.list?.()
      if (result?.ok) setScripts(result.scripts)
    })()
  }, [user])

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
          <div
            style={{
              width: '100%',
              maxWidth: 980,
              padding: '26px 38px',
              justifySelf: 'stretch',
              alignSelf: 'stretch',
            }}
          >
            <ScriptFormModal
              open={isScriptFormOpen}
              onClose={() => setIsScriptFormOpen(false)}
              onSave={async (payload) => {
                const api = window.electronAPI?.scripts
                if (!api?.create) return { ok: false, error: 'no-api' }
                const res = await api.create(payload)
                if (res.ok) {
                  setScripts((prev) => [res.script, ...prev])
                  return { ok: true, script: { id: res.script.id, name: res.script.name } }
                }
                return { ok: false, error: res.error }
              }}
            />
            <div
              style={{
                fontSize: 16,
                color: 'rgba(15, 23, 42, 0.65)',
                marginTop: 12,
                marginLeft: 14,
              }}
            >
              Anadir Scripts MSSQL (Haga clic en el boton + se abrirá un formulario para agregar un nuevo script )
            </div>

            {runMessage ? (
              <div
                role="status"
                style={{
                  marginTop: 10,
                  marginLeft: 14,
                  fontSize: 12,
                  color: 'rgba(15, 23, 42, 0.7)',
                }}
              >
                {runMessage}
              </div>
            ) : null}

            <button
              type="button"
              aria-label="Añadir script"
              title="Añadir script"
              style={
                {
                  WebkitAppRegion: 'no-drag',
                  position: 'fixed',
                  right: 28,
                  bottom: 28,
                  height: 64,
                  width: 64,
                  borderRadius: 999,
                  border: '1px solid rgba(15, 23, 42, 0.14)',
                  background: '#0f172a',
                  cursor: 'pointer',
                  display: 'grid',
                  placeItems: 'center',
                  boxShadow:
                    '0 12px 24px rgba(15, 23, 42, 0.24), 0 0 0 6px rgba(15, 23, 42, 0.08)',
                  zIndex: 20,
                } as DraggableStyle
              }
              onClick={() => setIsScriptFormOpen(true)}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M12 5v14M5 12h14"
                  stroke="rgba(255,255,255,0.92)"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            {scripts.length > 0 ? (
              <div style={{ marginTop: 26, marginLeft: 44 }}>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 10,
                    alignItems: 'flex-start',
                  }}
                >
                  {scripts.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      style={{
                        height: 40,
                        borderRadius: 12,
                        border: '1px solid rgba(15, 23, 42, 0.18)',
                        background: 'white',
                        padding: '0 14px',
                        fontSize: 13,
                        cursor: 'pointer',
                      }}
                      title={s.description ?? s.name}
                      onClick={async () => {
                        const api = window.electronAPI?.scripts
                        if (!api?.execute) {
                          setRunMessage('No se pudo ejecutar: API no disponible')
                          return
                        }
                        const result = await api.execute({ id: s.id })
                        if (result.ok) {
                          setRunMessage(result.message)
                          return
                        }
                        const map: Record<string, string> = {
                          'missing-server': 'Configura MSSQL_SERVER',
                          'missing-database': 'Configura MSSQL_DATABASE',
                          'missing-credentials': 'Configura MSSQL_USER y MSSQL_PASSWORD',
                          'execute-failed': 'Error ejecutando el script',
                        }
                        setRunMessage(map[result.error] ?? result.message ?? 'No se pudo ejecutar')
                      }}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <AuthCard onAuthenticated={(u) => setUser(u)} />
        )}
      </main>
    </div>
  )
}
