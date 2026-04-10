import { useCallback, useEffect, useState } from 'react'
import { useApiBaseUrl } from '../hooks/useApiBaseUrl'
import { apiRequest } from '../lib/apiClient'
import { getId, ui } from '../lib/ui'

export const AdminCategoriesPage = () => {
  const baseUrl = useApiBaseUrl()
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState({ name: '', slug: '', description: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [responseData, setResponseData] = useState(null)

  const loadCategories = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await apiRequest(baseUrl, '/api/v1/category')
      setCategories(response ?? [])
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Error cargando categorías.')
    } finally {
      setLoading(false)
    }
  }, [baseUrl])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  const submitCategory = async (event) => {
    event.preventDefault()
    setMessage('')
    setError('')
    setResponseData(null)
    try {
      const response = await apiRequest(baseUrl, '/api/v1/category', {
        method: 'POST',
        body: form,
      })
      setResponseData(response)
      setMessage('Categoría creada.')
      setForm({ name: '', slug: '', description: '' })
      await loadCategories()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Error creando categoría.')
    }
  }

  const deleteCategory = async (id) => {
    setMessage('')
    setError('')
    try {
      await apiRequest(baseUrl, `/api/v1/category/${id}`, { method: 'DELETE' })
      setMessage('Categoría eliminada.')
      await loadCategories()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Error eliminando categoría.')
    }
  }

  return (
    <section style={ui.card}>
      <h2 style={ui.cardTitle}>Gestión de categorías</h2>
      <button style={ui.button} type="button" onClick={loadCategories}>
        Actualizar categorías
      </button>

      <form onSubmit={submitCategory}>
        <h3>Crear categoría</h3>
        <input
          style={ui.input}
          value={form.name}
          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          placeholder="name"
        />
        <input
          style={ui.input}
          value={form.slug}
          onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
          placeholder="slug (opcional)"
        />
        <textarea
          style={ui.textarea}
          rows={4}
          value={form.description}
          onChange={(event) =>
            setForm((current) => ({ ...current, description: event.target.value }))
          }
          placeholder="description (opcional)"
        />
        <button style={ui.button} type="submit">
          Crear categoría
        </button>
      </form>

      {loading ? <p>Cargando...</p> : null}
      {message ? <p>{message}</p> : null}
      {error ? <p>Error: {error}</p> : null}

      <h3>Listado de categorías</h3>
      {categories.length ? (
        <ul style={ui.list}>
          {categories.map((category) => (
            <li key={getId(category)}>
              {category.name} ({category.slug}){' '}
              <button
                style={ui.button}
                type="button"
                onClick={() => deleteCategory(getId(category))}
              >
                Eliminar
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p>No hay categorías.</p>
      )}
      {responseData?.slug ? <p>Slug creado: {responseData.slug}</p> : null}
    </section>
  )
}
