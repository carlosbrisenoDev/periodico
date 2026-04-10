import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useApiBaseUrl } from '../hooks/useApiBaseUrl'
import { apiRequest } from '../lib/apiClient'
import { ui } from '../lib/ui'

export const PublicArchivePage = () => {
  const { year, month } = useParams()
  const navigate = useNavigate()
  const baseUrl = useApiBaseUrl()
  const [draftYear, setDraftYear] = useState(year ?? '')
  const [draftMonth, setDraftMonth] = useState(month ?? '')
  const [responseData, setResponseData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setDraftYear(year ?? '')
    setDraftMonth(month ?? '')
  }, [month, year])

  useEffect(() => {
    const loadArchive = async () => {
      if (!year || !month) {
        return
      }

      setLoading(true)
      setError('')
      try {
        const response = await apiRequest(baseUrl, `/api/v1/public/archive/${year}/${month}`)
        setResponseData(response)
      } catch (requestError) {
        setError(
          requestError instanceof Error ? requestError.message : 'Error cargando archivo mensual.',
        )
      } finally {
        setLoading(false)
      }
    }

    loadArchive()
  }, [baseUrl, month, year])

  const submitArchive = (event) => {
    event.preventDefault()
    if (!draftYear || !draftMonth) {
      return
    }
    navigate(`/archivo/${draftYear}/${draftMonth}`)
  }

  return (
    <section style={ui.card}>
      <h2 style={ui.cardTitle}>Archivo mensual</h2>
      <form onSubmit={submitArchive}>
        <div style={ui.row}>
          <input
            style={ui.input}
            value={draftYear}
            onChange={(event) => setDraftYear(event.target.value)}
            placeholder="Año (YYYY)"
          />
          <input
            style={ui.input}
            value={draftMonth}
            onChange={(event) => setDraftMonth(event.target.value)}
            placeholder="Mes (1..12)"
          />
          <button style={ui.button} type="submit">
            Ir al archivo
          </button>
        </div>
      </form>

      {loading ? <p>Cargando...</p> : null}
      {error ? <p>Error: {error}</p> : null}

      {responseData?.items?.length ? (
        <ul style={ui.list}>
          {responseData.items.map((item) => (
            <li key={item.slug ?? item.id ?? item._id}>
              {item.title}{' '}
              {item.slug ? <Link to={`/articulo/${item.slug}`}>abrir artículo</Link> : null}
            </li>
          ))}
        </ul>
      ) : (
        <p>Sin artículos para ese periodo.</p>
      )}
    </section>
  )
}
