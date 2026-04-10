import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApiBaseUrl } from '../hooks/useApiBaseUrl'
import { apiRequest } from '../lib/apiClient'
import { getId, ui } from '../lib/ui'

export const AdminArticlesPage = () => {
  const baseUrl = useApiBaseUrl()
  const [statusFilter, setStatusFilter] = useState('')
  const [qFilter, setQFilter] = useState('')
  const [pageFilter, setPageFilter] = useState('1')
  const [limitFilter, setLimitFilter] = useState('10')
  const [responseData, setResponseData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const queryFilters = useMemo(
    () => ({
      status: statusFilter,
      q: qFilter,
      page: pageFilter,
      limit: limitFilter,
    }),
    [limitFilter, pageFilter, qFilter, statusFilter],
  )

  const loadArticles = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await apiRequest(baseUrl, '/api/v1/article', { query: queryFilters })
      setResponseData(response)
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : 'Error cargando artículos admin.',
      )
    } finally {
      setLoading(false)
    }
  }, [baseUrl, queryFilters])

  useEffect(() => {
    loadArticles()
  }, [loadArticles])

  const executeAction = async (action, successMessage) => {
    setMessage('')
    setError('')
    try {
      await action()
      setMessage(successMessage)
      await loadArticles()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Error en acción admin.')
    }
  }

  const submitFilters = (event) => {
    event.preventDefault()
    loadArticles()
  }

  return (
    <section style={ui.card}>
      <h2 style={ui.cardTitle}>Gestión de artículos</h2>

      <form onSubmit={submitFilters}>
        <div style={ui.row}>
          <select
            style={ui.input}
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="">Todos los estados</option>
            <option value="draft">draft</option>
            <option value="published">published</option>
            <option value="scheduled">scheduled</option>
          </select>
          <input
            style={ui.input}
            value={qFilter}
            onChange={(event) => setQFilter(event.target.value)}
            placeholder="Buscar por q"
          />
          <input
            style={ui.input}
            value={pageFilter}
            onChange={(event) => setPageFilter(event.target.value)}
            placeholder="Page"
          />
          <input
            style={ui.input}
            value={limitFilter}
            onChange={(event) => setLimitFilter(event.target.value)}
            placeholder="Limit"
          />
          <button style={ui.button} type="submit">
            Filtrar
          </button>
        </div>
      </form>

      <div style={ui.row}>
        <Link to="/admin/articulos/nuevo">Crear artículo nuevo</Link>
      </div>

      {loading ? <p>Cargando...</p> : null}
      {message ? <p>{message}</p> : null}
      {error ? <p>Error: {error}</p> : null}

      {responseData?.items?.length ? (
        responseData.items.map((article) => {
          const articleId = getId(article)
          return (
            <article key={articleId || article.slug} style={ui.card}>
              <h3>{article.title}</h3>
              <p>Estado: {article.status}</p>
              <p>Destacado: {String(Boolean(article.isFeatured))}</p>
              <p>
                {article.slug ? <Link to={`/articulo/${article.slug}`}>Ver público</Link> : null}
              </p>
              <div style={ui.row}>
                <button
                  style={ui.button}
                  type="button"
                  onClick={() =>
                    executeAction(
                      () =>
                        apiRequest(baseUrl, `/api/v1/article/${articleId}/duplicate`, {
                          method: 'POST',
                        }),
                      'Artículo duplicado.',
                    )
                  }
                >
                  Duplicar
                </button>
                <button
                  style={ui.button}
                  type="button"
                  onClick={() =>
                    executeAction(
                      () =>
                        apiRequest(baseUrl, `/api/v1/article/${articleId}/publish-now`, {
                          method: 'POST',
                        }),
                      'Artículo publicado ahora.',
                    )
                  }
                >
                  Publicar ahora
                </button>
                <button
                  style={ui.button}
                  type="button"
                  onClick={() =>
                    executeAction(
                        () =>
                        apiRequest(baseUrl, `/api/v1/article/${articleId}/feature`, {
                          method: 'PATCH',
                          body: { isFeatured: !article.isFeatured },
                        }),
                      'Estado de destacado actualizado.',
                    )
                  }
                >
                  Destacar / quitar
                </button>
                <button
                  style={ui.button}
                  type="button"
                  onClick={() =>
                    executeAction(
                      () =>
                        apiRequest(baseUrl, `/api/v1/article/${articleId}`, {
                          method: 'DELETE',
                        }),
                      'Artículo eliminado.',
                    )
                  }
                >
                  Eliminar
                </button>
              </div>
            </article>
          )
        })
      ) : (
        <p>No hay artículos en este filtro.</p>
      )}
    </section>
  )
}
