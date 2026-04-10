import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { ui } from '../lib/ui'

export const RequireRole = ({ roles }) => {
  const { user, loadingSession } = useAuth()
  const location = useLocation()

  if (loadingSession) {
    return (
      <section style={ui.card}>
        <p>Cargando sesión...</p>
      </section>
    )
  }

  if (!user) {
    return <Navigate replace state={{ from: location }} to="/login" />
  }

  if (Array.isArray(roles) && roles.length > 0 && !roles.includes(user.role)) {
    return (
      <section style={ui.card}>
        <h2>Acceso denegado</h2>
        <p>No tienes permisos para ver esta sección.</p>
      </section>
    )
  }

  return <Outlet />
}
