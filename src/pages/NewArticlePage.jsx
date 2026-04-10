import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApiBaseUrl } from '../hooks/useApiBaseUrl'
import { apiRequest } from '../lib/apiClient'
import { getId, ui } from '../lib/ui'

export const NewArticlePage = () => {
  const baseUrl = useApiBaseUrl()
  const [authors, setAuthors] = useState([])
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState({
    title: '',
    excerpt: '',
    content: '',
    featuredImageUrl: '',
    status: 'draft',
    scheduledAt: '',
    authorId: '',
    categoryIds: [],
    isFeatured: false,
  })
  const [responseData, setResponseData] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [lookupError, setLookupError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadLookups = async () => {
      setLookupError('')
      try {
        const [authorResponse, categoryResponse] = await Promise.all([
          apiRequest(baseUrl, '/api/v1/author'),
          apiRequest(baseUrl, '/api/v1/category'),
        ])
        setAuthors(authorResponse ?? [])
        setCategories(categoryResponse ?? [])
      } catch (requestError) {
        setAuthors([])
        setCategories([])
        setLookupError(
          requestError instanceof Error
            ? requestError.message
            : 'No se pudieron cargar autores y categorías.',
        )
      }
    }

    loadLookups()
  }, [baseUrl])

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const submit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    setError('')
    setResponseData(null)

    const body = {
      title: form.title,
      excerpt: form.excerpt,
      content: form.content,
      status: form.status,
      authorId: form.authorId,
      categoryIds: form.categoryIds,
      isFeatured: form.isFeatured,
    }

    if (form.featuredImageUrl) {
      body.featuredImageUrl = form.featuredImageUrl
    }
    if (form.status === 'scheduled' && form.scheduledAt) {
      body.scheduledAt = form.scheduledAt
    }

    try {
      const response = await apiRequest(baseUrl, '/api/v1/article', {
        method: 'POST',
        body,
      })
      setResponseData(response)
      setMessage('Artículo creado.')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Error creando artículo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section style={ui.card}>
      <h2 style={ui.cardTitle}>Nuevo artículo</h2>
      {lookupError ? <p>Error cargando datos de formulario: {lookupError}</p> : null}
      <form onSubmit={submit}>
        <input
          style={ui.input}
          value={form.title}
          onChange={(event) => updateField('title', event.target.value)}
          placeholder="Título"
        />
        <input
          style={ui.input}
          value={form.excerpt}
          onChange={(event) => updateField('excerpt', event.target.value)}
          placeholder="Excerpt"
        />
        <textarea
          style={ui.textarea}
          rows={7}
          value={form.content}
          onChange={(event) => updateField('content', event.target.value)}
          placeholder="Contenido"
        />
        <input
          style={ui.input}
          value={form.featuredImageUrl}
          onChange={(event) => updateField('featuredImageUrl', event.target.value)}
          placeholder="Featured image URL (opcional)"
        />
        <select
          style={ui.input}
          value={form.authorId}
          onChange={(event) => updateField('authorId', event.target.value)}
        >
          <option value="">Selecciona authorId</option>
          {authors.map((author) => (
            <option key={getId(author)} value={getId(author)}>
              {author.name} ({getId(author)})
            </option>
          ))}
        </select>
        <p style={ui.muted}>
          ¿No existe el autor? <Link to="/admin/autores/nuevo">Crear autor ahora</Link>
        </p>
        <label htmlFor="new-article-categories">Categorías (multiple)</label>
        <select
          id="new-article-categories"
          style={ui.textarea}
          value={form.categoryIds}
          onChange={(event) =>
            updateField(
              'categoryIds',
              Array.from(event.target.selectedOptions).map((option) => option.value),
            )
          }
          multiple
          size={6}
        >
          {categories.map((category) => (
            <option key={getId(category)} value={getId(category)}>
              {category.name} ({getId(category)})
            </option>
          ))}
        </select>
        <select
          style={ui.input}
          value={form.status}
          onChange={(event) => updateField('status', event.target.value)}
        >
          <option value="draft">draft</option>
          <option value="published">published</option>
          <option value="scheduled">scheduled</option>
        </select>
        <input
          style={ui.input}
          value={form.scheduledAt}
          onChange={(event) => updateField('scheduledAt', event.target.value)}
          placeholder="scheduledAt ISO (solo scheduled)"
        />
        <label htmlFor="new-article-featured">
          <input
            id="new-article-featured"
            type="checkbox"
            checked={form.isFeatured}
            onChange={(event) => updateField('isFeatured', event.target.checked)}
          />{' '}
          Marcar como destacado
        </label>
        <div>
          <button style={ui.button} type="submit" disabled={loading}>
            {loading ? 'Creando...' : 'Crear artículo'}
          </button>
        </div>
      </form>
      {message ? <p>{message}</p> : null}
      {error ? <p>Error: {error}</p> : null}
      {responseData?.slug ? <p>Slug generado: {responseData.slug}</p> : null}
    </section>
  )
}
