import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useApiBaseUrl } from '../hooks/useApiBaseUrl'
import { apiRequest } from '../lib/apiClient'
import { ui } from '../lib/ui'

export const PublicCategoryPage = () => {
  const { slug } = useParams()
  const baseUrl = useApiBaseUrl()
  const [responseData, setResponseData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadCategory = async () => {
      if (!slug) {
        setError('Slug inválido.')
        return
      }

      setLoading(true)
      setError('')

      try {
        const response = await apiRequest(baseUrl, `/api/v1/public/category/${slug}`)
        setResponseData(response)
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : 'Error cargando categoría pública.',
        )
      } finally {
        setLoading(false)
      }
    }

    loadCategory()
  }, [baseUrl, slug])

  return (
    <section style={ui.card}>
      <h2 style={ui.cardTitle}>Categoría</h2>
      {loading ? <p>Cargando...</p> : null}
      {error ? <p>Error: {error}</p> : null}
      {responseData?.category ? (
        <>
          <h3 style={ui.cardTitle}>{responseData.category.name}</h3>
          <p>{responseData.category.description}</p>
        </>
      ) : null}
      <h3 style={ui.cardTitle}>Artículos</h3>
      {responseData?.articles?.length ? (
        <ul style={ui.list}>
          {responseData.articles.map((article) => (
            <li key={article.slug ?? article.id ?? article._id}>
              {article.title}{' '}
              {article.slug ? <Link to={`/articulo/${article.slug}`}>abrir</Link> : null}
            </li>
          ))}
        </ul>
      ) : (
        <p>No hay artículos en esta categoría.</p>
      )}
    </section>
  )
}
