import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApiBaseUrl } from '../hooks/useApiBaseUrl'
import { apiRequest } from '../lib/apiClient'
import { getId, ui } from '../lib/ui'

export const AdminAuthorsPage = () => {
  const baseUrl = useApiBaseUrl()
  const [authors, setAuthors] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const loadAuthors = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await apiRequest(baseUrl, '/api/v1/author')
      setAuthors(response ?? [])
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Error cargando autores.')
    } finally {
      setLoading(false)
    }
  }, [baseUrl])

  useEffect(() => {
    loadAuthors()
  }, [loadAuthors])

  const deleteAuthor = async (id) => {
    setMessage('')
    setError('')
    try {
      await apiRequest(baseUrl, `/api/v1/author/${id}`, { method: 'DELETE' })
      setMessage('Autor eliminado.')
      await loadAuthors()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Error eliminando autor.')
    }
  }

  return (
    <section style={ui.card}>
      <h2 style={ui.cardTitle}>Gestión de autores</h2>
      <div style={ui.row}>
        <button style={ui.button} type="button" onClick={loadAuthors}>
          Actualizar autores
        </button>
        <Link style={ui.link} to="/admin/autores/nuevo">
          Agregar autor
        </Link>
      </div>

      {loading ? <p>Cargando...</p> : null}
      {message ? <p>{message}</p> : null}
      {error ? <p>Error: {error}</p> : null}

      <h3>Listado de autores</h3>
      {authors.length ? (
        <ul style={ui.list}>
          {authors.map((author) => (
            <li key={getId(author)}>
              {author.name}{' '}
              <button style={ui.button} type="button" onClick={() => deleteAuthor(getId(author))}>
                Eliminar
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p>No hay autores.</p>
      )}
    </section>
  )
}
