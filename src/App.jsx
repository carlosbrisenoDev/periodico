import { useState } from 'react'
import { NavLink, Outlet, Route, Routes } from 'react-router-dom'
import { RequireRole } from './components/RequireRole'
import { useAuth } from './context/useAuth'
import { API_BASE_URL } from './lib/apiClient'
import { ui } from './lib/ui'
import { AdminArticlesPage } from './pages/AdminArticlesPage'
import { AdminAuthorsPage } from './pages/AdminAuthorsPage'
import { AdminCategoriesPage } from './pages/AdminCategoriesPage'
import { AdminImagesPage } from './pages/AdminImagesPage'
import { AdminUsersPage } from './pages/AdminUsersPage'
import { DashboardPage } from './pages/DashboardPage'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { NewArticlePage } from './pages/NewArticlePage'
import { NewAuthorPage } from './pages/NewAuthorPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { PublicArchivePage } from './pages/PublicArchivePage'
import { PublicArticlePage } from './pages/PublicArticlePage'
import { PublicCategoryPage } from './pages/PublicCategoryPage'
import { PublicSearchPage } from './pages/PublicSearchPage'

const publicLinks = [
  { to: '/', label: 'Inicio' },
  { to: '/buscar?q=', label: 'Buscar noticias' },
  { to: '/archivo/2026/4', label: 'Archivo mensual' },
]

const editorLinks = [
  { to: '/panel', label: 'Panel' },
  { to: '/admin/articulos', label: 'Artículos' },
  { to: '/admin/articulos/nuevo', label: 'Nuevo artículo' },
  { to: '/admin/imagenes', label: 'Biblioteca de imágenes' },
]

const adminLinks = [
  { to: '/admin/categorias', label: 'Categorías' },
  { to: '/admin/autores', label: 'Autores' },
  { to: '/admin/autores/nuevo', label: 'Nuevo autor' },
  { to: '/admin/usuarios', label: 'Usuarios' },
]

const navLinkStyle = ({ isActive }) => {
  return {
    ...ui.link,
    border: '1px solid #8f8f8f',
    padding: '6px 10px',
    color: '#111',
    background: isActive ? '#ddd' : '#fff',
    display: 'inline-block',
  }
}

function AppLayout() {
  const { user, loadingSession, logout } = useAuth()
  const [logoutError, setLogoutError] = useState('')
  const canManageContent = user && ['admin', 'editor'].includes(user.role)
  const isAdmin = user?.role === 'admin'

  const handleLogout = async () => {
    setLogoutError('')
    try {
      await logout()
    } catch (error) {
      setLogoutError(error instanceof Error ? error.message : 'No se pudo cerrar sesión.')
    }
  }

  return (
    <div style={ui.page}>
      <header style={ui.card}>
        <h1 style={ui.cardTitle}>Periódico Digital</h1>

        <h3 style={ui.sectionTitle}>Secciones públicas</h3>
        <nav style={ui.row}>
          {publicLinks.map((link) => (
            <NavLink key={link.to} style={navLinkStyle} to={link.to}>
              {link.label}
            </NavLink>
          ))}
          {!user && !loadingSession ? (
            <NavLink style={navLinkStyle} to="/login">
              Iniciar sesión
            </NavLink>
          ) : null}
        </nav>

        {loadingSession ? <p>Cargando sesión...</p> : null}
        {user ? (
          <div style={ui.card}>
            <p>
              Sesión activa como <strong>{user.name}</strong> ({user.role})
            </p>
            <div style={ui.row}>
              {canManageContent ? (
                editorLinks.map((link) => (
                  <NavLink key={link.to} style={navLinkStyle} to={link.to}>
                    {link.label}
                  </NavLink>
                ))
              ) : null}
              {isAdmin
                ? adminLinks.map((link) => (
                    <NavLink key={link.to} style={navLinkStyle} to={link.to}>
                      {link.label}
                    </NavLink>
                  ))
                : null}
              <button style={ui.button} type="button" onClick={handleLogout}>
                Cerrar sesión
              </button>
            </div>
            {logoutError ? <p>Error: {logoutError}</p> : null}
          </div>
        ) : null}
      </header>

      <Outlet context={{ baseUrl: API_BASE_URL }} />
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" index element={<HomePage />} />
        <Route path="/articulo/:slug" element={<PublicArticlePage />} />
        <Route path="/categoria/:slug" element={<PublicCategoryPage />} />
        <Route path="/buscar" element={<PublicSearchPage />} />
        <Route path="/archivo/:year/:month" element={<PublicArchivePage />} />
        <Route path="/login" element={<LoginPage />} />

        <Route element={<RequireRole />}>
          <Route path="/panel" element={<DashboardPage />} />
        </Route>

        <Route element={<RequireRole roles={['admin', 'editor']} />}>
          <Route path="/admin/articulos" element={<AdminArticlesPage />} />
          <Route path="/admin/articulos/nuevo" element={<NewArticlePage />} />
          <Route path="/admin/imagenes" element={<AdminImagesPage />} />
        </Route>

        <Route element={<RequireRole roles={['admin']} />}>
          <Route path="/admin/categorias" element={<AdminCategoriesPage />} />
          <Route path="/admin/autores" element={<AdminAuthorsPage />} />
          <Route path="/admin/autores/nuevo" element={<NewAuthorPage />} />
          <Route path="/admin/usuarios" element={<AdminUsersPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default App
