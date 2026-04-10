import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApiBaseUrl } from '../hooks/useApiBaseUrl'
import { apiRequest } from '../lib/apiClient'
import { ui } from '../lib/ui'

const renderArticles = (items = []) => {
  if (!items.length) {
    return <p>No hay artículos en esta sección.</p>
  }

  return (
    <ul>
      {items.map((article) => (
        <li key={article.slug ?? article.id ?? article._id}>
          <strong>{article.title}</strong>{' '}
          {article.slug ? <Link to={`/articulo/${article.slug}`}>ver</Link> : null}
        </li>
      ))}
    </ul>
  )
}

export const HomePage = () => {
  const baseUrl = useApiBaseUrl()
  const [homeData, setHomeData] = useState(null)
  const [categories, setCategories] = useState([])
  const [trending, setTrending] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const [homeResponse, categoriesResponse, trendingResponse] = await Promise.all([
        apiRequest(baseUrl, '/api/v1/public/home'),
        apiRequest(baseUrl, '/api/v1/public/categories'),
        apiRequest(baseUrl, '/api/v1/public/trending', { query: { limit: 8 } }),
      ])

      setHomeData(homeResponse)
      setCategories(categoriesResponse ?? [])
      setTrending(trendingResponse ?? [])
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Error cargando home.')
    } finally {
      setLoading(false)
    }
  }, [baseUrl])

  useEffect(() => {
    loadData()
  }, [loadData])

  return (
    <>
      <section style={ui.card}>
        <h2 style={ui.cardTitle}>Portada</h2>
        <p style={ui.muted}>Noticias públicas del periódico.</p>
        <button style={ui.button} type="button" onClick={loadData}>
          Actualizar portada
        </button>
        {loading ? <p>Cargando noticias...</p> : null}
        {error ? <p>Error: {error}</p> : null}
      </section>

      <section style={ui.split}>
        <article style={ui.card}>
          <h3 style={ui.cardTitle}>Recientes</h3>
          {renderArticles(homeData?.recent)}
        </article>

        <article style={ui.card}>
          <h3 style={ui.cardTitle}>Destacadas</h3>
          {renderArticles(homeData?.featured)}
        </article>

        <article style={ui.card}>
          <h3 style={ui.cardTitle}>Últimas</h3>
          {renderArticles(homeData?.latest)}
        </article>

        <article style={ui.card}>
          <h3 style={ui.cardTitle}>Tendencias</h3>
          {renderArticles(trending)}
        </article>
      </section>

      <section style={ui.card}>
        <h3 style={ui.cardTitle}>Categorías</h3>
        {categories.length ? (
          <ul style={ui.list}>
            {categories.map((category) => (
              <li key={category.id ?? category._id}>
                {category.name} ({category.articleCount ?? 0}){' '}
                {category.slug ? <Link to={`/categoria/${category.slug}`}>leer categoría</Link> : null}
              </li>
            ))}
          </ul>
        ) : (
          <p>No hay categorías públicas disponibles.</p>
        )}
      </section>
    </>
  )
}
