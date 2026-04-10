import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useApiBaseUrl } from '../hooks/useApiBaseUrl'
import { apiRequest } from '../lib/apiClient'
import { ui } from '../lib/ui'

export const PublicArticlePage = () => {
  const { slug } = useParams()
  const baseUrl = useApiBaseUrl()
  const [article, setArticle] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadArticle = async () => {
      if (!slug) {
        setError('Slug inválido.')
        return
      }

      setLoading(true)
      setError('')

      try {
        const response = await apiRequest(baseUrl, `/api/v1/public/article/${slug}`)
        setArticle(response)
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : 'Error cargando artículo público.',
        )
      } finally {
        setLoading(false)
      }
    }

    loadArticle()
  }, [baseUrl, slug])

  return (
    <section style={ui.card}>
      <h2 style={ui.cardTitle}>Artículo</h2>
      <p>
        <Link to="/">Volver al inicio</Link>
      </p>
      {loading ? <p>Cargando...</p> : null}
      {error ? <p>Error: {error}</p> : null}
      {article ? (
        <>
          <h3 style={ui.cardTitle}>{article.title}</h3>
          <p>{article.excerpt}</p>
          <p style={ui.muted}>
            Autor: {article.author?.name ?? article.authorName ?? 'Sin autor'} | Vistas:{' '}
            {article.views ?? 0}
          </p>
          <p>{article.content}</p>
          {article.categories?.length ? (
            <ul style={ui.list}>
              {article.categories.map((category) => (
                <li key={category.id ?? category._id}>
                  {category.slug ? (
                    <Link to={`/categoria/${category.slug}`}>{category.name}</Link>
                  ) : (
                    category.name
                  )}
                </li>
              ))}
            </ul>
          ) : null}
        </>
      ) : null}
    </section>
  )
}
