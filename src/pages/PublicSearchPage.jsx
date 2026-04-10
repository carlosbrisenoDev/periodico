import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useApiBaseUrl } from '../hooks/useApiBaseUrl'
import { apiRequest } from '../lib/apiClient'
import { ui } from '../lib/ui'

export const PublicSearchPage = () => {
  const baseUrl = useApiBaseUrl()
  const [searchParams, setSearchParams] = useSearchParams()
  const q = searchParams.get('q') ?? ''
  const [draftQ, setDraftQ] = useState(q)
  const [responseData, setResponseData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setDraftQ(q)
  }, [q])

  useEffect(() => {
    const loadSearch = async () => {
      if (!q.trim()) {
        setResponseData(null)
        setError('')
        return
      }

      setLoading(true)
      setError('')
      try {
        const response = await apiRequest(baseUrl, '/api/v1/public/search', {
          query: { q, limit: 10 },
        })
        setResponseData(response)
      } catch (requestError) {
        setError(
          requestError instanceof Error ? requestError.message : 'Error en búsqueda pública.',
        )
      } finally {
        setLoading(false)
      }
    }

    loadSearch()
  }, [baseUrl, q])

  const submitSearch = (event) => {
    event.preventDefault()
    setSearchParams(draftQ.trim() ? { q: draftQ } : {})
  }

  return (
    <section style={ui.card}>
      <h2 style={ui.cardTitle}>Buscar noticias</h2>
      <form onSubmit={submitSearch}>
        <div style={ui.row}>
          <input
            style={ui.input}
            value={draftQ}
            onChange={(event) => setDraftQ(event.target.value)}
            placeholder="Buscar artículos públicos..."
          />
          <button style={ui.button} type="submit">
            Buscar
          </button>
        </div>
      </form>
      {loading ? <p>Cargando...</p> : null}
      {error ? <p>Error: {error}</p> : null}
      {responseData?.items?.length ? (
        <ul style={ui.list}>
          {responseData.items.map((item) => (
            <li key={item.slug ?? item.id ?? item._id}>
              {item.title} {item.slug ? <Link to={`/articulo/${item.slug}`}>abrir</Link> : null}
            </li>
          ))}
        </ul>
      ) : (
        <p>{q ? 'Sin resultados.' : 'Escribe algo y busca.'}</p>
      )}
    </section>
  )
}
