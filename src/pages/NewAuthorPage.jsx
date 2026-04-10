import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApiBaseUrl } from '../hooks/useApiBaseUrl'
import { apiRequest } from '../lib/apiClient'
import { ui } from '../lib/ui'

export const NewAuthorPage = () => {
  const baseUrl = useApiBaseUrl()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', bio: '', avatarUrl: "https://images.rawpixel.com/image_png_800/cHJpdmF0ZS9sci9pbWFnZXMvd2Vic2l0ZS8yMDI0LTA5L3Jhd3BpeGVsb2ZmaWNlNV9zaW1wbGVfbWluaW1hbGlzdGljX2JsYWNrX2FuZF93aGl0ZV9pY29uX29mX2FfdV85MTU4MGM0Yi0yZDI3LTRjY2MtYWZhMC1mODFlOTNlNzhhOGUucG5n.png"})
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const submitAuthor = async (event) => {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    setError('')

    try {
      const response = await apiRequest(baseUrl, '/api/v1/author', {
        method: 'POST',
        body: form,
      })
      setMessage(response?.name ? `Autor "${response.name}" creado.` : 'Autor creado.')
      setForm({ name: '', bio: '', avatarUrl: '' })
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Error creando autor.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section style={ui.card}>
      <h2 style={ui.cardTitle}>Agregar autor</h2>
      <p style={ui.muted}>Crea autores para asignarlos a nuevos artículos.</p>

      <form onSubmit={submitAuthor}>
        <div style={ui.column}>
          <label htmlFor="author-name">Nombre</label>
          <input
            id="author-name"
            required
            style={ui.input}
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            placeholder="Ej: María Gómez"
          />

          <label htmlFor="author-bio">Biografía</label>
          <textarea
            id="author-bio"
            style={ui.textarea}
            rows={5}
            value={form.bio}
            onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))}
            placeholder="Resumen profesional"
          />

          <label htmlFor="author-avatar">URL de avatar</label>
          <input
            id="author-avatar"
            style={ui.input}
            value={form.avatarUrl}
            onChange={(event) =>
              setForm((current) => ({ ...current, avatarUrl: event.target.value }))
            }
            placeholder="https://..."
          />

          <div style={ui.row}>
            <button style={ui.button} disabled={loading} type="submit">
              {loading ? 'Guardando...' : 'Guardar autor'}
            </button>
            <button style={ui.button} type="button" onClick={() => navigate('/admin/autores')}>
              Volver a autores
            </button>
            <Link style={ui.link} to="/admin/articulos/nuevo">
              Ir a crear artículo
            </Link>
          </div>
        </div>
      </form>

      {message ? <p>{message}</p> : null}
      {error ? <p>Error: {error}</p> : null}
    </section>
  )
}
