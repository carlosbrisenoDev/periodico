import { useCallback, useEffect, useState } from 'react'
import { useApiBaseUrl } from '../hooks/useApiBaseUrl'
import { apiRequest } from '../lib/apiClient'
import { ui } from '../lib/ui'

export const DashboardPage = () => {
  const baseUrl = useApiBaseUrl()
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const loadSummary = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await apiRequest(baseUrl, '/api/v1/dashboard/summary')
      setSummary(response)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Error en dashboard.')
    } finally {
      setLoading(false)
    }
  }, [baseUrl])

  useEffect(() => {
    loadSummary()
  }, [loadSummary])

  return (
    <section style={ui.card}>
      <h2 style={ui.cardTitle}>Panel editorial</h2>
      <button style={ui.button} type="button" onClick={loadSummary}>
        Actualizar panel
      </button>
      {loading ? <p>Cargando...</p> : null}
      {error ? <p>Error: {error}</p> : null}

      <article style={ui.card}>
        <h3>Conteos</h3>
        <p>Draft: {summary?.counts?.draft ?? '-'}</p>
        <p>Published: {summary?.counts?.published ?? '-'}</p>
        <p>Scheduled: {summary?.counts?.scheduled ?? '-'}</p>
      </article>

      <article style={ui.card}>
        <h3 style={ui.cardTitle}>Últimos artículos</h3>
        {summary?.latestArticles?.length ? (
          <ul style={ui.list}>
            {summary.latestArticles.map((item) => (
              <li key={item.id ?? item._id}>
                {item.title} ({item.status})
              </li>
            ))}
          </ul>
        ) : (
          <p>Sin datos todavía.</p>
        )}
      </article>
    </section>
  )
}
