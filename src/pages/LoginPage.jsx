import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { ui } from '../lib/ui'

export const LoginPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, login, logout, refreshSession, loadingSession, sessionError } = useAuth()
  const [email, setEmail] = useState('admin@periodico.com')
  const [password, setPassword] = useState('12345678')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const nextPath = location.state?.from?.pathname ?? '/panel'

  const handleLogin = async (event) => {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    setError('')

    try {
      const response = await login({ email, password })
      setMessage(response?.message ?? 'Bienvenido.')
      navigate(nextPath, { replace: true })
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'No se pudo iniciar sesión.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    setMessage('')
    setError('')

    try {
      const response = await logout()
      setMessage(response?.message ?? 'Sesión cerrada.')
    } catch (logoutError) {
      setError(logoutError instanceof Error ? logoutError.message : 'No se pudo cerrar sesión.')
    }
  }

  return (
    <section style={ui.card}>
      <h2 style={ui.cardTitle}>Acceso</h2>
      <p style={ui.muted}>
        Inicia sesión para acceder al panel editorial y la administración del sitio.
      </p>

      {user ? (
        <div style={ui.card}>
          <p>
            Sesión activa como <strong>{user.name}</strong> ({user.role})
          </p>
          <div style={ui.row}>
            <button style={ui.button} type="button" onClick={refreshSession} disabled={loadingSession}>
              Actualizar sesión
            </button>
            <button style={ui.button} type="button" onClick={handleLogout}>
              Cerrar sesión
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleLogin}>
          <div style={ui.column}>
            <label htmlFor="auth-email">Correo</label>
            <input
              id="auth-email"
              style={ui.input}
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
            <label htmlFor="auth-password">Contraseña</label>
            <input
              id="auth-password"
              style={ui.input}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
            <button style={ui.button} type="submit" disabled={loading}>
              {loading ? 'Entrando...' : 'Iniciar sesión'}
            </button>
          </div>
        </form>
      )}

      {message ? <p>{message}</p> : null}
      {error ? <p>Error: {error}</p> : null}
      {sessionError ? <p>Error de sesión: {sessionError}</p> : null}
    </section>
  )
}
